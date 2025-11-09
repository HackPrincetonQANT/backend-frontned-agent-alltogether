# Smart Piggy AI - Financial Assistant

AI-powered financial assistant with iMessage integration and transaction tracking.

## Quick Start

### 1. Start Database API
```bash
cd backend/database/api
/opt/anaconda3/bin/python -m uvicorn main:app --port 8001 --reload
```

### 2. Start Frontend
```bash
cd clerk-react
npm run dev
```
Open: http://localhost:5174

### 3. Test AI Chat
```bash
cd agent
node simple-test.js
```

### 4. Start iMessage Bot (Optional)
```bash
bash start-smart-imessage.sh
```
Note: Open Messages app first

## Requirements

- Node.js v20 (use `nvm use 20`)
- Python 3.8+ with Anaconda
- macOS (for iMessage)

## What It Does

- AI chat about your spending via iMessage or terminal
- Web dashboard with transaction history
- Receipt scanning with Google Gemini Vision
- Real-time insights and predictions
- Connected to Snowflake database

## Tech Stack

FastAPI + Snowflake | React + Vite | OpenAI GPT-4 + Google Gemini | Photon iMessage SDK

## Testing

Connected to real data: 59 Amazon transactions ($4,429.39) via Knot API for user 15514049519.

```bash
# Database health check
curl http://localhost:8001/health

# View transactions
curl "http://localhost:8001/api/user/15514049519/transactions?limit=5"

# AI chat test
cd agent && node test-smart-agent.js
```

## Troubleshooting

- Port conflict: `lsof -ti:8001 | xargs kill -9`
- Node version: `nvm use 20 && cd agent && npm install`
- Python deps: `cd backend/database/api && pip install -r requirements.txt`
- Environment files: Check `.env` files in `backend/database/api/`, `backend/`, `agent/`, `clerk-react/`
- Detailed guide: See `SETUP_AND_TEST_GUIDE.md`
