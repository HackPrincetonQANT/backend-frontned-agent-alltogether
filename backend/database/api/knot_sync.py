"""
Knot Transaction Sync Service
Syncs transactions from Knot API to Snowflake database
"""
import uuid
from datetime import datetime
from typing import List, Dict, Any
from .knot_client import knot_client
from .db import get_conn, execute_sql
from .do_llm import categorize_item


def categorize_transaction_item(item_name: str, merchant_name: str = "") -> str:
    """
    Categorize a transaction item using the LLM categorization
    
    Args:
        item_name: Name of the item
        merchant_name: Merchant name for context
        
    Returns:
        Category string
    """
    try:
        category = categorize_item(item_name)
        return category
    except Exception as e:
        print(f"Error categorizing {item_name}: {e}")
        # Fallback to merchant-based categorization
        merchant_lower = merchant_name.lower()
        if any(x in merchant_lower for x in ["starbucks", "coffee", "dunkin"]):
            return "Coffee"
        elif any(x in merchant_lower for x in ["target", "walmart", "amazon", "trader"]):
            return "Groceries"
        elif any(x in merchant_lower for x in ["doordash", "uber eats", "grubhub", "chipotle"]):
            return "Food"
        elif any(x in merchant_lower for x in ["uber", "lyft", "zipcar"]):
            return "Transport"
        elif any(x in merchant_lower for x in ["netflix", "spotify", "hulu", "disney"]):
            return "Entertainment"
        else:
            return "Shopping"


def transform_knot_transaction(transaction: Dict[str, Any], user_id: str) -> List[Dict[str, Any]]:
    """
    Transform a Knot transaction into our Snowflake format
    
    Args:
        transaction: Knot transaction object
        user_id: Our internal user ID
        
    Returns:
        List of item records ready for Snowflake insertion
    """
    items = []
    
    # Extract transaction data
    transaction_id = transaction.get("id", "")
    merchant_name = transaction.get("merchant", {}).get("name", "")
    transaction_date = transaction.get("datetime", datetime.now().isoformat())
    
    # Process each item in the transaction
    line_items = transaction.get("lineItems", [])
    
    for line_item in line_items:
        item_name = line_item.get("name", "Unknown Item")
        
        # Get price - handle different price formats
        price_data = line_item.get("price", {})
        if isinstance(price_data, dict):
            price = float(price_data.get("amount", 0)) / 100  # Convert cents to dollars
        else:
            price = float(price_data) if price_data else 0.0
        
        # Categorize the item
        category = categorize_transaction_item(item_name, merchant_name)
        
        # Create item record
        item_record = {
            "item_id": str(uuid.uuid4()),
            "user_id": user_id,
            "item_name": item_name,
            "merchant": merchant_name,
            "price": price,
            "ts": transaction_date,
            "category": category,
            "knot_transaction_id": transaction_id,
            "knot_line_item_id": line_item.get("id", "")
        }
        
        items.append(item_record)
    
    # If no line items, create one record for the total transaction
    if not items:
        total_amount = transaction.get("total", {})
        if isinstance(total_amount, dict):
            amount = float(total_amount.get("amount", 0)) / 100
        else:
            amount = float(total_amount) if total_amount else 0.0
        
        category = categorize_transaction_item(merchant_name, merchant_name)
        
        items.append({
            "item_id": str(uuid.uuid4()),
            "user_id": user_id,
            "item_name": f"Purchase from {merchant_name}",
            "merchant": merchant_name,
            "price": amount,
            "ts": transaction_date,
            "category": category,
            "knot_transaction_id": transaction_id,
            "knot_line_item_id": ""
        })
    
    return items


def save_knot_transactions_to_snowflake(items: List[Dict[str, Any]]) -> int:
    """
    Save transformed Knot transactions to Snowflake
    
    Args:
        items: List of item records
        
    Returns:
        Number of items saved
    """
    if not items:
        return 0
    
    insert_sql = """
        INSERT INTO SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST 
        (ITEM_ID, USER_ID, ITEM_NAME, MERCHANT, PRICE, TS, CATEGORY)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    
    saved_count = 0
    with get_conn() as conn:
        for item in items:
            try:
                execute_sql(
                    insert_sql,
                    (
                        item["item_id"],
                        item["user_id"],
                        item["item_name"],
                        item["merchant"],
                        item["price"],
                        item["ts"],
                        item["category"]
                    ),
                    conn=conn
                )
                saved_count += 1
            except Exception as e:
                print(f"Error saving item {item['item_name']}: {e}")
                continue
    
    return saved_count


def sync_user_transactions_from_knot(user_id: str, knot_user_id: str = None) -> Dict[str, Any]:
    """
    Main function to sync all transactions for a user from Knot to Snowflake
    
    Args:
        user_id: Our internal user ID (for Snowflake)
        knot_user_id: Knot user ID (if different from internal user_id)
        
    Returns:
        Summary of sync operation
    """
    # Use same user_id for Knot if not provided
    if not knot_user_id:
        knot_user_id = user_id
    
    print(f"Starting Knot sync for user: {user_id}")
    
    # Get all transactions from Knot
    knot_transactions = knot_client.sync_all_user_transactions(knot_user_id)
    print(f"Retrieved {len(knot_transactions)} transactions from Knot")
    
    # Transform all transactions
    all_items = []
    for transaction in knot_transactions:
        items = transform_knot_transaction(transaction, user_id)
        all_items.extend(items)
    
    print(f"Transformed into {len(all_items)} items")
    
    # Save to Snowflake
    saved_count = save_knot_transactions_to_snowflake(all_items)
    
    return {
        "user_id": user_id,
        "knot_transactions_count": len(knot_transactions),
        "items_transformed": len(all_items),
        "items_saved": saved_count,
        "success": saved_count > 0
    }
