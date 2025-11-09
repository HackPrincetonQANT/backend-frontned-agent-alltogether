"""
Receipt Processing Module
Processes receipt data from images and saves to Snowflake
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any
import uuid
from .db import get_conn

def categorize_item(item_name: str, store: str = "") -> str:
    """
    Categorize an item based on its name and store
    """
    item_lower = item_name.lower()
    store_lower = store.lower()
    
    # Coffee
    if any(word in item_lower for word in ['coffee', 'latte', 'espresso', 'cappuccino', 'americano', 'mocha']):
        return 'Coffee'
    if 'starbucks' in store_lower:
        return 'Coffee'
    
    # Groceries
    if any(word in store_lower for word in ['trader joe', 'grocery', 'whole foods', 'wegmans', 'shoprite', 'acme']):
        return 'Groceries'
    if any(word in item_lower for word in ['milk', 'bread', 'egg', 'cheese', 'fruit', 'vegetable', 'meat', 'chicken']):
        return 'Groceries'
    
    # Food & Dining
    if any(word in store_lower for word in ['restaurant', 'pizza', 'burger', 'doordash', 'uber eats', 'grubhub']):
        return 'Food'
    if any(word in item_lower for word in ['pizza', 'burger', 'sandwich', 'salad', 'pasta', 'rice']):
        return 'Food'
    
    # Entertainment
    if any(word in store_lower for word in ['netflix', 'hulu', 'disney', 'spotify', 'apple music', 'theater', 'cinema']):
        return 'Entertainment'
    
    # Transport
    if any(word in store_lower for word in ['uber', 'lyft', 'gas', 'shell', 'exxon', 'transit']):
        return 'Transport'
    
    # Shopping
    if any(word in store_lower for word in ['amazon', 'target', 'walmart', 'mall']):
        return 'Shopping'
    
    # Default
    return 'Other'

def save_receipt_to_database(user_id: str, receipt_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save receipt data to Snowflake database
    
    Args:
        user_id: User identifier
        receipt_data: Parsed receipt with store, location, items, total
        
    Returns:
        dict with success status and saved transactions
    """
    with get_conn() as conn:
        cursor = conn.cursor()
        
        try:
            store = receipt_data.get('store', 'Unknown Store')
            location = receipt_data.get('location', '')
            items = receipt_data.get('items', [])
            total = receipt_data.get('total', 0)
            
            saved_transactions = []
            
            # If we have itemized data, save each item
            if items and len(items) > 0:
                for item in items:
                    item_name = item.get('name', 'Unknown Item')
                    quantity = item.get('quantity', 1)
                    price = item.get('price', 0)
                    
                    # Calculate individual item total
                    item_total = float(quantity) * float(price)
                    
                    # Categorize the item
                    category = categorize_item(item_name, store)
                    
                    # Generate unique item ID
                    item_id = f"rcpt_{uuid.uuid4().hex[:12]}"
                    
                    # Create item description
                    item_desc = f"{store} · {item_name}"
                    if quantity > 1:
                        item_desc = f"{store} · {item_name} x{quantity}"
                    
                    # Insert into database
                    cursor.execute("""
                        INSERT INTO SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST
                        (ITEM_ID, USER_ID, ITEM_NAME, MERCHANT, PRICE, TS, CATEGORY)
                        VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP(), %s)
                    """, (
                        item_id,
                        user_id,
                        item_name,
                        store,
                        item_total,
                        category
                    ))
                    
                    saved_transactions.append({
                        'item': item_desc,
                        'amount': item_total,
                        'category': category
                    })
                    
                    print(f"✅ Saved: {item_desc} - ${item_total:.2f} ({category})")
            else:
                # No itemized data, save as single transaction
                category = categorize_item(store, store)
                item_id = f"rcpt_{uuid.uuid4().hex[:12]}"
                
                cursor.execute("""
                    INSERT INTO SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST
                    (ITEM_ID, USER_ID, ITEM_NAME, MERCHANT, PRICE, TS, CATEGORY)
                    VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP(), %s)
                """, (
                    item_id,
                    user_id,
                    store,
                    store,
                    float(total),
                    category
                ))
                
                saved_transactions.append({
                    'item': store,
                    'amount': float(total),
                    'category': category
                })
                
                print(f"✅ Saved: {store} - ${total:.2f} ({category})")
            
            conn.commit()
            
            return {
                'success': True,
                'message': f'Saved {len(saved_transactions)} transaction(s) to database',
                'transactions': saved_transactions,
                'total_amount': sum(t['amount'] for t in saved_transactions)
            }
            
        except Exception as e:
            print(f"❌ Error saving receipt: {e}")
            conn.rollback()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            cursor.close()
