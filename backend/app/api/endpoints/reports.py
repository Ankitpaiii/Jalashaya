from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse, JSONResponse, Response
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.repositories.lake_repository import LakeRepository
from backend.app.services.reporting.report_generator import report_generator
from backend.app.services.comparison.change_engine import change_engine

router = APIRouter(prefix="/lakes", tags=["Reports & Evidence"])

@router.get("/{lake_id}/report.html", response_class=HTMLResponse)
def get_html_report(
    lake_id: str,
    older_obs_id: Optional[str] = Query(None),
    newer_obs_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    repo = LakeRepository(db)
    lake = repo.get_lake_by_id(lake_id)
    if not lake:
        raise HTTPException(status_code=404, detail="Lake not found")

    observations = repo.get_lake_observations(lake_id)
    if len(observations) < 2:
        raise HTTPException(status_code=400, detail="Insufficient observation history for change report")

    obs_old = repo.get_observation_by_id(older_obs_id) if older_obs_id else observations[0]
    obs_new = repo.get_observation_by_id(newer_obs_id) if newer_obs_id else observations[-1]

    comparison = change_engine.compare_observations(
        lake_name=lake.official_name,
        lake_reference_boundary=lake.boundary_geometry,
        older_obs={
            "observation_date": str(obs_old.observation_date),
            "satellite_source": obs_old.satellite_source,
            "detected_area_hectares": obs_old.detection_result.detected_area_hectares,
            "water_extent_geometry": obs_old.detection_result.water_extent_geometry
        },
        newer_obs={
            "observation_date": str(obs_new.observation_date),
            "satellite_source": obs_new.satellite_source,
            "detected_area_hectares": obs_new.detection_result.detected_area_hectares,
            "water_extent_geometry": obs_new.detection_result.water_extent_geometry
        }
    )

    lake_info = {
        "id": lake.id,
        "official_name": lake.official_name,
        "area_hectares": lake.area_hectares,
        "custodian": lake.custodian,
        "zone": lake.administrative_zone,
        "latitude": lake.latitude,
        "longitude": lake.longitude,
        "boundary_geometry": lake.boundary_geometry,
    }

    html = report_generator.generate_html_report(comparison, lake_info)
    return HTMLResponse(content=html)

@router.get("/{lake_id}/report.geojson")
def get_geojson_report(
    lake_id: str,
    older_obs_id: Optional[str] = Query(None),
    newer_obs_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    repo = LakeRepository(db)
    lake = repo.get_lake_by_id(lake_id)
    if not lake:
        raise HTTPException(status_code=404, detail="Lake not found")

    observations = repo.get_lake_observations(lake_id)
    obs_old = repo.get_observation_by_id(older_obs_id) if older_obs_id else observations[0]
    obs_new = repo.get_observation_by_id(newer_obs_id) if newer_obs_id else observations[-1]

    comparison = change_engine.compare_observations(
        lake_name=lake.official_name,
        lake_reference_boundary=lake.boundary_geometry,
        older_obs={
            "observation_date": str(obs_old.observation_date),
            "satellite_source": obs_old.satellite_source,
            "detected_area_hectares": obs_old.detection_result.detected_area_hectares,
            "water_extent_geometry": obs_old.detection_result.water_extent_geometry
        },
        newer_obs={
            "observation_date": str(obs_new.observation_date),
            "satellite_source": obs_new.satellite_source,
            "detected_area_hectares": obs_new.detection_result.detected_area_hectares,
            "water_extent_geometry": obs_new.detection_result.water_extent_geometry
        }
    )

    geojson_data = report_generator.generate_geojson(comparison)
    return JSONResponse(content=geojson_data)

@router.get("/{lake_id}/observations.csv")
def get_csv_observations(lake_id: str, db: Session = Depends(get_db)):
    repo = LakeRepository(db)
    lake = repo.get_lake_by_id(lake_id)
    if not lake:
        raise HTTPException(status_code=404, detail="Lake not found")

    observations = repo.get_lake_observations(lake_id)
    obs_list = []
    for obs in observations:
        det = obs.detection_result
        obs_list.append({
            "id": obs.id,
            "observation_date": str(obs.observation_date),
            "satellite_source": obs.satellite_source,
            "sensor": obs.sensor,
            "cloud_coverage_pct": obs.cloud_coverage_pct,
            "valid_pixel_pct": obs.valid_pixel_pct,
            "detected_area_hectares": det.detected_area_hectares if det else None,
            "confidence_score": det.confidence_score if det else None
        })

    csv_data = report_generator.generate_csv(obs_list)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={lake_id}_observations.csv"}
    )
