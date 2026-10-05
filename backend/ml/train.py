import pandas as pd
import numpy as np
from pathlib import Path
import json
import joblib
import sys
import matplotlib.pyplot as plt

from sklearn.model_selection import StratifiedKFold, cross_validate, cross_val_predict
from xgboost import XGBClassifier
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.pipeline import Pipeline
from sklearn.metrics import confusion_matrix, roc_curve, auc

backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from app.core.config import settings
from ml.preprocess import get_preprocessor, build_X, normalize_columns

TARGETS = settings.TARGETS

def train_and_evaluate():
    print("Starting Model Training Pipeline...")
    data_path = backend_dir / "data" / "dataset.csv"
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found at {data_path}")
        
    df = pd.read_csv(data_path)
    df = normalize_columns(df)
    
    # Strip target columns securely
    X = build_X(df)
    
    # Setup directories
    models_dir = backend_dir / "models"
    models_dir.mkdir(exist_ok=True)
    plots_dir = models_dir / "plots"
    plots_dir.mkdir(exist_ok=True)

    metrics_dict = {}

    for target in TARGETS:
        print(f"\n--- Training {target} Classifier ---")
        
        target_col = "Cath" if target == "CAD" else target
        y_raw = df[target_col]
        # Binarize targets: "CAD" or "Stenotic" -> 1, "Normal" -> 0
        y = np.where(y_raw.isin(["CAD", "Stenotic"]), 1, 0)
        
        # Calculate class imbalance ratio for scale_pos_weight
        num_neg = np.sum(y == 0)
        num_pos = np.sum(y == 1)
        scale_pos_weight = float(num_neg) / float(num_pos) if num_pos > 0 else 1.0

        # XGBoost tuned for a small tabular medical dataset (strong regularization)
        base_clf = XGBClassifier(
            n_estimators=150,
            max_depth=3,                 # Shallow trees to prevent overfitting
            learning_rate=0.05,          # Slower learning rate
            subsample=0.8,               # Row sampling
            colsample_bytree=0.8,        # Feature sampling
            min_child_weight=2,          # Require more samples in leaves
            random_state=settings.RANDOM_STATE, 
            scale_pos_weight=scale_pos_weight,
            eval_metric="logloss"
        )
        
        # 2. Probability Calibration (Crucial for 3D UI)
        clf = CalibratedClassifierCV(base_clf, method='sigmoid', cv=5)
        
        # 3. Pipeline
        pipeline = Pipeline(steps=[
            ("preprocessor", get_preprocessor()),
            ("classifier", clf)
        ])
        
        # 4. Stratified 10-fold Cross-Validation
        cv = StratifiedKFold(n_splits=10, shuffle=True, random_state=settings.RANDOM_STATE)
        
        scoring = ['roc_auc', 'f1', 'accuracy', 'precision', 'recall']
        cv_results = cross_validate(pipeline, X, y, cv=cv, scoring=scoring)
        
        # Out-of-fold predictions for curve plotting
        y_pred = cross_val_predict(pipeline, X, y, cv=cv)
        y_proba = cross_val_predict(pipeline, X, y, cv=cv, method="predict_proba")[:, 1]
        
        # 5. Generate and Save Plots
        
        # A. Confusion Matrix
        cm = confusion_matrix(y, y_pred)
        fig, ax = plt.subplots(figsize=(5, 5))
        cax = ax.matshow(cm, cmap=plt.cm.Blues)
        fig.colorbar(cax)
        for (i, j), z in np.ndenumerate(cm):
            ax.text(j, i, '{:0.0f}'.format(z), ha='center', va='center')
        plt.title(f"{target} Confusion Matrix")
        plt.xlabel("Predicted")
        plt.ylabel("Actual")
        plt.savefig(plots_dir / f"{target}_cm.png")
        plt.close()
        
        # B. ROC Curve
        fpr, tpr, _ = roc_curve(y, y_proba)
        roc_auc_val = auc(fpr, tpr)
        plt.figure(figsize=(6, 5))
        plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc_val:.2f})')
        plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title(f"{target} ROC Curve")
        plt.legend(loc="lower right")
        plt.savefig(plots_dir / f"{target}_roc.png")
        plt.close()
        
        # C. Calibration Curve
        prob_true, prob_pred = calibration_curve(y, y_proba, n_bins=5)
        plt.figure(figsize=(6, 5))
        plt.plot(prob_pred, prob_true, marker='o', label=f"{target} Calibration")
        plt.plot([0, 1], [0, 1], linestyle='--')
        plt.xlabel("Mean predicted probability")
        plt.ylabel("Fraction of positives")
        plt.title(f"{target} Calibration Curve")
        plt.savefig(plots_dir / f"{target}_cal.png")
        plt.close()

        # 6. Fit Final Production Model
        pipeline.fit(X, y)
        joblib.dump(pipeline, models_dir / f"{target}.joblib")
        
        # 7. Aggregate Metrics
        metrics_dict[target] = {
            "accuracy": float(np.mean(cv_results['test_accuracy'])),
            "precision": float(np.mean(cv_results['test_precision'])),
            "recall": float(np.mean(cv_results['test_recall'])),
            "f1": float(np.mean(cv_results['test_f1'])),
            "roc_auc": float(np.mean(cv_results['test_roc_auc'])),
            "cv": {
                "roc_auc_mean": float(np.mean(cv_results['test_roc_auc'])),
                "roc_auc_std": float(np.std(cv_results['test_roc_auc']))
            },
            "plots": {
                "roc": f"/static/plots/{target}_roc.png",
                "calibration": f"/static/plots/{target}_cal.png",
                "confusion": f"/static/plots/{target}_cm.png"
            }
        }
        
        print(f"ROC-AUC: {metrics_dict[target]['roc_auc']:.3f} | F1: {metrics_dict[target]['f1']:.3f}")
        
    with open(models_dir / "metrics.json", "w") as f:
        json.dump(metrics_dict, f, indent=2)
        
    print("\nPhase 2 Complete! Models and artifacts saved to backend/models/")

if __name__ == "__main__":
    train_and_evaluate()
