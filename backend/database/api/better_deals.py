# database/api/better_deals.py

from typing import List, Dict, Any
from .db import fetch_all


# Price comparison data for common merchants
ALTERNATIVE_STORES = {
    'Starbucks': {
        'alternatives': [
            {'name': 'Dunkin', 'price_diff': -40, 'emoji': '☕'},
            {'name': 'Home Brew', 'price_diff': -80, 'emoji': '🏠'},
            {'name': "McDonald's", 'price_diff': -50, 'emoji': '🍟'},
        ]
    },
    "Trader Joe's": {
        'alternatives': [
            {'name': 'Aldi', 'price_diff': -30, 'emoji': '🛒'},
            {'name': 'Costco', 'price_diff': -25, 'emoji': '📦'},
            {'name': 'Walmart', 'price_diff': -20, 'emoji': '🏪'},
        ]
    },
    'Target': {
        'alternatives': [
            {'name': 'Walmart', 'price_diff': -15, 'emoji': '🏪'},
            {'name': 'Costco (Bulk)', 'price_diff': -25, 'emoji': '📦'},
            {'name': 'Amazon', 'price_diff': -10, 'emoji': '📦'},
        ]
    },
    'Amazon': {
        'alternatives': [
            {'name': 'Walmart', 'price_diff': -12, 'emoji': '🏪'},
            {'name': 'Target', 'price_diff': -8, 'emoji': '🎯'},
            {'name': 'AliExpress', 'price_diff': -50, 'emoji': '🌍'},
        ]
    },
    'Whole Foods': {
        'alternatives': [
            {'name': "Trader Joe's", 'price_diff': -35, 'emoji': '🛒'},
            {'name': 'Sprouts', 'price_diff': -25, 'emoji': '🥬'},
            {'name': 'Regular Grocery', 'price_diff': -40, 'emoji': '🏪'},
        ]
    },
    'DoorDash': {
        'alternatives': [
            {'name': 'Pickup Instead', 'price_diff': -60, 'emoji': '🚗'},
            {'name': 'Cook at Home', 'price_diff': -70, 'emoji': '👨‍🍳'},
            {'name': 'Uber Eats (promo)', 'price_diff': -20, 'emoji': '🍔'},
        ]
    },
    'Disney+': {
        'alternatives': [
            {'name': 'Disney+Hulu Bundle', 'price_diff': -35, 'emoji': '🎬'},
            {'name': 'Family Plan Split', 'price_diff': -50, 'emoji': '👨‍👩‍👧'},
        ]
    },
    'Hulu': {
        'alternatives': [
            {'name': 'Disney+Hulu Bundle', 'price_diff': -35, 'emoji': '🎬'},
            {'name': 'Hulu (w/ads)', 'price_diff': -45, 'emoji': '📺'},
        ]
    },
    'Netflix': {
        'alternatives': [
            {'name': 'Share with Family', 'price_diff': -60, 'emoji': '👨‍👩‍👧'},
            {'name': 'Cancel & Rotate', 'price_diff': -100, 'emoji': '🔄'},
            {'name': 'Basic Plan', 'price_diff': -40, 'emoji': '📺'},
        ]
    },
    'Planet Fitness': {
        'alternatives': [
            {'name': 'Home Workouts', 'price_diff': -90, 'emoji': '🏠'},
            {'name': 'YouTube Fitness', 'price_diff': -100, 'emoji': '📱'},
            {'name': 'Community Rec Center', 'price_diff': -70, 'emoji': '🏊'},
        ]
    }
}


def generate_better_deals(user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Generate better deal suggestions based on user's purchases.
    
    Analyzes where the user shops and suggests cheaper alternatives
    with estimated savings.
    """
    
    deals = []
    
    # Get recent transactions
    sql = """
        SELECT
          MERCHANT,
          ITEM_NAME,
          CATEGORY,
          PRICE,
          COUNT(*) as purchase_count,
          SUM(PRICE) as total_spent
        FROM SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST
        WHERE USER_ID = %s
          AND TS >= DATEADD('day', -30, CURRENT_TIMESTAMP())
        GROUP BY MERCHANT, ITEM_NAME, CATEGORY, PRICE
        HAVING COUNT(*) >= 1
        ORDER BY total_spent DESC
    """
    
    purchases = fetch_all(sql, (user_id,))
    
    # Track which merchants we've already suggested alternatives for
    suggested_merchants = set()
    
    for purchase in purchases:
        merchant = purchase.get('MERCHANT', '')
        item_name = purchase.get('ITEM_NAME', '')
        category = purchase.get('CATEGORY', 'Other')
        price = float(purchase.get('PRICE', 0))
        count = int(purchase.get('PURCHASE_COUNT', 0))
        total_spent = float(purchase.get('TOTAL_SPENT', 0))
        
        # Check if we have alternative suggestions for this merchant
        for known_merchant, alternatives_data in ALTERNATIVE_STORES.items():
            if known_merchant.lower() in merchant.lower() and merchant not in suggested_merchants:
                suggested_merchants.add(merchant)
                
                # Get best alternative
                best_alt = alternatives_data['alternatives'][0]
                
                # Calculate actual savings
                savings_percent = abs(best_alt['price_diff']) / 100
                monthly_savings = total_spent * savings_percent
                
                deals.append({
                    'current_store': merchant,
                    'current_spending': total_spent,
                    'alternative_store': best_alt['name'],
                    'emoji': best_alt['emoji'],
                    'savings_percent': abs(best_alt['price_diff']),
                    'monthly_savings': monthly_savings,
                    'purchase_count': count,
                    'category': category,
                    'all_alternatives': alternatives_data['alternatives']
                })
                
                break
    
    # Sort by potential monthly savings
    deals_sorted = sorted(deals, key=lambda x: x['monthly_savings'], reverse=True)[:limit]
    
    return deals_sorted
