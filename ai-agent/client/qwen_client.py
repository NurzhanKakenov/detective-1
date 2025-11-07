from __future__ import annotations
from typing import List, Dict, Any
from ..config import settings

class QwenClient:
    """Единый клиент Qwen: OpenAI-совместимый или нативный dashscope."""
    def __init__(self):
        mode = settings.client_mode.lower()
        if mode == "openai":
            from openai import OpenAI
            self.client = OpenAI(api_key=settings.openai_api_key, base_url=settings.openai_base_url)
            self.mode = "openai"
        elif mode == "dashscope":
            import dashscope
            dashscope.api_key = settings.dashscope_api_key
            self.ds = dashscope
            self.mode = "dashscope"
        else:
            raise ValueError("Unsupported QWEN_CLIENT_MODE")

    def chat(self, messages: List[Dict[str, Any]], model: str | None = None) -> str:
        model = model or settings.qwen_model
        if self.mode == "openai":
            resp = self.client.chat.completions.create(model=model, messages=messages)
            return resp.choices[0].message.content
        else:
            from dashscope import Generation
            resp = Generation.call(model=model, input={"messages": messages})
            out = resp.output
            if isinstance(out, dict) and "text" in out:
                return out["text"]
            return str(out)

    def vision(self, prompt: str, image_urls: List[str] | None = None, model: str | None = None) -> str:
        model = model or settings.qwen_vl_model
        if self.mode == "openai":
            msgs = [{"role": "user", "content": [{"type":"text","text": prompt}]}]
            if image_urls:
                msgs[0]["content"].extend([{ "type":"image_url", "image_url": {"url": u}} for u in image_urls])
            resp = self.client.chat.completions.create(model=model, messages=msgs)
            return resp.choices[0].message.content
        else:
            from dashscope import MultiModalConversation
            content = [{"role":"user","content":[{"text":prompt}]}]
            if image_urls:
                content[0]["content"].extend([{ "image_url": u } for u in image_urls])
            resp = MultiModalConversation.call(model=model, messages=content)
            return resp.output.get("text", str(resp.output))

    def embed(self, texts: List[str], model: str = "text-embedding-v2") -> list[list[float]]:
        if self.mode == "openai":
            resp = self.client.embeddings.create(model=model, input=texts)
            return [d.embedding for d in resp.data]
        else:
            from dashscope import Embedding
            resp = Embedding.call(model=model, input=texts)
            return [item["embedding"] for item in resp["output"]["embeddings"]]
