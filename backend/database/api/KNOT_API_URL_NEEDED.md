# Knot API URL Configuration Needed

## Current Issue
The Knot API base URL is currently set to `https://api.knotapi.com/v1` but this returns:
```
The deployment could not be found on Vercel.
DEPLOYMENT_NOT_FOUND
```

## What We've Tried
- ❌ `https://api.knotapi.com` - Returns Vercel deployment not found
- ❌ `https://api.knotapi.com/v1` - Returns Vercel deployment not found  
- ❌ `https://connect.knotapi.com` - Returns Vercel deployment not found
- ❌ `https://sandbox.knotapi.com` - DNS resolution failed
- ❌ `https://api.dashboard.knotapi.com` - Returns 404
- ❌ `https://knotapi.com/api` - Method not allowed

## How to Find the Correct URL

### Option 1: Check Your Knot Dashboard
1. Go to https://dashboard.knotapi.com
2. Log in with your credentials
3. Look for:
   - **API Settings** section
   - **API Documentation** link
   - **Developers** or **Integration** tab
   - Any section showing "API Endpoint" or "Base URL"

### Option 2: Check Knot Documentation
Look for the API reference documentation that shows example curl commands - the base URL will be in there.

### Option 3: Contact Knot Support
Email Knot support and ask for:
- The correct production API base URL for TransactionLink product
- Confirmation that your credentials are activated

## Current Credentials (Production)
```
Client ID: a390e79d-2920-4440-9ba1-b747bc92790b
Secret: be1e86abb4fc42a3b904b2f52215847e
```

## Where to Update
Once you have the correct URL, update it in:
```
/Users/columbus/Desktop/hackPrinceton/backend/database/api/knot_client.py
Line 12: KNOT_BASE_URL = "YOUR_CORRECT_URL_HERE"
```

## Everything Else is Ready
✅ Authentication is configured correctly (Basic Auth)
✅ All API endpoints are built
✅ Frontend integration is complete
✅ Error handling and logging are in place

**We just need the correct API base URL!** 🐷
