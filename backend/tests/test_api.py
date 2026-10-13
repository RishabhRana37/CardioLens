import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from app.main import app

client = TestClient(app)

SAMPLE_FEATURES = {
    "Age": 62,
    "Sex": 1,
    "Weight": 84,
    "Height": 174,
    "BMI": 27.7,
    "DM": 1,
    "HTN": 1,
    "Current Smoker": 1,
    "Ex-Smoker": 0,
    "FH": 1,
    "Obesity": 0,
    "CRF": 0,
    "CVA": 0,
    "Airway disease": 0,
    "Thyroid Disease": 0,
    "CHF": 0,
    "DLP": 1,
    "BP": 150,
    "PR": 78,
    "Edema": 0,
    "Weak Peripheral Pulse": 0,
    "Lung rales": 0,
    "Systolic Murmur": 0,
    "Diastolic Murmur": 0,
    "Typical Chest Pain": 1,
    "Dyspnea": 1,
    "Function Class": 3,
    "Atypical": 0,
    "Nonanginal CP": 0,
    "Exertional CP": 1,
    "LowTH Ang": 1,
    "Q Wave": 1,
    "ST Elevation": 1,
    "ST Depression": 0,
    "T inversion": 1,
    "LVH": 1,
    "Poor R Progression": 1,
    "FBS": 165,
    "Cr": 1.2,
    "TG": 245,
    "LDL": 178,
    "HDL": 32,
    "BUN": 22,
    "ESR": 28,
    "HB": 13.8,
    "K": 4.4,
    "Na": 139,
    "WBC": 8.9,
    "Lymph": 22,
    "Neut": 72,
    "PLT": 260,
    "EF-TTE": 38,
    "Region with RWMA": 3,
    "VHD": "Moderate"
}

def test_health_endpoints():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "models_loaded" in data
    assert set(data["models_loaded"]) == {"CAD", "LAD", "LCX", "RCA"}

    res_v1 = client.get("/api/v1/health")
    assert res_v1.status_code == 200
    assert res_v1.json()["status"] == "ok"

def test_schema_endpoint():
    res = client.get("/api/v1/schema")
    assert res.status_code == 200
    data = res.json()
    assert "total_features" in data
    assert "groups" in data
    assert "features" in data
    assert len(data["features"]) >= 54
    assert "Demographic" in data["groups"]

def test_patients_endpoints():
    res = client.get("/api/v1/patients")
    assert res.status_code == 200
    patients = res.json()
    assert isinstance(patients, list)
    assert len(patients) >= 8
    p1 = patients[0]
    assert "id" in p1
    assert "summary" in p1
    assert "actual_cad" in p1
    assert "risk_tier" in p1

    # Test single patient detail
    detail_res = client.get(f"/api/v1/patients/{p1['id']}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert "features" in detail
    assert "Age" in detail["features"]

def test_predict_nested():
    # Frontend format: { "features": { ... } }
    res = client.post("/api/v1/predict", json={"features": SAMPLE_FEATURES})
    assert res.status_code == 200
    data = res.json()
    assert "predictions" in data
    assert "CAD" in data["predictions"]
    assert "LAD" in data["predictions"]
    assert "LCX" in data["predictions"]
    assert "RCA" in data["predictions"]

    for target in ["CAD", "LAD", "LCX", "RCA"]:
        pred = data["predictions"][target]
        assert "label" in pred
        assert "probability" in pred
        assert "confidence" in pred
        assert 0.0 <= pred["probability"] <= 1.0
        assert 0.0 <= pred["confidence"] <= 1.0
        assert "confidence_interval_95" in pred
        assert len(pred["confidence_interval_95"]) == 2
        assert "uncertainty_std" in pred
        assert "uncertainty_level" in pred
        assert pred["uncertainty_level"] in ["low", "moderate", "elevated"]

    assert "data_quality" in data
    assert data["data_quality"]["is_in_distribution"] is True
    assert "regulatory_context" in data
    assert "device_classification" in data["regulatory_context"]

def test_predict_flat():
    # Direct format: { "Age": 62, ... }
    res = client.post("/api/v1/predict", json=SAMPLE_FEATURES)
    assert res.status_code == 200
    data = res.json()
    assert "predictions" in data
    assert "CAD" in data["predictions"]

def test_predict_partial_features():
    # Only send 4 features; backend must auto-impute defaults and return 200 without crashing
    res = client.post("/api/v1/predict", json={
        "features": {
            "Age": 62,
            "BP": 150,
            "LDL": 178,
            "Typical Chest Pain": 1
        }
    })
    assert res.status_code == 200
    data = res.json()
    assert "predictions" in data
    assert "CAD" in data["predictions"]
    assert len(data.get("warnings", [])) > 0

def test_explain_partial_features():
    res = client.post("/api/v1/explain", json={
        "features": {
            "Age": 62,
            "BP": 150,
            "LDL": 178,
            "Typical Chest Pain": 1
        },
        "target": "LAD"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["target"] == "LAD"
    assert "contributions" in data
    assert "narrative" in data

def test_explain_endpoint():
    res = client.post("/api/v1/explain", json={
        "features": SAMPLE_FEATURES,
        "target": "LAD"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["target"] == "LAD"
    assert "base_value" in data
    assert "prediction" in data
    assert "contributions" in data
    assert "narrative" in data
    assert isinstance(data["contributions"], list)
    assert len(data["contributions"]) > 0

    c0 = data["contributions"][0]
    assert "feature" in c0
    assert "value" in c0
    assert "shap" in c0
    assert "direction" in c0
    assert c0["direction"] in ["increases", "decreases"]
    assert "population_reference" in c0

def test_metrics_endpoint():
    res = client.get("/api/v1/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "CAD" in data
    assert "accuracy" in data["CAD"]
    assert "roc_auc" in data["CAD"]
    assert "plots" in data["CAD"]
    assert "top_features" in data["CAD"]

def test_cohorts_endpoint():
    res = client.get("/api/v1/cohorts")
    assert res.status_code == 200
    data = res.json()
    assert "primary_cohort" in data
    assert "simulation_cohort" in data
    assert data["primary_cohort"]["size"] == 303
    assert data["simulation_cohort"]["size"] == 50000
    assert "summary" in data

def test_compliance_endpoint():
    res = client.get("/api/v1/compliance")
    assert res.status_code == 200
    data = res.json()
    assert "device_classification" in data
    assert "clinical_disclaimer" in data
    assert "anti_leakage_guarantee" in data

def test_sensor_outlier_detection():
    # Send impossible sensor values (e.g. BP=350, Age=150)
    res = client.post("/api/v1/predict", json={
        "features": {
            "Age": 150,
            "BP": 350,
            "EF-TTE": 50
        }
    })
    assert res.status_code == 200
    data = res.json()
    assert "data_quality" in data
    assert data["data_quality"]["is_in_distribution"] is False
    assert len(data["data_quality"]["extreme_biomarkers"]) >= 2
    assert len(data["warnings"]) > 0


