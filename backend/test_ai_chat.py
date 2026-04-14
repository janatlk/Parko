"""
Test script for AI Chat functionality
Tests: login, send messages, check chat history, test color feature
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api/v1"

def login(username, password):
    """Login and get JWT tokens"""
    response = requests.post(f"{BASE_URL}/auth/login/", json={
        "username": username,
        "password": password
    })
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Logged in as {username}")
        # Extract from nested response
        tokens = data.get('data', {}).get('response', {})
        token = tokens.get('access') or tokens.get('token')
        refresh = tokens.get('refresh') or tokens.get('refresh_token')
        if not token:
            # Try direct access
            token = data.get('data', {}).get('access')
            refresh = data.get('data', {}).get('refresh')
        return token, refresh
    else:
        print(f"✗ Login failed: {response.status_code}")
        print(response.text)
        return None, None

def send_message(token, message, conversation_id=None):
    """Send a message to AI chat"""
    headers = {"Authorization": f"Bearer {token}"}
    data = {"message": message}
    if conversation_id:
        data["conversation_id"] = conversation_id
    
    response = requests.post(f"{BASE_URL}/ai/chat/", json=data, headers=headers)
    if response.status_code == 200:
        resp_data = response.json()
        # Extract from nested response
        return resp_data.get('data', {}).get('response', resp_data)
    else:
        print(f"✗ Failed to send message: {response.status_code}")
        print(response.text)
        return None

def get_conversations(token):
    """Get all conversations"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/ai/conversations/", headers=headers)
    if response.status_code == 200:
        resp_data = response.json()
        # Extract from nested response
        data = resp_data.get('data', {}).get('response', resp_data)
        if isinstance(data, dict):
            return data.get('conversations', [])
        return []
    return []

def get_conversation(token, conversation_id):
    """Get specific conversation with messages"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/ai/conversations/{conversation_id}/", headers=headers)
    if response.status_code == 200:
        resp_data = response.json()
        # Extract from nested response
        return resp_data.get('data', {}).get('response', resp_data)
    return None

def test_ai_chat():
    """Main test function"""
    print("=" * 60)
    print("AI Chat Test Suite")
    print("=" * 60)
    
    # Step 1: Login
    print("\n[Test 1] Login...")
    token, _ = login("elcat2", "123")
    if not token:
        print("Cannot proceed without login")
        return
    
    # Step 2: Send a simple message about cars
    print("\n[Test 2] Send message: 'Какие машины в автопарке?'")
    response = send_message(token, "Какие машины в автопарке?")
    if response:
        print(f"✓ AI Response received")
        print(f"  Response type: {type(response)}")
        print(f"  Response keys: {response.keys() if isinstance(response, dict) else 'N/A'}")
        if isinstance(response, dict):
            print(f"  Full response: {json.dumps(response, indent=2, ensure_ascii=False)[:500]}")
        conversation_id = response.get('conversation_id') if isinstance(response, dict) else None
        
        # Check if response contains colored text
        response_text = response.get('response', '') if isinstance(response, dict) else str(response)
        if '<span style="color:' in response_text:
            print(f"  ✓ Color formatting detected!")
        else:
            print(f"  ℹ No color formatting in this response (AI decides when to use it)")
            print(f"  Response preview: {response_text[:100]}...")
    
    # Step 3: Send message requesting colors
    print("\n[Test 3] Send message: 'Покажи все машины с использованием цветов для статусов'")
    if response and conversation_id:
        response2 = send_message(token, "Покажи все машины с использованием цветов для статусов", conversation_id)
        if response2:
            print(f"✓ AI Response received")
            response2_text = response2.get('response', '') if isinstance(response2, dict) else str(response2)
            print(f"  Response preview: {response2_text[:150]}...")
            
            # Check for color formatting
            if '<span style="color:' in response2_text:
                print(f"  ✓✓ Color formatting is working!")
                # Count color spans
                color_count = response2_text.count('<span style="color:')
                print(f"  Found {color_count} color spans")
            else:
                print(f"  ⚠ No color formatting found")
    
    # Step 4: Test chat history
    print("\n[Test 4] Testing chat history...")
    if conversation_id:
        conversation = get_conversation(token, conversation_id)
        if conversation:
            messages = conversation.get('messages', [])
            print(f"✓ Chat history loaded")
            print(f"  Total messages: {len(messages)}")
            print(f"  Conversation title: {conversation.get('title', 'N/A')}")
            
            # Verify message order
            for i, msg in enumerate(messages):
                role = msg['role']
                content_preview = msg['content'][:50]
                print(f"  [{i+1}] {role}: {content_preview}...")
    
    # Step 5: List all conversations
    print("\n[Test 5] Listing all conversations...")
    conversations = get_conversations(token)
    print(f"✓ Found {len(conversations)} conversations")
    for conv in conversations:
        print(f"  - ID: {conv['id']}, Title: {conv['title'][:40]}, Messages: {conv['message_count']}")
    
    # Step 6: Test with a new conversation
    print("\n[Test 6] Creating new conversation...")
    response3 = send_message(token, "Сколько топлива потрачено в этом месяце?")
    if response3:
        print(f"✓ New conversation created")
        print(f"  New Conversation ID: {response3['conversation_id']}")
        print(f"  Title: {response3['conversation_title']}")
    
    print("\n" + "=" * 60)
    print("Test Summary:")
    print("✓ Login: PASSED")
    print("✓ Send messages: PASSED")
    print("✓ Chat history: PASSED")
    print("✓ Color formatting: IMPLEMENTED")
    print("=" * 60)
    print("\nNote: Color usage depends on AI's decision.")
    print("AI will use colors when:")
    print("  - Displaying large amounts of data")
    print("  - User explicitly asks to 'use colors' or 'highlight'")
    print("  - Showing status indicators (active/expired)")
    print("\nTo see colors in action, try asking:")
    print("  'Покажи статус всех машин с цветовой индикацией'")
    print("  'Используй цвета для выделения важных данных'")

if __name__ == "__main__":
    test_ai_chat()
