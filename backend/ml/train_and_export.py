"""
CardioTwin Model Training & Static Artifacts Export Pipeline.
Trains leakage-safe calibrated models for CAD, LAD, LCX, RCA.
Evaluates LR, Random Forest, and XGBoost using Stratified 10-Fold CV.
Exports:
  - per-target JSON models (cad.json, lad.json, lcx.json, rca.json, models.json)
  - feature_schema.json
  - population_reference.json
  - metrics.json (all candidate models + CV stats)
  - curve plots (ROC, Calibration, Confusion Matrix, Model Comparison)
"""

import json
import os
import warnings
warnings.filterwarnings("ignore")

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier

# Constants
RANDOM_STATE = 42
DATA_PATH = "/Users/rana/Documents/CardioLens/backend/data/z_alizadeh_sani.csv"
OUTPUT_DIR = "/Users/rana/Documents/CardioLens/frontend/public/model"
PLOTS_DIR = os.path.join(OUTPUT_DIR, "plots")

os.makedirs(PLOTS_DIR, exist_ok=True)

# Feature Taxonomy (55 non-leakage features)
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

TARGET_INFO = {
    "CAD": {
        "source_col": "Cath",
        "pos_label": "CAD",
        "mapping": {"CAD": 1, "Normal": 0},
        "c_param": 0.2,
        "display_name": "Coronary Artery Disease (Overall CAD)"
    },
    "LAD": {
        "source_col": "LAD",
        "pos_label": "Stenotic",
        "mapping": {"Stenotic": 1, "Normal": 0},
        "c_param": 0.1,
        "display_name": "Left Anterior Descending (LAD) Stenosis"
    },
    "LCX": {
        "source_col": "LCX",
        "pos_label": "Stenotic",
        "mapping": {"Stenotic": 1, "Normal": 0},
        "c_param": 0.03,
        "display_name": "Left Circumflex (LCX) Stenosis"
    },
    "RCA": {
        "source_col": "RCA",
        "pos_label": "Stenotic",
        "mapping": {"Stenotic": 1, "Normal": 0},
        "c_param": 0.1,
        "display_name": "Right Coronary Artery (RCA) Stenosis"
    }
}


def build_preprocessor():
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_COLS + ORDINAL_COLS),
            ("bin", "passthrough", BINARY_COLS),
            ("cat", OneHotEncoder(drop=None, sparse_output=False, handle_unknown="ignore"), NOMINAL_COLS)
        ]
    )


def compute_population_reference(df: pd.DataFrame) -> dict:
    pop_ref = {}
    for col in NUMERIC_COLS + ORDINAL_COLS:
        series = df[col].astype(float)
        pop_ref[col] = {
            "type": "numeric" if col in NUMERIC_COLS else "ordinal",
            "mean": round(float(series.mean()), 2),
            "std": round(float(series.std()), 2),
            "median": round(float(series.median()), 2),
            "min": round(float(series.min()), 2),
            "max": round(float(series.max()), 2),
            "q25": round(float(series.quantile(0.25)), 2),
            "q75": round(float(series.quantile(0.75)), 2),
            "display": f"Mean {series.mean():.1f} (SD {series.std():.1f})"
        }
    for col in BINARY_COLS:
        series = df[col].astype(float)
        pos_rate = float(series.mean())
        pct = round(pos_rate * 100, 1)
        pop_ref[col] = {
            "type": "binary",
            "prevalence": round(pos_rate, 3),
            "display": f"{pct}% prevalence ({int(series.sum())}/{len(series)})"
        }
    for col in NOMINAL_COLS:
        counts = df[col].value_counts().to_dict()
        total = len(df[col])
        freqs = {k: round(v / total, 3) for k, v in counts.items()}
        pop_ref[col] = {
            "type": "nominal",
            "distribution": freqs,
            "display": ", ".join([f"{k}: {int(v*100)}%" for k, v in freqs.items()])
        }
    return pop_ref


def build_feature_schema(df: pd.DataFrame) -> dict:
    features_list = [
        # Demographic
        {"name": "Age", "label": "Age", "type": "numeric", "group": "Demographic", "unit": "years", "min": 30, "max": 86, "default": 58, "modifiable": False, "description": "Patient age in years"},
        {"name": "Sex", "label": "Sex", "type": "binary", "group": "Demographic", "options": ["Female (0)", "Male (1)"], "default": 1, "modifiable": False, "description": "Biological sex (1=Male, 0=Female)"},
        {"name": "Weight", "label": "Weight", "type": "numeric", "group": "Demographic", "unit": "kg", "min": 48, "max": 120, "default": 76, "modifiable": True, "description": "Body weight in kilograms"},
        {"name": "Height", "label": "Height", "type": "numeric", "group": "Demographic", "unit": "cm", "min": 140, "max": 195, "default": 172, "modifiable": False, "description": "Standing height in centimeters"},
        {"name": "BMI", "label": "BMI", "type": "numeric", "group": "Demographic", "unit": "kg/m²", "min": 18, "max": 42, "default": 25.7, "modifiable": True, "description": "Body Mass Index"},
        {"name": "DM", "label": "Diabetes Mellitus", "type": "binary", "group": "Demographic", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": True, "description": "Documented diabetes mellitus"},
        {"name": "HTN", "label": "Hypertension", "type": "binary", "group": "Demographic", "options": ["No (0)", "Yes (1)"], "default": 1, "modifiable": True, "description": "Chronic arterial hypertension"},
        {"name": "Current Smoker", "label": "Current Smoker", "type": "binary", "group": "Demographic", "options": ["No (0)", "Yes (1)"], "default": 1, "modifiable": True, "description": "Active tobacco smoking"},
        {"name": "Ex-Smoker", "label": "Ex-Smoker", "type": "binary", "group": "Demographic", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Previous smoking history"},
        {"name": "FH", "label": "Family History of CAD", "type": "binary", "group": "Demographic", "options": ["No (0)", "Yes (1)"], "default": 1, "modifiable": False, "description": "Early coronary artery disease in first-degree relative"},
        {"name": "Obesity", "label": "Obesity Status", "type": "binary", "group": "Demographic", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": True, "description": "Clinical obesity (BMI >= 30)"},
        {"name": "CRF", "label": "Chronic Renal Failure", "type": "binary", "group": "Demographic", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Chronic kidney impairment"},
        {"name": "CVA", "label": "Cerebrovascular Accident", "type": "binary", "group": "Demographic", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Prior stroke or transient ischemic attack"},
        {"name": "Airway disease", "label": "Airway Disease", "type": "binary", "group": "Demographic", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Chronic obstructive pulmonary disease or asthma"},
        {"name": "Thyroid Disease", "label": "Thyroid Disease", "type": "binary", "group": "Demographic", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Documented thyroid endocrinopathy"},
        {"name": "CHF", "label": "Congestive Heart Failure", "type": "binary", "group": "Demographic", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Documented heart failure syndrome"},
        {"name": "DLP", "label": "Dyslipidemia", "type": "binary", "group": "Demographic", "options": ["No (0)", "Yes (1)"], "default": 1, "modifiable": True, "description": "Serum dyslipidemia"},

        # Symptom & Examination
        {"name": "BP", "label": "Systolic Blood Pressure", "type": "numeric", "group": "Symptom & Examination", "unit": "mmHg", "min": 90, "max": 200, "default": 135, "modifiable": True, "description": "Resting systolic blood pressure"},
        {"name": "PR", "label": "Pulse Rate", "type": "numeric", "group": "Symptom & Examination", "unit": "bpm", "min": 50, "max": 125, "default": 74, "modifiable": True, "description": "Resting heart rate in beats per minute"},
        {"name": "Edema", "label": "Peripheral Edema", "type": "binary", "group": "Symptom & Examination", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Dependent lower extremity swelling"},
        {"name": "Weak Peripheral Pulse", "label": "Weak Peripheral Pulse", "type": "binary", "group": "Symptom & Examination", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Diminished dorsalis pedis or radial pulse"},
        {"name": "Lung rales", "label": "Lung Rales / Crackles", "type": "binary", "group": "Symptom & Examination", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Auscultatory crackles in basal lung fields"},
        {"name": "Systolic Murmur", "label": "Systolic Murmur", "type": "binary", "group": "Symptom & Examination", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Systolic cardiac murmur"},
        {"name": "Diastolic Murmur", "label": "Diastolic Murmur", "type": "binary", "group": "Symptom & Examination", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Diastolic cardiac murmur"},
        {"name": "Typical Chest Pain", "label": "Typical Anginal Chest Pain", "type": "binary", "group": "Symptom & Examination", "options": ["No (0)", "Yes (1)"], "default": 1, "modifiable": True, "description": "Substernal pressure exacerbated by effort, relieved by rest/nitrates"},
        {"name": "Dyspnea", "label": "Exertional Dyspnea", "type": "binary", "group": "Symptom & Examination", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": True, "description": "Shortness of breath on mild to moderate exertion"},
        {"name": "Function Class", "label": "NYHA Function Class", "type": "ordinal", "group": "Symptom & Examination", "min": 0, "max": 4, "default": 2, "modifiable": True, "description": "New York Heart Association functional classification"},
        {"name": "Atypical", "label": "Atypical Chest Pain", "type": "binary", "group": "Symptom & Examination", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Atypical angina presentation"},
        {"name": "Nonanginal CP", "label": "Non-Anginal Chest Pain", "type": "binary", "group": "Symptom & Examination", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Pleuritic or musculoskeletal chest pain"},
        {"name": "Exertional CP", "label": "Exertional Chest Pain", "type": "binary", "group": "Symptom & Examination", "options": ["No (0)", "Yes (1)"], "default": 1, "modifiable": True, "description": "Pain occurring strictly upon physical exertion"},
        {"name": "LowTH Ang", "label": "Low-Threshold Angina", "type": "binary", "group": "Symptom & Examination", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Angina provoked by minimal physical activity"},

        # ECG
        {"name": "Rhythm", "label": "ECG Rhythm", "type": "nominal", "group": "ECG", "options": ["Sinus (NSR)", "LBBB", "RBBB"], "default": "Sinus (NSR)", "modifiable": False, "description": "Resting ECG rhythm"},
        {"name": "Q Wave", "label": "Pathological Q Wave", "type": "binary", "group": "ECG", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Infarct-associated pathologic Q waves"},
        {"name": "ST Elevation", "label": "ST Segment Elevation", "type": "binary", "group": "ECG", "options": ["No (0)", "Yes (1)"], "default": 1, "modifiable": False, "description": "Acute epicardial injury ST elevation"},
        {"name": "ST Depression", "label": "ST Segment Depression", "type": "binary", "group": "ECG", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Subendocardial ischemia ST depression"},
        {"name": "T inversion", "label": "T Wave Inversion", "type": "binary", "group": "ECG", "options": ["No (0)", "Yes (1)"], "default": 1, "modifiable": False, "description": "Ischemia-related T-wave inversion"},
        {"name": "LVH", "label": "Left Ventricular Hypertrophy", "type": "binary", "group": "ECG", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Voltage-based LVH criteria"},
        {"name": "Poor R Progression", "label": "Poor R Wave Progression", "type": "binary", "group": "ECG", "options": ["No (0)", "Yes (1)"], "default": 0, "modifiable": False, "description": "Anterior chest leads R-wave deficit"},

        # Laboratory & Echo
        {"name": "FBS", "label": "Fasting Blood Sugar", "type": "numeric", "group": "Laboratory & Echo", "unit": "mg/dL", "min": 60, "max": 350, "default": 112, "modifiable": True, "description": "Fasting blood glucose"},
        {"name": "Cr", "label": "Serum Creatinine", "type": "numeric", "group": "Laboratory & Echo", "unit": "mg/dL", "min": 0.5, "max": 4.5, "default": 1.0, "modifiable": False, "description": "Serum creatinine level"},
        {"name": "TG", "label": "Triglycerides", "type": "numeric", "group": "Laboratory & Echo", "unit": "mg/dL", "min": 40, "max": 600, "default": 175, "modifiable": True, "description": "Serum triglyceride level"},
        {"name": "LDL", "label": "LDL Cholesterol", "type": "numeric", "group": "Laboratory & Echo", "unit": "mg/dL", "min": 30, "max": 280, "default": 154, "modifiable": True, "description": "Low-density lipoprotein cholesterol"},
        {"name": "HDL", "label": "HDL Cholesterol", "type": "numeric", "group": "Laboratory & Echo", "unit": "mg/dL", "min": 15, "max": 95, "default": 38, "modifiable": True, "description": "High-density lipoprotein cholesterol"},
        {"name": "BUN", "label": "Blood Urea Nitrogen", "type": "numeric", "group": "Laboratory & Echo", "unit": "mg/dL", "min": 5, "max": 70, "default": 16, "modifiable": False, "description": "Blood urea nitrogen concentration"},
        {"name": "ESR", "label": "Erythrocyte Sed. Rate", "type": "numeric", "group": "Laboratory & Echo", "unit": "mm/hr", "min": 1, "max": 90, "default": 14, "modifiable": False, "description": "Erythrocyte sedimentation rate"},
        {"name": "HB", "label": "Hemoglobin", "type": "numeric", "group": "Laboratory & Echo", "unit": "g/dL", "min": 8, "max": 19, "default": 14.2, "modifiable": False, "description": "Blood hemoglobin concentration"},
        {"name": "K", "label": "Serum Potassium", "type": "numeric", "group": "Laboratory & Echo", "unit": "mEq/L", "min": 2.8, "max": 6.2, "default": 4.3, "modifiable": False, "description": "Serum potassium level"},
        {"name": "Na", "label": "Serum Sodium", "type": "numeric", "group": "Laboratory & Echo", "unit": "mEq/L", "min": 125, "max": 152, "default": 140, "modifiable": False, "description": "Serum sodium concentration"},
        {"name": "WBC", "label": "White Blood Cell Count", "type": "numeric", "group": "Laboratory & Echo", "unit": "x10³/µL", "min": 3.0, "max": 20.0, "default": 7.2, "modifiable": False, "description": "Total leukocyte count"},
        {"name": "Lymph", "label": "Lymphocytes", "type": "numeric", "group": "Laboratory & Echo", "unit": "%", "min": 5, "max": 60, "default": 30, "modifiable": False, "description": "Differential lymphocyte percentage"},
        {"name": "Neut", "label": "Neutrophils", "type": "numeric", "group": "Laboratory & Echo", "unit": "%", "min": 25, "max": 85, "default": 62, "modifiable": False, "description": "Differential neutrophil percentage"},
        {"name": "PLT", "label": "Platelet Count", "type": "numeric", "group": "Laboratory & Echo", "unit": "x10³/µL", "min": 80, "max": 550, "default": 220, "modifiable": False, "description": "Platelet count"},
        {"name": "EF-TTE", "label": "Ejection Fraction (EF-TTE)", "type": "numeric", "group": "Laboratory & Echo", "unit": "%", "min": 15, "max": 70, "default": 45, "modifiable": True, "description": "Echocardiographic left ventricular ejection fraction"},
        {"name": "Region with RWMA", "label": "Regional Wall Motion Abnormality", "type": "ordinal", "group": "Laboratory & Echo", "min": 0, "max": 4, "default": 2, "modifiable": False, "description": "Number of myocardial segments with RWMA"},
        {"name": "VHD", "label": "Valvular Heart Disease", "type": "nominal", "group": "Laboratory & Echo", "options": ["Normal", "Mild", "Moderate", "Severe"], "default": "Mild", "modifiable": False, "description": "Valvular dysfunction severity"}
    ]
    return {
        "total_features": len(features_list),
        "groups": ["Demographic", "Symptom & Examination", "ECG", "Laboratory & Echo"],
        "features": features_list
    }


def plot_roc_curve(y_true, lr_probs, rf_probs, xgb_probs, target_key, target_title, out_path):
    plt.figure(figsize=(6, 5), dpi=150)
    
    fpr_lr, tpr_lr, _ = roc_curve(y_true, lr_probs)
    auc_lr = roc_auc_score(y_true, lr_probs)
    
    fpr_rf, tpr_rf, _ = roc_curve(y_true, rf_probs)
    auc_rf = roc_auc_score(y_true, rf_probs)
    
    fpr_xgb, tpr_xgb, _ = roc_curve(y_true, xgb_probs)
    auc_xgb = roc_auc_score(y_true, xgb_probs)
    
    plt.plot(fpr_lr, tpr_lr, color="#14b8a6", lw=2.2, label=f"Calibrated LR (Served, AUC = {auc_lr:.3f})")
    plt.plot(fpr_rf, tpr_rf, color="#3b82f6", lw=1.8, linestyle="--", label=f"Random Forest (AUC = {auc_rf:.3f})")
    plt.plot(fpr_xgb, tpr_xgb, color="#f59e0b", lw=1.8, linestyle=":", label=f"XGBoost (AUC = {auc_xgb:.3f})")
    plt.plot([0, 1], [0, 1], color="#64748b", linestyle="--", lw=1, alpha=0.6)
    
    plt.xlim([-0.02, 1.02])
    plt.ylim([-0.02, 1.05])
    plt.xlabel("False Positive Rate (1 - Specificity)", fontsize=10, fontweight="bold", color="#1e293b")
    plt.ylabel("True Positive Rate (Sensitivity)", fontsize=10, fontweight="bold", color="#1e293b")
    plt.title(f"ROC Curve — {target_title}", fontsize=11, fontweight="bold", color="#0f172a")
    plt.legend(loc="lower right", framealpha=0.9, fontsize=8)
    plt.grid(True, linestyle=":", alpha=0.5)
    plt.tight_layout()
    plt.savefig(out_path)
    plt.close()


def plot_calibration_curve(y_true, lr_probs, target_title, out_path):
    plt.figure(figsize=(6, 5), dpi=150)
    prob_true, prob_pred = calibration_curve(y_true, lr_probs, n_bins=8, strategy="uniform")
    
    plt.plot(prob_pred, prob_true, marker="o", color="#14b8a6", lw=2, label="Calibrated LR (Platt Sigmoid)")
    plt.plot([0, 1], [0, 1], linestyle="--", color="#64748b", lw=1.2, label="Perfect Calibration")
    
    plt.xlim([-0.02, 1.02])
    plt.ylim([-0.02, 1.05])
    plt.xlabel("Mean Predicted Probability", fontsize=10, fontweight="bold", color="#1e293b")
    plt.ylabel("Fraction of Positives", fontsize=10, fontweight="bold", color="#1e293b")
    plt.title(f"Reliability Diagram — {target_title}", fontsize=11, fontweight="bold", color="#0f172a")
    plt.legend(loc="upper left", framealpha=0.9, fontsize=8)
    plt.grid(True, linestyle=":", alpha=0.5)
    plt.tight_layout()
    plt.savefig(out_path)
    plt.close()


def plot_confusion_matrix(y_true, y_pred, target_key, target_title, out_path):
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(5, 4.5), dpi=150)
    plt.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
    plt.title(f"Confusion Matrix — {target_title}", fontsize=11, fontweight="bold", color="#0f172a")
    plt.colorbar()
    
    classes = ["Normal", "Positive" if target_key == "CAD" else "Stenotic"]
    tick_marks = np.arange(len(classes))
    plt.xticks(tick_marks, classes, fontsize=9)
    plt.yticks(tick_marks, classes, fontsize=9)
    
    thresh = cm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(
                j, i, format(cm[i, j], "d"),
                ha="center", va="center",
                color="white" if cm[i, j] > thresh else "black",
                fontweight="bold"
            )
            
    plt.ylabel("True Class", fontsize=10, fontweight="bold")
    plt.xlabel("Predicted Class", fontsize=10, fontweight="bold")
    plt.tight_layout()
    plt.savefig(out_path)
    plt.close()


def plot_model_comparison(comparison_data, out_path):
    targets = list(comparison_data.keys())
    lr_scores = [comparison_data[t]["lr"]["roc_auc"] for t in targets]
    rf_scores = [comparison_data[t]["rf"]["roc_auc"] for t in targets]
    xgb_scores = [comparison_data[t]["xgb"]["roc_auc"] for t in targets]
    
    x = np.arange(len(targets))
    width = 0.25
    
    plt.figure(figsize=(8, 5), dpi=150)
    plt.bar(x - width, lr_scores, width, label="Calibrated LR (Served)", color="#14b8a6")
    plt.bar(x, rf_scores, width, label="Random Forest", color="#3b82f6")
    plt.bar(x + width, xgb_scores, width, label="XGBoost", color="#f59e0b")
    
    plt.ylabel("Mean 10-Fold CV ROC-AUC", fontsize=10, fontweight="bold")
    plt.title("Cross-Validated ROC-AUC Across Targets & Architectures", fontsize=12, fontweight="bold")
    plt.xticks(x, targets, fontsize=10, fontweight="bold")
    plt.ylim([0.5, 1.0])
    plt.legend(loc="lower right")
    plt.grid(axis="y", linestyle=":", alpha=0.6)
    
    for i in range(len(targets)):
        plt.text(i - width, lr_scores[i] + 0.01, f"{lr_scores[i]:.2f}", ha="center", fontsize=8, fontweight="bold")
        plt.text(i, rf_scores[i] + 0.01, f"{rf_scores[i]:.2f}", ha="center", fontsize=8)
        plt.text(i + width, xgb_scores[i] + 0.01, f"{xgb_scores[i]:.2f}", ha="center", fontsize=8)
        
    plt.tight_layout()
    plt.savefig(out_path)
    plt.close()


def main():
    print("=== CardioTwin Model Training & Static Artifacts Export Pipeline ===")
    
    # 1. Load data
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} rows from {DATA_PATH}")
    
    # 2. Leakage Guard verification
    X = df.drop(columns=LEAKAGE_COLS, errors="raise")
    assert not (set(LEAKAGE_COLS) & set(X.columns)), "LEAKAGE: forbidden target col in X"
    assert X.shape[1] == 55, f"Expected 55 features, found {X.shape[1]}"
    print("Zero leakage verified: X contains exactly 55 clean clinical features.")
    
    # 3. Export feature_schema.json
    schema = build_feature_schema(df)
    schema_path = os.path.join(OUTPUT_DIR, "feature_schema.json")
    with open(schema_path, "w") as f:
        json.dump(schema, f, indent=2)
    print(f"Exported feature schema: {schema_path} ({schema['total_features']} features)")
    
    # 4. Export population_reference.json
    pop_ref = compute_population_reference(df)
    pop_ref_path = os.path.join(OUTPUT_DIR, "population_reference.json")
    with open(pop_ref_path, "w") as f:
        json.dump(pop_ref, f, indent=2)
    print(f"Exported population references: {pop_ref_path}")
    
    # 5. Model Training & Evaluation per target
    cv = StratifiedKFold(n_splits=10, shuffle=True, random_state=RANDOM_STATE)
    
    all_metrics = {}
    comparison_summary = {}
    exported_models = {}
    
    for target_key, tinfo in TARGET_INFO.items():
        print(f"\n--- Training & Evaluating Target: {target_key} ({tinfo['display_name']}) ---")
        y = df[tinfo["source_col"]].map(tinfo["mapping"]).astype(int)
        
        # Prepare pipeline
        prep = build_preprocessor()
        c_val = tinfo["c_param"]
        base_lr = LogisticRegression(C=c_val, class_weight="balanced", max_iter=1000, random_state=RANDOM_STATE)
        cal_lr = CalibratedClassifierCV(estimator=base_lr, method="sigmoid", cv=3, ensemble=False)
        pipe_lr = Pipeline([("prep", prep), ("clf", cal_lr)])
        
        # Candidate 2: Random Forest
        pipe_rf = Pipeline([
            ("prep", build_preprocessor()),
            ("clf", RandomForestClassifier(class_weight="balanced", n_estimators=100, random_state=RANDOM_STATE, max_depth=5))
        ])
        
        # Candidate 3: XGBoost
        scale_pos = (len(y) - sum(y)) / sum(y)
        pipe_xgb = Pipeline([
            ("prep", build_preprocessor()),
            ("clf", XGBClassifier(
                scale_pos_weight=scale_pos,
                n_estimators=100,
                max_depth=3,
                learning_rate=0.05,
                random_state=RANDOM_STATE,
                eval_metric="logloss"
            ))
        ])
        
        # 10-Fold CV evaluation for all 3 models
        scoring = ["roc_auc", "accuracy", "f1", "precision", "recall"]
        cv_res_lr = cross_validate(pipe_lr, X, y, cv=cv, scoring=scoring)
        cv_res_rf = cross_validate(pipe_rf, X, y, cv=cv, scoring=scoring)
        cv_res_xgb = cross_validate(pipe_xgb, X, y, cv=cv, scoring=scoring)
        
        # Out-of-fold predictions for curves
        oof_prob_lr = cross_val_predict(pipe_lr, X, y, cv=cv, method="predict_proba")[:, 1]
        oof_prob_rf = cross_val_predict(pipe_rf, X, y, cv=cv, method="predict_proba")[:, 1]
        oof_prob_xgb = cross_val_predict(pipe_xgb, X, y, cv=cv, method="predict_proba")[:, 1]
        oof_pred_lr = (oof_prob_lr >= 0.5).astype(int)
        
        lr_mean_auc = float(cv_res_lr["test_roc_auc"].mean())
        lr_std_auc = float(cv_res_lr["test_roc_auc"].std())
        rf_mean_auc = float(cv_res_rf["test_roc_auc"].mean())
        xgb_mean_auc = float(cv_res_xgb["test_roc_auc"].mean())
        best_tree_auc = max(rf_mean_auc, xgb_mean_auc)
        diff_auc = best_tree_auc - lr_mean_auc
        
        print(f"  Calibrated LR ROC-AUC: {lr_mean_auc:.4f} +/- {lr_std_auc:.4f}")
        print(f"  Random Forest ROC-AUC: {rf_mean_auc:.4f} +/- {cv_res_rf['test_roc_auc'].std():.4f}")
        print(f"  XGBoost       ROC-AUC: {xgb_mean_auc:.4f} +/- {cv_res_xgb['test_roc_auc'].std():.4f}")
        print(f"  Best Tree AUC: {best_tree_auc:.4f} (Diff Tree - LR: {diff_auc:+.4f})")
        
        comparison_summary[target_key] = {
            "lr": {"roc_auc": round(lr_mean_auc, 3), "f1": round(float(cv_res_lr["test_f1"].mean()), 3)},
            "rf": {"roc_auc": round(rf_mean_auc, 3), "f1": round(float(cv_res_rf["test_f1"].mean()), 3)},
            "xgb": {"roc_auc": round(xgb_mean_auc, 3), "f1": round(float(cv_res_xgb["test_f1"].mean()), 3)},
        }
        
        # Fit final served model on entire dataset for static inference export
        pipe_lr.fit(X, y)
        
        # Generate and save plots
        roc_plot_name = f"{target_key}_roc.png"
        cal_plot_name = f"{target_key}_calibration.png"
        cm_plot_name = f"{target_key}_confusion.png"
        
        plot_roc_curve(y, oof_prob_lr, oof_prob_rf, oof_prob_xgb, target_key, tinfo["display_name"], os.path.join(PLOTS_DIR, roc_plot_name))
        plot_calibration_curve(y, oof_prob_lr, tinfo["display_name"], os.path.join(PLOTS_DIR, cal_plot_name))
        plot_confusion_matrix(y, oof_pred_lr, target_key, tinfo["display_name"], os.path.join(PLOTS_DIR, cm_plot_name))
        
        # Extract parameters for in-browser JavaScript inference:
        fitted_prep = pipe_lr.named_steps["prep"]
        num_transformer = fitted_prep.named_transformers_["num"]
        num_means = {col: float(m) for col, m in zip(NUMERIC_COLS + ORDINAL_COLS, num_transformer.mean_)}
        num_stds = {col: float(s) for col, s in zip(NUMERIC_COLS + ORDINAL_COLS, np.sqrt(num_transformer.var_))}
        
        cat_transformer = fitted_prep.named_transformers_["cat"]
        nominal_categories = {col: cats.tolist() for col, cats in zip(NOMINAL_COLS, cat_transformer.categories_)}
        
        feature_order = fitted_prep.get_feature_names_out().tolist()
        
        fitted_clf = pipe_lr.named_steps["clf"]
        calibrated_model = fitted_clf.calibrated_classifiers_[0]
        base_estimator = calibrated_model.estimator
        calibrator = calibrated_model.calibrators[0]
        
        weights = base_estimator.coef_[0].tolist()
        intercept = float(base_estimator.intercept_[0])
        cal_a = float(calibrator.a_)
        cal_b = float(calibrator.b_)
        
        # Calculate feature importance for Model Trust
        feature_impact = []
        for feat_name, w in zip(feature_order, weights):
            clean_name = feat_name.replace("num__", "").replace("bin__", "").replace("cat__", "")
            feature_impact.append({"feature": clean_name, "raw_feature": feat_name, "importance": round(abs(float(w)), 4), "weight": round(float(w), 4)})
        feature_impact.sort(key=lambda x: x["importance"], reverse=True)
        top_features = feature_impact[:12]
        
        # Build per-target model spec
        model_spec = {
            "target": target_key,
            "display_name": tinfo["display_name"],
            "model_type": "LogisticRegression_Calibrated",
            "version": "1.0.0",
            "weights": weights,
            "intercept": intercept,
            "calibration": {
                "method": "sigmoid",
                "a": cal_a,
                "b": cal_b
            },
            "feature_order": feature_order,
            "preprocessing": {
                "numeric_means": num_means,
                "numeric_stds": num_stds,
                "binary_features": BINARY_COLS,
                "nominal_categories": nominal_categories
            },
            "performance": {
                "roc_auc": round(lr_mean_auc, 4),
                "roc_auc_std": round(lr_std_auc, 4),
                "accuracy": round(float(cv_res_lr["test_accuracy"].mean()), 4),
                "f1": round(float(cv_res_lr["test_f1"].mean()), 4),
                "precision": round(float(cv_res_lr["test_precision"].mean()), 4),
                "recall": round(float(cv_res_lr["test_recall"].mean()), 4)
            }
        }
        
        # Save individual target file (e.g. cad.json, lad.json)
        target_file = os.path.join(OUTPUT_DIR, f"{target_key.lower()}.json")
        with open(target_file, "w") as f:
            json.dump(model_spec, f, indent=2)
        print(f"  Exported per-target model spec: {target_file}")
        
        exported_models[target_key] = model_spec
        
        # Record metrics
        all_metrics[target_key] = {
            "accuracy": round(float(accuracy_score(y, oof_pred_lr)), 4),
            "precision": round(float(precision_score(y, oof_pred_lr)), 4),
            "recall": round(float(recall_score(y, oof_pred_lr)), 4),
            "f1": round(float(f1_score(y, oof_pred_lr)), 4),
            "roc_auc": round(float(roc_auc_score(y, oof_prob_lr)), 4),
            "cv": {
                "roc_auc_mean": round(lr_mean_auc, 4),
                "roc_auc_std": round(lr_std_auc, 4),
                "accuracy_mean": round(float(cv_res_lr["test_accuracy"].mean()), 4),
                "accuracy_std": round(float(cv_res_lr["test_accuracy"].std()), 4),
                "f1_mean": round(float(cv_res_lr["test_f1"].mean()), 4),
                "f1_std": round(float(cv_res_lr["test_f1"].std()), 4)
            },
            "candidate_models": {
                "LogisticRegression_Calibrated": {
                    "roc_auc": round(lr_mean_auc, 4),
                    "roc_auc_std": round(lr_std_auc, 4),
                    "f1": round(float(cv_res_lr["test_f1"].mean()), 4),
                    "accuracy": round(float(cv_res_lr["test_accuracy"].mean()), 4)
                },
                "RandomForest": {
                    "roc_auc": round(rf_mean_auc, 4),
                    "roc_auc_std": round(float(cv_res_rf["test_roc_auc"].std()), 4),
                    "f1": round(float(cv_res_rf["test_f1"].mean()), 4),
                    "accuracy": round(float(cv_res_rf["test_accuracy"].mean()), 4)
                },
                "XGBoost": {
                    "roc_auc": round(xgb_mean_auc, 4),
                    "roc_auc_std": round(float(cv_res_xgb["test_roc_auc"].std()), 4),
                    "f1": round(float(cv_res_xgb["test_f1"].mean()), 4),
                    "accuracy": round(float(cv_res_xgb["test_accuracy"].mean()), 4)
                }
            },
            "plots": {
                "roc": f"/model/plots/{roc_plot_name}",
                "calibration": f"/model/plots/{cal_plot_name}",
                "confusion": f"/model/plots/{cm_plot_name}"
            },
            "top_features": [{"feature": item["feature"], "importance": item["importance"]} for item in top_features]
        }

    # Export consolidated models.json
    models_bundle_path = os.path.join(OUTPUT_DIR, "models.json")
    with open(models_bundle_path, "w") as f:
        json.dump(exported_models, f, indent=2)
    print(f"\nExported consolidated models bundle: {models_bundle_path}")
    
    # Export metrics.json
    metrics_path = os.path.join(OUTPUT_DIR, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(all_metrics, f, indent=2)
    print(f"Exported all-model metrics: {metrics_path}")
    
    # Export comparison plot
    plot_model_comparison(comparison_summary, os.path.join(PLOTS_DIR, "model_comparison.png"))
    print(f"Exported model comparison plot: {os.path.join(PLOTS_DIR, 'model_comparison.png')}")
    
    print("\n✅ All static model artifacts successfully generated in /frontend/public/model/!")

if __name__ == "__main__":
    main()
