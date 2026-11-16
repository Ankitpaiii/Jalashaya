# JALASHAYA — Scientific Architecture & Project Audit

**Document Version:** 1.0.0-RESEARCH  
**Date:** 2026-11-16  
**Auditor:** Remote Sensing & Machine Learning Systems Engineering Team  
**Subject Repository:** JALASHAYA — Karnataka Water Body Digital Twin & Satellite Change Detection

---

## 1. Executive Summary
JALASHAYA is an environmental intelligence and geospatial digital twin platform built for monitoring lake water bodies, quantifying historical shrinkage, and detecting urban encroachment. Currently, the application features:
1. **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + MapLibre GL / OpenLayers / ArcGIS World Imagery raster layer integrations.
2. **Backend:** FastAPI (Python 3.13) + SQLAlchemy + SQLite/PostGIS + Shapely + Scikit-Learn.
3. **Current Geospatial Baseline:** Multi-temporal optical satellite observations (Sentinel-2 MSI Level-2A NDWI extraction at 10m resolution) spanning 2017 to 2026 across 185 Bengaluru lakes.
4. **Research Target:** Transform the platform into a research-driven Sentinel-1 C-band Synthetic Aperture Radar (SAR) water body monitoring, Random Forest classification (Water, Settlement, Other), and multi-temporal change-detection platform based on the foundational research:
   > *"Mapping changes in Water Bodies of Bengaluru with Sentinel-1"*  
   > **Researcher:** Preethi Balaji, PhD (April 11, 2022)  
   > **Reference:** [ArcGIS StoryMaps](https://storymaps.arcgis.com/stories/1e6a0e96459d4601914890da5cd2b0cc)

---

## 2. Component-by-Component Audit

### 2.1 Backend Architecture
- **Framework:** FastAPI with Uvicorn server mounted at `/api/v1`.
- **Database Layer:** SQLAlchemy ORM models (`Lake`, `CadastralBoundary`, `SatelliteObservation`, `WaterDetectionResult`, `EncroachmentRecord`, `AuditTrail`).
- **Repositories:** `LakeRepository` providing CRUD, bounding box queries, and temporal observation lookups for 185 lake basins.
- **Services:**
  - `backend/app/services/satellite/sentinel2.py`: Multi-spectral Sentinel-2 NDWI computation ($(\text{Green} - \text{NIR}) / (\text{Green} + \text{NIR})$).
  - `backend/app/services/comparison/change_engine.py`: Geometric difference and intersection calculation for water gain/loss.
  - `backend/app/services/reporting/report_generator.py`: HTML, GeoJSON, and CSV time series generation.
  - `backend/app/api/endpoints/predictions.py`: Groq LPU™ accelerated hydrodynamic simulation engine.
- **Gaps for Sentinel-1 Research Transformation:**
  - Need dedicated SAR Preprocessing Pipeline: Radiometric calibration ($\sigma^0\text{ in dB}$), Lee speckle filter, VV/VH polarization backscatter extraction, and VV/VH ratio feature calculation.
  - Need Machine Learning Classifier: 3-class Random Forest (`Water`, `Settlement`, `Other`) trained on verified reference datasets.
  - Need Real Accuracy Validation: Spatially separated validation metrics (Overall Accuracy, Precision, Recall, F1-Score, Cohen's Kappa) computed dynamically.
  - Need Potential Encroachment vs Seasonal Variation classifier to ensure non-water pixels are not blindly tagged as illegal encroachment.
  - Need Open-Meteo historical weather & precipitation integration to contextualize monsoon vs drought cycles.

### 2.2 Frontend Architecture
- **State Management:** Zustand store (`useAppStore.ts`) coordinating `selectedLake`, `observations`, `comparisonData`, `layers`, and modal states.
- **Mapping:** `GeospatialMap.tsx` rendering MapLibre GL with 3D human road perspective view (`pitch: 68°`, `bearing: 42°`), vector polygon layers, and satellite swipe curtain.
- **Modals & Workspaces:**
  - `ComparisonStudioModal.tsx`: Dual side-by-side photographic comparison and interactive curtain swipe.
  - `GroqPredictionModal.tsx`: Ultra-fast hydro-ecological simulation for 2030, 2035, 2040.
  - `EvidenceReportModal.tsx`: Printable scientific change & verification report.
  - `RestorationLabModal.tsx`: Interactive hydrological intervention sandbox.
- **Gaps for Sentinel-1 Research Transformation:**
  - SAR Visualization Mode: Displaying raw radar backscatter layers (VV backscatter in dB, VH backscatter in dB, and VV/VH dual-pol false color composite).
  - 3-Class Random Forest Overlay: Distinct categorical raster/polygon view (Class 1: Water [Cyan/Blue], Class 2: Settlement [Orange/Red], Class 3: Other [Green/Grey]).
  - Research Lab Tab / View: Enabling users and judges to run the 7 core scientific experiments (VV vs VH vs Dual-pol, RF vs Otsu thresholding, Spatially separated validation, Seasonal vs long-term change).
  - Karnataka State & District Navigation: Exploring water bodies across Mandya, Mysuru, Kolar, Tumakuru, Belagavi, and Bengaluru.

---

## 3. Dependency & Environment Health
- Python packages installed and operational:
  - `fastapi`, `uvicorn`, `pydantic`, `sqlalchemy`, `shapely`, `pyproj`, `numpy`, `pillow`, `scikit-learn` (`sklearn`), `httpx`, `pytest`.
- Node.js & Vite build:
  - Clean TypeScript build (`tsc && vite build`) passing with 0 errors.
- External Integration Credentials:
  - `GROQ_API_KEY`: Configured in backend `.env` for predictive inference.
  - Satellite Endpoints: Earth Engine API & ArcGIS high-resolution satellite imagery cache active.
