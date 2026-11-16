import logging
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.repositories.lake_repository import LakeRepository
from backend.app.services.sar.research_lab_service import research_lab_service
from backend.app.services.sar.rf_classifier import sar_classifier

logger = logging.getLogger("jalashaya.api.research")
router = APIRouter(prefix="/research", tags=["Research Lab & Scientific Framework"])

@router.get("/experiments")
def get_scientific_experiments(lake_id: str = "lake-bellandur"):
    """
    Returns the 7 core scientific remote sensing experiments specified in the
    JALASHAYA Master Engineering Framework based on Preethi Balaji, PhD's research.
    """
    experiments = research_lab_service.run_all_experiments(lake_id)
    return {
        "framework_title": "JALASHAYA Scientific Research Lab",
        "reference_study": "Mapping changes in Water Bodies of Bengaluru with Sentinel-1 (Preethi Balaji, PhD, 2022)",
        "total_experiments": len(experiments),
        "target_lake": lake_id,
        "experiments": experiments
    }

@router.get("/model-metrics")
def get_rf_model_metrics():
    """Returns real-time validation metrics calculated on 30% held-out test data."""
    metrics = sar_classifier.train_and_validate()
    return {
        "algorithm": "Random Forest Classifier (Scikit-Learn)",
        "n_estimators": 100,
        "max_depth": 12,
        "criterion": "Gini Impurity",
        "validation_strategy": "Spatially Separated 70/30 Stratified Split",
        **metrics
    }

@router.get("/karnataka-overview")
def get_karnataka_overview(db: Session = Depends(get_db)):
    """Provides high-level Karnataka state and district-level water monitoring statistics."""
    repo = LakeRepository(db)
    lakes = repo.get_all_lakes()

    # Group lakes by administrative zone / district
    district_stats: Dict[str, Dict[str, Any]] = {}
    for lake in lakes:
        dist = lake.administrative_zone or "Bengaluru Urban"
        if dist not in district_stats:
            district_stats[dist] = {
                "district_name": dist,
                "total_lakes": 0,
                "total_cadastral_area_ha": 0.0,
                "encroached_lakes": 0,
                "intrusion_free_lakes": 0
            }
        district_stats[dist]["total_lakes"] += 1
        district_stats[dist]["total_cadastral_area_ha"] += lake.area_hectares
        if "Encroached" in lake.encroachment_status:
            district_stats[dist]["encroached_lakes"] += 1
        else:
            district_stats[dist]["intrusion_free_lakes"] += 1

    for d in district_stats.values():
        d["total_cadastral_area_ha"] = round(d["total_cadastral_area_ha"], 1)

    return {
        "state": "Karnataka",
        "total_monitored_lakes": len(lakes),
        "total_cadastral_basin_ha": round(sum(l.area_hectares for l in lakes), 1),
        "primary_satellite": "Sentinel-1 C-band SAR (10m)",
        "secondary_satellite": "Sentinel-2 MSI Level-2A (10m)",
        "districts_count": len(district_stats),
        "districts": list(district_stats.values())
    }

@router.get("/provenance")
def get_data_provenance():
    """Provides traceable scientific data provenance for all integrated sensors."""
    return {
        "sensors": [
            {
                "name": "Copernicus Sentinel-1 (C-SAR)",
                "constellation": "ESA / European Commission",
                "collection": "COPERNICUS/S1_GRD",
                "wavelength": "5.6 cm (C-band, 5.405 GHz)",
                "resolution": "10 meters",
                "polarizations": "VV + VH",
                "penetration": "All-weather, cloud-penetrating, day and night"
            },
            {
                "name": "Copernicus Sentinel-2 (MSI)",
                "constellation": "ESA / European Commission",
                "collection": "COPERNICUS/S2_SR_HARMONIZED",
                "bands": "Band 3 (Green 560nm), Band 8 (NIR 842nm)",
                "resolution": "10 meters",
                "index": "Normalized Difference Water Index (NDWI)"
            },
            {
                "name": "Open-Meteo ERA5 Climatological Archive",
                "endpoint": "https://archive-api.open-meteo.com/v1/archive",
                "parameters": "Daily precipitation (mm), 30d accumulation",
                "purpose": "Distinguishing climate-induced drought from urban encroachment"
            }
        ]
    }
