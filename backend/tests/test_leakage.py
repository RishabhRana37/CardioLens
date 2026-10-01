import pytest
import pandas as pd
import sys
from pathlib import Path

# Add backend to path so we can import ml.preprocess
backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from ml.preprocess import build_X, LEAKAGE_COLUMNS

def test_no_leakage():
    """
    Tests that build_X successfully removes all leakage columns using the actual dataset.
    """
    data_path = backend_dir / "data" / "dataset.csv"
    if not data_path.exists():
        pytest.skip(f"Dataset not found at {data_path}")
        
    df = pd.read_csv(data_path)
    
    # Process it
    X = build_X(df)
    
    # Assert none of the leakage columns are in X
    for col in LEAKAGE_COLUMNS:
        assert col not in X.columns, f"LEAKAGE DETECTED: {col} found in features!"
        
    # Assert legitimate columns are preserved
    assert "Age" in X.columns, "Legitimate feature 'Age' was unexpectedly dropped."
