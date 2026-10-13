import numpy as np
import pandas as pd
from typing import Dict, Any, List

# Population benchmarks derived from the Z-Alizadeh Sani clinical cohort
POPULATION_BENCHMARKS = {
    "Age": {"mean": 58.8, "std": 10.4, "min": 25, "max": 100},
    "BP": {"mean": 131.7, "std": 18.2, "min": 70, "max": 240},
    "PR": {"mean": 75.1, "std": 8.7, "min": 40, "max": 160},
    "FBS": {"mean": 119.2, "std": 48.9, "min": 50, "max": 500},
    "Cr": {"mean": 1.05, "std": 0.27, "min": 0.3, "max": 6.0},
    "TG": {"mean": 150.3, "std": 97.9, "min": 30, "max": 1000},
    "LDL": {"mean": 104.6, "std": 35.4, "min": 20, "max": 400},
    "HDL": {"mean": 40.2, "std": 10.6, "min": 10, "max": 120},
    "EF-TTE": {"mean": 47.2, "std": 8.9, "min": 10, "max": 80},
    "BMI": {"mean": 27.2, "std": 4.1, "min": 15, "max": 55}
}

def evaluate_data_quality(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Evaluates input data quality, sensor plausibility, and statistical distribution drift.
    Prevents garbage-in, garbage-out failures without rejecting borderline patients.
    """
    anomalies: List[Dict[str, Any]] = []
    quality_warnings: List[str] = []
    total_checks = 0
    passed_checks = 0
    
    for col, bench in POPULATION_BENCHMARKS.items():
        if col in df.columns and pd.notna(df[col].values[0]):
            try:
                val = float(df[col].values[0])
            except (ValueError, TypeError):
                continue
                
            total_checks += 1
            
            # Check biologically implausible sensor outliers
            if val < bench["min"] or val > bench["max"]:
                anomalies.append({
                    "biomarker": col,
                    "value": val,
                    "issue": "biologically_implausible_outlier",
                    "plausible_range": f"{bench['min']} - {bench['max']}"
                })
                quality_warnings.append(
                    f"Biomarker '{col}' value ({val}) exceeds typical physiological bounds [{bench['min']}-{bench['max']}]."
                )
            else:
                passed_checks += 1
                
            # Check statistical distribution drift (|Z| > 3.5)
            z_score = abs(val - bench["mean"]) / bench["std"]
            if z_score > 3.5:
                quality_warnings.append(
                    f"Biomarker '{col}' is a statistical distribution outlier (Z-score: {z_score:.1f})."
                )

    quality_score = round(passed_checks / max(1, total_checks), 2)
    is_in_dist = len(anomalies) == 0

    return {
        "is_in_distribution": is_in_dist,
        "quality_score": quality_score,
        "extreme_biomarkers": anomalies,
        "quality_warnings": quality_warnings
    }
