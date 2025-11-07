from ..client.qwen_client import QwenClient

def quick_case_brief(materials: list[dict]) -> str:
    text_chunks = [m.get("text") for m in materials if m.get("text")]
    corpus = "\n\n".join(text_chunks)[:150_000]
    q = QwenClient()
    prompt = ("Суммируй материалы по делу в 10–15 маркеров: факты, участники, объекты, номера, адреса, источники. "
              "Отдельно: спорные моменты и пробелы данных.")
    return q.chat([
        {"role":"system","content":"Ты криминалист-аналитик. Пиши чётко и структурно."},
        {"role":"user","content": f"{prompt}\n\n=== МАТЕРИАЛЫ ===\n{corpus}"}
    ])
