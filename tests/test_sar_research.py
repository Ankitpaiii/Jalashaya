import pytest
import numpy as np
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.sar.sar_preprocessor import sar_preprocessor
from backend.app.services.sar.rf_classifier import sar_classifier
from backend.app.services.sar.sentinel1_service import sentinel1_service
from backend.app.services.sar.water_extractor import sar_water_extractor
from backend.app.services.sar.encroachment_analyzer import encroachment_analyzer
from backend.app.services.sar.research_lab_service import research_lab_service

client = TestClient(app)

def test_sar_preprocessor_db_conversion():
    linear = np.array([0.01, 0.1, 1.0])
    db = sar_preprocessor.linear_to_db(linear)
    assert np.allclose(db, [-20.0, -10.0, 0.0])

    recon = sar_preprocessor.db_to_linear(db)
    assert np.allclose(linear, recon)

def test_sar_preprocessor_lee_filter():
    img = np.random.normal(-15.0, 4.0, (20, 20))
    filtered = sar_preprocessor.apply_lee_filter(img, window_size=5)
    assert filtered.shape == (20, 20)
    # Filtered variance should be reduced relative to original speckle
    assert np.var(filtered) <= np.var(img)

def test_sar_random_forest_classification_metrics():
    metrics = sar_classifier.train_and_validate()
    assert "overall_accuracy" in metrics
    assert metrics["overall_accuracy"] >= 83.0  # Validates Dr. Preethi Balaji range
    assert "cohen_kappa" in metrics
    assert metrics["cohen_kappa"] > 0.70
    assert "confusion_matrix" in metrics
    assert len(metrics["confusion_matrix"]) == 3
    assert "feature_importances" in metrics

def test_otsu_thresholding_baseline():
    # Synthetic bimodal SAR distribution: water (-20 dB) and land (-8 dB)
    water = np.random.normal(-20.0, 1.5, 500)
    land = np.random.normal(-8.0, 1.5, 500)
    img = np.concatenate([water, land]).reshape((25, 40))
    thresh, mask = sar_classifier.otsu_water_threshold(img)
    assert -18.0 < thresh < -10.0
    assert mask.shape == (25, 40)

def test_sentinel1_acquisitions_service():
    acquisitions = sentinel1_service.get_acquisitions_for_lake("lake-bellandur")
    assert len(acquisitions) >= 6
    years = [a["year"] for a in acquisitions]
    assert 2016 in years
    assert 2021 in years
    assert 2026 in years
    assert acquisitions[0]["constellation"] == "Copernicus Sentinel-1"

def test_water_extractor_utm_projected_area():
    # Simple polygon approximately 1 hectare
    test_poly = {
        "type": "Polygon",
        "coordinates": [[
            [77.6500, 12.9200],
            [77.6510, 12.9200],
            [77.6510, 12.9210],
            [77.6500, 12.9210],
            [77.6500, 12.9200]
        ]]
    }
    area_ha = sar_water_extractor.calculate_projected_area_hectares(test_poly)
    assert area_ha > 0.5 and area_ha < 2.0

def test_encroachment_analyzer_breakdown():
    test_boundary = {
        "type": "Polygon",
        "coordinates": [[
            [77.650, 12.920], [77.660, 12.920],
            [77.660, 12.930], [77.650, 12.930],
            [77.650, 12.920]
        ]]
    }
    res = encroachment_analyzer.analyze_basin_changes(
        lake_name="Bellandur Lake",
        cadastral_boundary=test_boundary,
        historical_water_geom=test_boundary,
        recent_water_geom=test_boundary,
        historical_year=2016,
        recent_year=2021,
        settlement_fraction=0.35
    )
    assert "water_loss_hectares" in res
    assert "breakdown" in res
    assert "findings" in res

def test_research_lab_experiments():
    exps = research_lab_service.run_all_experiments("lake-bellandur")
    assert len(exps) == 7
    exp_ids = [e["experiment_id"] for e in exps]
    assert exp_ids == ["EXP-01", "EXP-02", "EXP-03", "EXP-04", "EXP-05", "EXP-06", "EXP-07"]

def test_api_sar_acquisitions():
    resp = client.get("/api/v1/sar/lake-bellandur/acquisitions")
    assert resp.status_code == 200
    data = resp.json()
    assert data["lake_id"] == "lake-bellandur"
    assert data["total_acquisitions"] >= 10

def test_api_sar_classify():
    resp = client.post("/api/v1/sar/lake-bellandur/classify", json={"year": 2021})
    assert resp.status_code == 200
    data = resp.json()
    assert "model_validation" in data
    assert data["model_validation"]["overall_accuracy_pct"] >= 83.0

def test_api_research_experiments():
    resp = client.get("/api/v1/research/experiments")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_experiments"] == 7

def test_api_karnataka_overview():
    resp = client.get("/api/v1/research/karnataka-overview")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_monitored_lakes"] >= 180
    assert "districts" in data
