#!/usr/bin/env python3
"""
Скрипт для быстрого запуска тестирования Detective Nexus
"""
import subprocess
import sys
import time
import os

def run_command(command, cwd=None):
    """Выполнить команду в указанной директории"""
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def main():
    print("🚀 Detective Nexus - Быстрый тест")
    print("=" * 50)
    
    # Проверяем, что мы в правильной директории
    if not os.path.exists("detective-nexus"):
        print("❌ Директория detective-nexus не найдена!")
        print("Убедитесь, что вы запускаете скрипт из корневой папки проекта.")
        return
    
    backend_dir = "detective-nexus/backend"
    
    print("\n1. Инициализация базы данных...")
    success, stdout, stderr = run_command("python init_db.py", cwd=backend_dir)
    if success:
        print("✅ База данных инициализирована")
    else:
        print(f"❌ Ошибка инициализации БД: {stderr}")
        return
    
    print("\n2. Запуск сервера...")
    print("Сервер будет запущен на http://localhost:8000")
    print("Для остановки нажмите Ctrl+C")
    print("-" * 30)
    
    try:
        # Запускаем сервер
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"
        ], cwd=backend_dir)
    except KeyboardInterrupt:
        print("\n\n✅ Сервер остановлен")

if __name__ == "__main__":
    main()