from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import pandas as pd
import joblib
from pathlib import Path

from app.schemas.patient import PatientInput
from app.core.config import settings
from ml.explain import get_patient_shap, generate_clinical_narrative

router = APIRouter()
models_dir = Path(__file__).parent.parent.parent / "models"
models = {}

# Preload models on startup to avoid loading per request
for target in settings.TARGETS:
    model_path = models_dir / f"{target}.joblib"
    if model_path.exists():
        models[target] = joblib.load(model_path)

@router.post("/predict", summary="Predict 3D Cardiac Blockage Risk")
def predict_risk(patient: PatientInput) -> Dict[str, Any]:
    """
    Accepts patient biomarkers and predicts the risk probability for all 4 coronary targets.
    Returns probabilities and clinical narratives for the 3D heart UI.
    """
    # Convert Pydantic model to DataFrame using the true aliases (feature names)
    data = patient.model_dump(by_alias=True)
    df = pd.DataFrame([data])
    
    # Pre-map common strings dynamically if frontend sends Y/N
    df = df.replace({"Y": 1, "N": 0, "Male": 1, "Fmale": 0, "Female": 0})
    if "VHD" in df.columns:
        df["VHD"] = df["VHD"].replace({0: "N"}).astype(str)

    results = {}
    
    for target in settings.TARGETS:
        if target not in models:
            raise HTTPException(status_code=500, detail=f"Model for {target} not loaded.")
            
        model = models[target]
        
        # Predict probability of blockage (class 1)
        proba = float(model.predict_proba(df)[0][1])
        
        # Explainability
        shap_dict = get_patient_shap(df, target=target)
        narrative = generate_clinical_narrative(shap_dict, top_k=3)
        
        results[target] = {
            "probability": proba,
            "top_factors": shap_dict,
            "narrative": narrative
        }

    return {
        "status": "success",
        "patient_id": "anon",
        "predictions": results
    }

@router.get("/schema", summary="Get required features schema")
def get_schema():
    """
    Returns the required feature schema to help frontend dynamically build forms.
    """
    return PatientInput.model_json_schema()

@router.get("/metrics", summary="Get model performance metrics")
def get_metrics():
    """
    Returns the pre-calculated training metrics (accuracy, ROC-AUC) for the frontend dashboard.
    """
    import json
    metrics_file = models_dir / "metrics.json"
    if not metrics_file.exists():
        raise HTTPException(status_code=404, detail="Metrics file not found. Run training first.")
    with open(metrics_file, "r") as f:
        return json.load(f)

@router.get("/patients", summary="Get sample patients")
def get_patients():
    """
    Returns a few sample patient profiles for the 'Load Sample' feature in the UI.
    """
    try:
        df = pd.read_csv(Path(__file__).parent.parent.parent / "data" / "dataset.csv")
        from ml.preprocess import normalize_columns
        df = normalize_columns(df)
        
        # Take two diverse patients (e.g., Patient 0 is high risk CAD, Patient 4 is low risk)
        samples = df.iloc[[0, 4]].copy()
        
        # Fill NaNs if any exist to prevent JSON errors
        samples = samples.fillna(0)
        
        # Convert to list of dicts
        records = samples.to_dict(orient="records")
        return {"patients": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load sample patients: {str(e)}")
