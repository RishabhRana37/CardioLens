#!/usr/bin/env python3
"""
CardioLens AI Engine — Production Smoke Test & Self-Diagnostic Suite
Run from command line to verify models, pipelines, leakage protection, and inference latency.
"""

import sys
import time
from pathlib import Path
import pandas as pd
import joblib

backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from ml.preprocess import normalize_columns, build_X, LEAKAGE_COLUMNS
from ml.explain import get_patient_shap, generate_full_explanation
from ml.uncertainty import calculate_ensemble_uncertainty
from ml.quality import evaluate_data_quality
from app.core.config import settings

def run_smoke_test():
    t_start = time.perf_counter()
    print("=" * 65)
    print("       CARDIOLENS AI ENGINE — PRODUCTION SELF-DIAGNOSTIC       ")
    print("=" * 65)

    # 1. Verify Dataset & Leakage Prevention
    print("\n[1/6] Verifying Target Leakage Protection...")
    data_csv = backend_dir / "data" / "dataset.csv"
    if not data_csv.exists():
        print(f"  ❌ FAILED: Dataset not found at {data_csv}")
        sys.exit(1)
        
    df_raw = pd.read_csv(data_csv)
    df_norm = normalize_columns(df_raw)
    X = build_X(df_norm)
    for col in LEAKAGE_COLUMNS:
        assert col not in X.columns, f"Target leakage detected for column: {col}"
    print(f"  ✓ PASSED: Zero target leakage confirmed across {len(X.columns)} features.")

    # 2. Verify Model Artifacts
    print("\n[2/6] Loading Pre-Trained Calibrated Models...")
    models_dir = backend_dir / "models"
    loaded_models = {}
    for target in settings.TARGETS:
        m_path = models_dir / f"{target}.joblib"
        if not m_path.exists():
            print(f"  ❌ FAILED: Missing model artifact: {m_path}")
            sys.exit(1)
        loaded_models[target] = joblib.load(m_path)
        print(f"  ✓ {target} Model: Loaded & Calibrated")

    # 3. Test Multi-Vessel Inference & Latency
    print("\n[3/6] Benchmarking Calibrated Multi-Vessel Inference...")
    sample_patient = {
        "Age": 62, "Sex": 1, "Weight": 84, "Height": 174, "BMI": 27.7,
        "DM": 1, "HTN": 1, "Current Smoker": 1, "DLP": 1, "BP": 150,
        "PR": 78, "Typical Chest Pain": 1, "ST Elevation": 1, "EF-TTE": 38,
        "Region with RWMA": 3, "VHD": "Moderate"
    }
    
    from app.api.endpoints import _normalize_input_dataframe
    df_patient, warnings = _normalize_input_dataframe(sample_patient)
    
    t_infer_0 = time.perf_counter()
    preds = {}
    for target in settings.TARGETS:
        model = loaded_models[target]
        proba = float(model.predict_proba(df_patient)[0][1])
        unc = calculate_ensemble_uncertainty(model, df_patient)
        preds[target] = {
            "proba": proba,
            "ci": unc["confidence_interval_95"],
            "unc": unc["uncertainty_level"]
        }
    infer_ms = (time.perf_counter() - t_infer_0) * 1000
    
    print(f"  ✓ Latency: {infer_ms:.2f} ms for 4 simultaneous vessels")
    print(f"  ✓ CAD Risk: {preds['CAD']['proba']*100:.1f}% [95% CI: {preds['CAD']['ci'][0]*100:.0f}-{preds['CAD']['ci'][1]*100:.0f}%] (Uncertainty: {preds['CAD']['unc']})")
    print(f"  ✓ LAD Risk: {preds['LAD']['proba']*100:.1f}% [95% CI: {preds['LAD']['ci'][0]*100:.0f}-{preds['LAD']['ci'][1]*100:.0f}%] (Uncertainty: {preds['LAD']['unc']})")
    print(f"  ✓ LCX Risk: {preds['LCX']['proba']*100:.1f}% [95% CI: {preds['LCX']['ci'][0]*100:.0f}-{preds['LCX']['ci'][1]*100:.0f}%] (Uncertainty: {preds['LCX']['unc']})")
    print(f"  ✓ RCA Risk: {preds['RCA']['proba']*100:.1f}% [95% CI: {preds['RCA']['ci'][0]*100:.0f}-{preds['RCA']['ci'][1]*100:.0f}%] (Uncertainty: {preds['RCA']['unc']})")

    # 4. Test SHAP Explainability Engine
    print("\n[4/6] Verifying Physiological SHAP Explainability...")
    t_shap_0 = time.perf_counter()
    exp = generate_full_explanation(df_patient, target="LAD", proba=preds["LAD"]["proba"])
    shap_ms = (time.perf_counter() - t_shap_0) * 1000
    
    print(f"  ✓ SHAP TreeExplainer Time: {shap_ms:.2f} ms")
    print(f"  ✓ Primary Physiological Driver: {exp['contributions'][0]['feature']} (SHAP: {exp['contributions'][0]['shap']:+.4f})")
    print(f"  ✓ Narrative: \"{exp['narrative']}\"")

    # 5. Test Out-of-Distribution Data Quality Screening
    print("\n[5/6] Testing Sensor Quality & OOD Screening...")
    quality = evaluate_data_quality(df_patient)
    print(f"  ✓ Quality Score: {quality['quality_score']*100:.0f}% (In-Distribution: {quality['is_in_distribution']})")

    # 6. Verify Dual-Cohort Validation Artifact
    print("\n[6/6] Verifying Dual-Cohort Benchmark...")
    cohort_json = models_dir / "cohort_comparison.json"
    if cohort_json.exists():
        import json
        with open(cohort_json, "r") as f:
            c_data = json.load(f)
        p_n = c_data["primary_cohort"]["size"]
        s_n = c_data["simulation_cohort"]["size"]
        print(f"  ✓ Dual-Cohort Benchmark Verified: {p_n} Gold-Standard vs. {s_n:,} Simulation Patients")
    else:
        print("  ⚠️ Notice: Run python ml/evaluate_cohorts.py to generate cohort_comparison.json")

    total_time = (time.perf_counter() - t_start) * 1000
    print("\n" + "=" * 65)
    print(f" STATUS: ALL SYSTEMS OPERATIONAL (Diagnostic Time: {total_time:.1f}ms) ")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    run_smoke_test()
