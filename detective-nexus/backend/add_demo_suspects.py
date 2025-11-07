#!/usr/bin/env python3
"""
Добавляем демо-подозреваемых для тестирования системы
"""

import sqlite3
from datetime import datetime, timedelta
import json

def add_demo_suspects():
    conn = sqlite3.connect('detective_nexus.db')
    cursor = conn.cursor()
    
    # Демо-подозреваемые
    demo_suspects = [
        {
            'full_name': 'Иванов Алексей Петрович',
            'aliases': json.dumps(['Лёха', 'Алекс', 'Петрович']),
            'date_of_birth': '1985-03-15',
            'place_of_birth': 'Москва',
            'nationality': 'Российская Федерация',
            'gender': 'Мужской',
            'height': '175 см',
            'weight': '80 кг',
            'eye_color': 'Карие',
            'hair_color': 'Темно-русые',
            'distinguishing_marks': 'Шрам на левой щеке, татуировка орла на правом плече',
            'last_known_address': 'г. Москва, ул. Ленина, д. 15, кв. 42',
            'phone_numbers': json.dumps(['+7-999-123-45-67', '+7-495-987-65-43']),
            'email_addresses': json.dumps(['alex.ivanov@email.com']),
            'criminal_record': 'Кража (2010), Мошенничество (2015)',
            'previous_arrests': json.dumps([
                {'date': '2010-05-20', 'charge': 'Кража', 'outcome': 'Условный срок 2 года'},
                {'date': '2015-08-10', 'charge': 'Мошенничество', 'outcome': '3 года лишения свободы'}
            ]),
            'known_associates': json.dumps(['Петров Сергей Иванович', 'Сидоров Михаил Александрович']),
            'status': 'active',
            'risk_level': 'high',
            'occupation': 'Безработный',
            'education': 'Среднее специальное',
            'notes': 'Склонен к агрессивному поведению. Может быть вооружен.',
            'created_by': 1
        },
        {
            'full_name': 'Петрова Мария Сергеевна',
            'aliases': json.dumps(['Маша', 'Мэри']),
            'date_of_birth': '1992-07-22',
            'place_of_birth': 'Санкт-Петербург',
            'nationality': 'Российская Федерация',
            'gender': 'Женский',
            'height': '165 см',
            'weight': '55 кг',
            'eye_color': 'Голубые',
            'hair_color': 'Блондинка',
            'distinguishing_marks': 'Родинка под правым глазом',
            'last_known_address': 'г. Москва, пр. Мира, д. 88, кв. 15',
            'phone_numbers': json.dumps(['+7-916-555-12-34']),
            'email_addresses': json.dumps(['maria.petrova@mail.ru']),
            'criminal_record': 'Нет судимостей',
            'previous_arrests': json.dumps([]),
            'known_associates': json.dumps(['Иванов Алексей Петрович']),
            'status': 'active',
            'risk_level': 'medium',
            'occupation': 'Продавец-консультант',
            'education': 'Высшее',
            'notes': 'Подозревается в соучастии в мошеннических схемах.',
            'created_by': 1
        },
        {
            'full_name': 'Смирнов Дмитрий Владимирович',
            'aliases': json.dumps(['Дима', 'Димон', 'Владимирович']),
            'date_of_birth': '1978-11-03',
            'place_of_birth': 'Екатеринбург',
            'nationality': 'Российская Федерация',
            'gender': 'Мужской',
            'height': '182 см',
            'weight': '90 кг',
            'eye_color': 'Серые',
            'hair_color': 'Лысый',
            'distinguishing_marks': 'Золотые зубы, татуировка "Мама" на левой руке',
            'last_known_address': 'Адрес неизвестен',
            'phone_numbers': json.dumps([]),
            'email_addresses': json.dumps([]),
            'criminal_record': 'Разбой (2005), Торговля наркотиками (2012)',
            'previous_arrests': json.dumps([
                {'date': '2005-02-14', 'charge': 'Разбой', 'outcome': '5 лет лишения свободы'},
                {'date': '2012-09-30', 'charge': 'Торговля наркотиками', 'outcome': '7 лет лишения свободы'}
            ]),
            'known_associates': json.dumps(['Козлов Андрей Николаевич', 'Волков Игорь Петрович']),
            'status': 'unknown',
            'risk_level': 'extreme',
            'occupation': 'Неизвестно',
            'education': 'Среднее',
            'notes': 'КРАЙНЕ ОПАСЕН! Склонен к насилию. Вооружен и опасен.',
            'created_by': 1
        },
        {
            'full_name': 'Козлова Анна Михайловна',
            'aliases': json.dumps(['Аня', 'Нюта']),
            'date_of_birth': '1995-12-08',
            'place_of_birth': 'Новосибирск',
            'nationality': 'Российская Федерация',
            'gender': 'Женский',
            'height': '170 см',
            'weight': '60 кг',
            'eye_color': 'Зеленые',
            'hair_color': 'Рыжие',
            'distinguishing_marks': 'Пирсинг в носу, татуировка бабочки на запястье',
            'last_known_address': 'г. Москва, ул. Арбат, д. 25, кв. 7',
            'phone_numbers': json.dumps(['+7-903-777-88-99']),
            'email_addresses': json.dumps(['anna.kozlova@gmail.com']),
            'criminal_record': 'Нет судимостей',
            'previous_arrests': json.dumps([]),
            'known_associates': json.dumps([]),
            'status': 'cleared',
            'risk_level': 'low',
            'occupation': 'Студентка',
            'education': 'Неполное высшее',
            'notes': 'Оправдана по делу о краже. Сотрудничает со следствием.',
            'created_by': 1
        },
        {
            'full_name': 'Волков Игорь Петрович',
            'aliases': json.dumps(['Волк', 'Игорёк']),
            'date_of_birth': '1980-04-25',
            'place_of_birth': 'Казань',
            'nationality': 'Российская Федерация',
            'gender': 'Мужской',
            'height': '178 см',
            'weight': '85 кг',
            'eye_color': 'Карие',
            'hair_color': 'Черные',
            'distinguishing_marks': 'Шрам через левую бровь, татуировка волка на спине',
            'last_known_address': 'СИЗО №1',
            'phone_numbers': json.dumps([]),
            'email_addresses': json.dumps([]),
            'criminal_record': 'Грабеж (2008), Вымогательство (2018)',
            'previous_arrests': json.dumps([
                {'date': '2008-06-12', 'charge': 'Грабеж', 'outcome': '4 года лишения свободы'},
                {'date': '2018-11-05', 'charge': 'Вымогательство', 'outcome': 'Условный срок 3 года'}
            ]),
            'known_associates': json.dumps(['Смирнов Дмитрий Владимирович']),
            'status': 'arrested',
            'risk_level': 'high',
            'occupation': 'Охранник',
            'education': 'Среднее',
            'notes': 'Арестован 01.11.2025. Подозревается в организации преступной группы.',
            'created_by': 1
        }
    ]
    
    # Проверяем, существуют ли уже подозреваемые
    cursor.execute('SELECT COUNT(*) FROM suspects')
    existing_count = cursor.fetchone()[0]
    
    if existing_count > 0:
        print(f"В базе уже есть {existing_count} подозреваемых. Пропускаем добавление демо-данных.")
        conn.close()
        return
    
    # Добавляем подозреваемых
    for suspect in demo_suspects:
        cursor.execute('''
            INSERT INTO suspects (
                full_name, aliases, date_of_birth, place_of_birth, nationality, gender,
                height, weight, eye_color, hair_color, distinguishing_marks,
                last_known_address, phone_numbers, email_addresses, criminal_record,
                previous_arrests, known_associates, status, risk_level, occupation,
                education, notes, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            suspect['full_name'],
            suspect['aliases'],
            suspect['date_of_birth'],
            suspect['place_of_birth'],
            suspect['nationality'],
            suspect['gender'],
            suspect['height'],
            suspect['weight'],
            suspect['eye_color'],
            suspect['hair_color'],
            suspect['distinguishing_marks'],
            suspect['last_known_address'],
            suspect['phone_numbers'],
            suspect['email_addresses'],
            suspect['criminal_record'],
            suspect['previous_arrests'],
            suspect['known_associates'],
            suspect['status'],
            suspect['risk_level'],
            suspect['occupation'],
            suspect['education'],
            suspect['notes'],
            suspect['created_by'],
            datetime.now().isoformat(),
            datetime.now().isoformat()
        ))
        
        print(f"✅ Добавлен подозреваемый: {suspect['full_name']} ({suspect['status']})")
    
    conn.commit()
    conn.close()
    
    print(f"\n🎉 Добавлено {len(demo_suspects)} демо-подозреваемых!")
    print("\nТеперь в системе есть:")
    print("- 2 активных подозреваемых")
    print("- 1 арестованный")
    print("- 1 оправданный")
    print("- 1 с неизвестным статусом")
    print("- Разные уровни риска (от низкого до крайнего)")

if __name__ == '__main__':
    add_demo_suspects()