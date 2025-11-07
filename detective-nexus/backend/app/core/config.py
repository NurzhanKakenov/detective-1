from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./detective_nexus.db"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Discord
    DISCORD_BOT_TOKEN: Optional[str] = None
    DISCORD_GUILD_ID: Optional[str] = None
    
    # AI
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    class Config:
        env_file = ".env"

settings = Settings()