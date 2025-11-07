#!/usr/bin/env python3
"""
Инициализация базы данных для Detective Nexus
"""
from sqlalchemy import create_engine
from app.models.database import Base
from app.models.models import *
from app.core.config import settings

def init_database():
    """Создание всех таблиц в базе данных"""
    print("Инициализация базы данных...")
    
    # Создаем движок базы данных
    engine = create_engine(settings.DATABASE_URL)
    
    # Создаем все таблицы
    Base.metadata.create_all(bind=engine)
    
    print("✅ База данных успешно инициализирована!")
    print(f"Файл базы данных: {settings.DATABASE_URL}")

if __name__ == "__main__":
    init_database()