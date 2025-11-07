from ..client.qwen_client import QwenClient
from pathlib import Path

def transcribe_and_summarize(audio_paths: list[str]) -> str:
    """Заглушка: сюда подключи Qwen Audio / Tingwu ASR для реальной транскрипции."""
    transcripts = []
    for p in audio_paths:
        transcripts.append(f"[TRANSCRIPT PLACEHOLDER for {Path(p).name}]")
    q = QwenClient()
    return q.chat([
      {"role":"system","content":"Ты стенографист-аналитик. Сожми протоколы и выдели ключи/несостыковки."},
      {"role":"user","content": "Суммируй и выдели важные моменты:\n" + "\n\n".join(transcripts)}
    ])
