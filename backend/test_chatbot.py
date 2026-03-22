"""
Simple test script for the Chatbot API
Run this after starting the backend server
"""
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    """Test the health endpoint"""
    print("=" * 50)
    print("Testing Health Endpoint...")
    print("=" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/api/chatbot/health", timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response:\n{json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                print("✅ Health check passed!")
                return True
            else:
                print(f"⚠️ Chatbot status: {data.get('status')}")
                return False
        else:
            print(f"❌ Health check failed with status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Is the server running?")
        print("   Start it with: python main.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_chat(query: str):
    """Test the chat endpoint"""
    print("\n" + "=" * 50)
    print(f"Testing Chat Endpoint...")
    print(f"Query: {query}")
    print("=" * 50)
    
    try:
        chat_data = {
            "query": query
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chatbot/chat",
            json=chat_data,
            timeout=35  # Slightly more than the 30s timeout
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Response received!")
            print(f"\nQuery: {result.get('query')}")
            print(f"\nResponse:\n{result.get('response')}")
            print(f"\nContext Used: {result.get('context_used')} chunks")
            print(f"Processing Time: {result.get('processing_time', 'N/A')} seconds")
            print(f"Request ID: {result.get('request_id')}")
            return True
        else:
            print(f"❌ Chat failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out (took longer than 30 seconds)")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Is the server running?")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("\n🤖 ClimaCrop Chatbot Test Script")
    print("=" * 50)
    
    # Test 1: Health check
    health_ok = test_health()
    
    if not health_ok:
        print("\n⚠️ Health check failed. Please check:")
        print("   1. Backend server is running (python main.py)")
        print("   2. All dependencies are installed (pip install -r requirements.txt)")
        print("   3. Check backend logs for errors")
        sys.exit(1)
    
    # Test 2: Simple query
    print("\n" + "=" * 50)
    print("Running Test Queries...")
    print("=" * 50)
    
    test_queries = [
        "What crops are available for summer season?",
        "Tell me about cotton farming in Bahawalnagar",
        "What is the recommended fertilizer for rice?"
    ]
    
    success_count = 0
    for i, query in enumerate(test_queries, 1):
        print(f"\n--- Test Query {i}/{len(test_queries)} ---")
        if test_chat(query):
            success_count += 1
        print()  # Add spacing
    
    # Summary
    print("=" * 50)
    print("Test Summary")
    print("=" * 50)
    print(f"Health Check: {'✅ PASSED' if health_ok else '❌ FAILED'}")
    print(f"Chat Tests: {success_count}/{len(test_queries)} passed")
    
    if health_ok and success_count == len(test_queries):
        print("\n🎉 All tests passed!")
    elif health_ok:
        print(f"\n⚠️ {len(test_queries) - success_count} test(s) failed")
    else:
        print("\n❌ Tests failed - check backend status first")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
        sys.exit(0)
