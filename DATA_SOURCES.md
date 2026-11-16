# JALASHAYA — Scientific Data Sources & Provenance Registry

This registry documents all satellite datasets, reference boundaries, meteorological feeds, and machine learning ground-truth resources integrated into the JALASHAYA platform.

---

## 1. Satellite Constellations & Earth Observation Feeds

### 1.1 Copernicus Sentinel-1 Synthetic Aperture Radar (SAR)
- **Data Provider:** European Space Agency (ESA) / Copernicus Programme
- **Collection Identifier:** `COPERNICUS/S1_GRD`
- **Sensor:** C-band Synthetic Aperture Radar (5.405 GHz)
- **Product Type:** Level-1 Ground Range Detected (GRD)
- **Mode:** Interferometric Wide Swath (IW)
- **Polarizations:** VV (Vertical-Vertical), VH (Vertical-Horizontal)
- **Spatial Resolution:** 10 m pixel spacing (20 m × 22 m resolution)
- **Temporal Baseline:** May 2016 – May 2026
- **Radiometric Calibration:** Sigma Nought ($\sigma^0$) in decibels (dB)
- **Data Provenance:** Observed satellite telemetry via Copernicus Open Access Hub / Google Earth Engine catalog.

### 1.2 Copernicus Sentinel-2 Multi-Spectral Instrument (MSI)
- **Data Provider:** ESA / Copernicus Programme
- **Collection Identifier:** `COPERNICUS/S2_SR_HARMONIZED`
- **Sensor:** Multi-Spectral Instrument (13 spectral bands)
- **Key Bands Utilized:**
  - Band 3 (Green, 560 nm, 10m)
  - Band 8 (Near-Infrared / NIR, 842 nm, 10m)
- **Index Computed:** McFeeters Normalized Difference Water Index (NDWI)
- **Purpose:** Optical cross-validation and ground-truth verification for SAR water extraction.

### 1.3 Sub-Meter High-Resolution Optical Reference Basemaps
- **Data Provider:** Esri World Imagery / Maxar / Planet NICFI Basemaps
- **Spatial Resolution:** 0.3 m – 0.8 m sub-meter optical aerial photography
- **Purpose:** Ground-level validation of built-up urban encroachment, road layout construction, and physical shoreline alterations.

---

## 2. Cadastral Boundaries & Administrative Inventories

### 2.1 Authoritative Karnataka Lake Basins Inventory
- **Data Sources:**
  - Bruhat Bengaluru Mahanagara Palike (BBMP) Lake Department Cadastral Survey
  - Karnataka Lake Conservation and Development Authority (KLCDA)
  - Karnataka Tank Conservation and Development Authority (KTCDA)
  - Karnataka State Remote Sensing Applications Centre (KSRSAC)
  - OpenStreetMap (OSM) Waterway Polygons
- **Coverage:** 185 lake basins across Bengaluru Urban, Bengaluru Rural, Mandya, Mysuru, Kolar, and Tumakuru.
- **Attributes:** Official Name, Local Kannada Name, Cadastral Basin Area (hectares), Custodian Agency, Administrative Zone, Latitude, Longitude, Legal Boundary Geometry.

---

## 3. Meteorological & Climatological Data

### 3.1 Open-Meteo Historical Weather Archive
- **API Endpoint:** `https://archive-api.open-meteo.com/v1/archive`
- **Parameters:** Daily Precipitation Sums (mm), Maximum/Minimum Temperature (°C), Soil Moisture ($0-7\text{ cm}$).
- **Spatial Resolution:** 0.25° (~25 km ERA5-Land reanalysis grid).
- **Purpose:** Analyzing 30-day and 90-day cumulative precipitation prior to each satellite pass to distinguish climate-driven drought from permanent urban encroachment.

---

## 4. Machine Learning Reference Ground Truth

### 4.1 3-Class Training & Validation Samples
- **Class 1 (Water):** 850 verified core water body polygons across Bellandur, Varthur, Yelahanka, and Madiwala.
- **Class 2 (Settlement):** 920 high-density urban residential, commercial layouts, IT parks, and arterial road networks.
- **Class 3 (Other):** 890 non-water samples comprising wet marshland, Eichhornia crassipes (water hyacinth) vegetation mats, and agricultural fallow.
- **Validation Partitioning:** 70% Training / 30% Testing with spatial block splitting to eliminate spatial autocorrelation leakage.
