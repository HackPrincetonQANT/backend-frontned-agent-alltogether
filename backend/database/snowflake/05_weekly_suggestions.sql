-- Weekly Suggestions Reports Table
-- Stores cached weekly alternative suggestions for cheaper purchases
-- Based on user location and MCP websearch results

USE DATABASE SNOWFLAKE_LEARNING_DB;
USE SCHEMA BALANCEIQ_CORE;

-- ============================================================================
-- Main Table: weekly_suggestions_reports
-- ============================================================================
-- Stores one report per (user_id, week) with all alternative suggestions

CREATE OR REPLACE TABLE weekly_suggestions_reports (
  -- Identity
  report_id          STRING PRIMARY KEY,
  user_id            STRING NOT NULL,

  -- Time Window
  week_start         DATE NOT NULL,           -- ISO week start (Monday)
  week_end           DATE NOT NULL,           -- ISO week end (Sunday)

  -- Location (Privacy: city-level only, no lat/lon)
  location_city      STRING,
  location_state     STRING,
  location_country   STRING,

  -- Summary Metrics
  total_items        INTEGER,                 -- Total items purchased this week
  items_with_alts    INTEGER,                 -- Items with at least 1 alternative
  total_savings_usd  NUMBER(12,2),            -- Sum of all potential savings

  -- Report Data (Full JSON blob)
  report_json        VARIANT NOT NULL,        -- Complete report with alternatives

  -- Metadata
  mcp_calls_made     INTEGER,                 -- Number of MCP websearch calls
  processing_time_ms INTEGER,                 -- How long to generate report

  -- Audit
  created_at         TIMESTAMP_TZ DEFAULT CURRENT_TIMESTAMP(),
  updated_at         TIMESTAMP_TZ DEFAULT CURRENT_TIMESTAMP()
);

-- ============================================================================
-- Indexes for fast retrieval
-- ============================================================================

-- Primary access pattern: fetch by user and week
CREATE UNIQUE INDEX idx_user_week
  ON weekly_suggestions_reports(user_id, week_start);

-- Cluster for query performance
ALTER TABLE weekly_suggestions_reports
  CLUSTER BY (user_id, week_start);

-- ============================================================================
-- Sample report_json structure (for reference):
-- ============================================================================
-- {
--   "user_id": "user_123",
--   "week_start": "2024-01-22",
--   "week_end": "2024-01-28",
--   "location": {"city": "Chicago", "state": "IL", "country": "US"},
--   "items": [
--     {
--       "item_id": "item_abc",
--       "item_name": "Wemo Mini Smart Plug",
--       "paid_unit_price": 22.99,
--       "category": "Electronics",
--       "alternatives": [
--         {
--           "vendor": "Best Buy - Chicago Loop",
--           "url": "https://bestbuy.com/...",
--           "alt_unit_price": 19.99,
--           "distance_miles": 2.3,
--           "channel": "local",
--           "confidence": 0.95,
--           "notes": "Same model, in stock"
--         },
--         {
--           "vendor": "Amazon.com",
--           "url": "https://amazon.com/...",
--           "alt_unit_price": 21.49,
--           "channel": "online",
--           "confidence": 0.90,
--           "notes": "Prime eligible, IL warehouse"
--         }
--       ],
--       "estimated_savings": 3.00,
--       "decision": "alternatives_found",
--       "rationale": "2 local/online options found within constraints"
--     }
--   ],
--   "summary": {
--     "total_items": 15,
--     "items_with_alternatives": 12,
--     "total_potential_savings": 45.67,
--     "top_tips": [
--       "Save $12.00 on electronics by shopping at Best Buy",
--       "Save $8.50 on home goods with online alternatives"
--     ]
--   }
-- }
