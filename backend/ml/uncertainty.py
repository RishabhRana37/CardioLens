import numpy as np
import pandas as pd
from typing import Dict, Any, List

def calculate_ensemble_uncertainty(pipeline: Any, df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes epistemic model uncertainty across the cross-validation
    calibrated fold estimators.
    
    Mathematical formulation:
    - Fold probabilities: p_k for k in 1..K
    - Empirical variance: sigma^2 = (1/K) * sum((p_k - mean_p)^2)
    - 95% Confidence Interval: [mean_p - 1.96 * SE, mean_p + 1.96 * SE]
    """
    preprocessor = pipeline.named_steps["preprocessor"]
    calibrated_clf = pipeline.named_steps["classifier"]
    
    X_trans = preprocessor.transform(df)
    
    # Query calibrated sub-estimators from each cross-validation fold
    fold_probas: List[float] = [
        float(sub_est.predict_proba(X_trans)[0][1])
        for sub_est in calibrated_clf.calibrated_classifiers_
    ]
    
    mean_p = float(np.mean(fold_probas))
    std_p = float(np.std(fold_probas))
    n_folds = len(fold_probas)
    
    # Standard error of the mean
    se = std_p / np.sqrt(n_folds) if n_folds > 1 else std_p
    margin = 1.96 * se
    
    ci_lower = max(0.0, round(mean_p - margin, 3))
    ci_upper = min(1.0, round(mean_p + margin, 3))
    
    # Categorize uncertainty
    if std_p < 0.04:
        level = "low"
    elif std_p < 0.08:
        level = "moderate"
    else:
        level = "elevated"
        
    return {
        "mean_probability": round(mean_p, 3),
        "confidence_interval_95": [ci_lower, ci_upper],
        "uncertainty_std": round(std_p, 3),
        "uncertainty_level": level,
        "fold_samples": [round(p, 3) for p in fold_probas]
    }
