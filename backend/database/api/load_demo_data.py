"""
Load demo transaction data for hackathon demo
SAFE: Only adds data for specific demo user
"""
from db import execute
from datetime import datetime, timedelta
import random

# Your user ID
DEMO_USER_ID = "user_35EFmFe77RGaAFSAQLfPtEin7XW"

def generate_demo_transactions():
    """Generate realistic demo transactions"""
    transactions = []
    base_date = datetime.now()
    
    # Starbucks - Coffee purchases (10 transactions over past month)
    starbucks_items = [
        ("Grande Caramel Macchiato", 5.95),
        ("Venti Iced Coffee", 4.45),
        ("Grande Latte", 5.25),
        ("Tall Pike Place Roast", 2.95),
        ("Venti Cold Brew", 4.95),
        ("Grande Cappuccino", 4.75),
        ("Spinach Feta Wrap", 5.45),
        ("Bacon Egg Bites", 5.95)
    ]
    
    for i in range(10):
        item_name, price = random.choice(starbucks_items)
        days_ago = random.randint(1, 30)
        ts = base_date - timedelta(days=days_ago, hours=random.randint(6, 10))
        
        transactions.append({
            "user_id": DEMO_USER_ID,
            "item_name": item_name,
            "merchant": "Starbucks",
            "category": "Coffee & Cafes",
            "price": price,
            "ts": ts.strftime("%Y-%m-%d %H:%M:%S")
        })
    
    # McDonald's (formerly Uber Eats) - Fast food orders (8 transactions)
    mcdonalds_items = [
        ("Big Mac Meal", 9.99),
        ("Quarter Pounder with Cheese", 6.49),
        ("20 Piece McNuggets", 8.99),
        ("McChicken Meal", 7.99),
        ("Filet-O-Fish Meal", 8.49),
        ("Bacon McDouble", 3.99),
        ("Large Fries", 3.79),
        ("McFlurry with Oreo", 4.29)
    ]
    
    for i in range(8):
        item_name, price = random.choice(mcdonalds_items)
        days_ago = random.randint(1, 30)
        ts = base_date - timedelta(days=days_ago, hours=random.randint(11, 20))
        
        transactions.append({
            "user_id": DEMO_USER_ID,
            "item_name": item_name,
            "merchant": "McDonald's",
            "category": "Fast Food",
            "price": price,
            "ts": ts.strftime("%Y-%m-%d %H:%M:%S")
        })
    
    # Netflix - Monthly subscription (3 months)
    for month in range(3):
        days_ago = 30 * month + 5
        ts = base_date - timedelta(days=days_ago)
        
        transactions.append({
            "user_id": DEMO_USER_ID,
            "item_name": "Netflix Premium Subscription",
            "merchant": "Netflix",
            "category": "Entertainment",
            "price": 22.99,
            "ts": ts.strftime("%Y-%m-%d %H:%M:%S")
        })
    
    # Trader Joe's - Grocery shopping (6 trips)
    trader_joes_items = [
        ("Organic Bananas", 2.99),
        ("Mandarin Orange Chicken", 4.99),
        ("Everything But The Bagel Seasoning", 1.99),
        ("Cauliflower Gnocchi", 3.49),
        ("Cookie Butter", 3.99),
        ("Charles Shaw Wine", 3.99),
        ("Organic Eggs", 5.99),
        ("Greek Yogurt", 4.99),
        ("Trail Mix", 4.49),
        ("Frozen Mac & Cheese", 3.99),
        ("Organic Spinach", 2.99),
        ("Almond Butter", 6.99),
        ("Dark Chocolate", 2.49),
        ("Veggie Straws", 2.99)
    ]
    
    for trip in range(6):
        # Each trip has 3-5 items
        num_items = random.randint(3, 5)
        days_ago = random.randint(2, 30)
        ts = base_date - timedelta(days=days_ago, hours=random.randint(14, 19))
        
        for _ in range(num_items):
            item_name, price = random.choice(trader_joes_items)
            transactions.append({
                "user_id": DEMO_USER_ID,
                "item_name": item_name,
                "merchant": "Trader Joe's",
                "category": "Groceries",
                "price": price,
                "ts": ts.strftime("%Y-%m-%d %H:%M:%S")
            })
    
    return transactions

def load_demo_data():
    """Load demo data into database"""
    print(f"🎬 Loading demo data for user: {DEMO_USER_ID}")
    
    # SAFETY: Clear only this user's data
    print(f"🗑️  Clearing existing data for demo user...")
    delete_sql = """
        DELETE FROM SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST 
        WHERE USER_ID = %s
    """
    execute(delete_sql, (DEMO_USER_ID,))
    print(f"✅ Cleared")
    
    # Generate transactions
    transactions = generate_demo_transactions()
    print(f"📦 Generated {len(transactions)} demo transactions")
    
    # Insert into database
    insert_sql = """
        INSERT INTO SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST 
        (ITEM_ID, USER_ID, ITEM_NAME, MERCHANT, CATEGORY, PRICE, TS)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    
    count = 0
    for i, txn in enumerate(transactions):
        item_id = f"DEMO_{DEMO_USER_ID}_{i}"
        execute(insert_sql, (
            item_id,
            txn["user_id"],
            txn["item_name"],
            txn["merchant"],
            txn["category"],
            txn["price"],
            txn["ts"]
        ))
        count += 1
    
    print(f"✅ Loaded {count} transactions into database")
    
    # Summary
    merchants = {}
    for txn in transactions:
        merchant = txn["merchant"]
        merchants[merchant] = merchants.get(merchant, 0) + 1
    
    print("\n📊 Summary by merchant:")
    for merchant, count in merchants.items():
        print(f"  • {merchant}: {count} items")
    
    print(f"\n🎉 Demo data ready for user: {DEMO_USER_ID}")

if __name__ == "__main__":
    load_demo_data()
