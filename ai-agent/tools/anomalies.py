from ..client.qwen_client import QwenClient

def detect_anomalies(materials: list[dict]) -> str:
    corpus = "\n\n".join(m.get("text","") for m in materials)[:120_000]
    q = QwenClient()
    return q.chat([
      {"role":"system","content":"Ищи противоречия, статистические аномалии и подозрительные корреляции."},
      {"role":"user","content": f"Выяви аномалии и странные совпадения с обоснованием.\n\n{corpus}"}
    ])
