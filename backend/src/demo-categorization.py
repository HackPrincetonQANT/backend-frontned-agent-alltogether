import asyncio
import importlib.util
import json
import os
import sys
import uuid
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv

# Load environment variables from database API directory
env_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'api', '.env')
load_dotenv(env_path)

async def categorize_products_batch_verbose(runner, products_data):
    """
    Categorize all products in a single batch call to Dedalus AI.
    VERBOSE VERSION: Shows API interaction details for demo purposes.
    """
    print("\n" + "="*70)
    print("🤖 DEDALUS AI CATEGORIZATION DEMO")
    print("="*70)

    # Build the batch prompt with all products
    product_list = "\n".join([
        f"{i+1}. {p['name']} (${p['price']:.2f})"
        for i, p in enumerate(products_data)
    ])

    prompt = f"""You are a product taxonomy classifier. Categorize ALL these products in one response.

            Products to categorize:
            {product_list}

            Rules:
            - Suggest the most appropriate category for each (e.g., Electronics, Groceries, Pet Supplies, etc.)
            - Use CONSISTENT category names across similar products
            - Optionally provide subcategories for specificity
            - If confidence < 0.6, set ask_user=true
            - Keep category names concise and standard (no brand names)

            Return ONLY a valid JSON array with one object per product:
            [
            {{
                "item_number": 1,
                "category": "<main category>",
                "subcategory": "<optional subcategory or null>",
                "confidence": <float 0..1>,
                "reason": "<=12 words explaining why",
                "ask_user": <true|false>
            }},
            ...
            ]"""

    print(f"\n📊 Processing {len(products_data)} products through Dedalus AI...")
    print(f"🎯 Model: openai/gpt-5-mini")
    print(f"📦 Batch size: {len(products_data)} items")
    print(f"\n🔄 Sending request to Dedalus API...")

    import time
    start_time = time.time()

    response = await runner.run(
        input=prompt,
        model="openai/gpt-5-mini"
    )

    end_time = time.time()
    elapsed = end_time - start_time

    print(f"✅ Received response from Dedalus in {elapsed:.2f} seconds")
    print(f"\n📋 Sample Products Categorized:")

    # Parse JSON array response
    try:
        results = json.loads(response.final_output)
        if not isinstance(results, list):
            raise ValueError("Expected JSON array")

        # Show first 3 results as sample
        for i, result in enumerate(results[:3]):
            print(f"\n  {i+1}. {products_data[i]['name']}")
            print(f"     → Category: {result['category']}")
            if result.get('subcategory'):
                print(f"     → Subcategory: {result['subcategory']}")
            print(f"     → Confidence: {result['confidence']*100:.1f}%")
            print(f"     → Reasoning: {result['reason']}")

        if len(results) > 3:
            print(f"\n  ... and {len(results) - 3} more items")

        # Show confidence statistics
        confidences = [r['confidence'] for r in results]
        avg_confidence = sum(confidences) / len(confidences)
        min_confidence = min(confidences)
        max_confidence = max(confidences)

        print(f"\n📈 Categorization Statistics:")
        print(f"   • Total items: {len(results)}")
        print(f"   • Average confidence: {avg_confidence*100:.1f}%")
        print(f"   • Confidence range: {min_confidence*100:.1f}% - {max_confidence*100:.1f}%")
        print(f"   • Items needing review: {sum(1 for r in results if r.get('ask_user', False))}")

        return results
    except (json.JSONDecodeError, ValueError) as e:
        print(f"❌ Error parsing Dedalus response: {str(e)}")
        # Fallback: create default categorizations
        return [
            {
                "item_number": i + 1,
                "category": "Miscellaneous",
                "subcategory": None,
                "confidence": 0.0,
                "reason": f"Failed to parse batch response: {str(e)}",
                "ask_user": True
            }
            for i in range(len(products_data))
        ]

async def main():
    """
    DEMO VERSION: Shows Dedalus integration with detailed logging
    """
    print("\n" + "🎬 " + "="*68)
    print("   DEDALUS AI CATEGORIZATION - LIVE DEMO")
    print("   Powered by: Dedalus Labs (https://dedalus.ai)")
    print("="*70)

    # Load JSON data
    json_path = os.path.join(os.path.dirname(__file__), 'data', 'sample_knot.json')

    with open(json_path, 'r') as f:
        data = json.load(f)

    merchant_name = data['merchant']['name']
    print(f"\n📂 Loading transactions from: {merchant_name}")

    # Initialize Dedalus client
    print(f"\n🔧 Initializing Dedalus client...")
    client = AsyncDedalus()
    runner = DedalusRunner(client)
    print(f"✅ Dedalus client ready!")

    # Collect all products from all transactions
    products_to_categorize = []
    product_metadata = []

    for transaction in data['transactions']:
        for product in transaction['products']:
            products_to_categorize.append({
                'name': product['name'],
                'price': float(product['price']['total'])
            })
            product_metadata.append({
                'transaction_id': transaction['id'],
                'transaction_datetime': transaction['datetime'],
                'name': product['name'],
                'price': float(product['price']['total']),
                'quantity': product['quantity']
            })

    # Single batch categorization call with verbose output
    categorization_results = await categorize_products_batch_verbose(runner, products_to_categorize)

    # Merge categorization results with product metadata
    all_results = []
    for i, cat_result in enumerate(categorization_results):
        metadata = product_metadata[i]
        all_results.append({
            "item": metadata['name'],
            "category": cat_result['category'],
            "subcategory": cat_result.get('subcategory'),
            "price": metadata['price'],
            "quantity": metadata['quantity'],
            "purchased_at": metadata['transaction_datetime'],
            "confidence": cat_result['confidence'],
            "reason": cat_result['reason'],
            "ask_user": cat_result.get('ask_user', False),
            "transaction_id": metadata['transaction_id']
        })

    # Calculate summary statistics
    category_data = {}
    for result in all_results:
        category = result['category']
        if category not in category_data:
            category_data[category] = {"total_spend": 0.0, "count": 0}
        category_data[category]["total_spend"] += result['price']
        category_data[category]["count"] += 1

    print("\n" + "="*70)
    print("📊 FINAL CATEGORIZATION SUMMARY")
    print("="*70)
    print(f"\n✅ Successfully categorized {len(all_results)} products from {merchant_name}")
    print(f"\n💰 Spending by Category:")
    for category in sorted(category_data.keys(), key=lambda c: category_data[c]['total_spend'], reverse=True):
        data_cat = category_data[category]
        print(f"   • {category:20s}: ${data_cat['total_spend']:>8.2f} ({data_cat['count']:2d} items)")

    # Flag low confidence items
    low_confidence = [r for r in all_results if r['ask_user']]
    if low_confidence:
        print(f"\n⚠️  {len(low_confidence)} product(s) flagged for manual review (low confidence)")
    else:
        print(f"\n✅ All products categorized with high confidence!")

    print("\n" + "="*70)
    print("🎯 DEDALUS INTEGRATION DEMO COMPLETE!")
    print("="*70 + "\n")

    return all_results

if __name__ == "__main__":
    asyncio.run(main())
