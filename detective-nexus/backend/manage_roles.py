#!/usr/bin/env python3
"""
Скрипт для управления ролями пользователей в Detective Nexus
"""

import sqlite3
import sys
from typing import List, Tuple

# Доступные звания
AVAILABLE_RANKS = {
    'detective': 'Детектив',
    'senior_detective': 'Старший детектив', 
    'lieutenant': 'Лейтенант',
    'captain': 'Капитан',
    'major': 'Майор',
    'admin': 'Администратор'
}

def get_connection():
    """Получить подключение к базе данных"""
    return sqlite3.connect('detective_nexus.db')

def list_users() -> List[Tuple]:
    """Показать всех пользователей"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, full_name, rank FROM users ORDER BY id')
    users = cursor.fetchall()
    conn.close()
    return users

def update_user_rank(user_id: int, new_rank: str) -> bool:
    """Обновить звание пользователя"""
    if new_rank not in AVAILABLE_RANKS:
        print(f"❌ Неверное звание: {new_rank}")
        print(f"Доступные звания: {', '.join(AVAILABLE_RANKS.keys())}")
        return False
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Проверяем, существует ли пользователь
    cursor.execute('SELECT username, full_name FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    if not user:
        print(f"❌ Пользователь с ID {user_id} не найден")
        conn.close()
        return False
    
    # Обновляем звание
    cursor.execute('UPDATE users SET rank = ? WHERE id = ?', (new_rank, user_id))
    conn.commit()
    conn.close()
    
    print(f"✅ Звание пользователя {user[0]} ({user[1]}) обновлено на: {AVAILABLE_RANKS[new_rank]}")
    return True

def main():
    if len(sys.argv) < 2:
        print("🔧 Управление ролями Detective Nexus")
        print("\nИспользование:")
        print("  python manage_roles.py list                    - показать всех пользователей")
        print("  python manage_roles.py set <user_id> <rank>    - установить звание")
        print("\nДоступные звания:")
        for rank, name in AVAILABLE_RANKS.items():
            print(f"  {rank:<20} - {name}")
        return
    
    command = sys.argv[1]
    
    if command == 'list':
        users = list_users()
        print("\n👥 Пользователи в системе:")
        print("-" * 80)
        print(f"{'ID':<5} {'Username':<20} {'Имя':<25} {'Звание':<20}")
        print("-" * 80)
        for user in users:
            rank_name = AVAILABLE_RANKS.get(user[3], user[3])
            print(f"{user[0]:<5} {user[1]:<20} {user[2]:<25} {rank_name:<20}")
        print("-" * 80)
        
    elif command == 'set':
        if len(sys.argv) != 4:
            print("❌ Неверное количество аргументов")
            print("Использование: python manage_roles.py set <user_id> <rank>")
            return
        
        try:
            user_id = int(sys.argv[2])
            new_rank = sys.argv[3]
            update_user_rank(user_id, new_rank)
        except ValueError:
            print("❌ ID пользователя должен быть числом")
    
    else:
        print(f"❌ Неизвестная команда: {command}")

if __name__ == '__main__':
    main()