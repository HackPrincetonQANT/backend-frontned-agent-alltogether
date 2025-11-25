# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Piggy AI is a financial assistant platform with three main components:
1. **Backend (FastAPI + Snowflake)** - Transaction data API at `backend/database/api/`
2. **Frontend (React + Vite)** - Web dashboard at `clerk-react/`
3. **Agent (Node.js)** - Conversational AI with iMessage integration at `agent/`

Test user ID: `15514049519` (has 59 Amazon transactions worth $4,429.39)

## Development Commands

### Starting Services

**All services at once:**
```bash
./start-all.sh
```
This starts:
- Backend on port 8000
- Frontend on port 5173
- Agent on port 3001

**Individual services:**

Backend (Database API):
```bash
cd backend
conda activate princeton
python -m uvicorn database.api.main:app --reload --port 8000
# Or with absolute path:
/opt/anaconda3/bin/python -m uvicorn database.api.main:app --port 8001 --reload
```

Frontend:
```bash
cd clerk-react
npm run dev
# Opens on http://localhost:5173
```

Agent (Conversational AI):
```bash
cd agent
npm start  # Runs photon.js
```

**Stop all services:**
```bash
./stop-all.sh
```

### Testing

**Health check:**
```bash
curl http://localhost:8000/health
```

**View transactions:**
```bash
curl "http://localhost:8000/api/user/15514049519/transactions?limit=5"
```

**Test AI agent (terminal):**
```bash
cd agent
node simple-test.js
```

**Full integration test:**
```bash
./test-integration.sh
```

### Frontend Development

Build:
```bash
cd clerk-react
npm run build
```

Lint:
```bash
cd clerk-react
npm run lint
```

### Backend Development

Install Python dependencies:
```bash
cd backend/database/api
pip install -r requirements.txt
```

The backend uses Snowflake for data storage. Connection configured via environment variables in `backend/database/api/.env`.

## Architecture

### Data Flow

```
User → Frontend (React) → Backend API (FastAPI) → Snowflake DB
                              ↓
                         AI Agent (GPT-4) ← iMessage/Terminal
```

### Backend Structure (`backend/database/api/`)

**Core files:**
- `main.py` - FastAPI app with all endpoints
- `db.py` - Snowflake connection management (`fetch_all`, `execute`, `get_conn`)
- `queries.py` - SQL query definitions
- `models.py` - Pydantic models for request/response validation

**Feature modules:**
- `predictor.py` - Purchase prediction algorithm (analyzes transaction intervals)
- `do_llm.py` - DigitalOcean LLM wrapper for AI coaching
- `semantic.py` - Semantic search using Snowflake embeddings
- `smart_tips.py` - Generate savings tips based on spending patterns
- `better_deals.py` - Suggest cheaper alternatives for frequent purchases
- `piggy_graph.py` - Graph visualization of spending habits
- `receipt_processing.py` - Google Gemini Vision integration for receipt scanning

**Key endpoints:**
- `GET /api/user/{user_id}/transactions` - Recent transactions from `PURCHASE_ITEMS_TEST` table
- `GET /api/predict` - Behavioral predictions (when user will buy next)
- `GET /api/coach` - AI-generated financial coaching message
- `GET /api/smart-tips` - Savings recommendations
- `GET /api/better-deals` - Alternative cheaper options
- `GET /api/piggy-graph` - Graph structure for visualization
- `POST /api/receipt/process` - Process receipt image with Gemini Vision

### Frontend Structure (`clerk-react/src/`)

Built with React + Vite + TypeScript. Uses Clerk for authentication.

**Key components:**
- `components/common/Activity.tsx` - Main transaction view with category grouping
- `components/common/Home.tsx` - Dashboard overview
- `components/common/Insights.tsx` - Spending insights and predictions
- `components/common/PiggyGraph.tsx` - ReactFlow visualization
- `components/onboarding/Onboarding.tsx` - User onboarding flow

**Services:**
- `services/backendApi.ts` - API client for backend endpoints
- `services/nessieApi.ts` - Nessie API integration

**Type definitions:** See `src/types/index.ts` for `Transaction`, `Prediction` interfaces

### Agent Structure (`agent/`)

Node.js conversational AI with OpenAI function calling and iMessage integration.

**Core files:**
- `photon.js` - iMessage bot using Photon SDK
- `aiAgent.js` - OpenAI GPT-4 chat interface with function calling
- `dbClient.js` - Backend API client for database access

**AI Agent capabilities:**
- Maintains conversation history per user (last 20 messages)
- Function calling tools: `get_recent_transactions`, `get_category_stats`, `get_predictions`, `get_spending_summary`, `get_ai_coach`
- Personality: "Piggy" - friendly, concise, supportive financial assistant

## Database Schema

Main table: `SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST`

Columns:
- `ITEM_ID` - Unique transaction ID
- `USER_ID` - User identifier
- `ITEM_NAME` - Product/service name
- `MERCHANT` - Store/vendor
- `PRICE` - Amount (stored as decimal, converted to cents for API)
- `TS` - Timestamp
- `CATEGORY` - Spending category (Coffee, Food, Groceries, etc.)

## Environment Configuration

Each component needs its own `.env` file:

**Backend (`backend/database/api/.env`):**
- Snowflake credentials: `SNOWFLAKE_ACCOUNT`, `SNOWFLAKE_USER`, `SNOWFLAKE_PASSWORD`
- `SNOWFLAKE_DATABASE=SNOWFLAKE_LEARNING_DB`
- `SNOWFLAKE_SCHEMA=BALANCEIQ_CORE`

**Frontend (`clerk-react/.env`):**
- `VITE_BACKEND_API_URL=http://localhost:8000`
- `VITE_CLERK_PUBLISHABLE_KEY=pk_test_...`

**Agent (`agent/.env`):**
- `OPENAI_API_KEY` - For GPT-4 function calling
- `DATABASE_API_URL=http://localhost:8000`
- `TEST_USER_ID=15514049519`

## Key Implementation Patterns

### Backend Error Handling
All endpoints use try-except with `HTTPException` for errors. Database functions (`fetch_all`, `execute`) handle Snowflake connection lifecycle.

### Frontend API Calls
- `backendApi.ts` uses `fetch()` with error handling
- Returns typed responses matching backend Pydantic models
- CORS enabled for `localhost:5173` and `localhost:3000`

### AI Agent Function Calling
The agent uses OpenAI's function calling to decide which database queries to run. Flow:
1. User sends message → Added to conversation history
2. GPT-4 decides if it needs data → Calls function tool
3. `executeFunction()` runs DB query via `dbClient.js`
4. Function result added to history → GPT-4 generates final response

### Receipt Processing
Uses Google Gemini Vision API to extract transaction data from receipt images, then saves to Snowflake database with automatic categorization.

## Troubleshooting

**Port conflicts:**
```bash
lsof -ti:8000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

**Node version issues:**
```bash
nvm use 20
cd agent && npm install
```

**Conda environment:**
```bash
conda activate princeton
```

**Check logs:**
```bash
tail -f backend.log
tail -f frontend.log
tail -f agent.log
```

## Additional Documentation

- `README.md` - Quick start guide
- `ARCHITECTURE.md` - Detailed system architecture diagrams
- `SETUP_QUICK.md` - Setup instructions
- `INTEGRATION_GUIDE.md` - Integration details
