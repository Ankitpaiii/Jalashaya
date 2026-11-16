import os
import shutil
import json
from typing import List, Optional, Any, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def get_default_database_url() -> str:
    # Handle Vercel / AWS Lambda serverless read-only filesystem
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        tmp_db = "/tmp/jalashaya.db"
        src_db = os.path.join(ROOT_DIR, "jalashaya.db")
        if not os.path.exists(tmp_db) and os.path.exists(src_db):
            try:
                shutil.copy2(src_db, tmp_db)
            except Exception:
                pass
        if os.path.exists(tmp_db):
            return f"sqlite:///{tmp_db}"

    src_db = os.path.join(ROOT_DIR, "jalashaya.db")
    if os.path.exists(src_db):
        return f"sqlite:///{src_db.replace(os.sep, '/')}"
    return "sqlite:///./jalashaya.db"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "JALASHAYA"
    APP_ENV: str = "development"
    APP_PORT: int = 8000
    APP_SECRET_KEY: str = "jalashaya-production-ready-secret-key-2026"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = Field(default_factory=get_default_database_url)
    DB_ECHO: bool = False

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "https://*.vercel.app"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            if v.strip() == "*":
                return ["*"]
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, set, tuple)):
            return list(v)
        return ["*"]

    # Google Earth Engine
    GEE_ENABLED: bool = False
    GEE_AUTH_MODE: str = "service_account"
    GEE_PROJECT_ID: Optional[str] = None
    GEE_SERVICE_ACCOUNT: Optional[str] = None
    GEE_PRIVATE_KEY: Optional[str] = None
    GEE_KEY_FILE_PATH: Optional[str] = None
    GEE_CLIENT_ID: Optional[str] = None

    # Sentinel Hub / Copernicus / Planet
    SENTINEL_HUB_ENABLED: bool = True
    SENTINEL_HUB_CLIENT_ID: Optional[str] = None
    SENTINEL_HUB_CLIENT_SECRET: Optional[str] = None
    PLANET_API_KEY: Optional[str] = None
    COPERNICUS_API_KEY: Optional[str] = None

    # Data Source URLs
    OPENSTREETMAP_OVERPASS_URL: str = "https://overpass-api.de/api/interpreter"
    BBMP_DATA_SOURCE_URL: str = "https://bbmp.gov.in/lakes"
    JRC_DATA_SOURCE_URL: str = "https://global-surface-water.appspot.com"

    # Storage & Cache
    STORAGE_PROVIDER: str = "local"
    STORAGE_LOCAL_DIR: str = "./data"
    STORAGE_BUCKET: str = "jalashaya-satellite-cache"
    STORAGE_ACCESS_KEY: Optional[str] = None
    STORAGE_SECRET_KEY: Optional[str] = None
    STORAGE_REGION: str = "ap-south-1"
    STORAGE_ENDPOINT: Optional[str] = None

    # Scientific Processing
    NDWI_THRESHOLD: float = 0.0
    MAX_CLOUD_COVERAGE: float = 20.0
    DEFAULT_OBSERVATION_WINDOW_DAYS: int = 30
    ENABLE_SATELLITE_CACHE: bool = True
    CACHE_EXPIRY_HOURS: int = 720
    DATA_PROCESSING_WORKERS: int = 2
    TARGET_PROJECTION_CRS: str = "EPSG:32643"  # UTM Zone 43N (covers Bengaluru: ~77.5°E, 13.0°N)

    # Optional AI Explanations
    ENABLE_AI_EXPLANATIONS: bool = False
    GROQ_API_KEY: Optional[str] = None
    AI_MODEL: str = "llama-3.3-70b-versatile"

settings = Settings()
