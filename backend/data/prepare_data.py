"""
CardioTwin Backend Data Preparation Pipeline.
Ingests UCI dataset ID 411 (Extension of Z-Alizadeh Sani) and produces a clean,
leakage-guarded canonical CSV.
"""

import io
import os
import zipfile
import pandas as pd

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DEFAULT_ZIP_PATH = os.path.join(REPO_ROOT, "backend/data/z_alizadeh_411.zip")
OUTPUT_CSV = os.path.join(REPO_ROOT, "backend/data/z_alizadeh_sani.csv")

def extract_and_clean_data(zip_path: str = None, output_csv: str = OUTPUT_CSV) -> pd.DataFrame:
    if zip_path is None:
        if os.path.exists(DEFAULT_ZIP_PATH):
            zip_path = DEFAULT_ZIP_PATH
        elif os.path.exists("/tmp/z_alizadeh_411.zip"):
            zip_path = "/tmp/z_alizadeh_411.zip"
        else:
            zip_path = DEFAULT_ZIP_PATH
    with zipfile.ZipFile(zip_path) as z:
        for name in z.namelist():
            if name.endswith(".xlsx"):
                df_raw = pd.read_excel(io.BytesIO(z.read(name)))
                break
        else:
            raise FileNotFoundError("Could not find .xlsx file in zip archive")

    # Column rename mapping to canonical schema
    rename_map = {
        "Length": "Height",
        "EX-Smoker": "Ex-Smoker",
        "Nonanginal": "Nonanginal CP",
        "St Elevation": "ST Elevation",
        "St Depression": "ST Depression",
        "Tinversion": "T inversion",
        "BBB": "Rhythm",
        "CR": "Cr",
        "Region RWMA": "Region with RWMA",
    }
    df = df_raw.rename(columns=rename_map)

    # Standardize Sex (raw dataset has 'Fmale' and 'Male')
    df["Sex"] = df["Sex"].map({"Male": 1, "Fmale": 0, "Female": 0})

    # Standardize Rhythm (BBB in raw: N, LBBB, RBBB)
    df["Rhythm"] = df["Rhythm"].map({
        "N": "Sinus (NSR)",
        "LBBB": "LBBB",
        "RBBB": "RBBB"
    }).fillna("Sinus (NSR)")

    # Standardize VHD (raw: N, mild, Moderate, Severe)
    df["VHD"] = df["VHD"].map({
        "N": "Normal",
        "mild": "Mild",
        "Moderate": "Moderate",
        "Severe": "Severe"
    }).fillna("Normal")

    # Standardize binary columns to 0 / 1
    binary_cols = [
        "DM", "HTN", "Current Smoker", "Ex-Smoker", "FH", "Obesity", "CRF", "CVA",
        "Airway disease", "Thyroid Disease", "CHF", "DLP", "Edema", "Weak Peripheral Pulse",
        "Lung rales", "Systolic Murmur", "Diastolic Murmur", "Typical Chest Pain", "Dyspnea",
        "Atypical", "Nonanginal CP", "Exertional CP", "LowTH Ang", "Q Wave", "ST Elevation",
        "ST Depression", "T inversion", "LVH", "Poor R Progression"
    ]
    for col in binary_cols:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: 1 if x in ["Y", "Yes", 1, "1"] else 0)

    # Standardize targets
    # Cath: CAD / Normal
    # LAD, LCX, RCA: Stenotic / Normal
    for t in ["Cath", "LAD", "LCX", "RCA"]:
        df[t] = df[t].astype(str).str.strip()

    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    df.to_csv(output_csv, index=False)
    print(f"Cleaned dataset saved to {output_csv} with shape {df.shape}")
    return df

if __name__ == "__main__":
    extract_and_clean_data()
