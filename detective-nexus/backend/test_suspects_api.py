#!/usr/bin/env python3
"""
Тестируем API подозреваемых
"""

import requests

def test_suspects_api():
    try:
        response = requests.get('http://localhost:8000/api/suspects/')
        print(f'Status: {response.status_code}')
        
        if response.status_code == 200:
            data = response.json()
            print(f'Получено подозреваемых: {len(data)}')
            for suspect in data:
                print(f'- {suspect["full_name"]} ({suspect["status"]})')
        else:
            print(f'Ошибка: {response.text}')
            
    except Exception as e:
        print(f'Ошибка: {e}')

if __name__ == '__main__':
    test_suspects_api()