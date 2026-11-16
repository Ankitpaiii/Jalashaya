# JALASHAYA — Scientific Engineering Implementation Plan

**Objective:** Transform JALASHAYA into a research-grade Sentinel-1 SAR and Machine Learning water monitoring platform according to Preethi Balaji, PhD's methodology.

---

## Technical Stages & Architecture

### Stage 1: Sentinel-1 SAR Preprocessing & Acquisition Pipeline (`backend/app/services/sar/`)
- [x] `sentinel1_service.py`: Copernicus Sentinel-1 IW GRD acquisition service with real orbit tracking, VV/VH polarizations, acquisition dates (May 2016 to May 2026), and backscatter calibrated ranges.
- [x] `sar_preprocessor.py`: Implements radiometric calibration ($\sigma^0\text{ in dB}$), Lee speckle filtering kernel ($5 \times 5$), VV/VH backscatter ratio, and multi-band feature tensor builder.

### Stage 2: Machine Learning Classification Engine (`backend/app/services/sar/rf_classifier.py`)
- [x] Real Scikit-learn `RandomForestClassifier` trained on verified water, settlement, and other reference samples.
- [x] Feature importance calculation ($\text{VV}, \text{VH}, \text{VV/VH ratio}, \text{Radar Index}$).
- [x] Dynamic calculation of real validation metrics on test data:
  - Confusion Matrix ($3 \times 3$)
  - Overall Accuracy ($84\% - 91\%$)
  - Class Precision, Recall, $F_1$-score
  - Cohen's Kappa coefficient ($\kappa$)
  - Class-specific IoU (Jaccard Index)
- [x] Benchmark Otsu adaptive thresholding baseline for Experiment 4.

### Stage 3: Multi-Temporal Historical Change Detection & Encroachment Engine (`backend/app/services/sar/water_extractor.py`, `encroachment_analyzer.py`)
- [x] Computational water boundary extraction into Shapely/GeoJSON polygons.
- [x] Geodetic area measurement using EPSG:32643 (UTM Zone 43N).
- [x] Classification of pixel transitions between historical baseline and contemporary state:
  - Persistent Water (Blue)
  - Water Loss (Red)
  - Water Gain (Green)
  - Potential Settlement Encroachment (Orange/Red)
  - Seasonal Variation / Siltation (Yellow)
- [x] Minimum mapping unit (MMU) filtering ($0.05\text{ ha}$) to eliminate speckle noise while preserving genuine water bodies.

### Stage 4: Rainfall Context Engine (`backend/app/services/sar/weather_service.py`)
- [x] Open-Meteo historical precipitation integration for Karnataka coordinates.
- [x] Pre-acquisition 30-day and 90-day cumulative rainfall analysis to distinguish climate/seasonal variation from permanent anthropogenic shrinkage.

### Stage 5: Research Lab & Scientific Experiments (`backend/app/services/sar/research_lab_service.py`)
- [x] Automated execution and reporting for the 7 research experiments:
  1. Reproduction of May 2016–2021 study
  2. Multi-year Random Forest temporal stability
  3. Polarization efficacy: VV alone vs VH alone vs Dual-pol (VV + VH)
  4. Random Forest vs Adaptive Otsu thresholding
  5. Spatially separated validation vs random split
  6. SAR backscatter vs Optical NDWI multi-spectral cross-validation
  7. Seasonal monsoon cycle vs long-term multi-annual trend

### Stage 6: REST APIs (`backend/app/api/endpoints/sar.py`, `backend/app/api/endpoints/research.py`)
- [x] `GET /api/v1/sar/{lake_id}/acquisitions`: Historical Sentinel-1 acquisitions with VV/VH backscatter profiles.
- [x] `POST /api/v1/sar/{lake_id}/classify`: Run 3-class Random Forest classification with live confusion matrix and accuracy metrics.
- [x] `POST /api/v1/sar/{lake_id}/compare`: Historical multi-temporal change detection with water loss and potential built-up encroachment.
- [x] `GET /api/v1/sar/{lake_id}/weather`: Pre-acquisition rainfall context.
- [x] `GET /api/v1/research/experiments`: Comprehensive Research Lab results for all 7 experiments.

### Stage 7: Upgraded Frontend GIS Dashboard (`frontend/src/`)
- [x] **SAR Intelligence Layer:** Toggle between optical Google/Sentinel-2 and Sentinel-1 SAR (VV Backscatter, VH Backscatter, False Color Dual-Pol).
- [x] **AI Classification Layer:** Render 3-class Random Forest raster/polygons with interactive legend and dynamic confusion matrix drawer.
- [x] **Historical Comparison Slider:** Side-by-side and curtain swipe comparing historical May baselines with contemporary radar observations.
- [x] **Potential Encroachment Panel:** Clear breakdown of Water Extent Reduction vs Built-up Encroachment vs Seasonal Variation.
- [x] **Karnataka District Selector:** District-level navigation (Bengaluru Urban, Bengaluru Rural, Mysuru, Mandya, Kolar, Tumakuru, etc.).
- [x] **Research Lab Modal:** Full interactive viewer for the 7 research experiments.
- [x] **Executive Judicial Evidence Report:** Downloadable scientific report with side-by-side satellite images, confusion matrix, and citations.

### Stage 8: Testing & Verification
- [x] Unit & integration tests for SAR processing, Random Forest training, area calculation, and API endpoints.
- [x] Zero TypeScript compilation errors.
- [x] Produce `TEST_REPORT.md` and `FINAL_IMPLEMENTATION_REPORT.md`.
