#!/usr/bin/env python3
"""
Простой тест для проверки API Detective Nexus
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Тест health check"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health check: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_create_user():
    """Тест создания пользователя"""
    user_data = {
        "discord_id": "987654321",
        "username": "api_detective",
        "full_name": "API Test Detective",
        "badge_number": "BADGE-002"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/users/", json=user_data)
        print(f"Create user: {response.status_code}")
        if response.status_code == 200:
            user = response.json()
            print(f"Created user: {user['username']} (ID: {user['id']})")
            return user
        else:
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"Create user failed: {e}")
        return None

def test_create_case():
    """Тест создания дела"""
    # Create or obtain a test user to act as detective
    user = test_create_user()
    if not user:
        print("Skipping case creation: could not create/find test user")
        return None
    user_id = user.get('id')

    case_data = {
        "title": "Тестовое дело",
        "description": "Описание тестового дела для проверки API",
        "crime_type": "theft",
        "location": "Тестовая локация",
        "detective_id": user_id
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/cases/", json=case_data)
        print(f"Create case: {response.status_code}")
        if response.status_code == 200:
            case = response.json()
            print(f"Created case: {case['case_number']} - {case['title']}")
            return case
        else:
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"Create case failed: {e}")
        return None

def test_get_analytics():
    """Тест аналитики"""
    try:
        response = requests.get(f"{BASE_URL}/api/analytics/overview")
        print(f"Analytics: {response.status_code}")
        if response.status_code == 200:
            stats = response.json()
            print(f"Stats: {stats}")
            return stats
        else:
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"Analytics failed: {e}")
        return None

def main():
    print("=== Detective Nexus API Test ===\n")
    
    # Тест 1: Health check
    print("1. Testing health endpoint...")
    if not test_health():
        print("❌ Health check failed. Make sure the server is running.")
        return
    print("✅ Health check passed\n")
    
    # Тест 2: Создание пользователя
    print("2. Testing user creation...")
    user = test_create_user()
    if not user:
        print("❌ User creation failed")
        return
    print("✅ User creation passed\n")
    
    # Тест 3: Создание дела
    print("3. Testing case creation...")
    case = test_create_case(user['id'])
    if not case:
        print("❌ Case creation failed")
        return
    print("✅ Case creation passed\n")
    
    # Тест 4: Аналитика
    print("4. Testing analytics...")
    stats = test_get_analytics()
    if not stats:
        print("❌ Analytics failed")
        return
    print("✅ Analytics passed\n")
    
    print("🎉 All tests passed! API is working correctly.")

if __name__ == "__main__":
    main()