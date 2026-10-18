from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    APP_ENV: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    JWT_SECRET: str
    
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    
    MODEL_CACHE_DIR: str = "./models_cache"
    WHISPER_MODEL: str = "small"
    SENTENCE_MODEL: str = "all-MiniLM-L6-v2"
    SPACY_MODEL: str = "en_core_web_sm"
    GRAMMAR_MODEL: str = "prithivida/grammar_error_correcter_v1"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
