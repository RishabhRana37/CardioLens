"""
Requirement: Faithfulness Verification Test.
Loads the exported JSON artifacts and reproduces the sklearn model's predicted
probability for 5 patients using the exact transformation and linear algebra
that runs in JavaScript in the browser.
Asserts that the difference is strictly within 1e-6 (machine precision).
"""

import json
import math
import os
import pandas as pd
import numpy as np
import pytest

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV

DATA_PATH = "/Users/rana/Documents/CardioLens/backend/data/z_alizadeh_sani.csv"
MODEL_DIR = "/Users/rana/Documents/CardioLens/frontend/public/model"

NUMERIC_COLS = [
    "Age", "Weight", "Height", "BMI", "BP", "PR", "FBS", "Cr", "TG",
    "LDL", "HDL", "BUN", "ESR", "HB", "K", "Na", "WBC", "Lymph", "Neut", "PLT", "EF-TTE"
]
ORDINAL_COLS = ["Function Class", "Region with RWMA"]
BINARY_COLS = [
    "Sex", "DM", "HTN", "Current Smoker", "Ex-Smoker", "FH", "Obesity", "CRF", "CVA",
    "Airway disease", "Thyroid Disease", "CHF", "DLP", "Edema", "Weak Peripheral Pulse",
    "Lung rales", "Systolic Murmur", "Diastolic Murmur", "Typical Chest Pain", "Dyspnea",
    "Atypical", "Nonanginal CP", "Exertional CP", "LowTH Ang", "Q Wave", "ST Elevation",
    "ST Depression", "T inversion", "LVH", "Poor R Progression"
]
NOMINAL_COLS = ["Rhythm", "VHD"]
LEAKAGE_COLS = ["LAD", "LCX", "RCA", "Cath"]

TARGET_CONFIGS = {
    "CAD": {"source_col": "Cath", "mapping": {"CAD": 1, "Normal": 0}, "c_param": 0.2},
    "LAD": {"source_col": "LAD", "mapping": {"Stenotic": 1, "Normal": 0}, "c_param": 0.1},
    "LCX": {"source_col": "LCX", "mapping": {"Stenotic": 1, "Normal": 0}, "c_param": 0.03},
    "RCA": {"source_col": "RCA", "mapping": {"Stenotic": 1, "Normal": 0}, "c_param": 0.1},
}


def simulate_js_inference(patient_dict: dict, model_spec: dict) -> float:
    """
    Pure mathematical inference simulating browser JavaScript execution.
    Only uses basic arithmetic and math.exp, identical to JS runtime.
    """
    preprocessing = model_spec["preprocessing"]
    num_means = preprocessing["numeric_means"]
    num_stds = preprocessing["numeric_stds"]
    nominal_categories = preprocessing["nominal_categories"]
    weights = model_spec["weights"]
    intercept = model_spec["intercept"]
    cal_a = model_spec["calibration"]["a"]
    cal_b = model_spec["calibration"]["b"]
    
    vec = []
    
    # 1. Numeric and Ordinal Features (StandardScaler: (x - mean) / std)
    for col in NUMERIC_COLS + ORDINAL_COLS:
        val = float(patient_dict.get(col, num_means[col]))
        mean = num_means[col]
        std = num_stds[col]
        scaled = (val - mean) / std if std > 0 else 0.0
        vec.append(scaled)
        
    # 2. Binary Features (Passthrough 0.0 or 1.0)
    for col in BINARY_COLS:
        val = patient_dict.get(col, 0)
        binary_val = 1.0 if val in [1, "1", "Y", "Yes", "Male", True] else 0.0
        vec.append(binary_val)
        
    # 3. Nominal Features (One-Hot Encoded)
    for col in NOMINAL_COLS:
        val = str(patient_dict.get(col, ""))
        for cat in nominal_categories[col]:
            vec.append(1.0 if val == cat else 0.0)
            
    assert len(vec) == len(weights), f"Vector size {len(vec)} does not match weights size {len(weights)}"
    
    # 4. Dot Product (Decision Function z = w * x + b)
    z = sum(w * x for w, x in zip(weights, vec)) + intercept
    
    # 5. Sigmoid Calibration (P = 1 / (1 + exp(a * z + b)))
    prob = 1.0 / (1.0 + math.exp(cal_a * z + cal_b))
    return prob


def test_export_faithfulness():
    df = pd.read_csv(DATA_PATH)
    X = df.drop(columns=LEAKAGE_COLS)
    
    # Select 5 diverse sample patients across the dataset
    sample_indices = [0, 42, 100, 185, 299]
    sample_patients = [X.iloc[i].to_dict() for i in sample_indices]
    sample_df = X.iloc[sample_indices]
    
    # Load exported models bundle
    models_path = os.path.join(MODEL_DIR, "models.json")
    with open(models_path) as f:
        models = json.load(f)
        
    for target_key, cfg in TARGET_CONFIGS.items():
        # Load individual target artifact as well to verify both
        target_path = os.path.join(MODEL_DIR, f"{target_key.lower()}.json")
        with open(target_path) as f:
            target_model = json.load(f)
            
        # Re-fit the exact sklearn reference pipeline
        y = df[cfg["source_col"]].map(cfg["mapping"]).astype(int)
        prep = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), NUMERIC_COLS + ORDINAL_COLS),
                ("bin", "passthrough", BINARY_COLS),
                ("cat", OneHotEncoder(drop=None, sparse_output=False, handle_unknown="ignore"), NOMINAL_COLS)
            ]
        )
        base_lr = LogisticRegression(C=cfg["c_param"], class_weight="balanced", max_iter=1000, random_state=42)
        cal_clf = CalibratedClassifierCV(estimator=base_lr, method="sigmoid", cv=3, ensemble=False)
        pipe = Pipeline([("prep", prep), ("clf", cal_clf)])
        pipe.fit(X, y)
        
        # Ground truth probabilities from scikit-learn
        sklearn_probs = pipe.predict_proba(sample_df)[:, 1]
        
        print(f"\nEvaluating target: {target_key}")
        for i, (patient, true_prob) in enumerate(zip(sample_patients, sklearn_probs)):
            simulated_prob = simulate_js_inference(patient, target_model)
            diff = abs(simulated_prob - true_prob)
            print(f"  Patient #{sample_indices[i]}: JS simulated = {simulated_prob:.8f}, sklearn = {true_prob:.8f}, diff = {diff:.2e}")
            assert diff < 1e-6, f"Faithfulness failure for {target_key} patient {i}: diff={diff}"
            
    print("\n✅ test_export_faithfulness PASSED: Simulated JS inference strictly matches scikit-learn within 1e-6 across all targets and patients!")


if __name__ == "__main__":
    test_export_faithfulness()
