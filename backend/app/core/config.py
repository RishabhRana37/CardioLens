from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "CardioTwin API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Model Targets
    TARGETS: List[str] = ["CAD", "LAD", "LCX", "RCA"]
    
    # Machine Learning Settings
    RANDOM_STATE: int = 42

settings = Settings()
