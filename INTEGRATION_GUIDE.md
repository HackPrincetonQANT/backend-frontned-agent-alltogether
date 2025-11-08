# Frontend-Backend Integration Guide

This guide explains how the frontend Activity component connects to the backend API.

## Overview

The Activity component now fetches real transaction and prediction data from your FastAPI backend instead of using mock data.

## Architecture

### Backend Endpoints Used

1. **GET /api/user/{user_id}/transactions?limit=3**
   - Fetches transaction history for a user
   - Returns: Array of transactions with id, item, amount, date, category

2. **GET /api/predict?user_id=u_demo_min&limit=3**
   - Fetches predicted upcoming purchases
   - Returns: Array of predictions with item_name, category, confidence, etc.

### Frontend Structure

```
clerk-react/
├── src/
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces for Transaction & Prediction
│   ├── services/
│   │   ├── backendApi.ts         # API service for backend calls
│   │   └── index.ts              # Exports all services
│   └── components/
│       └── common/
│           └── Activity.tsx      # Main component using the API
```

## Setup Instructions

### 1. Configure Environment Variables

Create a `.env` file in the `clerk-react` directory (if it doesn't exist):

```bash
cd clerk-react
cp .env.example .env
```

Edit the `.env` file and set:

```bash
# Backend API URL
VITE_BACKEND_API_URL=http://localhost:8000

# Your Clerk key (if not already set)
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
```

### 2. Start the Backend Server

Navigate to your backend directory and start the FastAPI server:

```bash
cd backend/database/api

# Make sure you have dependencies installed
pip install -r requirements.txt

# Start the server (adjust port if needed)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Verify the backend is running by visiting:
- http://localhost:8000/health
- http://localhost:8000/docs (FastAPI automatic documentation)

### 3. Test Backend Endpoints Directly

Before running the frontend, test that your backend endpoints work:

```bash
# Test transactions endpoint
curl "http://localhost:8000/api/user/u_demo_min/transactions?limit=3"

# Test predictions endpoint
curl "http://localhost:8000/api/predict?user_id=u_demo_min&limit=3"
```

You should see JSON responses with transaction and prediction data.

### 4. Start the Frontend

```bash
cd clerk-react
npm run dev
```

The frontend should now be running at http://localhost:5173 (or similar).

## How It Works

### Data Flow

1. **Component Mount**: When the Activity component loads, it calls `useEffect()` which triggers data fetching
2. **API Calls**: Two parallel requests are made:
   - `fetchUserTransactions('u_demo_min', 20)`
   - `fetchPredictions('u_demo_min', 5)`
3. **Loading State**: Shows a spinner while data is being fetched
4. **Error Handling**: If the backend is unreachable, shows an error message
5. **Data Display**: Groups transactions by category and displays them in cards

### Code Example

The Activity component uses React hooks for state management:

```typescript
const [transactions, setTransactions] = useState<Transaction[]>([]);
const [predictions, setPredictions] = useState<Prediction[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      const [transactionsData, predictionsData] = await Promise.all([
        fetchUserTransactions(userId, 20),
        fetchPredictions(userId, 5)
      ]);
      setTransactions(transactionsData);
      setPredictions(predictionsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [userId]);
```

## Features

### Transaction Display

- **Grouped by Category**: Transactions are automatically grouped by their category field
- **Category Icons**: Each category gets an emoji icon (☕ for Coffee, 🛒 for Groceries, etc.)
- **Totals**: Shows total spending per category
- **Timestamps**: Displays formatted date and time for each transaction

### Prediction Display

- **Upcoming Purchases**: Shows items the user is likely to buy soon
- **Confidence Scores**: Visual progress bar showing prediction confidence
- **Time Estimates**: Shows last purchase date and predicted next purchase date
- **Cost Estimates**: Displays estimated cost of each predicted purchase

## Troubleshooting

### Common Issues

1. **"Failed to fetch" error**
   - ✅ Check that backend is running on port 8000
   - ✅ Verify `VITE_BACKEND_API_URL` in `.env`
   - ✅ Check browser console for CORS errors

2. **CORS errors**
   - Add CORS middleware to your FastAPI backend:
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5173"],  # Frontend URL
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

3. **Empty data / No transactions**
   - ✅ Verify user_id exists in your database
   - ✅ Check backend logs for SQL errors
   - ✅ Test endpoints directly with curl

4. **TypeScript errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check that types in `src/types/index.ts` match your API responses

## Customization

### Change User ID

Currently hardcoded to `u_demo_min`. To use a dynamic user ID:

```typescript
// In Activity.tsx, replace:
const userId = 'u_demo_min';

// With:
import { useUser } from '@clerk/clerk-react';
const { user } = useUser();
const userId = user?.id || 'u_demo_min';
```

### Adjust Data Limits

Modify the API calls in `Activity.tsx`:

```typescript
// Fetch more transactions
fetchUserTransactions(userId, 50)  // Instead of 20

// Fetch more predictions
fetchPredictions(userId, 10)  // Instead of 5
```

### Customize Categories

Edit the `getCategoryEmoji()` function in `Activity.tsx` to add more category icons.

## Next Steps

- [ ] Integrate Clerk user authentication to fetch user-specific data
- [ ] Add refresh functionality to update data without page reload
- [ ] Implement the Coach recommendations in the Insights tab
- [ ] Add transaction detail modal for more information
- [ ] Implement filtering and sorting options

## API Reference

### Transaction Type

```typescript
interface Transaction {
  id: string;
  item: string;
  amount: number;
  date: string;  // ISO8601 timestamp
  category: string;
}
```

### Prediction Type

```typescript
interface Prediction {
  item_name: string;
  category: string;
  last_purchase: string;  // ISO8601 timestamp
  next_predicted: string;  // ISO8601 timestamp
  avg_interval_days: number;
  confidence: number;
  estimated_price: number;
}
```

## Support

If you encounter issues:

1. Check browser console (F12) for error messages
2. Check backend logs for API errors
3. Verify all environment variables are set correctly
4. Test backend endpoints directly with curl
