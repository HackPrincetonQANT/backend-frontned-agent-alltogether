#!/bin/bash

# Backend-Frontend Integration Test Script
# This script tests the connection between frontend and backend

echo "🔍 Testing BalanceIQ Backend-Frontend Integration"
echo "=================================================="
echo ""

# Check if backend is running
echo "1️⃣ Checking if backend is running..."
BACKEND_URL="http://localhost:8000"

if curl -s "${BACKEND_URL}/health" > /dev/null 2>&1; then
    echo "   ✅ Backend is running at ${BACKEND_URL}"
    echo ""
else
    echo "   ❌ Backend is NOT running!"
    echo "   Please start the backend first:"
    echo "   cd backend/database/api"
    echo "   uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
    exit 1
fi

# Test transactions endpoint
echo "2️⃣ Testing transactions endpoint..."
TRANSACTIONS_RESPONSE=$(curl -s "${BACKEND_URL}/api/user/u_demo_min/transactions?limit=3")

if [ $? -eq 0 ]; then
    echo "   ✅ Transactions endpoint accessible"
    echo "   Response preview:"
    echo "$TRANSACTIONS_RESPONSE" | python3 -m json.tool 2>/dev/null | head -n 20
    echo ""
else
    echo "   ❌ Failed to fetch transactions"
    echo ""
fi

# Test predictions endpoint
echo "3️⃣ Testing predictions endpoint..."
PREDICTIONS_RESPONSE=$(curl -s "${BACKEND_URL}/api/predict?user_id=u_demo_min&limit=3")

if [ $? -eq 0 ]; then
    echo "   ✅ Predictions endpoint accessible"
    echo "   Response preview:"
    echo "$PREDICTIONS_RESPONSE" | python3 -m json.tool 2>/dev/null | head -n 20
    echo ""
else
    echo "   ❌ Failed to fetch predictions"
    echo ""
fi

# Check frontend environment
echo "4️⃣ Checking frontend configuration..."
if [ -f "clerk-react/.env" ]; then
    echo "   ✅ .env file exists"
    
    if grep -q "VITE_BACKEND_API_URL" clerk-react/.env; then
        BACKEND_CONFIG=$(grep "VITE_BACKEND_API_URL" clerk-react/.env)
        echo "   ✅ Backend URL configured: ${BACKEND_CONFIG}"
    else
        echo "   ⚠️  VITE_BACKEND_API_URL not found in .env"
        echo "   Add: VITE_BACKEND_API_URL=http://localhost:8000"
    fi
else
    echo "   ⚠️  .env file not found"
    echo "   Create one from .env.example:"
    echo "   cp clerk-react/.env.example clerk-react/.env"
fi
echo ""

# Final summary
echo "=================================================="
echo "✅ Integration test complete!"
echo ""
echo "Next steps:"
echo "1. Start frontend: cd clerk-react && npm run dev"
echo "2. Open http://localhost:5173 in your browser"
echo "3. Navigate to the Activity tab"
echo "4. You should see real transaction data!"
echo ""
