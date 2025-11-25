# Smart Piggy AI - Financial Assistant

An intelligent financial assistant platform combining behavioral prediction, conversational AI, and real-time transaction analysis. The system integrates FastAPI backend services with a React frontend and GPT-4 powered conversational agent to provide actionable spending insights.

## Abstract

Smart Piggy AI addresses the problem of delayed financial awareness by providing real-time transaction analysis and predictive spending alerts. The system employs behavioral analysis algorithms to predict future purchases, uses OpenAI function calling for natural language interaction, and leverages Snowflake's analytical capabilities for large-scale transaction processing. Unlike traditional budgeting tools that provide retrospective reports, this platform intervenes at the point of purchase decision-making through conversational engagement via iMessage and web interface.

## Architecture

### System Overview

The platform consists of three primary services communicating over HTTP:

```
┌─────────────────────────────────────────────────────────────┐
│  User Interfaces                                            │
│  - React Web Dashboard (Clerk Auth)                         │
│  - iMessage Bot (Photon SDK)                                │
│  - Terminal Chat Interface                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/REST
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  AI Agent Service (Node.js)                                 │
│  - OpenAI GPT-4 with Function Calling                       │
│  - Conversation Memory Management                           │
│  - Database Query Orchestration                             │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/REST
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend API Service (FastAPI)                              │
│  - Transaction Management                                   │
│  - Behavioral Prediction Engine                             │
│  - AI Coaching (DigitalOcean LLM)                           │
│  - Receipt Processing (Google Gemini Vision)                │
│  - Recommendation Generation                                │
└──────────────────┬──────────────────────────────────────────┘
                   │ Snowflake Connector
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Data Layer (Snowflake)                                     │
│  Database: SNOWFLAKE_LEARNING_DB                            │
│  Schema: BALANCEIQ_CORE                                     │
│  Primary Table: PURCHASE_ITEMS_TEST                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

Transaction data flows through the system as follows:

1. Transactions are stored in Snowflake PURCHASE_ITEMS_TEST table with columns: ITEM_ID, USER_ID, ITEM_NAME, MERCHANT, PRICE, TS (timestamp), CATEGORY
2. Backend API exposes RESTful endpoints for transaction queries, predictions, and recommendations
3. AI Agent service maintains per-user conversation history and executes database queries via backend API based on OpenAI function calling
4. Frontend fetches data from backend API and renders visualizations
5. Receipt images are processed by Google Gemini Vision API, extracted data is categorized and inserted into database

### Behavioral Prediction Algorithm

The prediction engine analyzes transaction history to forecast future purchases:

1. Group transactions by (item_name, category) tuple
2. Calculate inter-purchase intervals from timestamp sequence
3. Compute average interval and standard deviation
4. Predict next purchase time as: last_purchase_time + average_interval
5. Assign confidence score based on interval consistency and sample size
6. Filter predictions by minimum confidence threshold (0.5) and recency

## Tech Stack and Prerequisites

### Backend Service
- Python 3.10+
- FastAPI 0.115+
- Snowflake Connector 3.10+
- Uvicorn 0.30+
- Anaconda (conda environment: princeton)

### Frontend Service
- Node.js 20.x (managed via nvm)
- React 19.1+
- Vite 7.1+
- TypeScript 5.9+
- Clerk Authentication SDK 5.53+

### AI Agent Service
- Node.js 20.x
- OpenAI API 6.8+ (GPT-4 Turbo)
- Google Generative AI 0.21+ (Gemini Vision)
- Photon iMessage SDK 1.1+ (macOS only)

### Database
- Snowflake account with configured warehouse
- Database: SNOWFLAKE_LEARNING_DB
- Schema: BALANCEIQ_CORE
- Required privileges: SELECT, INSERT, UPDATE on PURCHASE_ITEMS_TEST table

## Setup

### Prerequisites Installation

Install Node.js via nvm:
```bash
nvm install 20
nvm use 20
```

Verify Python environment:
```bash
conda activate princeton
python --version  # Should be 3.10+
```

### Environment Configuration

Create environment files for each service:

**Backend: backend/database/api/.env**
```env
SNOWFLAKE_ACCOUNT=your_account_identifier
SNOWFLAKE_USER=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_ROLE=your_role
SNOWFLAKE_WAREHOUSE=your_warehouse
SNOWFLAKE_DATABASE=SNOWFLAKE_LEARNING_DB
SNOWFLAKE_SCHEMA=BALANCEIQ_CORE
```

**Frontend: clerk-react/.env**
```env
VITE_BACKEND_API_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
```

**Agent: agent/.env**
```env
OPENAI_API_KEY=sk-your_openai_key
DATABASE_API_URL=http://localhost:8000
TEST_USER_ID=15514049519
GOOGLE_API_KEY=your_gemini_api_key
```

### Dependency Installation

Install backend dependencies:
```bash
cd backend/database/api
pip install -r requirements.txt
```

Install frontend dependencies:
```bash
cd clerk-react
npm install
```

Install agent dependencies:
```bash
cd agent
npm install
```

### Starting Services

Start all services simultaneously:
```bash
./start-all.sh
```

This launches:
- Backend API: http://localhost:8000
- Frontend: http://localhost:5173
- AI Agent: http://localhost:3001

Individual service commands:

Backend:
```bash
cd backend
conda activate princeton
python -m uvicorn database.api.main:app --reload --port 8000
```

Frontend:
```bash
cd clerk-react
npm run dev
```

Agent:
```bash
cd agent
npm start
```

Stop all services:
```bash
./stop-all.sh
```

## Usage

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /health | GET | Backend health check and Snowflake connection status |
| /api/user/{user_id}/transactions | GET | Retrieve transaction history (limit param) |
| /api/predict | GET | Generate purchase predictions (user_id, limit params) |
| /api/coach | GET | AI-generated financial coaching message |
| /api/smart-tips | GET | Personalized savings recommendations |
| /api/better-deals | GET | Alternative cheaper options for frequent purchases |
| /api/piggy-graph | GET | Graph structure for spending visualization |
| /api/receipt/process | POST | Process receipt image with Gemini Vision |
| /api/ai-deals | GET | Personalized deals based on spending categories |

### Testing

Verify backend connectivity:
```bash
curl http://localhost:8000/health
```

Retrieve transactions for test user:
```bash
curl "http://localhost:8000/api/user/15514049519/transactions?limit=5"
```

Test prediction engine:
```bash
curl "http://localhost:8000/api/predict?user_id=15514049519&limit=3"
```

Run AI agent in terminal:
```bash
cd agent
node simple-test.js
```

Execute integration test suite:
```bash
./test-integration.sh
```

### Primary Use Case: Conversational Transaction Analysis

The AI agent maintains conversation history and uses OpenAI function calling to query the database:

```javascript
// Agent automatically determines which functions to call based on user query
// Example: User asks "What did I spend on coffee this month?"

// 1. GPT-4 analyzes query and decides to call get_category_stats function
// 2. Agent executes: getCategoryStats(userId, 30)
// 3. Backend queries Snowflake for coffee transactions in last 30 days
// 4. Results returned to GPT-4 with transaction data
// 5. GPT-4 generates natural language response with spending summary
```

Available agent functions:
- get_recent_transactions: Fetch recent purchase history
- get_category_stats: Spending breakdown by category
- get_predictions: Behavioral purchase predictions
- get_spending_summary: Aggregate spending metrics
- get_ai_coach: Financial coaching recommendations

### Frontend Dashboard

Access web interface at http://localhost:5173

Features:
- Transaction history with category grouping
- Behavioral predictions with confidence scores
- Spending graph visualization (ReactFlow)
- Receipt upload and processing
- Personalized deals and savings tips

### Development Commands

Build frontend for production:
```bash
cd clerk-react
npm run build
```

Run frontend linter:
```bash
cd clerk-react
npm run lint
```

View service logs:
```bash
tail -f backend.log
tail -f frontend.log
tail -f agent.log
```

## Troubleshooting

### Port Conflicts
```bash
lsof -ti:8000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Agent
```

### Conda Environment Issues
```bash
conda activate princeton
conda install python=3.10
```

### Node Version Mismatch
```bash
nvm use 20
cd agent && npm install
cd clerk-react && npm install
```

### Snowflake Connection Errors
Verify credentials in backend/database/api/.env and test connection:
```bash
cd backend/database/api
python -c "from db import get_conn; list(get_conn())"
```

### CORS Issues
CORS is pre-configured in backend/database/api/main.py for localhost:5173 and localhost:3000. If using different ports, modify CORSMiddleware allow_origins list.

## Test Data

The system includes test user 15514049519 with 59 Amazon transactions totaling 4,429.39 USD. This user ID is used for demonstration and testing purposes across all services.

## Additional Documentation

- CLAUDE.md: Developer guide for AI assistants working with this codebase
- ARCHITECTURE.md: Detailed system architecture diagrams and component descriptions
- CONTRIBUTING.md: Development workflow and contribution guidelines
- LICENSE: Software license terms
- DeepWiki Documentation: https://deepwiki.com/HackPrincetonQANT/backend-frontned-agent-alltogether
