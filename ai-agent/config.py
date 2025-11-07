from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseModel):
    client_mode: str = os.getenv("QWEN_CLIENT_MODE", "openai")
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    openai_base_url: str | None = os.getenv("OPENAI_BASE_URL")
    qwen_model: str = os.getenv("QWEN_MODEL", "qwen2.5-7b-instruct")
    dashscope_api_key: str | None = os.getenv("DASHSCOPE_API_KEY")
    qwen_vl_model: str = os.getenv("QWEN_VL_MODEL", "qwen-vl-max")
    qwen_asr_model: str = os.getenv("QWEN_ASR_MODEL", "qwen3-audio-asr")
    uploads_dir: str = os.getenv("UPLOADS_DIR", "ai-agent/storage/uploads")
    outputs_dir: str = os.getenv("OUTPUTS_DIR", "ai-agent/storage/outputs")
    index_dir: str = os.getenv("INDEX_DIR", "ai-agent/storage/index")

settings = Settings()
