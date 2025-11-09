#!/usr/bin/env python3
"""
Seed demo data into PURCHASE_ITEMS_TEST table.
Run this script to populate realistic demo transactions.
"""

from .db import execute, fetch_all

def seed_demo_data():
    """Populate PURCHASE_ITEMS_TEST with realistic demo transactions."""
    
    print("🗑️  Deleting old demo data...")
    execute(
        "DELETE FROM SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST WHERE USER_ID = %s",
        ('u_demo_min',)
    )
    
    print("🌱 Seeding new demo data...")
    
    # Define all transactions
    transactions = [
        # Netflix subscription (only watched 2 episodes - low usage)
        ('t_netflix_001', 'u_demo_min', 'Netflix', 'Netflix', 'Entertainment', 15.49, -28),
        ('t_netflix_002', 'u_demo_min', 'Netflix', 'Netflix', 'Entertainment', 15.49, -58),
        
        # Disney+ subscription
        ('t_disney_001', 'u_demo_min', 'Disney+', 'Disney+', 'Entertainment', 13.99, -25),
        ('t_disney_002', 'u_demo_min', 'Disney+', 'Disney+', 'Entertainment', 13.99, -55),
        
        # Hulu subscription
        ('t_hulu_001', 'u_demo_min', 'Hulu', 'Hulu', 'Entertainment', 17.99, -22),
        ('t_hulu_002', 'u_demo_min', 'Hulu', 'Hulu', 'Entertainment', 17.99, -52),
        
        # Trader Joe's groceries (inflated prices, weekly shopping)
        ('t_tj_001', 'u_demo_min', 'Trader Joes', "Trader Joe's", 'Groceries', 127.45, -5),
        ('t_tj_002', 'u_demo_min', 'Trader Joes', "Trader Joe's", 'Groceries', 143.20, -12),
        ('t_tj_003', 'u_demo_min', 'Trader Joes', "Trader Joe's", 'Groceries', 156.80, -19),
        ('t_tj_004', 'u_demo_min', 'Trader Joes', "Trader Joe's", 'Groceries', 134.95, -26),
        
        # Daily Starbucks (expensive habit) - 22 transactions
        ('t_sb_001', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -1),
        ('t_sb_002', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -2),
        ('t_sb_003', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -3),
        ('t_sb_004', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -4),
        ('t_sb_005', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -5),
        ('t_sb_006', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -6),
        ('t_sb_007', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -8),
        ('t_sb_008', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -9),
        ('t_sb_009', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -10),
        ('t_sb_010', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -11),
        ('t_sb_011', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -12),
        ('t_sb_012', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -13),
        ('t_sb_013', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -15),
        ('t_sb_014', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -16),
        ('t_sb_015', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -17),
        ('t_sb_016', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -18),
        ('t_sb_017', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -19),
        ('t_sb_018', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -20),
        ('t_sb_019', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -22),
        ('t_sb_020', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -23),
        ('t_sb_021', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -24),
        ('t_sb_022', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, -25),
        
        # DoorDash food delivery (frequent, expensive)
        ('t_dd_001', 'u_demo_min', 'DoorDash · Chipotle', 'DoorDash', 'Food', 28.50, -2),
        ('t_dd_002', 'u_demo_min', 'DoorDash · Panda Express', 'DoorDash', 'Food', 24.75, -5),
        ('t_dd_003', 'u_demo_min', 'DoorDash · Thai Food', 'DoorDash', 'Food', 32.90, -8),
        ('t_dd_004', 'u_demo_min', 'DoorDash · Pizza', 'DoorDash', 'Food', 31.25, -11),
        ('t_dd_005', 'u_demo_min', 'DoorDash · Sushi', 'DoorDash', 'Food', 45.80, -14),
        ('t_dd_006', 'u_demo_min', 'DoorDash · Mexican', 'DoorDash', 'Food', 27.60, -17),
        ('t_dd_007', 'u_demo_min', 'DoorDash · Burger', 'DoorDash', 'Food', 22.45, -20),
        ('t_dd_008', 'u_demo_min', 'DoorDash · Italian', 'DoorDash', 'Food', 38.90, -23),
        
        # Amazon shopping (various)
        ('t_amz_001', 'u_demo_min', 'Amazon · Electronics', 'Amazon', 'Shopping', 89.99, -7),
        ('t_amz_002', 'u_demo_min', 'Amazon · Books', 'Amazon', 'Shopping', 34.50, -14),
        ('t_amz_003', 'u_demo_min', 'Amazon · Home Goods', 'Amazon', 'Shopping', 67.25, -21),
        
        # Gym membership (barely used)
        ('t_gym_001', 'u_demo_min', 'Planet Fitness', 'Planet Fitness', 'Health', 24.99, -15),
        ('t_gym_002', 'u_demo_min', 'Planet Fitness', 'Planet Fitness', 'Health', 24.99, -45),
        
        # Spotify Premium
        ('t_spot_001', 'u_demo_min', 'Spotify Premium', 'Spotify', 'Entertainment', 10.99, -10),
        ('t_spot_002', 'u_demo_min', 'Spotify Premium', 'Spotify', 'Entertainment', 10.99, -40),
        
        # Target (household items)
        ('t_tgt_001', 'u_demo_min', 'Target', 'Target', 'Shopping', 76.45, -6),
        ('t_tgt_002', 'u_demo_min', 'Target', 'Target', 'Shopping', 52.30, -18),
    ]
    
    # Insert transactions
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
        print(f"  {row['CATEGORY']:15s} {row['TRANSACTION_COUNT']:3d} txns  ${row['TOTAL_SPENT']:8.2f}")
    
    print("\n🎉 Demo data seeded successfully!")


if __name__ == "__main__":
    seed_demo_data()
