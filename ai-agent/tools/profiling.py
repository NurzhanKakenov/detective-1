from ..client.qwen_client import QwenClient

def group_patterns(materials: list[dict]) -> str:
    corpus = "\n\n".join(m.get("text","") for m in materials)[:120_000]
    q = QwenClient()
    return q.chat([
      {"role":"system","content":"Определи повторяющиеся схемы, роли участников, TTPs (techniques, tactics, procedures)."},
      {"role":"user","content": f"Сделай профилирование группы/схем по материалам.\n\n{corpus}"}
    ])
