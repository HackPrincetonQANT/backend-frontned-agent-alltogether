/**
 * BalanceIQ Backend API Service
 * Connects to FastAPI backend for transactions and predictions
 */

import type { Transaction, Prediction } from '../types';

const getBackendUrl = (): string => {
  const backendUrl = import.meta.env.VITE_BACKEND_API_URL;
  if (!backendUrl) {
    console.warn('VITE_BACKEND_API_URL is not set, using default');
    return 'http://localhost:8000'; // Default for local development
  }
  return backendUrl;
};

/**
 * Fetch transactions for a specific user
 * @param userId - User identifier (e.g., "u_demo_min")
 * @param limit - Maximum number of transactions to fetch
 */
export const fetchUserTransactions = async (
  userId: string,
  limit: number = 20
): Promise<Transaction[]> => {
  try {
    const baseUrl = getBackendUrl();
    const url = `${baseUrl}/api/user/${userId}/transactions?limit=${limit}`;
    
    console.log('Fetching transactions from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    const data: Transaction[] = await response.json();
    console.log('Received transactions:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    throw error;
  }
};

/**
 * Fetch purchase predictions for a specific user
 * @param userId - User identifier (e.g., "u_demo_min")
 * @param limit - Maximum number of predictions to fetch
 */
export const fetchPredictions = async (
  userId: string,
  limit: number = 5
): Promise<Prediction[]> => {
  try {
    const baseUrl = getBackendUrl();
    const url = `${baseUrl}/api/predict?user_id=${userId}&limit=${limit}`;
    
    console.log('Fetching predictions from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    const data: Prediction[] = await response.json();
    console.log('Received predictions:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching predictions:', error);
    throw error;
  }
};

/**
 * Fetch AI coach recommendations
 * @param userId - User identifier
 * @param limit - Number of predictions to consider
 */
export const fetchCoachRecommendations = async (
  userId: string,
  limit: number = 3
): Promise<{
  message: string;
  predictions: Prediction[];
  recent_transactions: Array<{
    item: string;
    amount: number;
    category: string;
    timestamp: string;
  }>;
}> => {
  try {
    const baseUrl = getBackendUrl();
    const url = `${baseUrl}/api/coach?user_id=${userId}&limit=${limit}`;
    
    console.log('Fetching coach recommendations from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received coach recommendations:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching coach recommendations:', error);
    throw error;
  }
};
