#!/usr/bin/env python3
"""
Тестируем создание пользователя через API
"""

import requests
import json

def test_create_user():
    url = 'http://localhost:8000/api/users/'
    
    # Тестовые данные пользователя
    user_data = {
        "discord_id": "test_discord_123456",
        "username": "test_new_detective",
        "full_name": "Тестовый Новый Детектив",
        "email": "test@example.com",
        "rank": "detective",
        "department": "Отдел по расследованию убийств",
        "badge_number": "TEST001"
    }
    
    try:
        print("Отправляем запрос на создание пользователя...")
        print(f"URL: {url}")
        print(f"Данные: {json.dumps(user_data, indent=2, ensure_ascii=False)}")
        
        response = requests.post(url, json=user_data)
        
        print(f"\nОтвет сервера:")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Пользователь успешно создан!")
            print(f"ID: {result.get('id')}")
            print(f"Username: {result.get('username')}")
            print(f"Full name: {result.get('full_name')}")
        else:
            print("❌ Ошибка создания пользователя")
            print(f"Ответ: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print('❌ Не удалось подключиться к API. Убедитесь, что backend запущен на порту 8000')
    except Exception as e:
        print(f'❌ Ошибка: {e}')

if __name__ == '__main__':
    test_create_user()