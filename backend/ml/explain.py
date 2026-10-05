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
            
    # Pair feature names with their SHAP values
    importance_dict = {
        name: float(val) 
        for name, val in zip(feature_names, shap_vals_pos)
    }
    
    # Sort by absolute impact
    sorted_importance = dict(sorted(importance_dict.items(), key=lambda item: abs(item[1]), reverse=True))
    
    return sorted_importance

def generate_clinical_narrative(shap_dict: dict, top_k: int = 3) -> str:
    """
    Generates a human-readable clinical narrative based on top SHAP values.
    """
    narrative = []
    
    # Clinical glossary for better UX
    glossary = {
        "TG": "Triglycerides",
        "K": "Potassium",
        "Na": "Sodium",
        "Cr": "Creatinine",
        "FBS": "Fasting Blood Sugar",
        "BP": "Blood Pressure",
        "PR": "Pulse Rate",
        "BMI": "Body Mass Index",
        "HTN": "Hypertension",
        "DM": "Diabetes Mellitus",
        "FH": "Family History of CAD",
        "DLP": "Dyslipidemia"
    }
    
    clean_dict = {}
    for k, v in shap_dict.items():
        clean_name = k.split("__")[-1]
        if clean_name not in clean_dict:
             clean_dict[clean_name] = v
             
    top_features = list(clean_dict.items())[:top_k]
    
    for feat, impact in top_features:
        friendly_name = glossary.get(feat, feat)
        direction = "increased" if impact > 0 else "decreased"
        narrative.append(f"{friendly_name} {direction} risk.")
        
    return " Key factors: " + " ".join(narrative)
