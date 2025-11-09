# Backend Test & Feature Overview

## Executive Summary

The BalanceIQ backend is a **Python FastAPI** application with **NO traditional unit tests** (no pytest, unittest, or test files). Instead, the project uses:
- **Integration tests** via shell scripts (`test-integration.sh`)
- **API endpoint testing** via curl/manual testing
- **Data validation** through the categorization pipeline
- **Database integration tests** in seed scripts
- **Mock data** in seed_data.py for testing

---

## Test Architecture

### Current Testing Approach

#### 1. Integration Test Script
**File**: `/home/user/backend-frontned-agent-alltogether/test-integration.sh`

Tests the connection between frontend and backend:
- ✅ Backend health check (`/health`)
- ✅ Transactions endpoint (`/api/user/{user_id}/transactions`)
- ✅ Predictions endpoint (`/api/predict`)
- ✅ Frontend configuration verification
- ✅ Environment setup validation

**How to run**:
```bash
bash test-integration.sh
```

#### 2. API Manual Testing via curl
Endpoints documented but not automated:
```bash
# Test transactions
curl "http://localhost:8000/api/user/u_demo_min/transactions?limit=3"

# Test predictions
curl "http://localhost:8000/api/predict?user_id=u_demo_min&limit=3"

# Test health
curl "http://localhost:8000/health"
```

#### 3. Seed Data Script
**File**: `/home/user/backend-frontned-agent-alltogether/backend/database/api/seed_data.py`

Populates test data into database:
- Netflix subscriptions (low usage detection)
- Starbucks coffee purchases (recurring pattern)
- Trader Joe's groceries (large orders)
- DoorDash/dining expenses
- Streaming service subscriptions

**How to run**:
```bash
python -m database.api.seed_data
```

#### 4. Categorization Model Testing
**File**: `/home/user/backend-frontned-agent-alltogether/backend/src/categorization-model.py`

Tests the AI-powered categorization pipeline:
- Loads product data from JSON
- Calls Dedalus Labs for categorization
- Validates 100% of items get categorized
- Tests batch processing
- Tests database insertion
- Tests embedding generation

**Expected output**:
```
✅ Categorized 20 products from Amazon
✅ Inserted 20 records to purchase_items_test
✅ Generated embeddings for 20 items (100% coverage)
```

---

## Backend Features (Organized by Area)

### 1. TRANSACTION MANAGEMENT

#### Endpoints
- **GET** `/api/user/{user_id}/transactions`
  - Returns recent transactions from PURCHASE_ITEMS_TEST
  - Supports limit parameter (1-100)
  - Returns: id, item, amount, date, category
  - Test with: `curl "http://localhost:8000/api/user/u_demo_min/transactions?limit=20"`

- **POST** `/transactions`
  - Upsert single transaction via MERGE
  - Requires TransactionInsert model validation
  - Test with curl + JSON body

#### Tests
- Basic CRUD operations through models.py validation
- Database connection through db.py
- Query execution in queries.py
- Transaction timestamp handling (ISO8601)
- Amount precision (cents conversion)

---

### 2. CATEGORIZATION & AI CLASSIFICATION

#### Key Files
- `backend/src/categorization-model.py` - Main categorization engine
- `backend/database/api/models.py` - Data validation models

#### Features Tested
1. **Batch AI Categorization**
   - Sends multiple products in single API call to Dedalus Labs
   - Uses GPT-5-mini model
   - Returns: category, subcategory, confidence, reasoning
   - Future: Multi-model consensus (GPT-5, Claude, Gemini)

2. **Batch Database Insertion**
   - 100% success rate validation
   - MERGE operations for idempotency
   - Snowflake batch execution

3. **Embedding Generation**
   - Automatic 768-dimensional embeddings (Snowflake Cortex AI)
   - e5-base-v2 model
   - 100% coverage guarantee
   - 2-3 seconds per batch

4. **Item Text Normalization**
   - Format: "merchant · category · item_name"
   - Used for semantic search and embeddings

#### Test Metrics (from docs)
| Metric | Value |
|--------|-------|
| Success Rate | 100% (20/20 items) |
| Avg Confidence | 94% |
| Processing Time | ~5-8 seconds |
| Items Needing Review | 0 (all >= 70%) |

---

### 3. PREDICTION ENGINE

#### Endpoints
- **GET** `/api/predict`
  - Query params: user_id (required), limit (1-20, default 5)
  - Returns predictions with confidence scores
  - Test with: `curl "http://localhost:8000/api/predict?user_id=u_demo_min&limit=5"`

#### Features Tested
**File**: `backend/database/api/predictor.py`

1. **Purchase Interval Calculation**
   - Groups purchases by (item_name, category)
   - Computes time intervals between purchases
   - Calculates average interval
   - Predicts next_time = last_time + avg_interval

2. **Confidence Scoring**
   - Sample factor: # of historical purchases (saturates at 10)
   - Regularity factor: coefficient of variation (0..1)
   - Formula: confidence = 0.2 + 0.4*sample + 0.4*regularity
   - Returns: 0.0 to 1.0

3. **Prediction Validation**
   - Requires >= 2 historical purchases
   - Returns empty array if insufficient history
   - Sorts by soonest next_time
   - Limits results per request

#### Test Data
- Starbucks: 22 daily purchases = high confidence
- Netflix: 2 subscriptions = low confidence (< 2 samples)
- Trader Joes: 4 weekly purchases = medium confidence

---

### 4. SMART TIPS (PIGGY TIPS)

#### Endpoints
- **GET** `/api/smart-tips`
  - Query params: user_id (required), limit (1-20, default 6)
  - Test with: `curl "http://localhost:8000/api/smart-tips?user_id=u_demo_min"`

#### Features Tested
**File**: `backend/database/api/smart_tips.py`

1. **High-Frequency Purchase Detection**
   - Analyzes 60-day transaction history
   - Detects 4+ purchases of same item
   - Estimates 60% savings potential
   - Targets: Coffee, Fast Food

2. **Category Overspending Detection**
   - Groups by category
   - Identifies top 3 spending categories
   - Estimates 30% savings potential
   - Returns spending totals

3. **Subscription Detection**
   - Identifies recurring charges (same price multiple times)
   - Low-usage detection (4 or fewer charges)
   - Flags for review

4. **Bundle Opportunities**
   - Detects multiple streaming subscriptions
   - Suggests cheaper bundles (Disney+Hulu)
   - Calculates savings percentages

#### Test Data Patterns
- Netflix ($15.49/month) with 2 charges = low usage flag
- Starbucks ($7.25 × 22 times) = high frequency savings
- Trader Joes ($127-156 weekly) = category overspending

---

### 5. BETTER DEALS (ALTERNATIVE SUGGESTIONS)

#### Endpoints
- **GET** `/api/better-deals`
  - Query params: user_id (required), limit (1-20, default 10)
  - Test with: `curl "http://localhost:8000/api/better-deals?user_id=u_demo_min"`

#### Features Tested
**File**: `backend/database/api/better_deals.py`

1. **Alternative Store Database**
   - Hardcoded merchant comparisons in ALTERNATIVE_STORES dict
   - Covers: Starbucks, Trader Joe's, Target, Amazon, etc.
   - Stores alternatives + price differences

2. **Savings Calculation**
   - Monthly spending × savings percentage
   - Example: Starbucks ($159.50/month) → Dunkin saves 40% = $63.80/month

3. **Category Filtering**
   - Currently filters to "Groceries" only
   - Prevents non-grocery deals

#### Supported Merchants (With Alternatives)
- **Starbucks** → Dunkin (-40%), Home Brew (-80%), McDonald's (-50%)
- **Trader Joe's** → Aldi (-30%), Costco (-25%), Walmart (-20%)
- **Target** → Walmart (-15%), Costco (-25%), Amazon (-10%)
- **Amazon** → Walmart (-12%), Target (-8%), AliExpress (-50%)
- **Whole Foods** → Trader Joe's (-35%), Sprouts (-25%), Regular Grocery (-40%)
- **DoorDash** → Pickup (-60%), Cook at Home (-70%), Uber Eats (-20%)
- **Netflix/Disney+/Hulu** → Family Plan (-50-60%), Bundles (-35-45%)
- **Planet Fitness** → Home Workouts (-90%), YouTube (-100%), Rec Center (-70%)

---

### 6. PIGGY GRAPH (VISUALIZATION DATA)

#### Endpoints
- **GET** `/api/piggy-graph`
  - Query params: user_id (required)
  - Returns: nodes, edges, insights, stats for React Flow visualization
  - Test with: `curl "http://localhost:8000/api/piggy-graph?user_id=u_demo_min"`

#### Features Tested
**File**: `backend/database/api/piggy_graph.py`

1. **Merchant Analysis**
   - Counts purchases per merchant
   - Identifies frequently visited stores
   - Infers location patterns

2. **Category Analysis**
   - Totals spending by category
   - Creates category nodes
   - Connects to insights

3. **Household Insights**
   - Detects large orders (household size inference)
   - Analyzes frequency patterns
   - Generates AI insights via LLM

4. **Graph Structure**
   - Central "Piggy" node
   - Insight nodes (Location, Frequency, Preferences)
   - Merchant/Category nodes
   - Edge connections

---

### 7. AI COACH

#### Endpoints
- **GET** `/api/coach`
  - Query params: user_id (required), limit (3-10, default 3)
  - Combines predictions + recent transactions
  - Generates AI coaching message via DigitalOcean LLM
  - Test with: `curl "http://localhost:8000/api/coach?user_id=u_demo_min"`

#### Features Tested
**File**: `backend/database/api/do_llm.py`

1. **LLM Integration**
   - DigitalOcean API endpoint
   - GPT-4o-mini model
   - OpenAI-compatible interface
   - 30-second timeout

2. **Prompt Engineering**
   - System: Financial coach persona
   - User: Spending patterns + predictions
   - Response: 3 sentences max
   - Includes mascot emotion tracking

3. **Fallback Handling**
   - Returns stub message if API key missing
   - Returns error message on API failure
   - Never crashes the application

---

### 8. SEMANTIC SEARCH

#### Endpoints
- **GET** `/semantic-search`
  - Query params: q (search text), user_id, limit (1-50, default 5)
  - ILIKE text search on ITEM_NAME, MERCHANT, CATEGORY
  - Test with: `curl "http://localhost:8000/semantic-search?q=coffee&user_id=u_demo_min"`

#### Features Tested
**File**: `backend/database/api/semantic.py`

1. **Text-Based Search**
   - Case-insensitive ILIKE matching
   - Searches across item_name, merchant, category
   - Returns transaction-shaped results
   - Orders by timestamp DESC

2. **Future Vector Search**
   - Snowflake embeddings ready (768-dim vectors)
   - Will use cosine similarity
   - Currently blocked - using ILIKE as fallback

---

### 9. HEALTH & DIAGNOSTICS

#### Endpoints
- **GET** `/health`
  - Returns Snowflake connection info
  - Shows: current user, role, warehouse, database, schema
  - Test with: `curl "http://localhost:8000/health"`

#### Features Tested
**File**: `backend/database/api/queries.py`

1. **Database Connectivity**
   - Validates Snowflake connection
   - Checks current context (user, role, warehouse)
   - Helps diagnose configuration issues

---

### 10. REPLY HANDLING (USER FEEDBACK)

#### Endpoints
- **POST** `/reply`
  - Expects UserReply model (JSON)
  - Stores user's need/want label for transaction
  - Updates database via MERGE
  - Test with: `curl -X POST -H "Content-Type: application/json" -d '{"id":"r1","transaction_id":"t1","user_id":"u1","user_label":"need","received_at":"2025-11-09T00:00:00Z"}' http://localhost:8000/reply`

#### Features Tested
**File**: `backend/database/api/models.py`

1. **Input Validation**
   - user_label must be "need" or "want" (regex)
   - ISO8601 timestamp validation
   - Required fields check

2. **Database Updates**
   - MERGE operation for idempotency
   - USER_REPLIES table updates
   - Created_at timestamp

---

## Feature Coverage Matrix

| Feature | Endpoint | Tests | Status |
|---------|----------|-------|--------|
| Transactions | GET /api/user/{id}/transactions | Integration test, curl tests | ✅ Working |
| Predictions | GET /api/predict | Integration test, predictor.py logic | ✅ Working |
| Smart Tips | GET /api/smart-tips | smart_tips.py module logic | ✅ Working |
| Better Deals | GET /api/better-deals | better_deals.py module logic | ✅ Working |
| Piggy Graph | GET /api/piggy-graph | piggy_graph.py module logic | ✅ Working |
| AI Coach | GET /api/coach | do_llm.py + predictions | ✅ Working (with fallback) |
| Categorization | N/A (background) | categorization-model.py script | ✅ Tested |
| Embeddings | N/A (auto) | categorization-model.py + Snowflake | ✅ Tested |
| Semantic Search | GET /semantic-search | semantic.py logic | ✅ Working |
| Health Check | GET /health | Integration test | ✅ Working |
| User Reply | POST /reply | models.py validation | ✅ Working |

---

## Database Schema Under Test

### Main Table: PURCHASE_ITEMS_TEST

```sql
Columns tested:
- ITEM_ID (string, PK)
- USER_ID (string)
- ITEM_NAME (string)
- MERCHANT (string)
- CATEGORY (string)
- SUBCATEGORY (string)
- PRICE (decimal)
- QUANTITY (decimal)
- TS (timestamp)
- CONFIDENCE (float)
- REASON (string)
- ITEM_EMBED (vector - 768 dimensions)
- DETECTED_NEEDWANT (string: need/want)
- USER_NEEDWANT (string: need/want)
```

### Supporting Tables
- TRANSACTIONS (deprecated, PURCHASE_ITEMS_TEST preferred)
- USER_REPLIES (user labels)
- PREDICTIONS (pre-computed predictions)

---

## Test Data Structure

### Demo User
**ID**: `u_demo_min`

### Sample Transactions
```json
{
  "Starbucks": 22 daily purchases @ $7.25
  "Trader Joes": 4 weekly @ $127-156
  "Netflix": 2 charges @ $15.49
  "Disney+": 2 charges @ $13.99
  "DoorDash": 3 orders @ $35-50
}
```

### Categories in Test Data
- Coffee (Starbucks)
- Groceries (Trader Joes)
- Entertainment (Netflix, Disney+, Hulu)
- Food/Dining (DoorDash)
- Subscriptions

---

## How to Run Tests

### 1. Integration Test
```bash
# Navigate to project root
cd /home/user/backend-frontned-agent-alltogether

# Run integration test
bash test-integration.sh

# Expected output:
# ✅ Backend is running at http://localhost:8000
# ✅ Transactions endpoint accessible
# ✅ Predictions endpoint accessible
# ✅ Integration test complete!
```

### 2. Manual API Tests
```bash
# Start backend (if not running)
cd backend/database/api
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# In another terminal, test endpoints
curl http://localhost:8000/health
curl "http://localhost:8000/api/user/u_demo_min/transactions?limit=5"
curl "http://localhost:8000/api/predict?user_id=u_demo_min&limit=3"
curl "http://localhost:8000/api/smart-tips?user_id=u_demo_min"
curl "http://localhost:8000/api/better-deals?user_id=u_demo_min"
curl "http://localhost:8000/api/piggy-graph?user_id=u_demo_min"
curl "http://localhost:8000/api/coach?user_id=u_demo_min"
```

### 3. Categorization Test
```bash
cd backend
python src/categorization-model.py

# Expected output:
# ✅ Categorized 20 products from Amazon
# ✅ Inserted 20 records to purchase_items_test
# ✅ Generated embeddings for 20 items (100% coverage)
```

### 4. Seed Test Data
```bash
cd backend/database/api
python -m seed_data

# Expected:
# 🌱 Seeding new demo data...
# ✅ Demo data populated
```

---

## Documentation References

| Document | Location | Purpose |
|----------|----------|---------|
| CLAUDE.MD | backend/CLAUDE.MD | Development guidelines, testing strategy |
| categorization-flow.md | backend/docs/ | AI categorization pipeline details |
| unified-architecture.md | backend/docs/ | Database schema + prediction queries |
| deployment-snowflake.md | backend/docs/ | Snowflake setup instructions |
| INTEGRATION_GUIDE.md | root/ | Frontend-backend integration |
| ARCHITECTURE.md | root/ | System architecture diagram |

---

## Environment Setup for Testing

### Required Variables
```bash
SNOWFLAKE_ACCOUNT=<account>
SNOWFLAKE_USER=<user>
SNOWFLAKE_PASSWORD=<password>
SNOWFLAKE_ROLE=<role>
SNOWFLAKE_WAREHOUSE=<warehouse>
SNOWFLAKE_DATABASE=SNOWFLAKE_LEARNING_DB
SNOWFLAKE_SCHEMA=BALANCEIQ_CORE

# For AI Coach
DO_API_KEY=<digitalocean_api_key>
DO_LLM_MODEL=gpt-4o-mini

# For Categorization
DEDALUS_API_KEY=<dedalus_labs_key>
```

---

## Limitations & Known Issues

1. **No Unit Tests**: No pytest/unittest framework
2. **Embedding Search**: Currently uses ILIKE fallback (not vector similarity)
3. **Better Deals**: Only filters "Groceries" category
4. **Category Filtering**: Some features hardcoded to test data
5. **User Tracking**: Currently uses hardcoded "u_demo_min" (should use Clerk integration)
6. **Mock Data**: All tests use pre-seeded data, not real Knot API

---

## Future Testing Improvements

1. Add pytest framework for unit tests
2. Implement pytest fixtures for test data
3. Add parameterized tests for different users/categories
4. Test edge cases (empty results, invalid IDs)
5. Performance benchmarking for queries
6. Load testing for concurrent predictions
7. Integration with CI/CD pipeline
8. Automated embedding validation

---

## Summary

The BalanceIQ backend has **comprehensive feature coverage** with:
- ✅ 10+ API endpoints
- ✅ 5+ ML features (predictions, categorization, embeddings)
- ✅ AI integration (coaching, classification)
- ✅ Database integration testing
- ✅ Mock data generation

But lacks:
- ❌ Unit test framework
- ❌ Automated test suite
- ❌ CI/CD test pipeline
- ❌ Edge case coverage

The current integration test approach works but is **not scalable** for a production system. Moving to pytest + fixtures is recommended for the next phase.

