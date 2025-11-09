-- Seed realistic demo data for BalanceIQ
-- Run this in Snowflake to populate PURCHASE_ITEMS_TEST with demoable transactions

-- First, delete the old transport data and simple mock data
DELETE FROM SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST 
WHERE USER_ID = 'u_demo_min';

-- Insert realistic demo transactions
INSERT INTO SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST 
  (ITEM_ID, USER_ID, ITEM_NAME, MERCHANT, CATEGORY, PRICE, TS)
VALUES
  -- Netflix subscription (only watched 2 episodes - low usage)
  ('t_netflix_001', 'u_demo_min', 'Netflix', 'Netflix', 'Entertainment', 15.49, DATEADD('day', -28, CURRENT_TIMESTAMP())),
  ('t_netflix_002', 'u_demo_min', 'Netflix', 'Netflix', 'Entertainment', 15.49, DATEADD('day', -58, CURRENT_TIMESTAMP())),
  
  -- Disney+ subscription
  ('t_disney_001', 'u_demo_min', 'Disney+', 'Disney+', 'Entertainment', 13.99, DATEADD('day', -25, CURRENT_TIMESTAMP())),
  ('t_disney_002', 'u_demo_min', 'Disney+', 'Disney+', 'Entertainment', 13.99, DATEADD('day', -55, CURRENT_TIMESTAMP())),
  
  -- Hulu subscription
  ('t_hulu_001', 'u_demo_min', 'Hulu', 'Hulu', 'Entertainment', 17.99, DATEADD('day', -22, CURRENT_TIMESTAMP())),
  ('t_hulu_002', 'u_demo_min', 'Hulu', 'Hulu', 'Entertainment', 17.99, DATEADD('day', -52, CURRENT_TIMESTAMP())),
  
  -- Trader Joe's groceries (inflated prices, weekly shopping)
  ('t_tj_001', 'u_demo_min', 'Trader Joes', 'Trader Joe''s', 'Groceries', 127.45, DATEADD('day', -5, CURRENT_TIMESTAMP())),
  ('t_tj_002', 'u_demo_min', 'Trader Joes', 'Trader Joe''s', 'Groceries', 143.20, DATEADD('day', -12, CURRENT_TIMESTAMP())),
  ('t_tj_003', 'u_demo_min', 'Trader Joes', 'Trader Joe''s', 'Groceries', 156.80, DATEADD('day', -19, CURRENT_TIMESTAMP())),
  ('t_tj_004', 'u_demo_min', 'Trader Joes', 'Trader Joe''s', 'Groceries', 134.95, DATEADD('day', -26, CURRENT_TIMESTAMP())),
  
  -- Daily Starbucks (expensive habit)
  ('t_sb_001', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -1, CURRENT_TIMESTAMP())),
  ('t_sb_002', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -2, CURRENT_TIMESTAMP())),
  ('t_sb_003', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -3, CURRENT_TIMESTAMP())),
  ('t_sb_004', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -4, CURRENT_TIMESTAMP())),
  ('t_sb_005', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -5, CURRENT_TIMESTAMP())),
  ('t_sb_006', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -6, CURRENT_TIMESTAMP())),
  ('t_sb_007', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -8, CURRENT_TIMESTAMP())),
  ('t_sb_008', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -9, CURRENT_TIMESTAMP())),
  ('t_sb_009', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -10, CURRENT_TIMESTAMP())),
  ('t_sb_010', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -11, CURRENT_TIMESTAMP())),
  ('t_sb_011', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -12, CURRENT_TIMESTAMP())),
  ('t_sb_012', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -13, CURRENT_TIMESTAMP())),
  ('t_sb_013', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -15, CURRENT_TIMESTAMP())),
  ('t_sb_014', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -16, CURRENT_TIMESTAMP())),
  ('t_sb_015', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -17, CURRENT_TIMESTAMP())),
  ('t_sb_016', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -18, CURRENT_TIMESTAMP())),
  ('t_sb_017', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -19, CURRENT_TIMESTAMP())),
  ('t_sb_018', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -20, CURRENT_TIMESTAMP())),
  ('t_sb_019', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -22, CURRENT_TIMESTAMP())),
  ('t_sb_020', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -23, CURRENT_TIMESTAMP())),
  ('t_sb_021', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -24, CURRENT_TIMESTAMP())),
  ('t_sb_022', 'u_demo_min', 'Starbucks · Coffee', 'Starbucks', 'Coffee', 7.25, DATEADD('day', -25, CURRENT_TIMESTAMP())),
  
  -- DoorDash food delivery (frequent, expensive)
  ('t_dd_001', 'u_demo_min', 'DoorDash · Chipotle', 'DoorDash', 'Food', 28.50, DATEADD('day', -2, CURRENT_TIMESTAMP())),
  ('t_dd_002', 'u_demo_min', 'DoorDash · Panda Express', 'DoorDash', 'Food', 24.75, DATEADD('day', -5, CURRENT_TIMESTAMP())),
  ('t_dd_003', 'u_demo_min', 'DoorDash · Thai Food', 'DoorDash', 'Food', 32.90, DATEADD('day', -8, CURRENT_TIMESTAMP())),
  ('t_dd_004', 'u_demo_min', 'DoorDash · Pizza', 'DoorDash', 'Food', 31.25, DATEADD('day', -11, CURRENT_TIMESTAMP())),
  ('t_dd_005', 'u_demo_min', 'DoorDash · Sushi', 'DoorDash', 'Food', 45.80, DATEADD('day', -14, CURRENT_TIMESTAMP())),
  ('t_dd_006', 'u_demo_min', 'DoorDash · Mexican', 'DoorDash', 'Food', 27.60, DATEADD('day', -17, CURRENT_TIMESTAMP())),
  ('t_dd_007', 'u_demo_min', 'DoorDash · Burger', 'DoorDash', 'Food', 22.45, DATEADD('day', -20, CURRENT_TIMESTAMP())),
  ('t_dd_008', 'u_demo_min', 'DoorDash · Italian', 'DoorDash', 'Food', 38.90, DATEADD('day', -23, CURRENT_TIMESTAMP())),
  
  -- Amazon shopping (various)
  ('t_amz_001', 'u_demo_min', 'Amazon · Electronics', 'Amazon', 'Shopping', 89.99, DATEADD('day', -7, CURRENT_TIMESTAMP())),
  ('t_amz_002', 'u_demo_min', 'Amazon · Books', 'Amazon', 'Shopping', 34.50, DATEADD('day', -14, CURRENT_TIMESTAMP())),
  ('t_amz_003', 'u_demo_min', 'Amazon · Home Goods', 'Amazon', 'Shopping', 67.25, DATEADD('day', -21, CURRENT_TIMESTAMP())),
  
  -- Gym membership (barely used)
  ('t_gym_001', 'u_demo_min', 'Planet Fitness', 'Planet Fitness', 'Health', 24.99, DATEADD('day', -15, CURRENT_TIMESTAMP())),
  ('t_gym_002', 'u_demo_min', 'Planet Fitness', 'Planet Fitness', 'Health', 24.99, DATEADD('day', -45, CURRENT_TIMESTAMP())),
  
  -- Spotify Premium
  ('t_spot_001', 'u_demo_min', 'Spotify Premium', 'Spotify', 'Entertainment', 10.99, DATEADD('day', -10, CURRENT_TIMESTAMP())),
  ('t_spot_002', 'u_demo_min', 'Spotify Premium', 'Spotify', 'Entertainment', 10.99, DATEADD('day', -40, CURRENT_TIMESTAMP())),
  
  -- Target (household items)
  ('t_tgt_001', 'u_demo_min', 'Target', 'Target', 'Shopping', 76.45, DATEADD('day', -6, CURRENT_TIMESTAMP())),
  ('t_tgt_002', 'u_demo_min', 'Target', 'Target', 'Shopping', 52.30, DATEADD('day', -18, CURRENT_TIMESTAMP()));

-- Verify the data
SELECT 
  CATEGORY,
  COUNT(*) AS TRANSACTION_COUNT,
  SUM(PRICE) AS TOTAL_SPENT
FROM SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST
WHERE USER_ID = 'u_demo_min'
GROUP BY CATEGORY
ORDER BY TOTAL_SPENT DESC;
