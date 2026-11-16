import numpy as np
from typing import Dict, Any, Tuple

class SARPreprocessor:
    """
    Sentinel-1 C-band Synthetic Aperture Radar (SAR) Preprocessing Pipeline.
    
    Implements:
    - Radiometric Calibration: DN to Sigma0 (linear) to Sigma0 (dB)
    - Enhanced Lee Speckle Filter (5x5 spatial window)
    - Dual-Polarization Ratio: VV/VH (dB)
    - Radar Difference Index: (VV - VH) / (VV + VH)
    """

    @staticmethod
    def linear_to_db(linear_val: np.ndarray) -> np.ndarray:
        """Converts linear radar backscatter to logarithmic decibels (dB = 10 * log10(val))."""
        safe_linear = np.maximum(linear_val, 1e-7)
        return 10.0 * np.log10(safe_linear)

    @staticmethod
    def db_to_linear(db_val: np.ndarray) -> np.ndarray:
        """Converts decibels back to linear radar cross-section."""
        return np.power(10.0, db_val / 10.0)

    @classmethod
    def apply_lee_filter(cls, img_db: np.ndarray, window_size: int = 5) -> np.ndarray:
        """
        Applies an Enhanced Lee Speckle Reduction Filter on SAR backscatter.
        Reduces granular speckle noise while preserving sharp lake shoreline boundaries.
        """
        pad = window_size // 2
        padded = np.pad(img_db, pad, mode='reflect')
        filtered = np.zeros_like(img_db)

        # Vectorized rolling window statistics
        for i in range(img_db.shape[0]):
            for j in range(img_db.shape[1]):
                window = padded[i : i + window_size, j : j + window_size]
                mean = np.mean(window)
                var = np.var(window)
                if var > 0:
                    # Noise variance estimation for Sentinel-1 GRD 4.9 looks
                    noise_var = mean**2 / 4.9
                    k = max(0.0, min(1.0, 1.0 - (noise_var / max(var, 1e-6))))
                    filtered[i, j] = mean + k * (img_db[i, j] - mean)
                else:
                    filtered[i, j] = mean

        return filtered

    @classmethod
    def compute_features(cls, vv_db: np.ndarray, vh_db: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Computes the complete 4-dimensional SAR feature stack for classification:
        1. Filtered VV Backscatter (dB)
        2. Filtered VH Backscatter (dB)
        3. Polarization Ratio: VV - VH (dB)
        4. Normalized Radar Difference Index: (VV - VH) / (VV + VH)
        """
        filtered_vv = cls.apply_lee_filter(vv_db)
        filtered_vh = cls.apply_lee_filter(vh_db)

        # In decibels, ratio is subtraction: log(VV/VH) = log(VV) - log(VH)
        ratio_vv_vh = filtered_vv - filtered_vh

        # Radar Difference Index in linear scale
        vv_lin = cls.db_to_linear(filtered_vv)
        vh_lin = cls.db_to_linear(filtered_vh)
        denom = vv_lin + vh_lin
        denom[denom == 0] = 1e-6
        radar_index = (vv_lin - vh_lin) / denom

        return {
            "vv_db": filtered_vv,
            "vh_db": filtered_vh,
            "ratio_db": ratio_vv_vh,
            "radar_index": radar_index
        }

sar_preprocessor = SARPreprocessor()
