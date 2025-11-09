# database/api/smart_tips.py

from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict

from .db import fetch_all


def generate_smart_tips(user_id: str, limit: int = 6) -> List[Dict[str, Any]]:
    """
    Generate actionable smart savings tips based on user's actual spending patterns.
    
    Provides specific, informed recommendations like:
    - Too many Ubers? Try public transport (NJ Transit, TigerTransit)
    - Have Hulu & Disney+? Get the bundle to save money
    - Netflix but only watched 2 episodes? Maybe cancel
    - Exclude essentials like Spotify (music is a need!)
    """
    
    tips = []
    
    # 1. Analyze transaction patterns
    sql_recent = """
        SELECT
          ITEM_NAME,
          MERCHANT,
          CATEGORY,
          PRICE,
          TS
        FROM SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST
        WHERE USER_ID = %s
        ORDER BY TS DESC
    """
    
    transactions = fetch_all(sql_recent, (user_id,))
    
    if not transactions:
        return []
    
    # Group by merchant/category for pattern analysis
    merchant_totals = defaultdict(lambda: {'count': 0, 'total': 0, 'category': None})
    category_totals = defaultdict(lambda: {'count': 0, 'total': 0})
    
    for txn in transactions:
        merchant = txn.get('MERCHANT', 'Unknown')
        category = txn.get('CATEGORY', 'Other')
        price = float(txn.get('PRICE', 0))
        
        merchant_totals[merchant]['count'] += 1
        merchant_totals[merchant]['total'] += price
        merchant_totals[merchant]['category'] = category
        
        category_totals[category]['count'] += 1
        category_totals[category]['total'] += price
    
    # 2. Too many Ubers? Suggest public transport
    uber_count = merchant_totals.get('Uber', {}).get('count', 0)
    uber_total = merchant_totals.get('Uber', {}).get('total', 0)
    
    if uber_count >= 5 and uber_total > 100:
        tips.append({
            'icon': '🚗',
            'title': f'Too Many Uber Rides',
            'subtitle': f'{uber_count} rides costing ${uber_total:.2f}',
            'description': f"You took {uber_count} Uber rides this month. Try NJ Transit bus or TigerTransit (free Princeton shuttle) to save money!",
            'savings': uber_total * 0.85,  # Save 85% with public transport
            'action': 'Try Transit',
            'category': 'Transport'
        })
    
    # 3. Uber Eats too much? Cook at home or try Aldi
    ubereats_count = merchant_totals.get('Uber Eats', {}).get('count', 0)
    ubereats_total = merchant_totals.get('Uber Eats', {}).get('total', 0)
    
    if ubereats_count >= 10 and ubereats_total > 50:
        tips.append({
            'icon': '🍔',
            'title': f'Uber Eats Every Day',
            'subtitle': f'{ubereats_count} orders costing ${ubereats_total:.2f}',
            'description': f"You ordered food {ubereats_count} times this month. Shop at Aldi and cook at home to save big money!",
            'savings': ubereats_total * 0.70,  # Save 70% by cooking
            'action': 'Cook More',
            'category': 'Food'
        })
    
    # 4. Check for Hulu + Disney+ bundle opportunity (but NOT Spotify - that's essential!)
    has_hulu = 'Hulu' in merchant_totals
    has_disney = 'Disney+' in merchant_totals or 'Disney Plus' in merchant_totals
    
    if has_hulu and not has_disney:
        hulu_total = merchant_totals.get('Hulu', {}).get('total', 0)
        if hulu_total > 15:
            tips.append({
                'icon': '🎬',
                'title': 'Get Disney+ Hulu Bundle',
                'subtitle': f'Currently paying ${hulu_total:.2f}/mo for just Hulu',
                'description': "The Disney+Hulu bundle costs $19.99/mo and includes both services. Better value than Hulu alone!",
                'savings': hulu_total * 0.35,
                'action': 'Bundle',
                'category': 'Entertainment'
            })
    
    if has_hulu and has_disney:
        hulu_total = merchant_totals.get('Hulu', {}).get('total', 0)
        disney_total = merchant_totals.get('Disney+', {}).get('total', 0) or merchant_totals.get('Disney Plus', {}).get('total', 0)
        combined = hulu_total + disney_total
        
        if combined > 25:  # Bundle is $19.99
            tips.append({
                'icon': '🎬',
                'title': 'Switch to Disney+Hulu Bundle',
                'subtitle': f'Paying ${combined:.2f}/mo separately',
                'description': f"You're paying for Hulu and Disney+ separately (${combined:.2f}/mo). The bundle is only $19.99/mo - save money!",
                'savings': combined - 19.99,
                'action': 'Bundle Now',
                'category': 'Entertainment'
            })
    
    # 5. Netflix with low usage? Suggest cancel (but check if they actually watch)
    has_netflix = 'Netflix' in merchant_totals
    netflix_count = merchant_totals.get('Netflix', {}).get('count', 0)
    netflix_total = merchant_totals.get('Netflix', {}).get('total', 0)
    
    if has_netflix and netflix_count <= 3 and netflix_total > 20:
        # Simulate low usage (in real app, would check viewing history)
        tips.append({
            'icon': '📺',
            'title': 'Netflix Not Watching Much?',
            'subtitle': f'Paying ${netflix_total:.2f}/mo',
            'description': f"Only saw {netflix_count} charges this month. If you're barely watching, maybe cancel it and rotate subscriptions?",
            'savings': netflix_total,
            'action': 'Review',
            'category': 'Entertainment'
        })
    
    # 6. High transport spending in general
    transport_total = category_totals.get('Transport', {}).get('total', 0)
    transport_count = category_totals.get('Transport', {}).get('count', 0)
    
    if transport_total > 150 and transport_count >= 5:
        tips.append({
            'icon': '🚌',
            'title': 'High Transport Costs',
            'subtitle': f'${transport_total:.2f} on rides this month',
            'description': f"Spent ${transport_total:.2f} on {transport_count} rides. Princeton's TigerTransit is FREE, and NJ Transit is way cheaper than Uber!",
            'savings': transport_total * 0.80,
            'action': 'Go Public',
            'category': 'Transport'
        })
    
    # 7. Food delivery too frequent
    food_total = category_totals.get('Food', {}).get('total', 0)
    food_count = category_totals.get('Food', {}).get('count', 0)
    
    if food_total > 100 and food_count >= 15:
        tips.append({
            'icon': '�‍🍳',
            'title': 'Too Much Food Delivery',
            'subtitle': f'{food_count} deliveries = ${food_total:.2f}',
            'description': f"You ordered food {food_count} times! Hit up Aldi on Nassau St for groceries and meal prep to save tons of money.",
            'savings': food_total * 0.65,
            'action': 'Meal Prep',
            'category': 'Food'
        })
    
    # NOTE: Explicitly DON'T suggest removing Spotify - music is essential for students!
    # Spotify stays off the tips list
    
    # 8. Convert all Decimal to float for JSON serialization
    for tip in tips:
        tip['savings'] = float(tip['savings'])
    
    # 9. Sort by potential savings and return top tips
    tips_sorted = sorted(tips, key=lambda x: x['savings'], reverse=True)[:limit]
    
    return tips_sorted
