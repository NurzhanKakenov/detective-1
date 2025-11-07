#!/usr/bin/env python3
"""
Простой тест для проверки моделей и базы данных Detective Nexus
"""
from sqlalchemy.orm import sessionmaker
from app.models.database import engine
from app.models.models import User, Case, UserRole, CaseStatus, CasePriority

def test_database():
    """Тест создания записей в базе данных"""
    print("🧪 Тестирование базы данных...")
    
    # Создаем сессию
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Создаем тестового пользователя
        test_user = User(
            discord_id="123456789",
            username="test_detective",
            full_name="Test Detective",
            badge_number="BADGE-001",
            rank=UserRole.DETECTIVE
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print(f"✅ Пользователь создан: {test_user.username} (ID: {test_user.id})")
        
        # Создаем тестовое дело
        test_case = Case(
            case_number="HN-2025-0001",
            title="Тестовое дело",
            description="Описание тестового дела для проверки системы",
            crime_type="theft",
            location="Тестовая локация",
            status=CaseStatus.ACTIVE,
            priority=CasePriority.MEDIUM,
            detective_id=test_user.id
        )
        
        db.add(test_case)
        db.commit()
        db.refresh(test_case)
        
        print(f"✅ Дело создано: {test_case.case_number} - {test_case.title}")
        
        # Проверяем связи
        user_cases = db.query(Case).filter(Case.detective_id == test_user.id).all()
        print(f"✅ У детектива {len(user_cases)} дел")
        
        # Статистика
        total_users = db.query(User).count()
        total_cases = db.query(Case).count()
        active_cases = db.query(Case).filter(Case.status == CaseStatus.ACTIVE).count()
        
        print(f"\n📊 Статистика:")
        print(f"   Пользователей: {total_users}")
        print(f"   Всего дел: {total_cases}")
        print(f"   Активных дел: {active_cases}")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False
    finally:
        db.close()

def main():
    print("🚀 Detective Nexus - Тест базы данных")
    print("=" * 50)
    
    if test_database():
        print("\n🎉 Все тесты прошли успешно!")
        print("База данных работает корректно.")
    else:
        print("\n💥 Тесты не прошли!")

if __name__ == "__main__":
    main()