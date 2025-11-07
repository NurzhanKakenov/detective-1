from ..client.qwen_client import QwenClient

def search_by_description(desc: str) -> str:
    q = QwenClient()
    return q.chat([
      {"role":"system","content":"Ты спец по розыскной аналитике. Дай ориентировку и предположения мест/связей."},
      {"role":"user","content": f"По описанию составь ориентировку и план поиска:\n{desc}"}
    ])

def image_reasoning(prompt: str, image_urls: list[str]) -> str:
    q = QwenClient()
    return q.vision(prompt, image_urls)
