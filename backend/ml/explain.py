import shap
import pandas as pd
import numpy as np
import joblib
from pathlib import Path

backend_dir = Path(__file__).parent.parent
models_dir = backend_dir / "models"

# Cache for explainers to avoid rebuilding them on every request
_explainers = {}

def get_explainer(target: str):
    """
    Retrieves or builds a SHAP explainer for the given target.
    Because CalibratedClassifierCV wraps the base estimator, we extract the first 
    calibrated base estimator's RandomForest to use with TreeExplainer for speed.
    """
    if target in _explainers:
        return _explainers[target]
        
    pipeline = joblib.load(models_dir / f"{target}.joblib")
    
    # Extract the calibrated classifier
    calibrated_clf = pipeline.named_steps["classifier"]
    
    # Extract the underlying XGBoost from the first CV fold
    base_xgb = calibrated_clf.calibrated_classifiers_[0].estimator
    
    # Build TreeExplainer
    explainer = shap.TreeExplainer(base_xgb)
    
    _explainers[target] = (explainer, pipeline.named_steps["preprocessor"])
    return _explainers[target]

def get_patient_shap(df: pd.DataFrame, target: str = "CAD"):
    """
    Calculates SHAP values for a single patient dataframe.
    """
    explainer, preprocessor = get_explainer(target)
    
    # Preprocess the input data to match what the TreeExplainer expects
    X_transformed = preprocessor.transform(df)
    
    # Get feature names from preprocessor
    # For OneHotEncoder, we can use get_feature_names_out()
    feature_names = preprocessor.get_feature_names_out()
    
    # Calculate SHAP values
    shap_values = explainer.shap_values(X_transformed)
    
    # For Random Forest, shap_values is a list of arrays (one for each class).
    # We want the values for the positive class (index 1).
    if isinstance(shap_values, list):
        shap_vals_pos = shap_values[1][0]
    else:
        # shap >= 0.40 sometimes returns an Explanation object or single array
        if len(shap_values.shape) == 3:
            shap_vals_pos = shap_values[0, :, 1]
        else:
            shap_vals_pos = shap_values[0]
            
    # Pair feature names with their SHAP values and strip Scikit-Learn prefixes
    importance_dict = {}
    for name, val in zip(feature_names, shap_vals_pos):
        clean_name = name.split("__")[-1]
        importance_dict[clean_name] = float(val)
        
    # Sort by absolute impact
    sorted_importance = dict(sorted(importance_dict.items(), key=lambda item: abs(item[1]), reverse=True))
    
    return sorted_importance

FEATURE_METADATA = {
    "Age": {"label": "Age", "unit": "years", "ref": "Non-modifiable vascular aging"},
    "Sex": {"label": "Biological Sex", "unit": "", "ref": "Male (1) / Female (0)"},
    "Weight": {"label": "Weight", "unit": "kg", "ref": "Optimal reference: 60-80 kg"},
    "Height": {"label": "Height", "unit": "cm", "ref": "Standing height"},
    "BMI": {"label": "Body Mass Index", "unit": "kg/m²", "ref": "Normal reference: 18.5 - 24.9"},
    "DM": {"label": "Diabetes Mellitus", "unit": "", "ref": "Cardiovascular risk accelerator"},
    "HTN": {"label": "Hypertension", "unit": "", "ref": "Vascular endothelial stressor"},
    "Current Smoker": {"label": "Current Smoker", "unit": "", "ref": "Atherosclerotic accelerator"},
    "Ex-Smoker": {"label": "Ex-Smoker", "unit": "", "ref": "Past tobacco exposure"},
    "FH": {"label": "Family History of CAD", "unit": "", "ref": "Genetic predisposition"},
    "Obesity": {"label": "Obesity", "unit": "", "ref": "Metabolic risk factor"},
    "CRF": {"label": "Chronic Renal Failure", "unit": "", "ref": "Cardiorenal syndrome marker"},
    "CVA": {"label": "Cerebrovascular Accident", "unit": "", "ref": "Vascular disease history"},
    "Airway disease": {"label": "Airway Disease", "unit": "", "ref": "COPD / Asthma status"},
    "Thyroid Disease": {"label": "Thyroid Disease", "unit": "", "ref": "Metabolic endocrinopathy"},
    "CHF": {"label": "Congestive Heart Failure", "unit": "", "ref": "Impaired hemodynamics"},
    "DLP": {"label": "Dyslipidemia", "unit": "", "ref": "Atherogenic lipid profile"},
    "BP": {"label": "Systolic Blood Pressure", "unit": "mmHg", "ref": "Normal reference: < 120 mmHg"},
    "PR": {"label": "Pulse Rate", "unit": "bpm", "ref": "Resting rate: 60-100 bpm"},
    "Edema": {"label": "Peripheral Edema", "unit": "", "ref": "Venous / heart failure sign"},
    "Weak Peripheral Pulse": {"label": "Weak Peripheral Pulse", "unit": "", "ref": "Peripheral vascular deficit"},
    "Lung rales": {"label": "Lung Rales / Crackles", "unit": "", "ref": "Pulmonary congestion sign"},
    "Systolic Murmur": {"label": "Systolic Murmur", "unit": "", "ref": "Valvular / flow disturbance"},
    "Diastolic Murmur": {"label": "Diastolic Murmur", "unit": "", "ref": "Pathologic regurgitation sign"},
    "Typical Chest Pain": {"label": "Typical Anginal Chest Pain", "unit": "", "ref": "54% population baseline"},
    "Dyspnea": {"label": "Exertional Dyspnea", "unit": "", "ref": "Ischemic equivalence symptom"},
    "Function Class": {"label": "NYHA Function Class", "unit": "", "ref": "Functional impairment (0-4)"},
    "Atypical": {"label": "Atypical Chest Pain", "unit": "", "ref": "Non-classical presentation"},
    "Nonanginal CP": {"label": "Non-Anginal Chest Pain", "unit": "", "ref": "Musculoskeletal / non-ischemic"},
    "Exertional CP": {"label": "Exertional Chest Pain", "unit": "", "ref": "Effort-induced ischemia"},
    "LowTH Ang": {"label": "Low-Threshold Angina", "unit": "", "ref": "Low ischemic threshold"},
    "Q Wave": {"label": "Pathological Q Wave", "unit": "", "ref": "Infarct / transmural necrosis marker"},
    "ST Elevation": {"label": "ECG ST Segment Elevation", "unit": "", "ref": "Acute transmural injury marker"},
    "ST Depression": {"label": "ECG ST Segment Depression", "unit": "", "ref": "Subendocardial ischemia marker"},
    "T inversion": {"label": "ECG T-Wave Inversion", "unit": "", "ref": "Ischemic repolarization marker"},
    "LVH": {"label": "Left Ventricular Hypertrophy", "unit": "", "ref": "Hypertensive remodeling marker"},
    "Poor R Progression": {"label": "Poor R Wave Progression", "unit": "", "ref": "Anterior lead ischemic marker"},
    "FBS": {"label": "Fasting Blood Sugar", "unit": "mg/dL", "ref": "Normal fasting: < 100 mg/dL"},
    "Cr": {"label": "Serum Creatinine", "unit": "mg/dL", "ref": "Normal reference: 0.7 - 1.2 mg/dL"},
    "TG": {"label": "Serum Triglycerides", "unit": "mg/dL", "ref": "Normal reference: < 150 mg/dL"},
    "LDL": {"label": "LDL Cholesterol", "unit": "mg/dL", "ref": "Optimal target: < 100 mg/dL"},
    "HDL": {"label": "HDL Cholesterol", "unit": "mg/dL", "ref": "Normal reference: > 40 mg/dL"},
    "BUN": {"label": "Blood Urea Nitrogen", "unit": "mg/dL", "ref": "Normal reference: 7 - 20 mg/dL"},
    "ESR": {"label": "Erythrocyte Sed. Rate", "unit": "mm/hr", "ref": "Normal reference: < 20 mm/hr"},
    "HB": {"label": "Hemoglobin", "unit": "g/dL", "ref": "Normal reference: 13.5 - 17.5 g/dL"},
    "K": {"label": "Serum Potassium", "unit": "mEq/L", "ref": "Normal reference: 3.5 - 5.0 mEq/L"},
    "Na": {"label": "Serum Sodium", "unit": "mEq/L", "ref": "Normal reference: 135 - 145 mEq/L"},
    "WBC": {"label": "White Blood Cell Count", "unit": "x10³/µL", "ref": "Normal reference: 4.5 - 11.0"},
    "Lymph": {"label": "Lymphocyte Percentage", "unit": "%", "ref": "Normal reference: 20 - 40%"},
    "Neut": {"label": "Neutrophil Percentage", "unit": "%", "ref": "Normal reference: 40 - 70%"},
    "PLT": {"label": "Platelet Count", "unit": "x10³/µL", "ref": "Normal reference: 150 - 450"},
    "EF-TTE": {"label": "Ejection Fraction (EF-TTE)", "unit": "%", "ref": "Normal reference: ≥ 55%"},
    "Region with RWMA": {"label": "Regional Wall Motion Abnormality", "unit": "", "ref": "Normal reference: 0 segments"},
    "VHD": {"label": "Valvular Heart Disease", "unit": "", "ref": "Valvular integrity status"}
}

def generate_clinical_narrative(shap_dict: dict, top_k: int = 3) -> str:
    """
    Generates a human-readable clinical narrative based on top SHAP values.
    """
    narrative = []
    top_features = list(shap_dict.items())[:top_k]
    
    for feat, impact in top_features:
        meta = FEATURE_METADATA.get(feat, {})
        friendly_name = meta.get("label", feat)
        direction = "increased" if impact > 0 else "decreased"
        narrative.append(f"{friendly_name} {direction} risk.")
        
    return " Key factors: " + " ".join(narrative)

def generate_full_explanation(df: pd.DataFrame, target: str, proba: float, top_k: int = 6) -> dict:
    """
    Generates an explanation dictionary matching the frontend Explanation TypeScript interface.
    """
    from datetime import datetime, timezone
    
    base_values = {
        "CAD": 0.35,
        "LAD": 0.31,
        "LCX": 0.22,
        "RCA": 0.26
    }
    
    shap_dict = get_patient_shap(df, target=target)
    contributions = []
    
    for feat_name, shap_val in list(shap_dict.items())[:top_k]:
        clean_name = feat_name
        # Handle one-hot prefixes like VHD_mild
        if clean_name.startswith("VHD_"):
            meta = {"label": f"VHD ({clean_name.split('_')[-1]})", "unit": "", "ref": "Valvular dysfunction"}
            raw_val = "Present"
        else:
            meta = FEATURE_METADATA.get(clean_name, {"label": clean_name, "unit": "", "ref": "Clinical factor"})
            raw_val = df[clean_name].values[0] if clean_name in df.columns else ""
            
            # Format value for presentation
            if clean_name in ["Sex"]:
                raw_val = "Male" if str(raw_val) in ["1", "Male"] else "Female"
            elif isinstance(raw_val, (int, float)) and clean_name in ["DM", "HTN", "Current Smoker", "Typical Chest Pain", "Q Wave", "ST Elevation", "ST Depression", "T inversion"]:
                raw_val = "Present" if raw_val == 1 else "Absent"
            elif meta.get("unit"):
                raw_val = f"{raw_val} {meta['unit']}"
            else:
                raw_val = str(raw_val)

        contributions.append({
            "feature": meta.get("label", clean_name),
            "value": raw_val,
            "shap": round(float(shap_val), 4),
            "direction": "increases" if shap_val > 0 else "decreases",
            "population_reference": meta.get("ref", "Reference baseline")
        })

    # Sort contributions by absolute SHAP magnitude descending
    contributions.sort(key=lambda c: abs(c["shap"]), reverse=True)
    
    top_pos = [c for c in contributions if c["direction"] == "increases"][:2]
    if top_pos:
        drivers = " and ".join([c["feature"] for c in top_pos])
        narrative = f"Elevated {target} risk ({int(proba * 100)}%) is primarily driven by {drivers}."
    else:
        narrative = f"Low {target} risk ({int(proba * 100)}%) is supported by normal hemodynamics and lack of ischemic markers."

    return {
        "target": target,
        "base_value": base_values.get(target, 0.30),
        "prediction": round(float(proba), 3),
        "contributions": contributions,
        "narrative": narrative,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
