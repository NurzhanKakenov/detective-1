# ai-agent

Папка автономного ИИ-агента для DETECTIVE NEXUS (Qwen API). **Структуру корня проекта не меняем**.

## Быстрый старт
1) Создай `.env` по `.env.example` (вставь ключи и BASE_URL или `DASHSCOPE_API_KEY`).
2) Установи зависимости: `pip install -r requirements.txt`
3) Сложи материалы в `storage/uploads/` (pdf/docx/txt/jpg/png/mp3/wav/zip).
4) Примеры запуска:
   - `python runtime/run.py --task brief`
   - `python runtime/run.py --task timeline`
   - `python runtime/run.py --task entities`
   - `python runtime/run.py --task similar --query "пример запроса"`
   - `python runtime/run.py --task next`
   - `python runtime/run.py --task questions`
   - `python runtime/run.py --task anomalies`
   - `python runtime/run.py --task search --query "мужчина 30-35, рост 180"`
   - `python runtime/run.py --task vl --query "опиши, что на фото" --images https://.../pic.jpg`
   - `python runtime/run.py --task geo --incidents_json storage/uploads/incidents.json`
   - `python runtime/run.py --task profile`
   - `python runtime/run.py --task dossier`
   - `python runtime/run.py --task asr`

Результаты сохраняются в `storage/outputs/`.
