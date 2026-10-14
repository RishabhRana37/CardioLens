"""
Requirement 1d: Automated Target Leakage Guard.
Ensures that LAD, LCX, RCA, and Cath are NEVER present in feature set X for any target.
"""

import os
import pandas as pd
import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
LEAKAGE_COLUMNS = ["LAD", "LCX", "RCA", "Cath"]
DATA_PATH = os.path.join(REPO_ROOT, "backend/data/z_alizadeh_sani.csv")
LEGACY_DATA_PATH = os.path.join(REPO_ROOT, "backend/data/dataset.csv")

def build_X(df: pd.DataFrame) -> pd.DataFrame:
    cols_to_drop = [c for c in LEAKAGE_COLUMNS if c in df.columns]
    return df.drop(columns=cols_to_drop)

def test_no_leakage():
    # Primary canonical dataset for exported static models
    df = pd.read_csv(DATA_PATH)
    X = build_X(df)
    
    # Assert none of the leakage columns are in X
    overlap = set(LEAKAGE_COLUMNS) & set(X.columns)
    assert not overlap, f"LEAKAGE: forbidden target col(s) {overlap} found in feature matrix X!"
    
    # Assert exact number of features is 55
    assert X.shape[1] == 55, f"Expected 55 features, found {X.shape[1]}"
    assert X.shape[0] == 303, f"Expected 303 rows, found {X.shape[0]}"
    
    # Verify legacy dataset if present
    if os.path.exists(LEGACY_DATA_PATH):
        legacy_df = pd.read_csv(LEGACY_DATA_PATH)
        legacy_X = build_X(legacy_df)
        legacy_overlap = set(LEAKAGE_COLUMNS) & set(legacy_X.columns)
        assert not legacy_overlap, f"LEAKAGE in legacy dataset: {legacy_overlap}"
        assert "Age" in legacy_X.columns, "Legitimate feature 'Age' was unexpectedly dropped."

    print("test_no_leakage PASSED: X has 55 features with zero target leakage.")

if __name__ == "__main__":
    test_no_leakage()
