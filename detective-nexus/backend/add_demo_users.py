#!/usr/bin/env python3
"""
Добавляем демо-пользователей для тестирования админки
"""

import sqlite3
from datetime import datetime, timedelta
import random

def add_demo_users():
    conn = sqlite3.connect('detective_nexus.db')
    cursor = conn.cursor()
    
    # Демо-пользователи
    demo_users = [
        {
            'discord_id': 'demo_captain_001',
            'username': 'captain_smith',
            'full_name': 'Смит Джон Александрович',
            'rank': 'captain',
            'department': 'Отдел по расследованию убийств',
            'badge_number': '10001',
            'hire_date': '2020-01-15',
            'is_active': True
        },
        {
            'discord_id': 'demo_lieutenant_001',
            'username': 'lieutenant_jones',
            'full_name': 'Джонс Мария Петровна',
            'rank': 'lieutenant',
            'department': 'Отдел по борьбе с наркотиками',
            'badge_number': '20001',
            'hire_date': '2021-03-10',
            'is_active': True
        },
        {
            'discord_id': 'demo_senior_001',
            'username': 'senior_brown',
            'full_name': 'Браун Роберт Иванович',
            'rank': 'senior_detective',
            'department': 'Отдел по борьбе с мошенничеством',
            'badge_number': '30001',
            'hire_date': '2022-06-20',
            'is_active': True
        },
        {
            'discord_id': 'demo_senior_002',
            'username': 'senior_wilson',
            'full_name': 'Уилсон Анна Сергеевна',
            'rank': 'senior_detective',
            'department': 'Отдел по кибер-преступлениям',
            'badge_number': '30002',
            'hire_date': '2022-08-15',
            'is_active': True
        },
        {
            'discord_id': 'demo_detective_001',
            'username': 'detective_davis',
            'full_name': 'Дэвис Майкл Владимирович',
            'rank': 'detective',
            'department': 'Отдел по расследованию убийств',
            'badge_number': '40001',
            'hire_date': '2023-02-01',
            'is_active': True
        },
        {
            'discord_id': 'demo_detective_002',
            'username': 'detective_garcia',
            'full_name': 'Гарсия Елена Николаевна',
            'rank': 'detective',
            'department': 'Отдел по борьбе с наркотиками',
            'badge_number': '40002',
            'hire_date': '2023-05-10',
            'is_active': True
        },
        {
            'discord_id': 'demo_detective_inactive',
            'username': 'detective_inactive',
            'full_name': 'Неактивный Детектив Тестович',
            'rank': 'detective',
            'department': 'Отдел по борьбе с мошенничеством',
            'badge_number': '99999',
            'hire_date': '2023-01-01',
            'is_active': False
        }
    ]
    
    # Проверяем, существуют ли уже пользователи
    for user in demo_users:
        cursor.execute('SELECT id FROM users WHERE username = ?', (user['username'],))
        if cursor.fetchone():
            print(f"Пользователь {user['username']} уже существует, пропускаем...")
            continue
        
        # Добавляем пользователя
        cursor.execute('''
            INSERT INTO users (discord_id, username, full_name, rank, department, badge_number, hire_date, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user['discord_id'],
            user['username'],
            user['full_name'],
            user['rank'],
            user['department'],
            user['badge_number'],
            user['hire_date'],
            user['is_active'],
            datetime.now().isoformat()
        ))
        
        print(f"✅ Добавлен пользователь: {user['full_name']} ({user['rank']})")
    
    conn.commit()
    conn.close()
    
    print("\n🎉 Демо-пользователи успешно добавлены!")
    print("\nТеперь в админке будет больше данных для тестирования:")
    print("- Капитан Смит (captain)")
    print("- Лейтенант Джонс (lieutenant)")
    print("- 2 старших детектива (senior_detective)")
    print("- 2 обычных детектива (detective)")
    print("- 1 неактивный пользователь")

if __name__ == '__main__':
    add_demo_users()