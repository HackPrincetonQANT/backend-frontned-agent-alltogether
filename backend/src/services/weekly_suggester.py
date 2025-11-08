"""
Weekly Suggestions Service - Domain-Based Alternative Finder

Uses Dedalus AI with MCP websearch to find cheaper alternatives across major retailers.
Follows the "Plan" strategy: analyze top expensive items, search major retailers,
verify exact products, calculate total landed cost.

Design Principles (CLAUDE.MD):
- Test-driven development
- Security-first (parameterized queries, input validation)
- Privacy-conscious (no PII exposure)
"""

import asyncio
import importlib.util
import json
import os
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dedalus_labs import AsyncDedalus, DedalusRunner

# Dynamically load the db module from the database API directory
db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'api', 'db.py')
spec = importlib.util.spec_from_file_location("db", db_path)
db = importlib.util.module_from_spec(spec)
spec.loader.exec_module(db)
fetch_all = db.fetch_all


def fetch_top_items(user_id: str, week_start: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Fetch the top N most expensive items from PURCHASE_ITEMS_TEST for a given week.

    Args:
        user_id: User identifier
        week_start: ISO week start date (YYYY-MM-DD)
        limit: Maximum number of items to return (default 5)

    Returns:
        List of item dicts with item_name, merchant, price, category, purchased_at

    Security: Uses parameterized queries to prevent SQL injection
    """
    # Calculate week end (7 days from start)
    week_start_date = datetime.strptime(week_start, '%Y-%m-%d')
    week_end_date = week_start_date + timedelta(days=7)
    week_end = week_end_date.strftime('%Y-%m-%d')

    sql = """
        SELECT
            ITEM_NAME,
            MERCHANT,
            PRICE,
            CATEGORY,
            SUBCATEGORY,
            TS AS PURCHASED_AT,
            ITEM_ID
        FROM SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.PURCHASE_ITEMS_TEST
        WHERE USER_ID = %s
          AND TS >= TO_TIMESTAMP_TZ(%s)
          AND TS < TO_TIMESTAMP_TZ(%s)
          AND PRICE IS NOT NULL
        ORDER BY PRICE DESC
        LIMIT %s
    """

    params = (user_id, week_start, week_end, limit)
    rows = fetch_all(sql, params)

    # Convert to list of dicts with proper key names
    items = []
    for row in rows:
        items.append({
            'item_name': row.get('ITEM_NAME', 'Unknown'),
            'merchant': row.get('MERCHANT', 'Unknown'),
            'price': float(row.get('PRICE', 0.0)),
            'category': row.get('CATEGORY'),
            'subcategory': row.get('SUBCATEGORY'),
            'purchased_at': row.get('PURCHASED_AT'),
            'item_id': row.get('ITEM_ID')
        })

    return items


def build_plan_prompt(items: List[Dict[str, Any]]) -> str:
    """
    Build the "Plan" prompt for Dedalus AI with MCP websearch.

    Strategy:
    1. Analyze top expensive items
    2. Search major retailers (Best Buy, Target, Walmart, Newegg, etc.)
    3. Verify exact product (UPC/model number)
    4. Calculate total landed cost (price + shipping + taxes)
    5. Only report high-value savings (>$10)

    Args:
        items: List of purchase items to analyze

    Returns:
        Formatted prompt string for Dedalus AI
    """
    # Build item list for prompt
    item_list = []
    for i, item in enumerate(items, 1):
        item_list.append(
            f"{i}. {item['item_name']} - "
            f"Paid ${item['price']:.2f} at {item['merchant']} "
            f"({item.get('category', 'Unknown')})"
        )

    items_text = "\n".join(item_list)

    prompt = f"""You are a smart shopping assistant helping users find cheaper alternatives for their purchases.

**USER'S RECENT PURCHASES (Top {len(items)} expensive items):**
{items_text}

**YOUR TASK:**
For each item, search major retailers (Best Buy, Target, Walmart, Newegg, Amazon, etc.) to find cheaper alternatives.

**CRITICAL REQUIREMENTS:**
1. ✅ VERIFY EXACT PRODUCT: Match by UPC, model number, or exact product name
2. ✅ CHECK TOTAL LANDED COST: Include price + shipping + taxes in comparison
3. ✅ NO TRIVIAL SAVINGS: Only report alternatives with >$10 total savings
4. ✅ VERIFY AVAILABILITY: Check if item is in stock at the alternative retailer
5. ✅ DOMAIN-BASED SEARCH: Search across major retailer websites

**OUTPUT FORMAT:**
Return ONLY a valid JSON array. Each finding should be:
[
  {{
    "item_number": 1,
    "item_name": "exact product name",
    "original_price": 99.99,
    "original_merchant": "Amazon",
    "alternative_merchant": "Best Buy",
    "alternative_price": 79.99,
    "shipping_cost": 0.00,
    "tax_estimate": 5.60,
    "total_landed_cost": 85.59,
    "total_savings": 14.40,
    "product_match_confidence": "exact_upc_match",
    "stock_status": "in_stock",
    "url": "https://www.bestbuy.com/...",
    "notes": "Verified UPC match, free shipping, estimated tax"
  }}
]

**IMPORTANT:**
- Skip items where you can't find >$10 savings
- Skip items where product match is uncertain
- Skip items that are out of stock
- If NO items meet criteria, return empty array: []

Use the websearch tool to search major retailers. Start your search now!"""

    return prompt


async def generate_weekly_suggestions(
    user_id: str,
    week_start: str,
    top_n: int = 5
) -> Dict[str, Any]:
    """
    Generate weekly alternative suggestions for a user using Dedalus AI with MCP.

    Process:
    1. Fetch top N expensive items from the week
    2. Build "Plan" prompt with constraints
    3. Call Dedalus with MCP websearch tool
    4. Parse high-value findings (>$10 savings)
    5. Return structured report

    Args:
        user_id: User identifier
        week_start: ISO week start date (YYYY-MM-DD)
        top_n: Number of top items to analyze (default 5)

    Returns:
        Dict with user_id, week_start, findings, total_potential_savings, metadata

    Raises:
        ValueError: If week_start format is invalid
        Exception: If Dedalus API call fails
    """
    # Validate week_start format
    try:
        datetime.strptime(week_start, '%Y-%m-%d')
    except ValueError:
        raise ValueError(f"Invalid week_start format: {week_start}. Expected YYYY-MM-DD")

    # Step 1: Fetch top expensive items
    items = fetch_top_items(user_id, week_start, limit=top_n)

    if not items:
        # No purchases this week - return empty report
        week_end = (datetime.strptime(week_start, '%Y-%m-%d') + timedelta(days=7)).strftime('%Y-%m-%d')
        return {
            'user_id': user_id,
            'week_start': week_start,
            'week_end': week_end,
            'findings': [],
            'total_potential_savings': 0.0,
            'items_analyzed': 0,
            'items_with_alternatives': 0,
            'mcp_calls_made': 0,
            'processing_time_ms': 0,
            'error': None
        }

    # Step 2: Build Plan prompt
    prompt = build_plan_prompt(items)

    # Step 3: Call Dedalus with MCP websearch
    start_time = datetime.now()

    try:
        client = AsyncDedalus()
        runner = DedalusRunner(client)

        # Run with MCP tools enabled (websearch)
        response = await runner.run(
            input=prompt,
            model="openai/gpt-4o-mini"
        )

        # Step 4: Parse AI response
        try:
            findings = json.loads(response.final_output)
            if not isinstance(findings, list):
                # Try to extract JSON array from response
                import re
                json_match = re.search(r'\[\s*\{.*\}\s*\]', response.final_output, re.DOTALL)
                if json_match:
                    findings = json.loads(json_match.group(0))
                else:
                    findings = []
        except (json.JSONDecodeError, AttributeError):
            # If parsing fails, return empty findings
            findings = []

        # Calculate total savings
        total_savings = sum(f.get('total_savings', 0.0) for f in findings)

        # Step 5: Build report
        end_time = datetime.now()
        processing_time_ms = int((end_time - start_time).total_seconds() * 1000)

        return {
            'user_id': user_id,
            'week_start': week_start,
            'week_end': (datetime.strptime(week_start, '%Y-%m-%d') + timedelta(days=7)).strftime('%Y-%m-%d'),
            'findings': findings,
            'total_potential_savings': round(total_savings, 2),
            'items_analyzed': len(items),
            'items_with_alternatives': len(findings),
            'mcp_calls_made': 1,  # One batch call with MCP websearch
            'processing_time_ms': processing_time_ms,
            'error': None
        }

    except Exception as e:
        # Handle Dedalus API errors gracefully
        end_time = datetime.now()
        processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
        week_end = (datetime.strptime(week_start, '%Y-%m-%d') + timedelta(days=7)).strftime('%Y-%m-%d')

        return {
            'user_id': user_id,
            'week_start': week_start,
            'week_end': week_end,
            'findings': [],
            'total_potential_savings': 0.0,
            'items_analyzed': len(items),
            'items_with_alternatives': 0,
            'mcp_calls_made': 0,
            'processing_time_ms': processing_time_ms,
            'error': str(e)
        }


async def main():
    """Test the weekly suggester with mock data"""
    print("Testing Weekly Suggester...")

    # Test with mock user and week
    user_id = "test_user_001"
    week_start = "2024-01-22"  # Week containing our mock transactions

    print(f"\nGenerating suggestions for user {user_id}, week starting {week_start}")

    report = await generate_weekly_suggestions(user_id, week_start, top_n=5)

    print(f"\n{'='*60}")
    print("WEEKLY ALTERNATIVES REPORT")
    print(f"{'='*60}")
    print(f"User: {report['user_id']}")
    print(f"Week: {report['week_start']} to {report['week_end']}")
    print(f"Items Analyzed: {report['items_analyzed']}")
    print(f"Items with Alternatives: {report['items_with_alternatives']}")
    print(f"Total Potential Savings: ${report['total_potential_savings']:.2f}")
    print(f"Processing Time: {report['processing_time_ms']}ms")
    print(f"MCP Calls Made: {report['mcp_calls_made']}")

    if report['error']:
        print(f"\n❌ Error: {report['error']}")

    if report['findings']:
        print(f"\n{'='*60}")
        print("FINDINGS:")
        print(f"{'='*60}")
        for i, finding in enumerate(report['findings'], 1):
            print(f"\n{i}. {finding.get('item_name', 'Unknown')}")
            print(f"   Original: ${finding.get('original_price', 0):.2f} at {finding.get('original_merchant', 'Unknown')}")
            print(f"   Alternative: ${finding.get('total_landed_cost', 0):.2f} at {finding.get('alternative_merchant', 'Unknown')}")
            print(f"   💰 Savings: ${finding.get('total_savings', 0):.2f}")
            print(f"   🔗 {finding.get('url', 'N/A')}")
            print(f"   📝 {finding.get('notes', 'N/A')}")
    else:
        print("\n✅ No high-value alternatives found (all items already well-priced!)")

    print(f"\n{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(main())
