from ..client.qwen_client import QwenClient

def final_case(materials: list[dict]) -> str:
    corpus = "\n\n".join(m.get("text","") for m in materials)[:120_000]
    q = QwenClient()
    return q.chat([
      {"role":"system","content":"Собери финальный кейс: вводная, факты, доказательства, связи, выводы; указать, откуда взято."},
      {"role":"user","content": f"Сформируй финальный отчёт со ссылками на источники (файлы/страницы/фото).\n\n{corpus}"}
    ])
