# Тестирование Detective Nexus

## Быстрый старт

### 1. Установка зависимостей

```bash
cd detective-nexus/backend
pip install -r requirements.txt
```

### 2. Инициализация базы данных

```bash
python init_db.py
```

### 3. Запуск сервера

```bash
uvicorn app.main:app --reload
```

Сервер будет доступен по адресу: http://localhost:8000

### 4. Тестирование API

В новом терминале:

```bash
cd detective-nexus/backend
python test_api.py
```

## Ручное тестирование

### Проверка endpoints

1. **Health check**: http://localhost:8000/health
2. **API документация**: http://localhost:8000/docs
3. **Создание пользователя**: POST http://localhost:8000/api/users/
4. **Создание дела**: POST http://localhost:8000/api/cases/
5. **Аналитика**: GET http://localhost:8000/api/analytics/overview

### Тестовые данные

**Создание пользователя:**
```json
{
  "discord_id": "123456789",
  "username": "test_detective",
  "full_name": "Test Detective",
  "badge_number": "BADGE-001"
}
```

**Создание дела:**
```json
{
  "title": "Тестовое дело",
  "description": "Описание тестового дела",
  "crime_type": "theft",
  "location": "Тестовая локация",
  "detective_id": 1
}
```

## Frontend тестирование

```bash
cd detective-nexus/frontend
npm install
npm run dev
```

Frontend будет доступен по адресу: http://localhost:3000

## Возможные проблемы

1. **Ошибка импорта pydantic_settings**: Обновите pydantic до версии 2.x
2. **Ошибка SQLite**: Убедитесь, что файл detective_nexus.db создался в папке backend
3. **CORS ошибки**: Проверьте, что backend запущен на порту 8000