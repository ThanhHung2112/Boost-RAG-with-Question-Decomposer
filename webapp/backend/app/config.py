from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: Optional[str] = "RAG API"
    DEBUG: Optional[bool] = True
    NEO4J_URI: str = "neo4j://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "12qwaszx"
    DEVICE: Optional[str] = "cpu"
    DECOMPOSER_MODEL: str = "./app/models/question_decomposer"
    COLBERT_MODEL: str = "./app/models/colbert/"

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
