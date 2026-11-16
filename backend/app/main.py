import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.repositories.lake_repository import LakeRepository
from backend.app.api.endpoints import lakes, comparisons, restoration, reports, system, predictions, sar, research

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger("jalashaya")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed initial authoritative inventory
    logger.info("Initializing JALASHAYA database schemas...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        repo = LakeRepository(db)
        repo.seed_initial_inventory_if_empty()
        logger.info("Authoritative Bengaluru lake inventory verified and seeded.")
    except Exception as e:
        logger.error(f"Error seeding inventory: {e}")
    finally:
        db.close()

    yield

    # Shutdown
    logger.info("Shutting down JALASHAYA services.")

app = FastAPI(
    title=f"{settings.APP_NAME} — Bengaluru Water Body Digital Twin",
    description="Scientific remote sensing, NDWI water detection, and historical change simulation platform.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Endpoints under /api/v1
api_v1_prefix = "/api/v1"
app.include_router(lakes.router, prefix=api_v1_prefix)
app.include_router(comparisons.router, prefix=api_v1_prefix)
app.include_router(restoration.router, prefix=api_v1_prefix)
app.include_router(reports.router, prefix=api_v1_prefix)
app.include_router(system.router, prefix=api_v1_prefix)
app.include_router(predictions.router, prefix=api_v1_prefix)
app.include_router(sar.router, prefix=api_v1_prefix)
app.include_router(research.router, prefix=api_v1_prefix)

@app.get("/")
def root():
    return {
        "message": "Welcome to JALASHAYA — Bengaluru Water Body Digital Twin API",
        "documentation": "/docs",
        "health": "/api/v1/system/health"
    }
