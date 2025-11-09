# database/api/main.py

from typing import List, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from . import queries as Q
from .db import fetch_all, execute, get_conn
from .models import TransactionInsert, UserReply
from .semantic import search_similar_items
from .predictor import predict_next_purchases
from .do_llm import call_do_llm
from .smart_tips import generate_smart_tips
from .better_deals import generate_better_deals
from .piggy_graph import generate_piggy_graph
from .receipt_processing import save_receipt_to_database

app = FastAPI(title="BalanceIQ Core API", version="0.1.0")

# Configure CORS to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default
        "http://localhost:3000",  # Common React dev server
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------------------------
# Basic health / core endpoints
# ----------------------------------------------------------------------


@app.get("/health")
def health():
    """
    Simple health check: returns current Snowflake user/role/db/schema.
    """
    try:
        rows = fetch_all(Q.SQL_HEALTH)
        return rows[0] if rows else JSONResponse({"ok": False}, status_code=500)
    except Exception as e:
        print("Health error:", repr(e))
        raise HTTPException(status_code=500, detail="Health check failed")


@app.get("/feed")
def feed(user_id: str, limit: int = Query(20, ge=1, le=100)):
    """
    Recent transactions feed for a given user (from TRANSACTIONS table).
    """
    return fetch_all(Q.SQL_FEED, {"user_id": user_id, "limit": limit})


@app.get("/stats/category")
def stats_by_category(user_id: str, days: int = Query(30, ge=1, le=365)):
    """
    Category-level stats (counts, want/need rate, totals) over a window.
    """
    return fetch_all(Q.SQL_STATS_BY_CATEGORY, {"user_id": user_id, "days": days})


@app.get("/predictions")
def predictions(user_id: str):
    """
    Returns precomputed prediction rows (if any) from PREDICTIONS table.
    """
    return fetch_all(Q.SQL_PREDICTIONS, {"user_id": user_id})


@app.post("/transactions")
def upsert_transaction(txn: TransactionInsert):
    """
    Upsert a single transaction into TRANSACTIONS via MERGE.
    """
    execute(Q.SQL_MERGE_TXN, txn.model_dump())
    return {"status": "ok", "id": txn.id}


@app.post("/reply")
def upsert_reply(rep: UserReply):
    """
    Upsert a user's reply (need/want label) tied to a transaction.
    """
    execute(Q.SQL_MERGE_REPLY, rep.model_dump())
    return {"status": "ok", "id": rep.id}


# ----------------------------------------------------------------------
# Semantic search (vector-ish search over ITEM_TEXT)
# ----------------------------------------------------------------------


@app.get("/semantic-search")
def semantic_search(
    q: str = Query(..., description="Search text"),
    user_id: str = Query(...),
    limit: int = Query(5, ge=1, le=50),
):
    """
    Semantic search over a user's transactions using Snowflake embeddings
    and a Python-side cosine similarity.
    """
    return search_similar_items(q, user_id, limit)


# ----------------------------------------------------------------------
# App-facing endpoints for the frontend / mobile
# ----------------------------------------------------------------------


@app.get("/api/user/{user_id}/transactions")
def get_user_transactions(
    user_id: str,
    limit: int = Query(20, ge=1, le=100),
) -> List[Dict[str, Any]]:
    """
    Return recent transactions for a user in a simplified shape
    for the frontend/mobile app, based on PURCHASE_ITEMS_TEST.

    Shape:
    [
      {
        "id": "t123",
        "item": "Starbucks · Coffee",
        "amount": 5.25,
        "date": "<ISO timestamp>",
        "category": "Coffee"
      },
      ...
    ]
    """

    # NOTE: This uses PURCHASE_ITEMS_TEST, not TRANSACTIONS.
    sql = f"""
        SELECT
          ITEM_ID AS ID,
          COALESCE(ITEM_NAME, MERCHANT) AS ITEM_TEXT,
          (PRICE * 100)::NUMBER(12,0) AS AMOUNT_CENTS,
          TS AS OCCURRED_AT,
          CATEGORY
        FROM SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST
        WHERE USER_ID = %s
        ORDER BY TS DESC
        LIMIT {limit}
    """

    rows = fetch_all(sql, (user_id,))

    out: List[Dict[str, Any]] = []
    for r in rows:
        cents = r.get("AMOUNT_CENTS")
        amount = float(cents) / 100.0 if cents is not None else None

        out.append(
            {
                "id": r["ID"],
                "item": r["ITEM_TEXT"],
                "amount": amount,
                "date": r["OCCURRED_AT"],  # FastAPI → ISO8601 in JSON
                "category": r["CATEGORY"],
            }
        )

    return out


# ----------------------------------------------------------------------
# Behavioral prediction (when will they buy next?)
# ----------------------------------------------------------------------


@app.get("/api/predict")
def api_predict(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(5, ge=1, le=20, description="Max number of predictions"),
) -> List[Dict[str, Any]]:
    """
    Behavioral prediction endpoint (uses PURCHASE_ITEMS_TEST).

    Uses predictor.predict_next_purchases() which:
      - Groups by (item_name, category)
      - Looks at historical TS times
      - Estimates an average interval between purchases
      - Predicts next_time = last_time + avg_interval
      - Computes a confidence score
    """
    try:
        return predict_next_purchases(user_id=user_id, limit=limit)
    except Exception as e:
        print("Prediction error:", repr(e))
        raise HTTPException(status_code=500, detail="Prediction failed")


# ----------------------------------------------------------------------
# AI Coach using DigitalOcean LLM
# ----------------------------------------------------------------------


@app.get("/api/coach")
def api_coach(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(3, ge=1, le=10, description="Max number of predicted items to consider"),
) -> Dict[str, Any]:
    """
    AI coach endpoint.

    - Uses predict_next_purchases() to get upcoming purchases.
    - Uses recent transactions (from PURCHASE_ITEMS_TEST).
    - Calls DigitalOcean LLM to generate a short, friendly coaching message.
    """
    # 1) Get predictions (re-use your predictor)
    try:
        predictions = predict_next_purchases(user_id=user_id, limit=limit)
    except Exception as e:
        print("Coach: prediction error", repr(e))
        predictions = []

    # 2) Get recent transactions (same source as /api/user/{user_id}/transactions)
    tx_sql = """
        SELECT
          ITEM_ID AS ID,
          COALESCE(ITEM_NAME, MERCHANT) AS ITEM_TEXT,
          (PRICE * 100)::NUMBER(12,0) AS AMOUNT_CENTS,
          TS AS OCCURRED_AT,
          CATEGORY
        FROM SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST
        WHERE USER_ID = %s
        ORDER BY TS DESC
        LIMIT 20
    """
    try:
        tx_rows = fetch_all(tx_sql, (user_id,))
    except Exception as e:
        print("Coach: transactions error", repr(e))
        tx_rows = []

    # 3) Summarize transactions for the LLM (compact JSON-ish summary)
    summarized_txs: List[Dict[str, Any]] = []
    for r in tx_rows:
        cents = r.get("AMOUNT_CENTS")
        amount = float(cents) / 100.0 if cents is not None else None
        ts = r.get("OCCURRED_AT")
        summarized_txs.append(
            {
                "item": r.get("ITEM_TEXT"),
                "amount": amount,
                "category": r.get("CATEGORY"),
                "timestamp": ts.isoformat() if ts else None,
            }
        )

    import json

    coach_system_prompt = (
        "You are a friendly financial coach for a budgeting app with a cute mascot. "
        "The mascot gets happier when the user saves money or stays on track, and sadder when "
        "they overspend. You must be supportive, non-judgmental, and very concise."
    )

    user_prompt = (
        "Here is this user's recent spending history and predicted upcoming purchases.\n\n"
        f"Recent transactions (JSON):\n{json.dumps(summarized_txs, default=str)[:4000]}\n\n"
        f"Predicted upcoming purchases (JSON):\n{json.dumps(predictions, default=str)[:4000]}\n\n"
        "1. Briefly summarize their spending patterns.\n"
        "2. Suggest ONE or TWO concrete, realistic actions to save money in the next week.\n"
        "3. Mention how the mascot will feel (happier/sadder) if they follow or ignore the advice.\n"
        "Answer in 3 short sentences max."
    )

    # 4) Call DigitalOcean LLM
    try:
        coach_text = call_do_llm(
            system_prompt=coach_system_prompt,
            user_prompt=user_prompt,
        )
    except Exception as e:
        print("Coach: LLM error", repr(e))
        raise HTTPException(status_code=500, detail="Coach LLM failed")

    # 5) Return both the message and the raw data driving it
    return {
        "message": coach_text,
        "predictions": predictions,
        "recent_transactions": summarized_txs,
    }


# ----------------------------------------------------------------------
# Smart Tips (Piggy Tips) endpoint
# ----------------------------------------------------------------------


@app.get("/api/smart-tips")
def api_smart_tips(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(6, ge=1, le=20, description="Max number of tips"),
) -> List[Dict[str, Any]]:
    """
    Smart savings tips endpoint (Piggy Tips).
    
    Analyzes user's spending patterns to generate actionable savings recommendations:
    - High-frequency purchases (daily coffee, etc.)
    - Underutilized subscriptions
    - Category overspending
    - Potential alternatives
    
    Returns tips with potential savings amounts and action buttons.
    """
    try:
        tips = generate_smart_tips(user_id=user_id, limit=limit)
        return tips
    except Exception as e:
        print("Smart tips error:", repr(e))
        raise HTTPException(status_code=500, detail="Failed to generate smart tips")


# ----------------------------------------------------------------------
# Better Deals endpoint
# ----------------------------------------------------------------------


@app.get("/api/better-deals")
def api_better_deals(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(10, ge=1, le=20, description="Max number of deals"),
) -> List[Dict[str, Any]]:
    """
    Better deals/alternatives endpoint.
    
    Suggests cheaper alternatives for stores and services the user frequents.
    Shows potential monthly savings by switching to cheaper alternatives.
    
    Returns deals with:
    - Current store/service
    - Suggested alternative
    - Estimated savings amount and percentage
    - All available alternatives
    """
    try:
        deals = generate_better_deals(user_id=user_id, limit=limit)
        return deals
    except Exception as e:
        print("Better deals error:", repr(e))
        raise HTTPException(status_code=500, detail="Failed to generate better deals")


# ----------------------------------------------------------------------
# Piggy Graph endpoint
# ----------------------------------------------------------------------


@app.get("/api/piggy-graph")
def api_piggy_graph(
    user_id: str = Query(..., description="User ID"),
) -> Dict[str, Any]:
    """
    Piggy Graph visualization endpoint.
    
    Generates a graph structure for visualizing user spending habits,
    preferences, and AI-driven insights from Snowflake data.
    
    Returns:
    - nodes: List of graph nodes (piggy center, insights, merchants, categories)
    - edges: Connections between nodes
    - insights: AI-analyzed patterns (household size, frequency, preferences)
    - stats: Overall statistics
    
    Features:
    - Frequency analysis (daily Starbucks visits)
    - Location inference (near Princeton)
    - Household size prediction (large grocery orders)
    - Category preferences
    """
    try:
        graph_data = generate_piggy_graph(user_id=user_id)
        return graph_data
    except Exception as e:
        print("Piggy graph error:", repr(e))
        raise HTTPException(status_code=500, detail="Failed to generate piggy graph")


@app.post("/api/receipt/process")
async def process_receipt(receipt_data: Dict[str, Any]):
    """
    Process receipt data from image and save to database
    
    Expected receipt_data:
    {
        "user_id": "u_demo_min",
        "store": "Trader Joe's",
        "location": "Princeton, NJ",
        "items": [
            {"name": "Milk", "quantity": 1, "price": 3.99},
            {"name": "Bread", "quantity": 2, "price": 2.50}
        ],
        "total": 8.99
    }
    
    Returns:
    - success: Boolean
    - message: Description of what was saved
    - transactions: List of saved transactions with categories
    - total_amount: Total amount saved
    """
    try:
        user_id = receipt_data.get('user_id', 'u_demo_min')
        
        result = save_receipt_to_database(user_id, receipt_data)
        
        if result['success']:
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Failed to save receipt'))
    except Exception as e:
        print("Receipt processing error:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai-deals")
def get_ai_deals(
    user_id: str = Query("u_demo_min"),
    limit: int = Query(2, ge=1, le=10),
) -> List[Dict[str, Any]]:
    """
    Generate AI-powered personalized deals based on user's spending patterns.
    Returns deals that match user interests and categories.
    """
    try:
        # Get recent transactions to understand spending
        recent_sql = """
            SELECT CATEGORY, COUNT(*) as count, AVG(PRICE) as avg_price
            FROM SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST
            WHERE USER_ID = %s
            GROUP BY CATEGORY
            ORDER BY count DESC
            LIMIT 3
        """
        category_stats = fetch_all(recent_sql, (user_id,))
    except Exception as e:
        print(f"Error fetching category stats: {e}")
        category_stats = []
    
    # Generate AI deals based on top categories
    deals = []
    
    # Deal templates based on categories - realistic and believable deals
    deal_templates = {
        'Coffee': [
            {
                "title": "Starbucks Rewards",
                "subtitle": "2% cashback on all purchases",
                "description": "Use your Chase Freedom card at Starbucks and earn 2% cashback. On your $5 daily coffee, that's $3/month back!",
                "savings": 3,
                "category": "Coffee",
                "cta": "Learn More",
            },
            {
                "title": "Dunkin' Perks Deal",
                "subtitle": "Free drink after 5 purchases",
                "description": "Join DD Perks program. Buy 5, get 1 free. Based on your coffee habit, you'll get 2 free drinks per month!",
                "savings": 6,
                "category": "Coffee",
                "cta": "Sign Up",
            }
        ],
        'Groceries': [
            {
                "title": "Target Circle Cashback",
                "subtitle": "5% off with RedCard",
                "description": "Get 5% off every Target trip with RedCard debit card. On $80/week groceries, save $16/month!",
                "savings": 16,
                "category": "Groceries",
                "cta": "Apply Now",
            },
            {
                "title": "Walmart+ Membership",
                "subtitle": "Free delivery, gas discount",
                "description": "Get free grocery delivery + 10¢/gal gas discount. Save $12/month vs paying delivery fees.",
                "savings": 12,
                "category": "Groceries",
                "cta": "Try Free",
            }
        ],
        'Food': [
            {
                "title": "DoorDash DashPass",
                "subtitle": "$0 delivery fees",
                "description": "Order 3x/month? DashPass ($9.99/mo) saves you $5/order in delivery fees. Net savings: $5/month.",
                "savings": 5,
                "category": "Food",
                "cta": "Subscribe",
            },
            {
                "title": "Student Dining Discount",
                "subtitle": "15% off local restaurants",
                "description": "Show student ID at participating restaurants. Save 15% on your next 3 meals out.",
                "savings": 8,
                "category": "Food",
                "cta": "View List",
            }
        ],
        'Transport': [
            {
                "title": "Uber Pass Student",
                "subtitle": "$4.99/mo, save on rides",
                "description": "Get $5 off 2 rides/month. If you Uber 2x monthly, this pays for itself + $5 extra savings.",
                "savings": 5,
                "category": "Transport",
                "cta": "Get Pass",
            },
            {
                "title": "Campus Bike Share",
                "subtitle": "First month free",
                "description": "Princeton bike share: $8/month after free trial. Replace 4 Uber rides and save $12/month.",
                "savings": 12,
                "category": "Transport",
                "cta": "Sign Up",
            }
        ],
        'Entertainment': [
            {
                "title": "Black Friday: Hulu + Disney+",
                "subtitle": "$1.99/month for 12 months",
                "description": "Early Black Friday deal! Hulu + Disney+ bundle for just $1.99/mo (normally $9.99). Save $8/month!",
                "savings": 8,
                "category": "Entertainment",
                "cta": "Grab Deal",
            },
            {
                "title": "Spotify Student Discount",
                "subtitle": "50% off with .edu email",
                "description": "Get Spotify Premium for $5.99/mo (normally $10.99). Includes Hulu. Save $5/month.",
                "savings": 5,
                "category": "Entertainment",
                "cta": "Verify Now",
            }
        ],
        'Shopping': [
            {
                "title": "Amazon Student Prime",
                "subtitle": "6 months free, then $7.49/mo",
                "description": "Free 2-day shipping + Prime Video. Save on shipping costs vs paying per order.",
                "savings": 10,
                "category": "Shopping",
                "cta": "Start Trial",
            },
            {
                "title": "Rakuten Cashback",
                "subtitle": "1-5% back on purchases",
                "description": "Get cashback when shopping online. On $100/month purchases, earn $2-5 back automatically.",
                "savings": 4,
                "category": "Shopping",
                "cta": "Install Free",
            }
        ]
    }
    
    # Select deals based on user's top spending categories
    deals_per_category = max(1, limit // max(len(category_stats), 1)) if category_stats else 1
    
    if category_stats:
        for cat_data in category_stats:
            category = cat_data['CATEGORY']
            if category in deal_templates:
                # Add multiple deals from this category
                for deal in deal_templates[category][:deals_per_category]:
                    if len(deals) < limit:
                        deals.append(deal)
    
    # Fill remaining slots with popular deals if needed
    if len(deals) < limit:
        default_deals = [
            {
                "title": "Black Friday: Disney+ Bundle",
                "subtitle": "$1.99/mo for 12 months",
                "description": "Limited time! Disney+ with ads for just $1.99/month. Save $8/month vs regular price.",
                "savings": 8,
                "category": "Streaming",
                "cta": "Get Deal",
            },
            {
                "title": "Student Spotify Premium",
                "subtitle": "50% off with student email",
                "description": "Spotify Premium + Hulu for $5.99/month. Save $5/month with .edu email verification.",
                "savings": 5,
                "category": "Music",
                "cta": "Verify Student",
            },
            {
                "title": "Target Circle App",
                "subtitle": "Extra 5% off clearance",
                "description": "Download Target app for exclusive deals. Save an extra 5% on clearance items every week.",
                "savings": 7,
                "category": "Retail",
                "cta": "Download",
            },
            {
                "title": "Chipotle Rewards",
                "subtitle": "Free entree after 10 visits",
                "description": "Join rewards program. Get a free burrito bowl ($10 value) after every 10 purchases.",
                "savings": 10,
                "category": "Dining",
                "cta": "Sign Up",
            },
            {
                "title": "Netflix Student Discount",
                "subtitle": "Basic plan at $6.99/mo",
                "description": "Get Netflix Basic for $6.99/month (save $3/mo). Verify with your .edu email address.",
                "savings": 3,
                "category": "Streaming",
                "cta": "Verify Now",
            },
            {
                "title": "Gas Buddy Rewards",
                "subtitle": "Save 5¢/gallon",
                "description": "Link your debit card and save 5¢ per gallon. On 10 gallons/week, save $2.60/month.",
                "savings": 3,
                "category": "Gas",
                "cta": "Link Card",
            },
            {
                "title": "Campus Bookstore Sale",
                "subtitle": "20% off used textbooks",
                "description": "Buy used textbooks and save 20% vs new. Resell at end of semester for even more savings.",
                "savings": 15,
                "category": "Books",
                "cta": "Shop Now",
            },
            {
                "title": "Planet Fitness Student",
                "subtitle": "$10/month, no commitment",
                "description": "Get gym membership for just $10/month with student ID. Cancel anytime, no annual fee.",
                "savings": 20,
                "category": "Fitness",
                "cta": "Join Now",
            }
        ]
        deals.extend(default_deals[:limit - len(deals)])
    
    return deals[:limit]
