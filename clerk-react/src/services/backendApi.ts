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

/**
 * Fetch smart savings tips (Piggy Tips)
 * @param userId - User identifier
 * @param limit - Maximum number of tips to fetch
 */
export const fetchSmartTips = async (
  userId: string,
  limit: number = 6
): Promise<Array<{
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  savings: number;
  action: string;
  category: string;
}>> => {
  try {
    const baseUrl = getBackendUrl();
    const url = `${baseUrl}/api/smart-tips?user_id=${userId}&limit=${limit}`;
    
    console.log('Fetching smart tips from:', url);
    
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
    console.log('Received smart tips:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching smart tips:', error);
    throw error;
  }
};

/**
 * Fetch better deals/alternatives
 * @param userId - User identifier
 * @param limit - Maximum number of deals to fetch
 */
export const fetchBetterDeals = async (
  userId: string,
  limit: number = 10
): Promise<Array<{
  current_store: string;
  current_spending: number;
  alternative_store: string;
  emoji: string;
  savings_percent: number;
  monthly_savings: number;
  purchase_count: number;
  category: string;
  all_alternatives: Array<{
    name: string;
    price_diff: number;
    emoji: string;
  }>;
}>> => {
  try {
    const baseUrl = getBackendUrl();
    const url = `${baseUrl}/api/better-deals?user_id=${userId}&limit=${limit}`;
    
    console.log('Fetching better deals from:', url);
    
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
    console.log('Received better deals:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching better deals:', error);
    throw error;
  }
};

/**
 * Fetch AI-generated personalized deals
 * @param userId - User identifier
 * @param limit - Maximum number of deals to fetch (default 2)
 */
export const fetchAIDeals = async (
  userId: string,
  limit: number = 2
): Promise<Array<{
  title: string;
  subtitle: string;
  description: string;
  savings: number;
  category: string;
  cta: string;
  icon: string;
}>> => {
  try {
    const baseUrl = getBackendUrl();
    const url = `${baseUrl}/api/ai-deals?user_id=${userId}&limit=${limit}`;
    
    console.log('Fetching AI deals from:', url);
    
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
    console.log('Received AI deals:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching AI deals:', error);
    throw error;
  }
};
