from ..client.qwen_client import QwenClient

def interview_questions(materials: list[dict], role: str="подозреваемый") -> str:
    corpus = "\n\n".join(m.get("text","") for m in materials)[:100_000]
    q = QwenClient()
    return q.chat([
      {"role":"system","content":"Составляй вопросы по методу funneling; отмечай, каких фактов не хватает."},
      {"role":"user","content": f"Сформируй вопросы для допроса ({role}). В конце — список недостающей информации.\n\n{corpus}"}
    ])
