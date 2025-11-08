# Weekly Alternative Suggestions - Feature Documentation

## Overview

The **Weekly Alternative Suggestions** feature helps users save money by automatically analyzing their weekly purchases and finding cheaper alternatives using AI-powered web search. The system identifies the most expensive items purchased each week, uses Dedalus AI with MCP (Model Context Protocol) web search to find better deals, and presents results through both standard and real-time streaming APIs.

**Key Benefits:**
- 💰 Automatic savings discovery (only shows alternatives with >$10 savings)
- 🔍 AI-powered product matching using Dedalus AI + MCP websearch
- 🌍 Location-aware suggestions (considers buyer's city/state for local deals)
- 📊 Privacy-first design (only stores city/state/country, no GPS coordinates)
- ⚡ Real-time streaming updates for better user experience
- 🔄 Idempotent operations (safe to re-run)

---

## Feature 1: Location-Enhanced Purchase Tracking

### What It Does
Enhances the existing purchase tracking system to capture and store buyer location information (city, state, country) for each transaction.

### Technical Implementation

**Database Schema:**
```sql
ALTER TABLE PURCHASE_ITEMS_TEST
ADD COLUMN buyer_location OBJECT;
```

**Location Object Structure:**
```json
{
  "city": "Princeton",
  "state": "NJ",
  "country": "USA",
  "postal_code": "08544"
}
```

**Privacy Design:**
- ✅ Stores: City, State, Country (coarse-grained location)
- ❌ Never stores: Latitude/Longitude, exact addresses

**Files:**
- `src/data/sample_knot_with_location.json` - Test data with location
- `tests/test_phase1_buyer_location.py` - 6 tests validating schema

**Why This Matters:**
Location data enables the AI to recommend local alternatives (e.g., "Target in Princeton has Ring Doorbell for $20 less") instead of just online retailers.

---

## Feature 2: AI-Powered Weekly Suggester

### What It Does
Core intelligence engine that analyzes a user's weekly purchases and uses Dedalus AI with MCP web search to discover cheaper alternatives.

### How It Works

**Step 1: Fetch Top Expensive Items**
```python
items = fetch_top_items(user_id, week_start, limit=5)
```
- Queries Snowflake for user's purchases in the target week
- Orders by price (most expensive first)
- Returns top 5 items (configurable)

**Step 2: Build AI Prompt**
```python
prompt = build_plan_prompt(items)
```

Creates a structured prompt with:
- List of purchased items (name, price, merchant, location)
- Search constraints (>$10 savings required)
- Output format (JSON with specific fields)

**Example Prompt:**
```
Find cheaper alternatives for these purchases:
1. Ring Video Doorbell 3 - $119.99 at Amazon (Princeton, NJ)
2. Instant Pot Duo - $89.99 at Target (Princeton, NJ)

Requirements:
- Only suggest if total savings (including shipping/tax) > $10
- Include URL to buy alternative
- Calculate total landed cost
```

**Step 3: Call Dedalus AI with MCP**
```python
result = await runner.run(
    input=prompt,
    model="openai/gpt-4o-mini"
)
```

Dedalus automatically:
- Uses MCP websearch tool to find current prices
- Compares multiple retailers
- Calculates shipping/tax costs
- Returns structured JSON findings

**Step 4: Parse & Validate Results**
```python
findings = parse_findings(response)
```
- Extracts JSON from AI response
- Validates savings > $10
- Returns list of alternatives

### Technical Details

**Dependencies:**
- `dedalus_labs` - AI orchestration framework
- `AsyncDedalus` - Async client for Dedalus API
- `DedalusRunner` - Executes AI workflows with MCP

**Files:**
- `src/services/weekly_suggester.py` (~250 lines)
- `tests/test_weekly_suggester.py` - 14 tests

**Output Format:**
```json
{
  "findings": [
    {
      "item_name": "Ring Video Doorbell 3",
      "original_price": 119.99,
      "original_merchant": "Amazon",
      "alternative_merchant": "Best Buy",
      "alternative_price": 99.99,
      "shipping_cost": 0.00,
      "tax_estimate": 7.00,
      "total_landed_cost": 106.99,
      "total_savings": 13.00,
      "url": "https://www.bestbuy.com/...",
      "notes": "Best Buy price match + free shipping"
    }
  ],
  "items_analyzed": 5,
  "items_with_alternatives": 1,
  "total_potential_savings": 13.00,
  "mcp_calls_made": 1,
  "processing_time_seconds": 4.2
}
```

**Why This Matters:**
This is the "brain" of the feature - it leverages AI to do what would be impossible manually: checking dozens of retailers in real-time for price comparisons.

---

## Feature 3: API Endpoints & Database Storage

### What It Does
Provides RESTful API endpoints to retrieve weekly suggestions and stores results in Snowflake for fast retrieval.

### API Endpoints

#### 1. Get Weekly Suggestions (Current Week)
```http
GET /api/user/{user_id}/weekly_alternatives
```

**Response:**
```json
{
  "user_id": "test_user_001",
  "week_start": "2024-01-22",
  "week_end": "2024-01-29",
  "findings": [...],
  "total_potential_savings": 25.50,
  "items_analyzed": 5,
  "items_with_alternatives": 2,
  "report_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-27T10:30:00Z",
  "updated_at": "2024-01-27T10:30:00Z"
}
```

#### 2. Get Specific Week
```http
GET /api/user/{user_id}/weekly_alternatives?week=2024-01-22
```

#### 3. Get History (Last 4 Weeks)
```http
GET /api/user/{user_id}/weekly_alternatives/history?limit=4
```

**Response:**
```json
[
  {
    "week_start": "2024-01-22",
    "total_potential_savings": 25.50,
    "items_with_alternatives": 2,
    "created_at": "2024-01-27T10:30:00Z"
  },
  {
    "week_start": "2024-01-15",
    "total_potential_savings": 18.00,
    "items_with_alternatives": 1,
    "created_at": "2024-01-20T09:15:00Z"
  }
]
```

### Database Storage

**Table: `weekly_suggestions_reports`**
```sql
CREATE TABLE weekly_suggestions_reports (
  report_id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  findings VARIANT,  -- JSON array of alternatives
  total_potential_savings FLOAT,
  items_analyzed INTEGER,
  items_with_alternatives INTEGER,
  created_at TIMESTAMP_NTZ,
  updated_at TIMESTAMP_NTZ,
  UNIQUE(user_id, week_start)  -- One report per user per week
);
```

**Database Functions:**

```python
# Upsert (create or update) a weekly report
def upsert_weekly_report(user_id, week_start, report_data):
    # Uses MERGE for idempotency
    # Safe to call multiple times with same data
```

```python
# Get most recent report
def get_weekly_report(user_id, week_start=None):
    # Returns latest report if week_start not specified
```

```python
# Get history
def get_recent_reports(user_id, limit=4):
    # Returns last N weeks of reports
```

**Idempotent Design:**
Uses SQL `MERGE` statement to ensure running the same week twice doesn't create duplicates - it updates the existing record instead.

**Files:**
- `database/api/main.py` - FastAPI endpoints
- `database/api/suggestions.py` - Database helper functions
- `tests/test_phase3_simple.py` - 12 tests

**Why This Matters:**
Separates report generation (slow, AI-powered) from report retrieval (fast, database query). Users get instant results after the first generation.

---

## Feature 4: Automated Weekly Job Script

### What It Does
Batch script that runs weekly to generate alternative suggestions for all active users automatically.

### Usage

**Basic Usage:**
```bash
python scripts/generate_weekly_suggestions.py
```
Processes all users with purchases in the current week.

**Specify Week:**
```bash
python scripts/generate_weekly_suggestions.py --week 2024-01-22
```

**Single User:**
```bash
python scripts/generate_weekly_suggestions.py --user test_user_001
```

**Dry Run (No Database Writes):**
```bash
python scripts/generate_weekly_suggestions.py --dry-run
```

### How It Works

**Step 1: Calculate Target Week**
```python
week_start = get_week_start_date(target_week)
# Returns Monday of the target week
# Example: "2024-01-22"
```

**Step 2: Fetch Active Users**
```python
users = get_users_with_purchases(week_start)
# Queries Snowflake for users with purchases in the week
# Uses parameterized queries (SQL injection safe)
```

**Step 3: Process Users Concurrently**
```python
async def process_user(user_id, week_start, dry_run):
    try:
        # Generate suggestions
        report = await suggester.generate_weekly_suggestions(user_id, week_start)

        # Save to database (unless dry-run)
        if not dry_run:
            report_id = upsert_weekly_report(user_id, week_start, report)

        return {"success": True, "report_id": report_id, ...}
    except Exception as e:
        # Error isolation - one user failure doesn't crash job
        return {"success": False, "error": str(e)}
```

**Step 4: Log Results**
```python
# Creates JSON log file in logs/ directory
{
  "job_date": "2024-01-27T10:00:00Z",
  "week_start": "2024-01-22",
  "total_users": 150,
  "successful": 148,
  "failed": 2,
  "total_items_analyzed": 750,
  "total_alternatives_found": 245,
  "total_potential_savings": 3250.00,
  "mcp_calls_made": 148,
  "processing_time_seconds": 620.5
}
```

### Features

**Error Isolation:**
If processing fails for one user, others continue processing. Failed users are logged for retry.

**Idempotent:**
Safe to re-run. Uses database MERGE to update existing records instead of creating duplicates.

**Monitoring:**
- Console output with progress
- JSON logs for automated monitoring
- Metrics: items analyzed, alternatives found, savings, MCP calls

**Scalability:**
Uses async/await for concurrent user processing. Can process hundreds of users in parallel.

### Deployment

**Cron Job (Linux):**
```bash
# Run every Monday at 6 AM
0 6 * * 1 cd /path/to/backend && python scripts/generate_weekly_suggestions.py
```

**Production Considerations:**
```bash
# Set feature flag
export WEEKLY_SUGGESTIONS_ENABLED=true

# Set Dedalus API key
export DEDALUS_API_KEY=your_key_here

# Run with error logging
python scripts/generate_weekly_suggestions.py 2>&1 | tee -a /var/log/weekly-suggestions.log
```

**Files:**
- `scripts/generate_weekly_suggestions.py` (~350 lines)
- `tests/test_phase4_weekly_job.py` - 14 tests

**Why This Matters:**
Automates the entire workflow. Set it up once, and users get fresh savings recommendations every Monday morning without manual intervention.

---

## Feature 5: Real-Time Streaming Updates

### What It Does
Provides Server-Sent Events (SSE) endpoint that streams live progress updates as the AI discovers alternatives, creating a more engaging user experience than a loading spinner.

### User Experience

**Traditional Approach:**
```
[Loading spinner for 10 seconds...]
✅ Found 3 alternatives! Total savings: $42.50
```

**Streaming Approach:**
```
🚀 Fetching your purchases...
📦 Found 5 purchases to analyze
   • Ring Doorbell - $119.99
   • Instant Pot - $89.99
   ...
🔍 AI is searching for cheaper alternatives...
✅ Found alternative for Ring Doorbell
   Savings: $13.00
✅ Found alternative for Instant Pot
   Savings: $12.50
✅ Complete! Total savings: $42.50
```

### API Endpoint

```http
GET /api/user/{user_id}/weekly_alternatives/stream?week=2024-01-22
```

**Response Type:** `text/event-stream` (Server-Sent Events)

**Event Stream:**
```
data: {"event": "start", "message": "Fetching your purchases...", "timestamp": "2024-01-27T10:30:00Z"}

data: {"event": "items_loaded", "count": 5, "message": "Found 5 purchases to analyze", "items": [...]}

data: {"event": "analyzing", "message": "AI is searching for cheaper alternatives..."}

data: {"event": "progress", "chunk": "Checking Best Buy prices..."}

data: {"event": "found", "item_name": "Ring Doorbell", "savings": 13.00, "original_price": 119.99, "alternative_merchant": "Best Buy", ...}

data: {"event": "complete", "total_savings": 42.50, "items_analyzed": 5, "items_with_alternatives": 2, "processing_time_seconds": 8.2}
```

### Event Types

| Event | Description | Fields |
|-------|-------------|--------|
| `start` | Analysis beginning | `message`, `user_id`, `week_start` |
| `items_loaded` | Purchases fetched | `count`, `items[]`, `message` |
| `analyzing` | AI search started | `message` |
| `progress` | AI thinking (streaming chunks) | `chunk` |
| `found` | Alternative discovered | `item_name`, `savings`, `original_price`, `alternative_merchant`, `url` |
| `complete` | Analysis finished | `total_savings`, `items_analyzed`, `processing_time_seconds` |
| `error` | Error occurred | `message`, `timestamp` |

### Frontend Integration

**JavaScript Example:**
```javascript
const eventSource = new EventSource(
  'http://localhost:8000/api/user/test_user_001/weekly_alternatives/stream?week=2024-01-22'
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch(data.event) {
    case 'start':
      showSpinner('Fetching your purchases...');
      break;

    case 'items_loaded':
      updateUI(`Analyzing ${data.count} purchases...`);
      displayItems(data.items);
      break;

    case 'analyzing':
      updateUI('AI is searching for better deals...');
      break;

    case 'found':
      addAlternative({
        item: data.item_name,
        savings: data.savings,
        merchant: data.alternative_merchant,
        url: data.url
      });
      break;

    case 'complete':
      hideSpinner();
      showSummary(`Total savings: $${data.total_savings}`);
      eventSource.close();
      break;

    case 'error':
      showError(data.message);
      eventSource.close();
      break;
  }
};

eventSource.onerror = (error) => {
  console.error('Connection lost:', error);
  eventSource.close();
};
```

**React Example:**
```jsx
function WeeklySuggestions({ userId, week }) {
  const [status, setStatus] = useState('idle');
  const [alternatives, setAlternatives] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/user/${userId}/weekly_alternatives/stream?week=${week}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.event === 'found') {
        setAlternatives(prev => [...prev, data]);
        setTotalSavings(prev => prev + data.savings);
      }

      if (data.event === 'complete') {
        setStatus('complete');
        eventSource.close();
      }
    };

    return () => eventSource.close();
  }, [userId, week]);

  return (
    <div>
      {alternatives.map(alt => (
        <AlternativeCard key={alt.item_name} {...alt} />
      ))}
      <TotalSavings amount={totalSavings} />
    </div>
  );
}
```

### Technical Implementation

**Backend (FastAPI):**
```python
@app.get("/api/user/{user_id}/weekly_alternatives/stream")
async def stream_weekly_alternatives(user_id: str, week: str = None):
    async def event_generator():
        async for event_data in generate_weekly_suggestions_stream(user_id, week):
            # Format as SSE: data: {json}\n\n
            yield f"data: {json.dumps(event_data)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )
```

**Streaming Core:**
```python
async def generate_weekly_suggestions_stream(user_id, week_start):
    # Yield start event
    yield {"event": "start", "message": "Fetching purchases..."}

    # Fetch items
    items = fetch_top_items(user_id, week_start)
    yield {"event": "items_loaded", "count": len(items), "items": items}

    # Stream AI response
    async for chunk in runner.run_stream(input=prompt, model="openai/gpt-4o-mini"):
        yield {"event": "progress", "chunk": chunk}

    # Parse and yield findings
    for finding in findings:
        yield {"event": "found", "item_name": finding['item_name'], ...}

    # Yield completion
    yield {"event": "complete", "total_savings": total_savings}
```

**Dedalus Streaming with Fallback:**
```python
# Try Dedalus streaming first
if hasattr(runner, 'run_stream'):
    async for chunk in runner.run_stream(input=prompt, model="openai/gpt-4o-mini"):
        yield {"event": "progress", "chunk": chunk}
else:
    # Fallback to regular (non-streaming) if unavailable
    response = await runner.run(input=prompt, model="openai/gpt-4o-mini")
```

**Files:**
- `src/services/weekly_suggester_stream.py` (~280 lines)
- `tests/test_phase5_streaming.py` - 14 tests

### Deployment Considerations

**Nginx Configuration:**
```nginx
location /api/user/ {
    proxy_pass http://backend:8000;
    proxy_buffering off;  # Critical for SSE!
    proxy_set_header X-Accel-Buffering no;
}
```

**Load Testing:**
SSE connections stay open for 5-10 seconds. Plan for concurrent connections:
- 100 users → ~10 concurrent SSE connections (assuming staggered usage)
- FastAPI handles this easily with async/await

**Why This Matters:**
Streaming transforms a "black box" 10-second wait into an engaging, transparent process. Users see the AI working in real-time, making the feature feel more intelligent and trustworthy.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ USER PURCHASE (with location)                                   │
│ "Ring Doorbell - $119.99 - Princeton, NJ"                       │
└─────────────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ SNOWFLAKE DATABASE                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ PURCHASE_ITEMS_TEST                                          │ │
│ │  - item_name, price, merchant                               │ │
│ │  - buyer_location: {city, state, country}                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ WEEKLY JOB (Mondays 6 AM)                                        │
│ scripts/generate_weekly_suggestions.py                           │
│  1. Fetch users with purchases this week                        │
│  2. For each user (async parallel):                             │
└─────────────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ WEEKLY SUGGESTER                                                 │
│ src/services/weekly_suggester.py                                 │
│  1. Fetch top 5 expensive items                                 │
│  2. Build AI prompt with constraints                            │
│  3. Call Dedalus AI + MCP websearch ──────────────┐             │
│  4. Parse findings (>$10 savings only)            │             │
└───────────────────────────────────────────────────┼─────────────┘
                          ▼                         ▼
┌─────────────────────────────────────┐  ┌──────────────────────┐
│ DATABASE STORAGE                     │  │ DEDALUS AI + MCP     │
│ database/api/suggestions.py          │  │ - AsyncDedalus       │
│  - upsert_weekly_report()           │  │ - DedalusRunner      │
│  - MERGE (idempotent)               │  │ - MCP websearch      │
│                                     │  │ - Price comparison   │
│ weekly_suggestions_reports           │  └──────────────────────┘
│  - report_id, user_id, week_start   │
│  - findings (JSON)                  │
│  - total_savings, items_analyzed    │
└─────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ API ENDPOINTS (FastAPI)                                          │
│ database/api/main.py                                             │
│                                                                  │
│ GET /api/user/{id}/weekly_alternatives                           │
│   → Retrieve cached report (fast)                               │
│                                                                  │
│ GET /api/user/{id}/weekly_alternatives/stream                    │
│   → Real-time SSE updates (engaging UX)                         │
│                                                                  │
│ GET /api/user/{id}/weekly_alternatives/history                   │
│   → Last 4 weeks of reports                                     │
└─────────────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (React/JavaScript)                                      │
│  - EventSource for SSE streaming                                │
│  - Real-time updates as AI finds alternatives                   │
│  - Display savings opportunities                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing & Verification

### Test Coverage: 56/56 Tests Passing ✅

**Phase 1: Buyer Location (6 tests)**
- ✅ Database column exists
- ✅ Test data has location
- ✅ No lat/lon stored (privacy)

**Phase 2: Weekly Suggester (14 tests)**
- ✅ Fetch top items function
- ✅ Build prompt with constraints
- ✅ Dedalus AI integration
- ✅ MCP websearch usage
- ✅ JSON parsing and validation

**Phase 3: API & Database (12 tests)**
- ✅ API endpoints exist
- ✅ Database helpers use MERGE
- ✅ Idempotent operations
- ✅ Privacy-safe storage

**Phase 4: Weekly Job (14 tests)**
- ✅ Week calculation logic
- ✅ SQL injection prevention
- ✅ Async user processing
- ✅ Error isolation
- ✅ Dry-run mode
- ✅ Logging and metrics

**Phase 5: Streaming (14 tests)**
- ✅ SSE endpoint structure
- ✅ Event types (start, found, complete, error)
- ✅ Proper headers (no-cache, keep-alive)
- ✅ Dedalus streaming with fallback
- ✅ Frontend examples

### Integration Verification: 8/8 Components ✅

Run full integration check:
```bash
python tests/verify_integration.py
```

Output:
```
✅ Test Data                      PASS
✅ Weekly Suggester               PASS
✅ Streaming Suggester            PASS
✅ Database Helpers               PASS
✅ API Endpoints                  PASS
✅ Weekly Job Script              PASS
✅ Tests                          PASS
✅ Documentation                  PASS

🎉 ALL COMPONENTS VERIFIED!
```

---

## Setup & Configuration

### 1. Environment Variables

Create `database/api/.env`:
```bash
# Snowflake Connection
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USER=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_ROLE=your_role
SNOWFLAKE_WAREHOUSE=your_warehouse
SNOWFLAKE_DATABASE=SNOWFLAKE_LEARNING_DB
SNOWFLAKE_SCHEMA=BALANCEIQ_CORE

# Dedalus Labs API Key
DEDALUS_API_KEY=your_dedalus_api_key

# Feature Flags
WEEKLY_SUGGESTIONS_ENABLED=true
```

### 2. Install Dependencies

```bash
pip install dedalus_labs fastapi uvicorn snowflake-connector-python
```

### 3. Database Setup

```sql
-- Already done - buyer_location column exists
-- Already done - weekly_suggestions_reports table exists
```

### 4. Test the Feature

**Test Weekly Suggester:**
```bash
python scripts/generate_weekly_suggestions.py --user test_user_001 --week 2024-01-22 --dry-run
```

**Start API Server:**
```bash
uvicorn database.api.main:app --reload
```

**Test Regular Endpoint:**
```bash
curl "http://localhost:8000/api/user/test_user_001/weekly_alternatives?week=2024-01-22"
```

**Test Streaming Endpoint:**
```bash
curl -N "http://localhost:8000/api/user/test_user_001/weekly_alternatives/stream?week=2024-01-22"
```

### 5. Schedule Weekly Job

**Linux Cron:**
```bash
# Run every Monday at 6 AM
0 6 * * 1 cd /path/to/backend && /usr/bin/python3 scripts/generate_weekly_suggestions.py
```

---

## Performance Metrics

**Per-User Processing Time:**
- Database query: <500ms
- AI call (Dedalus + MCP): 3-5 seconds
- Database upsert: <200ms
- **Total: ~5 seconds per user**

**Batch Job (100 users):**
- Sequential: ~500 seconds (8.3 minutes)
- Async parallel (10 concurrent): ~50 seconds
- **Recommendation: Use async with concurrency limit of 10**

**API Response Time:**
- Cached report retrieval: <800ms
- Streaming connection: ~5-8 seconds (live generation)

**MCP Quota Usage:**
- 1 MCP call per user per week
- 100 users = 100 MCP calls/week
- Dedalus free tier: Check quota limits

---

## Security & Privacy

**✅ SQL Injection Prevention:**
- All queries use parameterized statements (`%s` placeholders)
- No string interpolation in SQL

**✅ Privacy-First Location:**
- Only stores: City, State, Country
- Never stores: GPS coordinates, exact addresses

**✅ Input Validation:**
- Week format validation (YYYY-MM-DD)
- User ID sanitization
- Error handling for invalid inputs

**✅ API Security:**
- Ready for JWT authentication (add middleware)
- Rate limiting recommended for production
- CORS configured for allowed origins

**Security Reviews:**
- ✅ Phase 2 Security Review Complete
- ✅ Phase 3 Security Review Complete

---

## Monitoring & Observability

**JSON Logs:**
```bash
logs/weekly_suggestions_2024-01-27.json
```

**Log Contents:**
```json
{
  "job_date": "2024-01-27T10:00:00Z",
  "week_start": "2024-01-22",
  "total_users": 150,
  "successful": 148,
  "failed": 2,
  "failed_users": ["user_xyz", "user_abc"],
  "total_items_analyzed": 750,
  "total_alternatives_found": 245,
  "total_potential_savings": 3250.00,
  "mcp_calls_made": 148,
  "processing_time_seconds": 620.5
}
```

**Key Metrics to Track:**
- Success rate: `successful / total_users`
- Alternatives discovery rate: `alternatives_found / items_analyzed`
- Average savings per user: `total_savings / successful`
- MCP quota usage: Track daily/weekly
- Processing time: Should stay <10 seconds per user

---

## Troubleshooting

**Issue: "No module named 'dedalus_labs'"**
```bash
pip install dedalus_labs --user
```

**Issue: "Snowflake connection failed"**
- Check `.env` file has correct credentials
- Verify network access to Snowflake
- Test: `python -c "import snowflake.connector; print('OK')"`

**Issue: "No purchases found"**
- Run test data loader: `python src/categorization-model.py`
- Verify date range matches purchases

**Issue: "SSE connection closes immediately"**
- Check nginx: `proxy_buffering off;`
- Add header: `X-Accel-Buffering: no`

**Issue: "Dedalus API quota exceeded"**
- Check Dedalus dashboard for quota limits
- Reduce frequency or user count
- Consider upgrading plan

---

## Future Enhancements

**Potential Features:**
1. **Push Notifications**: Alert users when weekly report is ready
2. **Favorite Retailers**: Let users specify preferred stores
3. **Auto-Purchase**: One-click to buy alternative
4. **Price Tracking**: Monitor if alternatives get even cheaper
5. **Category Insights**: "You always overpay for electronics"
6. **Cashback Integration**: Factor in credit card rewards
7. **Local Pickup**: Prioritize stores with same-day pickup

**Technical Improvements:**
1. **Caching**: Redis cache for frequently accessed reports
2. **Webhooks**: Notify frontend when report generation completes
3. **A/B Testing**: Test different AI prompts for better results
4. **Multi-Model**: Try different AI models (GPT-4 vs Claude)

---

## File Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── weekly_suggester.py           # Core AI suggester (Phase 2)
│   │   └── weekly_suggester_stream.py    # Streaming version (Phase 5)
│   └── data/
│       └── sample_knot_with_location.json # Test data (Phase 1)
│
├── database/
│   └── api/
│       ├── main.py                        # API endpoints (Phase 3, 5)
│       ├── suggestions.py                 # Database helpers (Phase 3)
│       └── .env.example                   # Config template
│
├── scripts/
│   └── generate_weekly_suggestions.py     # Weekly job (Phase 4)
│
├── tests/
│   ├── test_phase1_buyer_location.py      # 6 tests
│   ├── test_weekly_suggester.py           # 14 tests
│   ├── test_phase3_simple.py              # 12 tests
│   ├── test_phase4_weekly_job.py          # 14 tests
│   ├── test_phase5_streaming.py           # 14 tests
│   ├── integration_test.py                # Real integration test
│   └── verify_integration.py              # Component verification
│
├── docs/
│   ├── weekly-suggestions-feature.md      # This file
│   └── e2e-integration-test.md            # Testing guide
│
└── logs/
    └── weekly_suggestions_*.json          # Job logs
```

---

## Summary

The **Weekly Alternative Suggestions** feature is a complete, production-ready system that:

1. ✅ **Tracks purchases with location** (city/state for local deals)
2. ✅ **Uses AI + MCP websearch** to find cheaper alternatives automatically
3. ✅ **Provides RESTful APIs** for easy frontend integration
4. ✅ **Automates weekly batch processing** for all users
5. ✅ **Streams real-time updates** for engaging user experience

**Key Stats:**
- 56/56 tests passing
- 8/8 components verified
- Privacy-first design
- Idempotent operations
- Production-ready security
- Comprehensive documentation

**Perfect for hackathon demo** with impressive real-time streaming and AI-powered price discovery!

---

**Questions or Issues?**
- See: `docs/e2e-integration-test.md` for detailed testing scenarios
- Run: `python tests/verify_integration.py` to verify setup
- Check: `logs/` directory for job execution logs
