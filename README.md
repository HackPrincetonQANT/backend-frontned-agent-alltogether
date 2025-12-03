<div id="top">

<!-- HEADER STYLE: CLASSIC -->
<div align="center">

# PiggyBank AI – Multimodal Financial Assistant – Money that talks

<em>Real-time spending conscience for the everyday spender</em>

<!-- BADGES -->
<img src="https://img.shields.io/github/license/HackPrincetonQANT/backend-frontned-agent-alltogether?style=flat&logo=opensourceinitiative&logoColor=white&color=f97316" alt="license">
<img src="https://img.shields.io/github/last-commit/HackPrincetonQANT/backend-frontned-agent-alltogether?style=flat&logo=git&logoColor=white&color=f97316" alt="last-commit">
<img src="https://img.shields.io/github/languages/top/HackPrincetonQANT/backend-frontned-agent-alltogether?style=flat&color=f97316" alt="repo-top-language">
<img src="https://img.shields.io/github/languages/count/HackPrincetonQANT/backend-frontned-agent-alltogether?style=flat&color=f97316" alt="repo-language-count">

<br />

<em>Built with the tools and technologies:</em>

<br />

<img src="https://img.shields.io/badge/FastAPI-009688.svg?style=flat&logo=FastAPI&logoColor=white" alt="FastAPI">
<img src="https://img.shields.io/badge/Node.js-339933.svg?style=flat&logo=node.js&logoColor=white" alt="Node.js">
<img src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=flat&logo=TypeScript&logoColor=white" alt="TypeScript">
<img src="https://img.shields.io/badge/React-61DAFB.svg?style=flat&logo=React&logoColor=000000" alt="React">
<img src="https://img.shields.io/badge/Vite-646CFF.svg?style=flat&logo=Vite&logoColor=white" alt="Vite">
<img src="https://img.shields.io/badge/Snowflake-29B5E8.svg?style=flat&logo=Snowflake&logoColor=white" alt="Snowflake">
<img src="https://img.shields.io/badge/OpenAI-412991.svg?style=flat&logo=openai&logoColor=white" alt="OpenAI">
<img src="https://img.shields.io/badge/Gemini-4285F4.svg?style=flat&logo=google&logoColor=white" alt="Google Gemini">
<img src="https://img.shields.io/badge/Photon%20iMessage-000000.svg?style=flat&logo=apple&logoColor=white" alt="Photon iMessage">
<br />
<img src="https://img.shields.io/badge/Python-3776AB.svg?style=flat&logo=Python&logoColor=white" alt="Python">
<img src="https://img.shields.io/badge/Node-339933.svg?style=flat&logo=node.js&logoColor=white" alt="Node">
<img src="https://img.shields.io/badge/Conda-44A833.svg?style=flat&logo=anaconda&logoColor=white" alt="Conda">
<img src="https://img.shields.io/badge/nvm-43853d.svg?style=flat&logo=nodedotjs&logoColor=white" alt="nvm">
<img src="https://img.shields.io/badge/Clerk-000000.svg?style=flat&logo=clerk&logoColor=white" alt="Clerk Auth">
<img src="https://img.shields.io/badge/DigitalOcean-0080FF.svg?style=flat&logo=DigitalOcean&logoColor=white" alt="DigitalOcean">

</div>

<br/>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [System Overview](#system-overview)
  - [Data Flow](#data-flow)
  - [Behavioral Prediction Engine](#behavioral-prediction-engine)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Installation](#installation)
  - [Running the Services](#running-the-services)
- [Usage](#usage)
  - [Primary Use Case – Conversational Spending Analysis](#primary-use-case--conversational-spending-analysis)
  - [Web Dashboard](#web-dashboard)
  - [iMessage & Multimodal Receipts](#imessage--multimodal-receipts)
  - [API Endpoints](#api-endpoints)
  - [Test Data](#test-data)
- [Project Structure](#project-structure)
- [Development](#development)
  - [Build & Lint](#build--lint)
  - [Testing & Integration](#testing--integration)
- [Troubleshooting](#troubleshooting)
- [Additional Documentation](#additional-documentation)
- [License](#license)

---

## Overview

**Smart Piggy AI** is a multimodal financial assistant that lives where you already chat – web, iMessage, and terminal – and helps you understand your spending in real time instead of at the end of the month.

Traditional budgeting apps tell you what happened. Smart Piggy AI tells you what is *about* to happen:

- Predicts your next likely purchases from transaction history.
- Nudges you at the right moment (e.g. “Skip coffee tomorrow – that’s \$850/year saved.”).
- Lets you **chat** with your spending via GPT‑4–powered analysis.
- Reads receipts and bills through **Gemini Vision + OCR** directly from iMessage.
- Supports **multi-language conversations** and understands your reactions (e.g. 👍, ❤️) to refine future coaching.

Under the hood, Piggy combines a FastAPI backend, a Node.js GPT‑4 agent layer, a React dashboard, and a Snowflake data warehouse into one opinionated stack for behavioral finance experiments.

> 💡 **Repo:** [GitHub Repo](https://github.com/HackPrincetonQANT/backend-frontned-agent-alltogether)

---

## Architecture

### System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│  User Interfaces                                            │
│  - React Web Dashboard (Clerk Auth)                         │
│  - iMessage Bot (Photon SDK + Gemini Vision OCR)            │
│  - Terminal Chat Interface                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/REST + Webhooks
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  AI Agent Service (Node.js)                                 │
│  - GPT‑4 / GPT‑4.1 with Function Calling                    │
│  - Conversation Memory & Multi-language Support             │
│  - Database Query Orchestration                             │
│  - Reaction-aware coaching (👍, 😭, 😂, ❤️)                   │
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
│  Schema:   BALANCEIQ_CORE                                   │
│  Table:    PURCHASE_ITEMS_TEST                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Ingestion:** Transactions are stored in Snowflake `PURCHASE_ITEMS_TEST` with columns:

   ```text
   ITEM_ID | USER_ID | ITEM_NAME | MERCHANT | PRICE | TS | CATEGORY
   ```

2. **Backend:** FastAPI exposes REST endpoints for:
   - Transaction history
   - Behavioral predictions
   - Smart coaching and tips
   - Better deals and alternative options

3. **AI Agent:** Node.js service:
   - Maintains per-user conversation memory
   - Uses GPT‑4 function calling to decide when to hit which API endpoints
   - Aggregates responses into natural language, multi-language answers

4. **Front-end:** React + Vite dashboard:
   - Calls backend APIs for graphs and summaries
   - Visualizes predictions and savings opportunities

5. **Receipts & Bills:** iMessage bot (Photon SDK + Gemini Vision):
   - User sends a photo of receipt/bill
   - Gemini Vision performs OCR + parsing
   - Parsed lines are categorized and sent into Snowflake
   - GPT‑style coaching returns insights back in the same iMessage thread

### Behavioral Prediction Engine

The prediction engine estimates your next likely purchase for recurring items:

1. Group past transactions by `(ITEM_NAME, CATEGORY)` pair.
2. Sort each group by timestamp and compute inter-purchase intervals.
3. Calculate:
   - Mean interval
   - Standard deviation
   - Sample size
4. Predict next purchase time:

   ```text
   next_ts = last_purchase_ts + avg_interval
   ```

5. Compute a **confidence score** based on:
   - Interval stability
   - Number of samples
   - Recency of behavior

6. Only predictions with `confidence >= 0.5` and recent history are surfaced as “Heads up” nudges.

---

## Features

|      | Area                        | Details                                                                                                                                 |
| :--- | :-------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| 💬   | **Conversational Agent**    | GPT‑4–powered chat assistant that understands natural language, calls backend functions, and supports multi-language conversations.    |
| 📊   | **Behavioral Predictions**  | Forecasts recurring purchases, surfaces “next‑likely” expenses, and quantifies annualized savings from small habit changes.           |
| 🧾   | **Receipt Intelligence**    | iMessage bot with Gemini Vision OCR to read receipts/bills, extract line items, and categorize them into Snowflake in real time.      |
| 🧠   | **AI Money Coach**          | DigitalOcean LLM + custom prompts for coaching messages, streaks, and habit‑aware nudges (e.g., coffee, subscriptions, late‑night eats). |
| 🌐   | **Multi-channel UI**        | Web dashboard, iMessage bot, and terminal interface all talking to the same backend + data warehouse.                                  |
| 🏦   | **Data Warehouse Backbone** | Snowflake schema (`BALANCEIQ_CORE`) for centralized transaction analytics and experimentation.                                         |
| 🔐   | **Auth & Security**         | Clerk.js for web auth; secret-managed environment config; Snowflake role-based permissions.                                            |
| 🧪   | **Hackable Lab**            | Integration scripts, test data, and CLI tools for running behavioral experiments on synthetic or real transaction data.                |

---

## Tech Stack

**Backend Service**

- Python 3.10+
- FastAPI 0.115+
- Snowflake Connector 3.10+
- Uvicorn 0.30+
- Conda environment: `princeton`

**Frontend Service**

- Node.js 20.x (managed via `nvm`)
- React 19.x
- Vite 7.x
- TypeScript 5.9+
- Clerk Auth SDK 5.53+

**AI Agent Service**

- Node.js 20.x
- OpenAI API (GPT‑4 / GPT‑4.1 with function calling)
- Google Generative AI 0.21+ (Gemini Vision)
- Photon iMessage SDK (macOS only)

**Database**

- Snowflake account + configured warehouse
- Database: `SNOWFLAKE_LEARNING_DB`
- Schema: `BALANCEIQ_CORE`
- Table: `PURCHASE_ITEMS_TEST`
- Privileges: `SELECT`, `INSERT`, `UPDATE`

---

## Getting Started

### Prerequisites

- **Programming Languages**
  - Python 3.10+ (via Conda)
  - Node.js 20.x (via `nvm`)
- **Database**
  - Snowflake account + credentials
- **APIs**
  - OpenAI API key
  - Google Gemini API key
  - (Optional) DigitalOcean LLM key
- **Auth**
  - Clerk publishable key for the frontend

### Environment Configuration

Create service-specific `.env` files.

**Backend – `backend/database/api/.env`**

```env
SNOWFLAKE_ACCOUNT=your_account_identifier
SNOWFLAKE_USER=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_ROLE=your_role
SNOWFLAKE_WAREHOUSE=your_warehouse
SNOWFLAKE_DATABASE=SNOWFLAKE_LEARNING_DB
SNOWFLAKE_SCHEMA=BALANCEIQ_CORE
```

**Frontend – `clerk-react/.env`**

```env
VITE_BACKEND_API_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
```

**Agent – `agent/.env`**

```env
OPENAI_API_KEY=sk-your_openai_key
DATABASE_API_URL=http://localhost:8000
TEST_USER_ID=15514049519
GOOGLE_API_KEY=your_gemini_api_key
```

### Installation

Install Node.js via `nvm`:

```bash
nvm install 20
nvm use 20
```

Verify Python environment:

```bash
conda activate princeton
python --version  # Expect 3.10+
```

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

### Running the Services

Start everything with helper scripts:

```bash
./start-all.sh
```

This spins up:

- **Backend API:** http://localhost:8000
- **Frontend:** http://localhost:5173
- **AI Agent:** http://localhost:3001

Individual commands:

**Backend**

```bash
cd backend
conda activate princeton
python -m uvicorn database.api.main:app --reload --port 8000
```

**Frontend**

```bash
cd clerk-react
npm run dev
```

**Agent**

```bash
cd agent
npm start
```

Stop all services:

```bash
./stop-all.sh
```

---

## Usage

### Primary Use Case – Conversational Spending Analysis

The AI agent keeps conversation history and uses GPT‑4 function calling to translate natural language into database queries.

Example: user asks  
> “What did I spend on coffee this month, and how bad is it if I keep this up for a year?”

Flow:

```text
1. GPT‑4 parses intent → decides to call get_category_stats + get_predictions
2. Agent executes:
   - getCategoryStats(userId="15514049519", lookback_days=30)
   - getPredictions(userId="15514049519")
3. Backend queries Snowflake for coffee transactions + behavioral forecasts
4. Results returned to GPT‑4 as JSON
5. GPT‑4 responds in natural language:
   - total spent
   - average per day/week
   - projected annual cost
   - gentle, emoji‑friendly nudge
```

Available agent functions:

- `get_recent_transactions` – Recent purchase history
- `get_category_stats` – Spending breakdown by category
- `get_predictions` – Behavioral purchase predictions
- `get_spending_summary` – Aggregate metrics
- `get_ai_coach` – Coaching & nudges tuned to your habits

### Web Dashboard

Open: **http://localhost:5173**

Includes:

- Transaction history grouped by category and time
- Behavioral predictions with confidence scores
- Graph visualization of spending flows (ReactFlow)
- Receipt upload panel
- Personalized savings tips and “what-if” scenarios

### iMessage & Multimodal Receipts

On a Mac running the Photon iMessage bot:

- Text Piggy like a friend:  
  > “How much did I spend on food this week?”  
  > “Can I afford a \$300 trip if I keep my coffee habit?”

- Send a **photo of a receipt or bill**:
  - Gemini Vision performs OCR + parsing
  - Backend categorizes line items and stores them in Snowflake
  - Piggy replies with insights:
    - “This grocery trip is 20% higher than your usual.”
    - “You’ve hit your eating-out budget for this week.”

- React to messages with emoji (👍, ❤️, 😭, 😂):
  - The bot stores reactions as feedback and adjusts tone/intensity of future nudges.

### API Endpoints

| Endpoint                                      | Method | Description                                                  |
|----------------------------------------------|--------|--------------------------------------------------------------|
| `/health`                                    | GET    | Backend health check & Snowflake connection status          |
| `/api/user/{user_id}/transactions`           | GET    | Retrieve transaction history (`limit` param)                |
| `/api/predict`                               | GET    | Generate purchase predictions (`user_id`, `limit` params)   |
| `/api/coach`                                 | GET    | AI-generated financial coaching message                     |
| `/api/smart-tips`                            | GET    | Personalized savings recommendations                        |
| `/api/better-deals`                          | GET    | Alternative cheaper options for frequent purchases          |
| `/api/piggy-graph`                           | GET    | Graph structure for spending visualization                  |
| `/api/receipt/process`                       | POST   | Process receipt image with Gemini Vision                    |
| `/api/ai-deals`                              | GET    | Personalized deals based on spending categories             |

### Test Data

A demo user is preloaded:

- **User ID:** `15514049519`
- **Sample:** 59 Amazon transactions
- **Total:** \$4,429.39 USD

You can use this ID when testing:

```bash
curl "http://localhost:8000/api/user/15514049519/transactions?limit=5"
curl "http://localhost:8000/api/predict?user_id=15514049519&limit=3"
```

---

## Project Structure

```sh
backend-frontned-agent-alltogether/
├── backend/
│   └── database/
│       └── api/
│           ├── main.py          # FastAPI entrypoint
│           ├── db.py            # Snowflake connection helpers
│           ├── models.py        # Transaction models & schemas
│           ├── predictors.py    # Behavioral prediction engine
│           └── requirements.txt
├── clerk-react/                 # React + Vite + Clerk frontend
│   ├── src/
│   └── package.json
├── agent/                       # Node.js GPT‑4 agent service
│   ├── index.ts / index.js
│   ├── functions/              # OpenAI function handlers
│   └── simple-test.js
├── start-all.sh
├── stop-all.sh
└── README.md
```

*(Structure may vary slightly as the project evolves, but the three-core-service pattern remains.)*

---

## Development

### Build & Lint

**Frontend build**

```bash
cd clerk-react
npm run build
```

**Frontend lint**

```bash
cd clerk-react
npm run lint
```

### Testing & Integration

Health check:

```bash
curl http://localhost:8000/health
```

Backend integration tests:

```bash
./test-integration.sh
```

Run the simple terminal agent test:

```bash
cd agent
node simple-test.js
```

---

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

Verify credentials in `backend/database/api/.env` and test:

```bash
cd backend/database/api
python -c "from db import get_conn; list(get_conn())"
```

### CORS Issues

CORS is configured in `database/api/main.py` for `http://localhost:5173` and `http://localhost:3000`.  
If you change ports, update the `allow_origins` list accordingly.

---

## Additional Documentation

- `CLAUDE.md` – Developer guide for AI assistants working with this codebase
- `ARCHITECTURE.md` – Extended diagrams and deep-dive into each component
- `CONTRIBUTING.md` – Contribution guidelines and branching strategy
- `LICENSE` – Software license terms
- DeepWiki: <https://deepwiki.com/HackPrincetonQANT/backend-frontned-agent-alltogether>

---

## License

Smart Piggy AI is released under the terms described in the [`LICENSE`](./LICENSE) file.

---

<div align="left"><a href="#top">⬆ Return to top</a></div>
