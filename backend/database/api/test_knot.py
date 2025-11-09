"""
Test script for Knot API integration
Run this to verify Knot API credentials and connectivity
"""
from knot_client import knot_client

def test_knot_connection():
    """Test basic Knot API connectivity"""
    print("=" * 60)
    print("Testing Knot API Integration")
    print("=" * 60)
    
    # Test 1: List merchants
    print("\n1. Testing List Merchants...")
    merchants = knot_client.list_merchants()
    print(f"   ✓ Found {len(merchants)} merchants")
    if merchants:
        print(f"   Sample merchant: {merchants[0].get('name')} (ID: {merchants[0].get('id')})")
    
    # Test 2: Create session (will fail without valid user, but tests auth)
    print("\n2. Testing Create Session...")
    test_user_id = "test_user_001"
    session = knot_client.create_session(test_user_id, merchant_id=19)  # DoorDash
    if session:
        print(f"   ✓ Session created: {session.get('session_id')[:20]}...")
    else:
        print("   ⚠ Session creation returned None (check credentials)")
    
    # Test 3: Get accounts (will be empty for test user)
    print("\n3. Testing Get Merchant Accounts...")
    accounts = knot_client.get_merchant_accounts(test_user_id)
    print(f"   ✓ Retrieved {len(accounts)} accounts for user")
    
    print("\n" + "=" * 60)
    print("Knot API Integration Test Complete!")
    print("=" * 60)
    
    return {
        "merchants_found": len(merchants),
        "session_created": session is not None,
        "accounts_fetched": True
    }


if __name__ == "__main__":
    try:
        results = test_knot_connection()
        print("\nResults:", results)
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
