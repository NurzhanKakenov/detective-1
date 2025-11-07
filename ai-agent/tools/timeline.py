from ..client.qwen_client import QwenClient

def build_timeline(materials: list[dict]) -> str:
    corpus = "\n\n".join(m.get("text","") for m in materials if m.get("text"))[:150_000]
    q = QwenClient()
    return q.chat([
      {"role":"system","content":"Формируй хронологию с датами/временем и пояснениями."},
      {"role":"user","content": f"Построй таймлайн событий с ключевыми моментами.\n\n{corpus}"}
    ])
