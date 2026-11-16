import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.repositories.lake_repository import LakeRepository
from backend.app.services.sar.sentinel1_service import sentinel1_service
from backend.app.services.sar.rf_classifier import sar_classifier
from backend.app.services.sar.water_extractor import sar_water_extractor
from backend.app.services.sar.encroachment_analyzer import encroachment_analyzer
from backend.app.services.sar.weather_service import weather_service

logger = logging.getLogger("jalashaya.api.sar")
router = APIRouter(prefix="/sar", tags=["Sentinel-1 SAR Research"])

class ClassificationRequest(BaseModel):
    year: int = 2021
    apply_mmu: bool = True

class ComparisonRequest(BaseModel):
    historical_year: int = 2016
    recent_year: int = 2021

@router.get("/{lake_id}/acquisitions")
def get_lake_sar_acquisitions(lake_id: str, db: Session = Depends(get_db)):
    """Returns multi-temporal Sentinel-1 C-band SAR acquisitions (May 2016 – May 2026)."""
    repo = LakeRepository(db)
    lake = repo.get_lake_by_id(lake_id)
    if not lake:
        raise HTTPException(status_code=404, detail="Lake not found")

    acquisitions = sentinel1_service.get_acquisitions_for_lake(lake_id)
    return {
        "lake_id": lake.id,
        "lake_name": lake.official_name,
        "cadastral_area_hectares": lake.area_hectares,
        "constellation": "Copernicus Sentinel-1 (C-SAR)",
        "mode": "Interferometric Wide Swath (IW) GRD",
        "polarizations": ["VV", "VH"],
        "spatial_resolution_meters": 10,
        "total_acquisitions": len(acquisitions),
        "acquisitions": acquisitions
    }

@router.get("/{lake_id}/backscatter/{year}")
def get_backscatter_profile(lake_id: str, year: int, db: Session = Depends(get_db)):
    """Retrieves calibrated VV and VH radar backscatter parameters in decibels (dB)."""
    repo = LakeRepository(db)
    lake = repo.get_lake_by_id(lake_id)
    if not lake:
        raise HTTPException(status_code=404, detail="Lake not found")

    profile = sentinel1_service.get_backscatter_profile(lake_id, year)
    return {
        **profile,
        "official_name": lake.official_name,
        "latitude": lake.latitude,
        "longitude": lake.longitude,
        "radiometric_calibration": "Sigma Nought (dB) = 10 * log10(DN^2 / A_i^2)",
        "speckle_filter": "Enhanced Lee 5x5 Spatial Window"
    }

@router.post("/{lake_id}/classify")
def run_rf_classification(lake_id: str, req: ClassificationRequest, db: Session = Depends(get_db)):
    """
    Executes 3-Class Random Forest Machine Learning Classification.
    Classes:
    - 1: Water (Lake surface, ponds)
    - 2: Settlement (Urban built-up, concrete buildings, roads)
    - 3: Other (Vegetation, agriculture, dry soil)
    """
    repo = LakeRepository(db)
    lake = repo.get_lake_by_id(lake_id)
    if not lake:
        raise HTTPException(status_code=404, detail="Lake not found")

    profile = sentinel1_service.get_backscatter_profile(lake_id, req.year)
    extracted = sar_water_extractor.extract_water_boundary(
        lake.boundary_geometry,
        profile["water_fraction"],
        req.year
    )

    metrics = sar_classifier.train_and_validate()

    return {
        "lake_id": lake.id,
        "lake_name": lake.official_name,
        "year": req.year,
        "satellite": "Sentinel-1 C-SAR IW",
        "algorithm": "Random Forest Classifier (100 Trees, Balanced Weights)",
        "water_area_hectares": extracted["detected_area_hectares"],
        "cadastral_area_hectares": lake.area_hectares,
        "class_fractions": {
            "water": profile["water_fraction"],
            "settlement": profile["settlement_fraction"],
            "other": profile["other_fraction"]
        },
        "extracted_water_geometry": extracted["geometry"],
        "model_validation": {
            "overall_accuracy_pct": metrics["overall_accuracy"],
            "cohen_kappa": metrics["cohen_kappa"],
            "precision_per_class": metrics["precision_per_class"],
            "recall_per_class": metrics["recall_per_class"],
            "f1_per_class": metrics["f1_per_class"],
            "confusion_matrix": metrics["confusion_matrix"],
            "feature_importances": metrics["feature_importances"],
            "validation_method": "Spatially Separated 70/30 Split (Dr. Preethi Balaji Methodology)"
        }
    }

@router.post("/{lake_id}/compare")
def compare_sar_periods(lake_id: str, req: ComparisonRequest, db: Session = Depends(get_db)):
    """
    Compares two Sentinel-1 SAR observation periods.
    Detects persistent water, water loss, water gain, and identifies potential built-up encroachment.
    """
    repo = LakeRepository(db)
    lake = repo.get_lake_by_id(lake_id)
    if not lake:
        raise HTTPException(status_code=404, detail="Lake not found")

    profile_hist = sentinel1_service.get_backscatter_profile(lake_id, req.historical_year)
    profile_recent = sentinel1_service.get_backscatter_profile(lake_id, req.recent_year)

    extracted_hist = sar_water_extractor.extract_water_boundary(
        lake.boundary_geometry, profile_hist["water_fraction"], req.historical_year
    )
    extracted_recent = sar_water_extractor.extract_water_boundary(
        lake.boundary_geometry, profile_recent["water_fraction"], req.recent_year
    )

    result = encroachment_analyzer.analyze_basin_changes(
        lake_name=lake.official_name,
        cadastral_boundary=lake.boundary_geometry,
        historical_water_geom=extracted_hist["geometry"],
        recent_water_geom=extracted_recent["geometry"],
        historical_year=req.historical_year,
        recent_year=req.recent_year,
        settlement_fraction=profile_recent["settlement_fraction"]
    )

    return {
        "lake_id": lake.id,
        "lake_name": lake.official_name,
        **result,
        "methodology_reference": "Mapping changes in Water Bodies of Bengaluru with Sentinel-1 (Preethi Balaji, PhD)"
    }

@router.get("/{lake_id}/weather/{year}")
async def get_lake_weather(lake_id: str, year: int, db: Session = Depends(get_db)):
    """Retrieves Open-Meteo precipitation context for the 30-day window preceding the May pass."""
    repo = LakeRepository(db)
    lake = repo.get_lake_by_id(lake_id)
    if not lake:
        raise HTTPException(status_code=404, detail="Lake not found")

    acquisitions = sentinel1_service.get_acquisitions_for_lake(lake_id)
    match = next((a for a in acquisitions if a["year"] == year), acquisitions[0])

    data = await weather_service.get_rainfall_context(
        lake.latitude, lake.longitude, year, match["acquisition_date"]
    )
    return {
        "lake_id": lake.id,
        "lake_name": lake.official_name,
        **data
    }
