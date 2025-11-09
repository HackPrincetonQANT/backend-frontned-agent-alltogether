#!/usr/bin/env python3
"""Quick script to re-seed demo data"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from db import execute, fetch_all

def reseed():
    print("🔄 Re-seeding demo data to Snowflake...")
    
    # Clear existing data for demo user
    print("Clearing old data...")
    execute(
        "DELETE FROM SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST WHERE USER_ID = %s",
        ('u_demo_min',)
    )
    
    # Insert demo transactions
    transactions = [
        # Starbucks (coffee)
        ('t_sbux_001', 'u_demo_min', 'Latte', 'Starbucks', 'Coffee', 5.75, -2),
        ('t_sbux_002', 'u_demo_min', 'Cappuccino', 'Starbucks', 'Coffee', 5.25, -5),
        ('t_sbux_003', 'u_demo_min', 'Coffee', 'Starbucks', 'Coffee', 4.50, -8),
        ('t_sbux_004', 'u_demo_min', 'Americano', 'Starbucks', 'Coffee', 4.75, -12),
        ('t_sbux_005', 'u_demo_min', 'Latte', 'Starbucks', 'Coffee', 5.75, -15),
        
        # Trader Joe's (groceries)
        ('t_tj_001', 'u_demo_min', 'Groceries', "Trader Joe's", 'Groceries', 87.32, -3),
        ('t_tj_002', 'u_demo_min', 'Groceries', "Trader Joe's", 'Groceries', 62.18, -10),
        ('t_tj_003', 'u_demo_min', 'Groceries', "Trader Joe's", 'Groceries', 45.67, -17),
        ('t_tj_004', 'u_demo_min', 'Groceries', "Trader Joe's", 'Groceries', 93.24, -24),
        
        # Chipotle (food)
        ('t_chip_001', 'u_demo_min', 'Burrito Bowl', 'Chipotle', 'Food', 12.50, -1),
        ('t_chip_002', 'u_demo_min', 'Burrito', 'Chipotle', 'Food', 11.75, -7),
        ('t_chip_003', 'u_demo_min', 'Bowl', 'Chipotle', 'Food', 13.25, -14),
        ('t_chip_004', 'u_demo_min', 'Tacos', 'Chipotle', 'Food', 10.50, -21),
        
        # Uber (transport)
        ('t_uber_001', 'u_demo_min', 'Ride', 'Uber', 'Transport', 15.30, -4),
        ('t_uber_002', 'u_demo_min', 'Ride', 'Uber', 'Transport', 22.50, -11),
        ('t_uber_003', 'u_demo_min', 'Ride', 'Uber', 'Transport', 18.75, -18),
        
        # Amazon (shopping)
        ('t_amzn_001', 'u_demo_min', 'Books', 'Amazon', 'Shopping', 34.99, -5),
        ('t_amzn_002', 'u_demo_min', 'Electronics', 'Amazon', 'Shopping', 129.99, -13),
        ('t_amzn_003', 'u_demo_min', 'Clothing', 'Amazon', 'Shopping', 45.50, -20),
        
        # Netflix (entertainment)
        ('t_nflx_001', 'u_demo_min', 'Subscription', 'Netflix', 'Entertainment', 15.99, -1),
        ('t_nflx_002', 'u_demo_min', 'Subscription', 'Netflix', 'Entertainment', 15.99, -31),
        
        # Spotify (entertainment)
        ('t_spot_001', 'u_demo_min', 'Spotify Premium', 'Spotify', 'Entertainment', 10.99, -10),
        ('t_spot_002', 'u_demo_min', 'Spotify Premium', 'Spotify', 'Entertainment', 10.99, -40),
        
        # Target (shopping)
        ('t_tgt_001', 'u_demo_min', 'Target', 'Target', 'Shopping', 76.45, -6),
        ('t_tgt_002', 'u_demo_min', 'Target', 'Target', 'Shopping', 52.30, -18),
    ]
    
    sql = """
        INSERT INTO SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST 
        (ITEM_ID, USER_ID, ITEM_NAME, MERCHANT, CATEGORY, PRICE, TS)
        VALUES (%s, %s, %s, %s, %s, %s, DATEADD('day', %s, CURRENT_TIMESTAMP()))
    """
    
    for txn in transactions:
        execute(sql, txn)
    
    print(f"✅ Inserted {len(transactions)} transactions")
    
    # Verify
    print("\n📊 Category Summary:")
    summary = fetch_all("""
        SELECT 
          CATEGORY,
          COUNT(*) AS TRANSACTION_COUNT,
          ROUND(SUM(PRICE), 2) AS TOTAL_SPENT
        FROM SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST
        WHERE USER_ID = %s
        GROUP BY CATEGORY
        ORDER BY TOTAL_SPENT DESC
    """, ('u_demo_min',))
    
    for row in summary:
        print(f"  {row[0]}: {row[1]} transactions, ${row[2]:.2f}")
    
    print("\n✅ Demo data re-seeded successfully!")

if __name__ == '__main__':
    reseed()
