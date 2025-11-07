from ..client.qwen_client import QwenClient

def next_steps(materials: list[dict]) -> str:
    corpus = "\n\n".join(m.get("text","") for m in materials)[:120_000]
    q = QwenClient()
    return q.chat([
      {"role":"system","content":"Ты следователь-методист. Дай последовательные actionable-шаги, укажи риски и какие данные собрать."},
      {"role":"user","content": f"На основе материалов предложи дальнейшие шаги расследования, укажи риски и недостающие данные.\n\n{corpus}"}
    ])
