#!/usr/bin/env python3
"""
Быстрая утилита для управления ролями
"""

import sqlite3

def set_user_rank(user_id: int, rank: str):
    """Быстро установить звание пользователю"""
    conn = sqlite3.connect('detective_nexus.db')
    cursor = conn.cursor()
    
    # Получаем текущие данные пользователя
    cursor.execute('SELECT username, full_name, rank FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    if not user:
        print(f"❌ Пользователь с ID {user_id} не найден")
        conn.close()
        return
    
    old_rank = user[2]
    
    # Обновляем звание
    cursor.execute('UPDATE users SET rank = ? WHERE id = ?', (rank, user_id))
    conn.commit()
    conn.close()
    
    print(f"✅ Пользователь: {user[1]} ({user[0]})")
    print(f"   Старое звание: {old_rank}")
    print(f"   Новое звание: {rank}")

if __name__ == '__main__':
    print("🚀 Быстрое управление ролями")
    print("=" * 50)
    
    # Показываем текущих пользователей
    conn = sqlite3.connect('detective_nexus.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, full_name, rank FROM users')
    users = cursor.fetchall()
    conn.close()
    
    print("\n👥 Текущие пользователи:")
    for user in users:
        print(f"  {user[0]}: {user[2]} ({user[1]}) - {user[3]}")
    
    print("\n🔧 Доступные команды:")
    print("  detective        - Детектив (базовые права)")
    print("  senior_detective - Старший детектив (отчеты, редактирование)")
    print("  lieutenant       - Лейтенант (управление детективами)")
    print("  captain          - Капитан (админ панель)")
    print("  major            - Майор (полные права)")
    print("  admin            - Администратор (полные права)")
    
    print("\n" + "=" * 50)
    
    # Интерактивное управление
    while True:
        try:
            user_input = input("\nВведите 'ID звание' (например: '1 senior_detective') или 'exit': ").strip()
            
            if user_input.lower() == 'exit':
                break
                
            parts = user_input.split()
            if len(parts) != 2:
                print("❌ Неверный формат. Используйте: ID звание")
                continue
                
            user_id = int(parts[0])
            rank = parts[1]
            
            set_user_rank(user_id, rank)
            
        except ValueError:
            print("❌ ID должен быть числом")
        except KeyboardInterrupt:
            print("\n👋 До свидания!")
            break
        except Exception as e:
            print(f"❌ Ошибка: {e}")