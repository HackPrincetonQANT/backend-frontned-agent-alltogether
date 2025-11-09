"""
Knot Transaction Sync Service
Syncs transactions from Knot API to Snowflake database
"""
import uuid
from datetime import datetime
from typing import List, Dict, Any
from .db import get_conn, execute


def categorize_transaction_item(item_name: str, merchant_name: str = "") -> str:
    """
    Categorize a transaction item based on merchant and item name
    
    Args:
        item_name: Name of the item
        merchant_name: Merchant name for context
        
    Returns:
        Category string
    """
    # Merchant-based categorization
    item_lower = item_name.lower()
    merchant_lower = merchant_name.lower()
    
    if any(x in merchant_lower or x in item_lower for x in ["starbucks", "coffee", "dunkin", "cafe"]):
        return "Coffee"
    elif any(x in merchant_lower or x in item_lower for x in ["target", "walmart", "amazon", "trader", "grocery", "whole foods"]):
        return "Groceries"
    elif any(x in merchant_lower or x in item_lower for x in ["doordash", "uber eats", "grubhub", "chipotle", "restaurant", "food", "pizza"]):
        return "Food"
    elif any(x in merchant_lower or x in item_lower for x in ["uber", "lyft", "zipcar", "transport", "taxi"]):
        return "Transport"
    elif any(x in merchant_lower or x in item_lower for x in ["netflix", "spotify", "hulu", "disney", "entertainment", "music", "movie"]):
        return "Entertainment"
    else:
        return "Shopping"


def transform_knot_transaction(transaction: Dict[str, Any], user_id: str) -> List[Dict[str, Any]]:
    """
    Transform a Knot transaction into our Snowflake format
    Works with the new Knot API response structure
    
    Args:
        transaction: Knot transaction object with products array
        user_id: Our internal user ID
        
    Returns:
        List of item records ready for Snowflake insertion
    """
    items = []
    
    # Extract transaction data
    transaction_id = transaction.get("id", "")
    transaction_date = transaction.get("datetime", datetime.now().isoformat())
    
    # Get merchant name from the transaction-level merchant field
    # Note: This may not be in the transaction itself, might need to pass it separately
    merchant_name = "Uber Eats"  # Default, should be passed in from webhook/merchant context
    
    # Process each product in the transaction
    products = transaction.get("products", [])
    
    for product in products:
        item_name = product.get("name", "Unknown Item")
        quantity = product.get("quantity", 1)
        
        # Get price - use total or unit_price
        price_data = product.get("price", {})
        if isinstance(price_data, dict):
            # Try total first, then unit_price
            price_str = price_data.get("total") or price_data.get("unit_price") or "0"
            price = float(price_str) if price_str else 0.0
        else:
            price = float(price_data) if price_data else 0.0
        
        # Categorize the item
        category = categorize_transaction_item(item_name, merchant_name)
        
        # Create item record (one per quantity for better tracking)
        for _ in range(quantity):
            item_record = {
                "item_id": str(uuid.uuid4()),
                "user_id": user_id,
                "item_name": item_name,
                "merchant": merchant_name,
                "price": price / quantity if quantity > 1 else price,  # Divide by quantity for per-item price
                "ts": transaction_date,
                "category": category,
                "knot_transaction_id": transaction_id,
                "knot_product_id": product.get("external_id", "")
            }
            
            items.append(item_record)
    
    # If no products, create one record for the total transaction
    if not items:
        price_data = transaction.get("price", {})
        if isinstance(price_data, dict):
            total_str = price_data.get("total", "0")
            amount = float(total_str) if total_str else 0.0
        else:
            amount = float(price_data) if price_data else 0.0
        
        category = categorize_transaction_item(merchant_name, merchant_name)
        
        items.append({
            "item_id": str(uuid.uuid4()),
            "user_id": user_id,
            "item_name": f"Purchase from {merchant_name}",
            "merchant": merchant_name,
            "price": amount,
            "ts": transaction_date,
            "category": category,
            "knot_transaction_id": transaction_id,
            "knot_product_id": ""
        })
    
    return items


def save_knot_transactions_to_snowflake(items: List[Dict[str, Any]]) -> int:
    """
    Save transformed Knot transactions to Snowflake
    
    Args:
        items: List of item records
        
    Returns:
        Number of items saved
    """
    if not items:
        return 0
    
    insert_sql = """
        INSERT INTO SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST 
        (ITEM_ID, USER_ID, ITEM_NAME, MERCHANT, PRICE, TS, CATEGORY)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    
    saved_count = 0
    with get_conn() as conn:
        for item in items:
            try:
                execute(
                    insert_sql,
                    (
                        item["item_id"],
                        item["user_id"],
                        item["item_name"],
                        item["merchant"],
                        item["price"],
                        item["ts"],
                        item["category"]
                    )
                )
                saved_count += 1
            except Exception as e:
                print(f"Error saving item {item['item_name']}: {e}")
                continue
    
    return saved_count


def sync_user_transactions_from_knot(user_id: str, merchant_id: int) -> Dict[str, Any]:
    """
    Main function to sync transactions for a user from Knot to Snowflake
    
    Args:
        user_id: Our internal user ID (for Snowflake and Knot external_user_id)
        merchant_id: Knot merchant ID
        
    Returns:
        Summary of sync operation
    """
    from .knot_client import KnotAPIClient
    
    print(f"Starting Knot sync for user: {user_id}, merchant: {merchant_id}")
    
    # Get transactions from Knot
    client = KnotAPIClient()
    result = client.get_transactions_by_merchant(user_id, merchant_id, limit=100)
    
    knot_transactions = result.get("transactions", [])
    merchant_name = result.get("merchant", {}).get("name", f"Merchant {merchant_id}")
    
    print(f"Retrieved {len(knot_transactions)} transactions from {merchant_name}")
    
    # Transform all transactions
    all_items = []
    for transaction in knot_transactions:
        items = transform_knot_transaction(transaction, user_id)
        all_items.extend(items)
    
    print(f"Transformed into {len(all_items)} items")
    
    # Save to Snowflake
    saved_count = save_knot_transactions_to_snowflake(all_items)
    
    return {
        "user_id": user_id,
        "merchant_id": merchant_id,
        "merchant_name": merchant_name,
        "knot_transactions_count": len(knot_transactions),
        "items_transformed": len(all_items),
        "items_saved": saved_count,
        "success": saved_count > 0
    }
