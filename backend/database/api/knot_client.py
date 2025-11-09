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
KNOT_SESSION_URL = "https://production.knotapi.com"  # For session creation
KNOT_API_URL = "https://api.knotapi.com"  # For data endpoints
KNOT_CLIENT_ID = os.getenv("KNOT_CLIENT_ID", "a390e79d-2920-4440-9ba1-b747bc92790b")
KNOT_API_SECRET = os.getenv("KNOT_API_SECRET", "be1e86abb4fc42a3b904b2f52215847e")


class KnotAPIClient:
    """Client for interacting with Knot TransactionLink API"""
    
    def __init__(self):
        self.session_url = KNOT_SESSION_URL
        self.api_url = KNOT_API_URL
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
    
    def create_session(
        self,
        user_id: str,
        merchant_id: int = None,
        product_type: str = "transaction_link"
    ) -> Optional[Dict[str, Any]]:
        """
        Create a session for user to authenticate with a merchant
        
        Args:
            user_id: Your internal user ID (external_user_id)
            merchant_id: Optional Knot merchant ID to pre-select
            product_type: Product type (transaction_link or card_switch)
            
        Returns:
            Session object with session_id if successful, None otherwise
        """
        url = f"{self.session_url}/session/create"
        
        body = {
            "client_id": self.client_id,
            "external_user_id": user_id,
            "type": product_type
        }
        
        if merchant_id:
            body["merchant_id"] = merchant_id
        
        try:
            print(f"🔵 Creating Knot session at {url}")
            print(f"🔵 Body: {body}")
            response = requests.post(url, headers=self.headers, json=body)
            print(f"🔵 Response status: {response.status_code}")
            
            if response.status_code == 500:
                print(f"⚠️  500 Server Error from Knot")
                print(f"⚠️  Response: {response.text[:500]}")
                return None
            
            response.raise_for_status()
            data = response.json()
            
            print(f"✅ Session created: {data.get('session', 'N/A')[:50]}...")
            
            # Return normalized response
            return {
                "session_id": data.get("session"),
                "session": data.get("session"),
                "user_id": user_id,
                "merchant_id": merchant_id
            }
        except requests.exceptions.RequestException as e:
            print(f"❌ Error creating session: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"❌ Response: {e.response.text[:500]}")
            return None
    
    def get_merchant_accounts(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all merchant accounts for a user
        
        Args:
            user_id: Your internal user ID (external_user_id)
            
        Returns:
            List of merchant account objects
        """
        url = f"{self.api_url}/v1/transaction-link/merchant-accounts"
        params = {
            "externalUserId": user_id
        }
        
        try:
            print(f"🔵 Fetching merchant accounts from {url}")
            print(f"🔵 Params: {params}")
            response = requests.get(url, headers=self.headers, params=params)
            print(f"🔵 Response status: {response.status_code}")
            response.raise_for_status()
            data = response.json()
            return data.get("merchantAccounts", [])
        except requests.exceptions.RequestException as e:
            print(f"Error fetching merchant accounts: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response: {e.response.text}")
            return []
    
    def sync_transactions(
        self, 
        merchant_account_id: str,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        page_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sync transactions for a merchant account
        
        Args:
            merchant_account_id: Knot merchant account ID
            start_time: Optional ISO8601 start time
            end_time: Optional ISO8601 end time
            page_token: Optional pagination token
            
        Returns:
            Dict with transactions array and nextPageToken
        """
        url = f"{self.api_url}/v1/transaction-link/merchant-accounts/{merchant_account_id}/transactions/sync"
        
        body = {}
        if start_time:
            body["startTime"] = start_time
        if end_time:
            body["endTime"] = end_time
        if page_token:
            body["pageToken"] = page_token
        
        try:
            print(f"🔵 Syncing transactions from {url}")
            print(f"🔵 Body: {body}")
            response = requests.post(url, headers=self.headers, json=body)
            print(f"🔵 Response status: {response.status_code}")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Error syncing transactions: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"❌ Response: {e.response.text[:500]}")
            return {"transactions": [], "nextPageToken": None}
    
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
    
    def get_transactions_by_merchant(self, user_id: str, merchant_id: int, limit: int = 100, cursor: Optional[str] = None) -> Dict[str, Any]:
        """
        Sync transactions using Knot's /transactions/sync endpoint
        Uses cursor-based pagination to get new transactions
        
        Args:
            user_id: Your internal user ID (external_user_id)
            merchant_id: Merchant ID (e.g., 19 for DoorDash, 36 for Uber Eats)
            limit: Max transactions to fetch (min: 1, max: 100)
            cursor: Optional cursor token for pagination
            
        Returns:
            Dict with: {
                "merchant": {"id": int, "name": str},
                "transactions": [...],
                "next_cursor": str | None,
                "limit": int
            }
        """
        # Use production endpoint
        url = "https://production.knotapi.com/transactions/sync"
        
        body = {
            "merchant_id": merchant_id,
            "external_user_id": user_id,
            "limit": min(limit, 100)  # Max 100 per docs
        }
        
        if cursor:
            body["cursor"] = cursor
        
        try:
            print(f"🔵 Syncing transactions from {url}")
            print(f"🔵 Body: {body}")
            response = requests.post(url, headers=self.headers, json=body)
            print(f"🔵 Response status: {response.status_code}")
            
            if response.status_code == 403:
                print(f"⚠️  403 Forbidden - May need to contact Knot for API access")
                print(f"⚠️  Response: {response.text[:500]}")
                return {"merchant": {}, "transactions": [], "next_cursor": None, "limit": limit}
            
            response.raise_for_status()
            data = response.json()
            
            transactions = data.get("transactions", [])
            next_cursor = data.get("next_cursor")
            merchant = data.get("merchant", {})
            
            print(f"✅ Got {len(transactions)} transactions from {merchant.get('name', f'merchant {merchant_id}')}")
            if next_cursor:
                print(f"📄 Next cursor available: {next_cursor[:50]}...")
            
            return {
                "merchant": merchant,
                "transactions": transactions,
                "next_cursor": next_cursor,
                "limit": data.get("limit", limit)
            }
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error syncing transactions: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"❌ Response: {response.status_code} - {e.response.text[:500]}")
            return {"merchant": {}, "transactions": [], "next_cursor": None, "limit": limit}
    
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
        print(f"📋 Found {len(accounts)} merchant accounts for user {user_id}")
        
        for account in accounts:
            # Only sync from connected accounts
            status = account.get("status", "")
            if status == "connected":
                merchant_account_id = account.get("merchantAccountId")
                merchant_name = account.get("merchantName", "Unknown")
                print(f"🔄 Syncing transactions from {merchant_name} (account: {merchant_account_id})")
                
                # Paginate through all transactions
                page_token = None
                
                while True:
                    result = self.sync_transactions(
                        merchant_account_id=merchant_account_id,
                        page_token=page_token
                    )
                    
                    transactions = result.get("transactions", [])
                    all_transactions.extend(transactions)
                    print(f"  ✅ Retrieved {len(transactions)} transactions")
                    
                    page_token = result.get("nextPageToken")
                    if not page_token:
                        break
        
        print(f"📦 Total transactions retrieved: {len(all_transactions)}")
        return all_transactions
        
        return all_transactions


# Initialize global client
knot_client = KnotAPIClient()
