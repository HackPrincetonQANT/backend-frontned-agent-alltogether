"""
Knot API Client for TransactionLink
Pulls SKU-level transaction data from user's merchant accounts
"""
import os
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime
import base64

# Knot API Configuration
KNOT_BASE_URL = "https://api.knotapi.com"
KNOT_CLIENT_ID = os.getenv("KNOT_CLIENT_ID", "dda0778d-9486-47f8-bd80-6f2512f9bcdb")
KNOT_API_SECRET = os.getenv("KNOT_API_SECRET", "ff5e51b6dcf84a829898d37449cbc47a")


class KnotAPIClient:
    """Client for interacting with Knot TransactionLink API"""
    
    def __init__(self):
        self.base_url = KNOT_BASE_URL
        self.client_id = KNOT_CLIENT_ID
        self.api_secret = KNOT_API_SECRET
        
        # Create basic auth header
        credentials = f"{self.client_id}:{self.api_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        self.headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/json"
        }
    
    def list_merchants(self, product_type: str = "transaction_link") -> List[Dict[str, Any]]:
        """
        Get list of available merchants for TransactionLink
        
        Args:
            product_type: Product type filter (default: "transaction_link")
            
        Returns:
            List of merchant objects
        """
        url = f"{self.base_url}/merchants"
        params = {"type": product_type}
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json().get("merchants", [])
        except requests.exceptions.RequestException as e:
            print(f"Error fetching merchants: {e}")
            return []
    
    def create_session(self, user_id: str, merchant_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """
        Create a session for user to link their merchant account
        
        Args:
            user_id: Your internal user ID
            merchant_id: Optional merchant ID to pre-select
            
        Returns:
            Session object with session_id
        """
        url = f"{self.base_url}/sessions"
        payload = {
            "user_id": user_id,
            "product": "transaction_link"
        }
        
        if merchant_id:
            payload["merchant_id"] = merchant_id
        
        try:
            response = requests.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error creating session: {e}")
            return None
    
    def get_merchant_accounts(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all linked merchant accounts for a user
        
        Args:
            user_id: Your internal user ID
            
        Returns:
            List of merchant account objects with connection status
        """
        url = f"{self.base_url}/accounts"
        params = {"user_id": user_id}
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json().get("accounts", [])
        except requests.exceptions.RequestException as e:
            print(f"Error fetching merchant accounts: {e}")
            return []
    
    def sync_transactions(
        self, 
        user_id: str, 
        merchant_account_id: str,
        limit: int = 100,
        cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sync new transactions for a user's merchant account
        
        Args:
            user_id: Your internal user ID
            merchant_account_id: Knot merchant account ID
            limit: Number of transactions to fetch (max 100)
            cursor: Pagination cursor for next page
            
        Returns:
            Dict with transactions array and pagination info
        """
        url = f"{self.base_url}/transactions/sync"
        params = {
            "user_id": user_id,
            "merchant_account_id": merchant_account_id,
            "limit": limit
        }
        
        if cursor:
            params["cursor"] = cursor
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error syncing transactions: {e}")
            return {"transactions": [], "has_more": False}
    
    def get_transaction_by_id(self, transaction_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific transaction by ID (for updates)
        
        Args:
            transaction_id: Knot transaction ID
            
        Returns:
            Transaction object
        """
        url = f"{self.base_url}/transactions/{transaction_id}"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching transaction {transaction_id}: {e}")
            return None
    
    def sync_all_user_transactions(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Sync all transactions from all connected merchant accounts for a user
        
        Args:
            user_id: Your internal user ID
            
        Returns:
            List of all transactions across all merchant accounts
        """
        all_transactions = []
        
        # Get all merchant accounts
        accounts = self.get_merchant_accounts(user_id)
        
        for account in accounts:
            # Only sync from connected accounts
            if account.get("connection", {}).get("status") == "connected":
                merchant_account_id = account.get("id")
                
                # Paginate through all transactions
                cursor = None
                has_more = True
                
                while has_more:
                    result = self.sync_transactions(
                        user_id=user_id,
                        merchant_account_id=merchant_account_id,
                        limit=100,
                        cursor=cursor
                    )
                    
                    transactions = result.get("transactions", [])
                    all_transactions.extend(transactions)
                    
                    has_more = result.get("has_more", False)
                    cursor = result.get("cursor")
        
        return all_transactions


# Initialize global client
knot_client = KnotAPIClient()
