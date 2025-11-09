# database/api/smart_tips.py

from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict

from .db import fetch_all


def generate_smart_tips(user_id: str, limit: int = 6) -> List[Dict[str, Any]]:
    """
    Generate smart savings tips based on user's actual spending patterns.
    
    Analyzes:
    - Recurring low-usage subscriptions
    - High-frequency expensive items (like daily coffee)
    - Underutilized recurring payments
    - Category-based overspending
    """
    
    tips = []
    
    # 1. Analyze transaction patterns from last 30 days
    sql_recent = """
        SELECT
          ITEM_NAME,
          MERCHANT,
          CATEGORY,
          PRICE,
          TS
        FROM SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST
        WHERE USER_ID = %s
          AND TS >= DATEADD('day', -30, CURRENT_TIMESTAMP())
        ORDER BY TS DESC
    """
    
    transactions = fetch_all(sql_recent, (user_id,))
    
    if not transactions:
        return []
    
    # Group by item/merchant for pattern analysis
    item_patterns = defaultdict(lambda: {
        'count': 0,
        'total_spent': 0,
        'prices': [],
        'category': None,
        'merchant': None,
        'last_purchase': None
    })
    
    for txn in transactions:
        item_name = txn.get('ITEM_NAME') or txn.get('MERCHANT', 'Unknown')
        merchant = txn.get('MERCHANT', '')
        category = txn.get('CATEGORY', 'Other')
        price = txn.get('PRICE', 0)
        ts = txn.get('TS')
        
        key = f"{item_name}_{merchant}"
        item_patterns[key]['count'] += 1
        item_patterns[key]['total_spent'] += price
        item_patterns[key]['prices'].append(price)
        item_patterns[key]['category'] = category
        item_patterns[key]['merchant'] = merchant
        item_patterns[key]['item_name'] = item_name
        if not item_patterns[key]['last_purchase'] or ts > item_patterns[key]['last_purchase']:
            item_patterns[key]['last_purchase'] = ts
    
    # 2. Find high-frequency items (coffee, fast food, etc.)
    for key, data in item_patterns.items():
        if data['count'] >= 10 and data['category'] in ['Coffee', 'Food']:  # 10+ times in 30 days
            avg_price = data['total_spent'] / data['count']
            monthly_cost = data['total_spent']
            potential_savings = monthly_cost * 0.6  # Assume 60% savings possible
            
            tips.append({
                'icon': '☕' if data['category'] == 'Coffee' else '🍔',
                'title': f"Frequent {data['item_name']}",
                'subtitle': f"${avg_price:.2f} × {data['count']} times = ${monthly_cost:.2f}/mo",
                'description': f"You visit {data['merchant'] or data['item_name']} often. Consider cheaper alternatives or reducing frequency.",
                'savings': potential_savings,
                'action': 'Review',
                'category': data['category']
            })
    
    # 3. Find expensive single purchases that could be reduced
    category_totals = defaultdict(lambda: {'total': 0, 'count': 0, 'items': []})
    for key, data in item_patterns.items():
        cat = data['category']
        category_totals[cat]['total'] += data['total_spent']
        category_totals[cat]['count'] += data['count']
        category_totals[cat]['items'].append(data)
    
    # Find top spending categories
    for category, cat_data in sorted(category_totals.items(), key=lambda x: x[1]['total'], reverse=True)[:3]:
        if cat_data['total'] > 100 and category not in ['Coffee', 'Food']:  # Already handled above
            potential_savings = cat_data['total'] * 0.3  # 30% potential savings
            
            emoji_map = {
                'Groceries': '🛒',
                'Transport': '🚗',
                'Entertainment': '🎬',
                'Shopping': '🛍️',
                'Other': '💰'
            }
            
            tips.append({
                'icon': emoji_map.get(category, '💰'),
                'title': f"High {category} Spending",
                'subtitle': f"${cat_data['total']:.2f} spent this month",
                'description': f"You spent ${cat_data['total']:.2f} on {category} across {cat_data['count']} purchases. Look for deals or alternatives.",
                'savings': potential_savings,
                'action': 'Explore',
                'category': category
            })
    
    # 4. Check for patterns that suggest subscriptions/recurring
    for key, data in item_patterns.items():
        # If same price multiple times from same merchant = likely subscription
        if len(data['prices']) >= 2:
            prices_unique = list(set([round(p, 2) for p in data['prices']]))
            if len(prices_unique) == 1 and data['count'] >= 2:  # Same price multiple times
                monthly_cost = data['total_spent']
                
                # Low usage heuristic: if it's a small number of identical charges, might be underused
                if data['count'] <= 4 and monthly_cost > 10:  # 4 or fewer uses, costs money
                    tips.append({
                        'icon': '📱',
                        'title': f"{data['item_name']} Subscription",
                        'subtitle': f"Only {data['count']} charges this month",
                        'description': f"You're paying ${monthly_cost:.2f}/month but might not be using it much. Consider if you need it.",
                        'savings': monthly_cost,
                        'action': 'Review',
                        'category': data['category']
                    })
    
    # 5. Convert all Decimal to float for JSON serialization
    for tip in tips:
        tip['savings'] = float(tip['savings'])
    
    # 6. Sort by potential savings and return top tips
    tips_sorted = sorted(tips, key=lambda x: x['savings'], reverse=True)[:limit]
    
    return tips_sorted
