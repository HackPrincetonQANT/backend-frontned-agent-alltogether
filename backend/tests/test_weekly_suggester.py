"""
Tests for Phase 2: Weekly Suggester - Domain-Based Alternative Finder

Tests the weekly suggester service that uses Dedalus AI with MCP websearch
to find cheaper alternatives across major retailers.

Following CLAUDE.MD Rule 2: Each step should contain tests to validate changes work.
"""

import asyncio
import json
import os
import sys
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock, AsyncMock

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from services.weekly_suggester import (
    fetch_top_items,
    build_plan_prompt,
    generate_weekly_suggestions
)


# Test 1: fetch_top_items returns correct data structure
def test_fetch_top_items_structure():
    """
    Verify that fetch_top_items returns properly structured item data.

    Expected: List of dicts with item_name, merchant, price, category, etc.
    """
    # Mock database response
    mock_rows = [
        {
            'ITEM_NAME': 'Test Product 1',
            'MERCHANT': 'Amazon',
            'PRICE': 99.99,
            'CATEGORY': 'Electronics',
            'SUBCATEGORY': 'Smart Home',
            'PURCHASED_AT': datetime(2024, 1, 27, 15, 13, 35),
            'ITEM_ID': 'item-001'
        },
        {
            'ITEM_NAME': 'Test Product 2',
            'MERCHANT': 'Best Buy',
            'PRICE': 49.99,
            'CATEGORY': 'Electronics',
            'SUBCATEGORY': 'Accessories',
            'PURCHASED_AT': datetime(2024, 1, 28, 10, 0, 0),
            'ITEM_ID': 'item-002'
        }
    ]

    with patch('services.weekly_suggester.fetch_all', return_value=mock_rows):
        items = fetch_top_items('test_user', '2024-01-22', limit=5)

    # Verify structure
    assert isinstance(items, list), "Should return list"
    assert len(items) == 2, "Should have 2 items"

    # Verify first item structure
    item = items[0]
    assert 'item_name' in item, "Should have item_name"
    assert 'merchant' in item, "Should have merchant"
    assert 'price' in item, "Should have price"
    assert 'category' in item, "Should have category"

    # Verify data types
    assert isinstance(item['item_name'], str), "item_name should be string"
    assert isinstance(item['price'], float), "price should be float"

    # Verify values
    assert item['item_name'] == 'Test Product 1'
    assert item['price'] == 99.99


# Test 2: fetch_top_items parameterized query (SQL injection prevention)
def test_fetch_top_items_sql_injection_prevention():
    """
    Verify that fetch_top_items uses parameterized queries to prevent SQL injection.

    Expected: Parameters should be passed separately, not concatenated into SQL.
    """
    with patch('services.weekly_suggester.fetch_all') as mock_fetch:
        mock_fetch.return_value = []

        user_id = "test'; DROP TABLE purchase_items; --"
        week_start = '2024-01-22'

        fetch_top_items(user_id, week_start, limit=5)

        # Verify fetch_all was called with parameters
        assert mock_fetch.called, "Should call fetch_all"
        call_args = mock_fetch.call_args

        # Verify SQL uses placeholders, not string concatenation
        sql = call_args[0][0]
        assert '%s' in sql, "Should use parameterized placeholders"
        assert user_id not in sql, "User input should NOT be in SQL string"

        # Verify parameters passed separately
        params = call_args[0][1]
        assert params[0] == user_id, "User ID should be in params"


# Test 3: build_plan_prompt generates valid prompt
def test_build_plan_prompt_format():
    """
    Verify that build_plan_prompt generates a properly formatted prompt.

    Expected: Prompt should include items, constraints, and output format.
    """
    test_items = [
        {
            'item_name': 'Ring Video Doorbell 3',
            'merchant': 'Amazon',
            'price': 119.99,
            'category': 'Smart Home'
        },
        {
            'item_name': 'Instant Pot Duo 7-in-1',
            'merchant': 'Target',
            'price': 89.00,
            'category': 'Kitchen'
        }
    ]

    prompt = build_plan_prompt(test_items)

    # Verify prompt includes key constraints
    assert 'NO TRIVIAL SAVINGS' in prompt, "Should mention savings threshold"
    assert '>$10' in prompt, "Should specify $10 threshold"
    assert 'VERIFY EXACT PRODUCT' in prompt, "Should require exact match"
    assert 'TOTAL LANDED COST' in prompt, "Should require total cost calculation"

    # Verify items are included
    assert 'Ring Video Doorbell 3' in prompt, "Should include first item"
    assert 'Instant Pot Duo 7-in-1' in prompt, "Should include second item"
    assert '119.99' in prompt, "Should include prices"

    # Verify output format specified
    assert 'JSON' in prompt, "Should request JSON output"
    assert 'total_savings' in prompt, "Should request savings calculation"


# Test 4: build_plan_prompt handles empty items
def test_build_plan_prompt_empty_items():
    """
    Verify that build_plan_prompt handles empty item list gracefully.

    Expected: Should generate valid prompt even with no items.
    """
    prompt = build_plan_prompt([])

    assert isinstance(prompt, str), "Should return string"
    assert len(prompt) > 0, "Should not be empty"
    assert 'Top 0 expensive items' in prompt, "Should indicate 0 items"


# Test 5: generate_weekly_suggestions validates date format
def test_generate_weekly_suggestions_invalid_date():
    """
    Verify that generate_weekly_suggestions validates week_start format.

    Expected: Should raise ValueError for invalid date format.
    """
    async def run_test():
        try:
            await generate_weekly_suggestions('test_user', 'invalid-date', top_n=5)
            assert False, "Should raise ValueError"
        except ValueError as e:
            assert 'Invalid week_start format' in str(e)

    asyncio.run(run_test())


# Test 6: generate_weekly_suggestions handles no purchases
def test_generate_weekly_suggestions_no_purchases():
    """
    Verify that generate_weekly_suggestions handles users with no purchases.

    Expected: Should return empty report without calling Dedalus.
    """
    async def run_test():
        with patch('services.weekly_suggester.fetch_all', return_value=[]):
            report = await generate_weekly_suggestions('test_user', '2024-01-22', top_n=5)

        # Verify empty report structure
        assert report['items_analyzed'] == 0, "Should have 0 items analyzed"
        assert report['items_with_alternatives'] == 0, "Should have 0 alternatives"
        assert report['total_potential_savings'] == 0.0, "Should have 0 savings"
        assert report['findings'] == [], "Should have empty findings"
        assert report['mcp_calls_made'] == 0, "Should not call MCP if no items"

    asyncio.run(run_test())


# Test 7: generate_weekly_suggestions parses AI response
def test_generate_weekly_suggestions_ai_response():
    """
    Verify that generate_weekly_suggestions correctly parses Dedalus AI response.

    Expected: Should extract findings and calculate total savings.
    """
    async def run_test():
        # Mock database response
        mock_items = [
            {
                'ITEM_NAME': 'Ring Video Doorbell 3',
                'MERCHANT': 'Amazon',
                'PRICE': 119.99,
                'CATEGORY': 'Smart Home',
                'SUBCATEGORY': None,
                'PURCHASED_AT': datetime(2024, 1, 27),
                'ITEM_ID': 'item-001'
            }
        ]

        # Mock Dedalus response
        mock_ai_response = Mock()
        mock_ai_response.final_output = json.dumps([
            {
                'item_number': 1,
                'item_name': 'Ring Video Doorbell 3',
                'original_price': 119.99,
                'original_merchant': 'Amazon',
                'alternative_merchant': 'Best Buy',
                'alternative_price': 99.99,
                'shipping_cost': 0.00,
                'tax_estimate': 7.00,
                'total_landed_cost': 106.99,
                'total_savings': 13.00,
                'product_match_confidence': 'exact_upc_match',
                'stock_status': 'in_stock',
                'url': 'https://www.bestbuy.com/...',
                'notes': 'Free shipping'
            }
        ])

        # Mock AsyncDedalus
        mock_runner = AsyncMock()
        mock_runner.run.return_value = mock_ai_response

        with patch('services.weekly_suggester.fetch_all', return_value=mock_items), \
             patch('services.weekly_suggester.DedalusRunner', return_value=mock_runner), \
             patch('services.weekly_suggester.AsyncDedalus'):

            report = await generate_weekly_suggestions('test_user', '2024-01-22', top_n=5)

        # Verify report structure
        assert report['items_analyzed'] == 1, "Should analyze 1 item"
        assert report['items_with_alternatives'] == 1, "Should find 1 alternative"
        assert report['total_potential_savings'] == 13.00, "Should calculate correct savings"
        assert len(report['findings']) == 1, "Should have 1 finding"

        # Verify finding details
        finding = report['findings'][0]
        assert finding['item_name'] == 'Ring Video Doorbell 3'
        assert finding['total_savings'] == 13.00
        assert finding['alternative_merchant'] == 'Best Buy'

    asyncio.run(run_test())


# Test 8: generate_weekly_suggestions filters low savings
def test_generate_weekly_suggestions_filters_low_savings():
    """
    Verify that AI is instructed to filter out alternatives with <$10 savings.

    Expected: Prompt should specify >$10 threshold.
    """
    test_items = [
        {
            'item_name': 'Test Item',
            'merchant': 'Amazon',
            'price': 50.00,
            'category': 'Test'
        }
    ]

    prompt = build_plan_prompt(test_items)

    # Verify threshold is specified
    assert '>$10' in prompt or '> $10' in prompt, "Should specify $10 minimum savings"
    assert 'NO TRIVIAL SAVINGS' in prompt, "Should emphasize no trivial savings"


# Test 9: generate_weekly_suggestions handles API errors
def test_generate_weekly_suggestions_api_error():
    """
    Verify that generate_weekly_suggestions handles Dedalus API errors gracefully.

    Expected: Should return error report without crashing.
    """
    async def run_test():
        # Mock database response
        mock_items = [
            {
                'ITEM_NAME': 'Test Product',
                'MERCHANT': 'Amazon',
                'PRICE': 99.99,
                'CATEGORY': 'Electronics',
                'SUBCATEGORY': None,
                'PURCHASED_AT': datetime(2024, 1, 27),
                'ITEM_ID': 'item-001'
            }
        ]

        # Mock Dedalus to raise exception
        with patch('services.weekly_suggester.fetch_all', return_value=mock_items), \
             patch('services.weekly_suggester.DedalusRunner') as mock_runner_class:

            mock_runner = AsyncMock()
            mock_runner.run.side_effect = Exception("API quota exceeded")
            mock_runner_class.return_value = mock_runner

            report = await generate_weekly_suggestions('test_user', '2024-01-22', top_n=5)

        # Verify error handling
        assert report['error'] is not None, "Should record error"
        assert 'quota exceeded' in report['error'].lower(), "Should include error message"
        assert report['findings'] == [], "Should have empty findings"
        assert report['items_analyzed'] == 1, "Should still count items analyzed"

    asyncio.run(run_test())


# Test 10: Week calculation is correct
def test_week_calculation():
    """
    Verify that week end is calculated correctly (7 days from start).

    Expected: week_end should be exactly 7 days after week_start.
    """
    async def run_test():
        with patch('services.weekly_suggester.fetch_all', return_value=[]):
            report = await generate_weekly_suggestions('test_user', '2024-01-22', top_n=5)

        # Verify week calculation
        week_start = datetime.strptime(report['week_start'], '%Y-%m-%d')
        week_end = datetime.strptime(report['week_end'], '%Y-%m-%d')

        delta = (week_end - week_start).days
        assert delta == 7, f"Week should be 7 days, got {delta}"

    asyncio.run(run_test())


# Test 11: Response JSON parsing robustness
def test_json_parsing_robustness():
    """
    Verify that JSON parsing handles malformed AI responses gracefully.

    Expected: Should return empty findings if JSON parsing fails.
    """
    async def run_test():
        # Mock database response
        mock_items = [
            {
                'ITEM_NAME': 'Test Product',
                'MERCHANT': 'Amazon',
                'PRICE': 99.99,
                'CATEGORY': 'Electronics',
                'SUBCATEGORY': None,
                'PURCHASED_AT': datetime(2024, 1, 27),
                'ITEM_ID': 'item-001'
            }
        ]

        # Mock Dedalus response with malformed JSON
        mock_ai_response = Mock()
        mock_ai_response.final_output = "This is not valid JSON at all"

        mock_runner = AsyncMock()
        mock_runner.run.return_value = mock_ai_response

        with patch('services.weekly_suggester.fetch_all', return_value=mock_items), \
             patch('services.weekly_suggester.DedalusRunner', return_value=mock_runner), \
             patch('services.weekly_suggester.AsyncDedalus'):

            report = await generate_weekly_suggestions('test_user', '2024-01-22', top_n=5)

        # Verify graceful handling
        assert report['findings'] == [], "Should have empty findings on parse error"
        assert report['error'] is None, "Should not set error for parse failures"

    asyncio.run(run_test())


if __name__ == '__main__':
    # Run tests manually
    print("Running Phase 2 Weekly Suggester Tests...")

    print("\n1. Testing fetch_top_items structure...")
    test_fetch_top_items_structure()
    print("   ✅ fetch_top_items returns correct structure")

    print("\n2. Testing SQL injection prevention...")
    test_fetch_top_items_sql_injection_prevention()
    print("   ✅ Parameterized queries prevent SQL injection")

    print("\n3. Testing prompt format...")
    test_build_plan_prompt_format()
    print("   ✅ Plan prompt includes constraints and format")

    print("\n4. Testing empty items handling...")
    test_build_plan_prompt_empty_items()
    print("   ✅ Empty items handled gracefully")

    print("\n5. Testing date validation...")
    test_generate_weekly_suggestions_invalid_date()
    print("   ✅ Invalid date format raises ValueError")

    print("\n6. Testing no purchases scenario...")
    test_generate_weekly_suggestions_no_purchases()
    print("   ✅ No purchases returns empty report")

    print("\n7. Testing AI response parsing...")
    test_generate_weekly_suggestions_ai_response()
    print("   ✅ AI response parsed correctly")

    print("\n8. Testing savings filter...")
    test_generate_weekly_suggestions_filters_low_savings()
    print("   ✅ Prompt specifies >$10 savings threshold")

    print("\n9. Testing API error handling...")
    test_generate_weekly_suggestions_api_error()
    print("   ✅ API errors handled gracefully")

    print("\n10. Testing week calculation...")
    test_week_calculation()
    print("   ✅ Week end calculated correctly (7 days)")

    print("\n11. Testing JSON parsing robustness...")
    test_json_parsing_robustness()
    print("   ✅ Malformed JSON handled gracefully")

    print("\n✅ All Phase 2 tests passed!")
