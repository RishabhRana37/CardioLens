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

def build_X(df: pd.DataFrame) -> pd.DataFrame:
    return df.drop(columns=LEAKAGE_COLUMNS, errors="raise")

def test_no_leakage():
    df = pd.read_csv(DATA_PATH)
    X = build_X(df)
    
    # Assert none of the leakage columns are in X
    overlap = set(LEAKAGE_COLUMNS) & set(X.columns)
    assert not overlap, f"LEAKAGE: forbidden target col(s) {overlap} found in feature matrix X!"
    
    # Assert exact number of features is 55
    assert X.shape[1] == 55, f"Expected 55 features, found {X.shape[1]}"
    assert X.shape[0] == 303, f"Expected 303 rows, found {X.shape[0]}"
    print("test_no_leakage PASSED: X has 55 features with zero target leakage.")

if __name__ == "__main__":
    test_no_leakage()
