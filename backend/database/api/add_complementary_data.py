"""
Add complementary mock data to go with real Knot food transactions
Adds: Netflix, Hulu, Spotify (Tyler, the Creator), and Uber rides
"""
import sys
sys.path.insert(0, '/Users/columbus/Desktop/hackPrinceton/backend/database')

from api.db import execute
import uuid
from datetime import datetime, timedelta
import random

DEMO_USER_ID = "user_35EFmFe77RGaAFSAQLfPtEin7XW"

def generate_complementary_transactions():
    """Generate complementary transactions to go with real Knot food data"""
    transactions = []
    now = datetime.now()
    
    # Netflix Subscription (3 months)
    print("📺 Adding Netflix subscriptions...")
    for i in range(3):
        date = now - timedelta(days=30 * i)
        transactions.append({
            "item_id": str(uuid.uuid4()),
            "user_id": DEMO_USER_ID,
            "item_name": "Netflix Premium Subscription",
            "merchant": "Netflix",
            "category": "Entertainment",
            "price": 22.99,
            "ts": date.isoformat()
        })
    
    # Hulu Subscription (3 months)
    print("📺 Adding Hulu subscriptions...")
    for i in range(3):
        date = now - timedelta(days=30 * i + 5)  # Offset by 5 days
        transactions.append({
            "item_id": str(uuid.uuid4()),
            "user_id": DEMO_USER_ID,
            "item_name": "Hulu (No Ads) Subscription",
            "merchant": "Hulu",
            "category": "Entertainment",
            "price": 17.99,
            "ts": date.isoformat()
        })
    
    # Spotify - Tyler, the Creator
    print("🎵 Adding Spotify subscription...")
    for i in range(3):
        date = now - timedelta(days=30 * i + 10)  # Offset by 10 days
        transactions.append({
            "item_id": str(uuid.uuid4()),
            "user_id": DEMO_USER_ID,
            "item_name": "Spotify Premium - Tyler, the Creator on repeat",
            "merchant": "Spotify",
            "category": "Entertainment",
            "price": 10.99,
            "ts": date.isoformat()
        })
    
    # Uber Rides (8 rides over the past month)
    print("🚗 Adding Uber rides...")
    uber_destinations = [
        "Uber to Campus",
        "Uber to Downtown",
        "Uber to Airport",
        "Uber to Friend's Place",
        "Uber to Concert",
        "Uber Home",
        "Uber to Grocery Store",
        "Uber to Gym"
    ]
    
    for i in range(8):
        days_ago = random.randint(1, 30)
        hour = random.randint(8, 23)
        minute = random.randint(0, 59)
        date = (now - timedelta(days=days_ago)).replace(hour=hour, minute=minute)
        price = round(random.uniform(12.50, 45.99), 2)
        
        transactions.append({
            "item_id": str(uuid.uuid4()),
            "user_id": DEMO_USER_ID,
            "item_name": uber_destinations[i],
            "merchant": "Uber",
            "category": "Transport",
            "price": price,
            "ts": date.isoformat()
        })
    
    return transactions


def save_transactions(transactions):
    """Save transactions to Snowflake"""
    insert_sql = """
        INSERT INTO SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST 
        (ITEM_ID, USER_ID, ITEM_NAME, MERCHANT, PRICE, TS, CATEGORY)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    
    saved_count = 0
    for txn in transactions:
        try:
            execute(
                insert_sql,
                (
                    txn["item_id"],
                    txn["user_id"],
                    txn["item_name"],
                    txn["merchant"],
                    txn["price"],
                    txn["ts"],
                    txn["category"]
                )
            )
            saved_count += 1
        except Exception as e:
            print(f"Error saving {txn['item_name']}: {e}")
            continue
    
    return saved_count


if __name__ == "__main__":
    print('🎬 Adding complementary data to Knot food transactions...')
    print(f'👤 User: {DEMO_USER_ID}\n')
    
    # Generate transactions
    transactions = generate_complementary_transactions()
    print(f'\n📦 Generated {len(transactions)} complementary transactions')
    
    # Save to Snowflake
    saved_count = save_transactions(transactions)
    print(f'✅ Loaded {saved_count} transactions into database')
    
    # Summary
    print('\n📊 Summary by category:')
    by_category = {}
    for txn in transactions:
        cat = txn['category']
        by_category[cat] = by_category.get(cat, 0) + 1
    
    for category, count in by_category.items():
        print(f'  • {category}: {count} items')
    
    print(f'\n🎉 Complementary data ready!')
    print('💡 You now have:')
    print('   - Real Knot food transactions (Uber Eats groceries)')
    print('   - Netflix & Hulu subscriptions')
    print('   - Spotify Premium (Tyler, the Creator vibes)')
    print('   - Uber rides around town')
