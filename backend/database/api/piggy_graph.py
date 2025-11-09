# database/api/piggy_graph.py

from typing import List, Dict, Any
from collections import defaultdict
from .db import fetch_all
from .do_llm import call_do_llm
from .graph_storage import save_graph_to_db


def generate_piggy_graph(user_id: str) -> Dict[str, Any]:
    """
    Generate a graph visualization of user spending habits, preferences, and insights.
    
    Returns nodes and edges for React Flow visualization with:
    - User habits (frequency, patterns)
    - Common locations (merchants, stores)
    - Household insights (large grocery orders)
    - AI-generated insights from LLM
    """
    
    # Get all transaction data for analysis
    sql = """
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
    
    transactions = fetch_all(sql, (user_id,))
    
    if not transactions:
        return {"nodes": [], "edges": []}
    
    # Analyze data
    merchant_counts = defaultdict(int)
    category_totals = defaultdict(float)
    merchant_locations = {}
    large_orders = []
    
    for txn in transactions:
        merchant = txn.get('MERCHANT', 'Unknown')
        category = txn.get('CATEGORY', 'Other')
        price = float(txn.get('PRICE', 0))
        item_name = txn.get('ITEM_NAME', '')
        
        merchant_counts[merchant] += 1
        category_totals[category] += price
        
        # Track locations (infer from merchant names)
        if merchant not in merchant_locations:
            # Infer location hints
            if 'Starbucks' in merchant:
                merchant_locations[merchant] = "Near Princeton"
            elif "Trader Joe" in merchant or "Target" in merchant:
                merchant_locations[merchant] = "Local Area"
            else:
                merchant_locations[merchant] = "Online/Local"
        
        # Detect large orders (groceries > $100)
        if category == 'Groceries' and price > 100:
            large_orders.append({
                'merchant': merchant,
                'amount': price,
                'item': item_name
            })
    
    # Determine frequency patterns
    total_txns = len(transactions)
    frequent_merchants = {m: c for m, c in merchant_counts.items() if c >= 4}
    
    # Prepare data for LLM analysis
    spending_summary = {
        'total_transactions': total_txns,
        'frequent_merchants': dict(list(frequent_merchants.items())[:5]),
        'top_categories': dict(sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:3]),
        'large_orders': large_orders[:3],
        'avg_grocery_order': sum(o['amount'] for o in large_orders) / len(large_orders) if large_orders else 0
    }
    
    # Generate AI insights using LLM with Princeton-specific context
    llm_prompt = f"""You are analyzing spending patterns for a Princeton University student/resident. Be EXTREMELY specific about Princeton campus locations.

Spending Data:
- {spending_summary['total_transactions']} transactions
- Frequent merchants: {', '.join([f"{m} ({c}x)" for m, c in spending_summary['frequent_merchants'].items()])}
- Top categories: {', '.join([f"{c}: ${a:.0f}" for c, a in spending_summary['top_categories'].items()])}
- Average grocery order: ${spending_summary['avg_grocery_order']:.0f}

Generate insights in THREE categories. For each category, provide 2-3 specific insights in exact JSON format:

{{
  "location": [
    {{"title": "Starbucks on Nassau Street", "description": "22 visits - Most likely the location near Palmer Square or inside Frist Campus Center"}},
    {{"title": "Trader Joe's on Nassau Street", "description": "4 large grocery orders averaging $141 - The location near Princeton Shopping Center"}}
  ],
  "frequency": [
    {{"title": "Daily Coffee Routine", "description": "Visits Starbucks almost every day (22 times in 30 days) - likely between classes"}},
    {{"title": "Weekly Grocery Shopping", "description": "Large orders every 7 days suggest planning ahead for the week"}}
  ],
  "preferences": [
    {{"title": "Groceries-Focused Spender", "description": "Spends most on groceries ($562) suggesting cooking at home rather than dining halls"}},
    {{"title": "Delivery App User", "description": "Uses DoorDash for convenience, likely during exam periods or late nights"}}
  ]
}}

CRITICAL REQUIREMENTS:
- For locations: Be SPECIFIC to Princeton University campus (Nassau Street, Palmer Square, Frist Center, Prospect Avenue, etc.)
- For Starbucks: Mention it's likely near Palmer Square or inside Frist Campus Center
- For Trader Joe's: Note it's on Nassau Street near Princeton Shopping Center
- For frequency: Analyze patterns (daily, weekly, situational)
- For preferences: Infer lifestyle choices (cooking vs dining hall, convenience vs cost)
- NO emojis anywhere
- Be precise and actionable"""

    try:
        llm_response = call_do_llm(llm_prompt)
        # Parse LLM response to extract insights
        import json
        import re
        
        # Try to extract JSON from response
        json_match = re.search(r'\{.*\}', llm_response, re.DOTALL)
        if json_match:
            categorized_insights = json.loads(json_match.group(0))
            location_insights = categorized_insights.get('location', [])
            frequency_insights = categorized_insights.get('frequency', [])
            preference_insights = categorized_insights.get('preferences', [])
        else:
            raise ValueError("No JSON found in LLM response")
    except Exception as e:
        print(f"LLM insight generation failed: {e}, using fallback")
        # Fallback insights with SPECIFIC details based on actual data
        location_insights = []
        frequency_insights = []
        preference_insights = []
        
        # Location insights - Be VERY specific about Princeton locations
        for merchant, count in sorted(merchant_counts.items(), key=lambda x: x[1], reverse=True)[:4]:
            if merchant == 'Uber Eats' and count > 10:
                location_insights.append({
                    'title': 'Uber Eats - Delivers to Campus',
                    'description': f'{count} orders delivered - Likely to dorm/apartment near Princeton campus, probably Nassau Street area'
                })
            elif merchant == 'Starbucks':
                location_insights.append({
                    'title': 'Starbucks - Nassau St/Frist Center',
                    'description': f'{count} visits - Most likely Palmer Square location or Frist Campus Center inside Princeton University'
                })
            elif "Trader Joe" in merchant:
                location_insights.append({
                    'title': "Trader Joe's on Nassau Street",
                    'description': f'{count} trips to Nassau Street location near Princeton Shopping Center - {merchant_locations.get(merchant, "walking distance")}'
                })
            elif merchant == 'Chipotle':
                location_insights.append({
                    'title': 'Chipotle Near Princeton',
                    'description': f'{count} visits - Located on Nassau Street, walking distance from Princeton University campus'
                })
            elif merchant == 'Target':
                location_insights.append({
                    'title': 'Target - Princeton Shopping Ctr',
                    'description': f'{count} visits - Located at Princeton Shopping Center on North Harrison Street'
                })
        
        # If no specific locations found, add general ones
        if not location_insights:
            location_insights.append({
                'title': 'Online Shopping Preferred',
                'description': 'Most purchases appear to be online deliveries or digital services'
            })
        
        # Frequency insights - Be SPECIFIC about visit patterns
        if frequent_merchants:
            top_merchant = max(frequent_merchants.items(), key=lambda x: x[1])
            visits_per_day = round(top_merchant[1] / 30, 1)
            
            if top_merchant[0] == 'Uber Eats':
                frequency_insights.append({
                    'title': f'Heavy Uber Eats User',
                    'description': f'{top_merchant[1]} orders in 30 days - More than once daily on average, suggests relying on delivery for meals'
                })
            elif 'Starbucks' in top_merchant[0]:
                frequency_insights.append({
                    'title': 'Daily Coffee Routine',
                    'description': f'{top_merchant[1]} visits in 30 days - Nearly daily Starbucks stops, likely between classes or study sessions'
                })
            else:
                frequency_insights.append({
                    'title': f'Frequent {top_merchant[0]} Visits',
                    'description': f'{top_merchant[1]} visits in 30 days ({visits_per_day}x/day average) - Regular routine established'
                })
        
        # Check for subscription patterns
        subscription_merchants = ['Netflix', 'Hulu', 'Spotify', 'Amazon Prime', 'Apple Music']
        active_subscriptions = [m for m in merchant_counts.keys() if any(sub in m for sub in subscription_merchants)]
        if len(active_subscriptions) >= 3:
            frequency_insights.append({
                'title': f'Multiple Active Subscriptions',
                'description': f'{len(active_subscriptions)} streaming/music services ({", ".join(active_subscriptions[:3])}) - Paying monthly'
            })
        
        if len(large_orders) >= 2:
            avg_order = sum(o['amount'] for o in large_orders) / len(large_orders)
            frequency_insights.append({
                'title': 'Weekly Grocery Shopping Pattern',
                'description': f'{len(large_orders)} large grocery orders (avg ${avg_order:.0f}) - Suggests weekly meal prep planning'
            })
        
        # Preference insights - Be SPECIFIC about lifestyle choices
        top_category = max(category_totals.items(), key=lambda x: x[1])
        
        if top_category[0] == 'Transport':
            rides_count = merchant_counts.get('Uber', 0) + merchant_counts.get('Lyft', 0)
            preference_insights.append({
                'title': 'No Car - Relies on Rideshare',
                'description': f'${top_category[1]:.0f} spent on transport ({rides_count} rides) - Student without car, depends on Uber/Lyft for off-campus trips'
            })
        elif top_category[0] == 'Food':
            preference_insights.append({
                'title': 'Food Delivery Dependent',
                'description': f'${top_category[1]:.0f} on food delivery - Prefers convenience over dining hall, likely busy schedule'
            })
        elif top_category[0] == 'Groceries':
            preference_insights.append({
                'title': 'Cooking at Home',
                'description': f'${top_category[1]:.0f} on groceries - Prefers cooking over dining halls, suggests off-campus housing or apartment'
            })
        elif top_category[0] == 'Entertainment':
            preference_insights.append({
                'title': 'Entertainment-Focused',
                'description': f'${top_category[1]:.0f} on entertainment - Values streaming services and digital content'
            })
        
        # Second preference insight
        if 'Groceries' in category_totals and category_totals['Groceries'] > 400:
            preference_insights.append({
                'title': 'Meal Prep Over Takeout',
                'description': f'${category_totals["Groceries"]:.0f} grocery spending vs takeout - Cost-conscious, prefers home cooking'
            })
        elif 'Transport' in category_totals and category_totals['Transport'] > 100:
            preference_insights.append({
                'title': 'Active Social Life',
                'description': f'${category_totals["Transport"]:.0f} on rides - Frequently traveling to off-campus locations, social outings'
            })
        elif 'Entertainment' in category_totals and category_totals['Entertainment'] > 50:
            subs_list = ', '.join(active_subscriptions[:3]) if active_subscriptions else 'multiple services'
            preference_insights.append({
                'title': 'Digital Media Consumer',
                'description': f'${category_totals["Entertainment"]:.0f} on subscriptions ({subs_list}) - Values streaming entertainment'
            })
        
        # Ensure we have at least 2 insights per category
        if len(location_insights) < 2:
            location_insights.append({
                'title': 'Campus-Centric Lifestyle',
                'description': 'Most spending within walking distance or delivery radius of Princeton campus'
            })
        if len(frequency_insights) < 2:
            frequency_insights.append({
                'title': 'Consistent Spending Pattern',
                'description': f'{total_txns} transactions tracked - Regular purchasing habits established'
            })
        if len(preference_insights) < 2:
            preference_insights.append({
                'title': 'Convenience-Oriented',
                'description': 'Spending patterns show preference for convenient, time-saving options'
            })
    
    # Build graph nodes and edges
    nodes = []
    edges = []
    
    # Central Piggy node - center of the graph
    nodes.append({
        'id': 'piggy',
        'type': 'piggy',
        'data': {
            'label': 'Piggy',
            'subtitle': 'Your Spending Profile'
        },
        'position': {'x': 600, 'y': 400}
    })
    
    # Location category node - left branch
    nodes.append({
        'id': 'category_location',
        'type': 'category',
        'data': {
            'label': 'Locations',
            'subtitle': 'Where you shop'
        },
        'position': {'x': 150, 'y': 200}
    })
    edges.append({
        'id': 'edge_piggy_location',
        'source': 'piggy',
        'target': 'category_location',
        'type': 'smoothstep',
        'animated': True,
        'style': {'stroke': '#6b4423', 'strokeWidth': 3},
        'markerEnd': {'type': 'arrowclosed', 'color': '#6b4423', 'width': 25, 'height': 25}
    })
    
    # Frequency category node - top branch
    nodes.append({
        'id': 'category_frequency',
        'type': 'category',
        'data': {
            'label': 'Frequency',
            'subtitle': 'How often you spend'
        },
        'position': {'x': 600, 'y': 100}
    })
    edges.append({
        'id': 'edge_piggy_frequency',
        'source': 'piggy',
        'target': 'category_frequency',
        'type': 'smoothstep',
        'animated': True,
        'style': {'stroke': '#6b4423', 'strokeWidth': 3},
        'markerEnd': {'type': 'arrowclosed', 'color': '#6b4423', 'width': 25, 'height': 25}
    })
    
    # Preferences category node - right branch
    nodes.append({
        'id': 'category_preferences',
        'type': 'category',
        'data': {
            'label': 'Preferences',
            'subtitle': 'What you like'
        },
        'position': {'x': 1050, 'y': 200}
    })
    edges.append({
        'id': 'edge_piggy_preferences',
        'source': 'piggy',
        'target': 'category_preferences',
        'type': 'smoothstep',
        'animated': True,
        'style': {'stroke': '#6b4423', 'strokeWidth': 3},
        'markerEnd': {'type': 'arrowclosed', 'color': '#6b4423', 'width': 25, 'height': 25}
    })
    
    # Location insight nodes - spread horizontally below location category
    x_start_location = 50
    for i, insight in enumerate(location_insights):
        node_id = f"location_{i}"
        nodes.append({
            'id': node_id,
            'type': 'insight',
            'data': {
                'label': insight['title'],
                'description': insight['description'],
                'category': 'location'
            },
            'position': {'x': x_start_location + i * 280, 'y': 500}
        })
        edges.append({
            'id': f"edge_loc_{node_id}",
            'source': 'category_location',
            'target': node_id,
            'type': 'smoothstep',
            'animated': False,
            'style': {'stroke': '#8b6240', 'strokeWidth': 2},
            'markerEnd': {'type': 'arrowclosed', 'color': '#8b6240', 'width': 20, 'height': 20}
        })
    
    # Frequency insight nodes - spread horizontally below frequency category
    x_start_frequency = 400
    for i, insight in enumerate(frequency_insights):
        node_id = f"frequency_{i}"
        nodes.append({
            'id': node_id,
            'type': 'insight',
            'data': {
                'label': insight['title'],
                'description': insight['description'],
                'category': 'frequency'
            },
            'position': {'x': x_start_frequency + i * 300, 'y': 0}
        })
        edges.append({
            'id': f"edge_freq_{node_id}",
            'source': 'category_frequency',
            'target': node_id,
            'type': 'smoothstep',
            'animated': False,
            'style': {'stroke': '#8b6240', 'strokeWidth': 2},
            'markerEnd': {'type': 'arrowclosed', 'color': '#8b6240', 'width': 20, 'height': 20}
        })
    
    # Preference insight nodes - spread horizontally below preferences category
    x_start_preferences = 900
    for i, insight in enumerate(preference_insights):
        node_id = f"preference_{i}"
        nodes.append({
            'id': node_id,
            'type': 'insight',
            'data': {
                'label': insight['title'],
                'description': insight['description'],
                'category': 'preferences'
            },
            'position': {'x': x_start_preferences + i * 280, 'y': 500}
        })
        edges.append({
            'id': f"edge_pref_{node_id}",
            'source': 'category_preferences',
            'target': node_id,
            'type': 'smoothstep',
            'animated': False,
            'style': {'stroke': '#8b6240', 'strokeWidth': 2},
            'markerEnd': {'type': 'arrowclosed', 'color': '#8b6240', 'width': 20, 'height': 20}
        })
    
    # Combine all insights for legacy support
    all_insights = location_insights + frequency_insights + preference_insights
    
    # Prepare response data
    response_data = {
        'nodes': nodes,
        'edges': edges,
        'insights': {
            'location': location_insights,
            'frequency': frequency_insights,
            'preferences': preference_insights,
            'all': all_insights
        },
        'stats': {
            'total_transactions': total_txns,
            'unique_merchants': len(merchant_counts),
            'total_spent': sum(category_totals.values())
        }
    }
    
    # Save graph data to Snowflake for later use in recommendations
    try:
        save_graph_to_db(
            user_id=user_id,
            nodes=nodes,
            edges=edges,
            insights=response_data['insights'],
            stats=response_data['stats']
        )
    except Exception as e:
        print(f"Warning: Could not save graph to database: {e}")
    
    return response_data
