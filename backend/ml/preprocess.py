import pandas as pd
import yaml
from pathlib import Path
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder, FunctionTransformer
import numpy as np

# Load feature configuration
config_path = Path(__file__).parent.parent / "app" / "core" / "features.yaml"
with open(config_path, "r") as f:
    FEATURES = yaml.safe_load(f)

LEAKAGE_COLUMNS = FEATURES.get("leakage", ["LAD", "LCX", "RCA", "Cath"])

def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalizes column names from raw CSV variations to the canonical names defined in features.yaml.
    """
    rename_map = {
        "Length": "Height",
        "EX-Smoker": "Ex-Smoker",
        "Nonanginal": "Nonanginal CP",
        "St Elevation": "ST Elevation",
        "St Depression": "ST Depression",
        "Tinversion": "T inversion",
        "CR": "Cr",
        "Region RWMA": "Region with RWMA"
    }
    # Only rename columns that exist in the mapping
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})
    
    # Map common string binaries to numeric to prevent Random Forest crashes
    df = df.replace({"Y": 1, "N": 0, "Male": 1, "Fmale": 0})
    
    # Fix VHD mixed types (N got replaced by 0)
    if "VHD" in df.columns:
        df["VHD"] = df["VHD"].replace({0: "N"}).astype(str)
    
    return df


def build_X(df: pd.DataFrame) -> pd.DataFrame:
    """
    Critical requirement: Drops target and leakage columns from the input features.
    Raises KeyError if they are completely missing (errors='raise' per PRD strictness).
    """
    return df.drop(columns=LEAKAGE_COLUMNS, errors="raise")

def get_preprocessor():
    """
    Creates a scikit-learn ColumnTransformer for the feature groups.
    """
    numeric_features = FEATURES["numeric"]
    nominal_features = FEATURES["nominal"]
    
    # Binary and ordinal features are passed through or converted to int if needed
    # (Assuming binary are already {0, 1} and ordinals are numeric codes)
    passthrough_features = FEATURES["binary"] + FEATURES["ordinal"]

    # We apply StandardScaler to numeric features, OneHotEncoder to nominals.
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("nom", OneHotEncoder(handle_unknown="ignore"), nominal_features),
            ("pass", "passthrough", passthrough_features)
        ],
        remainder="drop" # Drop any columns not explicitly defined in features.yaml
    )
    
    return preprocessor
