#!/usr/bin/env python3
"""
Тестируем API пользователей
"""

import requests
import json

def test_users_api():
    try:
        response = requests.get('http://localhost:8000/api/users/')
        print(f'Status: {response.status_code}')
        
        if response.status_code == 200:
            users = response.json()
            print(f'API вернул {len(users)} пользователей:')
            print('-' * 60)
            
            for user in users:
                print(f'ID: {user.get("id", "N/A")}')
                print(f'Name: {user.get("full_name", "N/A")}')
                print(f'Username: {user.get("username", "N/A")}')
                print(f'Rank: {user.get("rank", "N/A")}')
                print(f'Active: {user.get("is_active", "N/A")}')
                print('-' * 60)
        else:
            print(f'Ошибка API: {response.status_code}')
            print(f'Ответ: {response.text}')
            
    except requests.exceptions.ConnectionError:
        print('❌ Не удалось подключиться к API. Убедитесь, что backend запущен на порту 8000')
    except Exception as e:
        print(f'❌ Ошибка: {e}')

if __name__ == '__main__':
    test_users_api()