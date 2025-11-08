/**
 * Capital One Nessie API Service
 * Securely fetches account data from the Nessie API
 */

const NESSIE_BASE_URL = 'http://api.nessieisreal.com';

// Get API credentials from environment variables
const getApiKey = (): string => {
  const apiKey = import.meta.env.VITE_NESSIE_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_NESSIE_API_KEY is not set in environment variables');
  }
  return apiKey;
};

const getAccountId = (): string => {
  const accountId = import.meta.env.VITE_NESSIE_ACCOUNT_ID;
  if (!accountId) {
    throw new Error('VITE_NESSIE_ACCOUNT_ID is not set in environment variables');
  }
  return accountId;
};

export interface NessieAccount {
  _id: string;
  type: string;
  nickname: string;
  rewards: number;
  balance: number;
  account_number: string;
  customer_id: string;
}

export interface AccountBalance {
  balance: number;
  accountNumber: string;
  nickname: string;
  type: string;
}

/**
 * Fetch account details including balance from Nessie API
 */
export const fetchAccountBalance = async (): Promise<AccountBalance> => {
  try {
    const apiKey = getApiKey();
    const accountId = getAccountId();

    const url = `${NESSIE_BASE_URL}/accounts/${accountId}?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Nessie API error: ${response.status} ${response.statusText}`);
    }

    const data: NessieAccount = await response.json();

    return {
      balance: data.balance,
      accountNumber: data.account_number,
      nickname: data.nickname,
      type: data.type,
    };
  } catch (error) {
    console.error('Error fetching account balance:', error);
    throw error;
  }
};

/**
 * Fetch all accounts for a customer
 */
export const fetchAllAccounts = async (customerId: string): Promise<NessieAccount[]> => {
  try {
    const apiKey = getApiKey();
    const url = `${NESSIE_BASE_URL}/customers/${customerId}/accounts?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Nessie API error: ${response.status} ${response.statusText}`);
    }

    const data: NessieAccount[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching all accounts:', error);
    throw error;
  }
};
