# Knot API Integration

This branch (`knot-prod`) integrates Knot API's TransactionLink product to pull real SKU-level transaction data from users' merchant accounts.

## Overview

Instead of manually inputting receipts, users can now link their merchant accounts (DoorDash, Amazon, Starbucks, etc.) and automatically sync all their purchase history.

## Architecture

```
User → Links Merchant Account → Knot API → Our Backend → Snowflake → Piggy Bank App
```

### Components

1. **knot_client.py** - Knot API client with methods for:
   - Listing available merchants
   - Creating sessions for account linking
   - Syncing transactions
   - Getting merchant account status

2. **knot_sync.py** - Service layer that:
   - Transforms Knot transactions into our Snowflake format
   - Categorizes items using our existing LLM
   - Saves to PURCHASE_ITEMS_TEST table

3. **main.py endpoints**:
   - `GET /api/knot/merchants` - List available merchants
   - `POST /api/knot/session` - Create linking session
   - `GET /api/knot/accounts` - Get user's linked accounts
   - `POST /api/knot/sync` - Sync transactions to Snowflake
   - `GET /api/knot/sync-status` - Check sync status

## Setup

### 1. Environment Variables

Already configured in `/backend/src/.env`:
```env
KNOT_CLIENT_ID=dda0778d-9486-47f8-bd80-6f2512f9bcdb
KNOT_API_SECRET=ff5e51b6dcf84a829898d37449cbc47a
```

### 2. Install Dependencies

```bash
cd backend/database/api
pip install requests
```

### 3. Test Connection

```bash
cd backend/database/api
python test_knot.py
```

## Usage Flow

### 1. List Available Merchants

```bash
curl http://localhost:8000/api/knot/merchants
```

Returns merchants like DoorDash (19), Amazon (44), Starbucks (11), etc.

### 2. Create Session for User

```bash
curl -X POST "http://localhost:8000/api/knot/session?user_id=u_demo_min&merchant_id=19"
```

Returns `session_id` to initialize Knot SDK in frontend.

### 3. User Links Account (Frontend SDK)

User authenticates with merchant in Knot SDK. You'll receive `AUTHENTICATED` webhook.

### 4. Sync Transactions

```bash
curl -X POST "http://localhost:8000/api/knot/sync?user_id=u_demo_min"
```

This will:
- Fetch all transactions from connected accounts
- Transform into our format with categories
- Save to Snowflake PURCHASE_ITEMS_TEST table

### 5. Check Sync Status

```bash
curl "http://localhost:8000/api/knot/sync-status?user_id=u_demo_min"
```

Shows connected accounts and their status.

## Data Transformation

### Knot Transaction → Our Format

```python
# Knot format
{
  "id": "txn_123",
  "merchant": {"name": "Starbucks"},
  "datetime": "2025-11-09T12:00:00Z",
  "lineItems": [
    {"name": "Latte", "price": {"amount": 550}}  # 550 cents
  ]
}

# Transformed to our format
{
  "item_id": "uuid",
  "user_id": "u_demo_min",
  "item_name": "Latte",
  "merchant": "Starbucks",
  "price": 5.50,
  "ts": "2025-11-09T12:00:00Z",
  "category": "Coffee"  # Auto-categorized
}
```

## Webhooks (Future)

To receive real-time updates, subscribe to these webhooks in Knot Dashboard:

- `NEW_TRANSACTIONS_AVAILABLE` - New purchases detected
- `UPDATED_TRANSACTIONS_AVAILABLE` - Order status changed
- `ACCOUNT_LOGIN_REQUIRED` - User needs to reconnect account

## Testing

### Development Environment

Use Knot's test credentials to simulate transactions:
- Test DoorDash account will return 205 sample transactions
- Use merchant_id: 19 for DoorDash testing

### Testing the Full Flow

1. Start backend: `./start-all.sh`
2. Test merchants: `curl http://localhost:8000/api/knot/merchants`
3. Create session: `curl -X POST "http://localhost:8000/api/knot/session?user_id=test_user&merchant_id=19"`
4. After linking (in SDK), sync: `curl -X POST "http://localhost:8000/api/knot/sync?user_id=test_user"`
5. Verify in DB: `curl http://localhost:8000/api/user/test_user/transactions`

## Next Steps

1. **Frontend Integration**: 
   - Install Knot SDK in React app
   - Add "Link Account" button
   - Initialize SDK with session_id from our API

2. **Webhook Setup**:
   - Deploy webhook endpoint
   - Subscribe in Knot Dashboard
   - Auto-sync on NEW_TRANSACTIONS_AVAILABLE

3. **Production**:
   - Switch to production credentials
   - Update KNOT_BASE_URL if needed
   - Monitor sync success rates

## API Reference

See Knot docs: https://docs.knotapi.com/transaction-link/quickstart
