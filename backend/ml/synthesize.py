import numpy as np
import pandas as pd
from pathlib import Path
import sys
from scipy import stats

backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from ml.preprocess import normalize_columns

def generate_synthetic_cohort(
    source_path: Path, 
    n_samples: int = 50000, 
    random_state: int = 42
) -> pd.DataFrame:
    """
    Generates a high-fidelity synthetic clinical cohort of n_samples
    using Gaussian Copula marginal estimation and empirical correlation modeling,
    preserving medical constraints, correlation structure, and multi-vessel targets.
    """
    np.random.seed(random_state)
    
    # 1. Load and normalize source gold-standard dataset
    df_raw = pd.read_csv(source_path)
    df = normalize_columns(df_raw.copy())
    
    continuous_cols = [
        "Age", "Weight", "Height", "BP", "PR", "FBS", "Cr", "TG",
        "LDL", "HDL", "BUN", "ESR", "HB", "K", "Na", "WBC",
        "Lymph", "Neut", "PLT", "EF-TTE"
    ]
    
    binary_cols = [
        "Sex", "DM", "HTN", "Current Smoker", "Ex-Smoker", "FH", "Obesity",
        "CRF", "CVA", "Airway disease", "Thyroid Disease", "CHF", "DLP",
        "Edema", "Weak Peripheral Pulse", "Lung rales", "Systolic Murmur",
        "Diastolic Murmur", "Typical Chest Pain", "Dyspnea", "Atypical",
        "Nonanginal CP", "Exertional CP", "LowTH Ang", "Q Wave",
        "ST Elevation", "ST Depression", "T inversion", "LVH", "Poor R Progression"
    ]
    
    ordinal_cols = ["Function Class", "Region with RWMA"]
    nominal_cols = ["VHD"]
    target_cols = ["LAD", "LCX", "RCA", "Cath"]
    
    # Clean continuous values in source
    cont_data = df[continuous_cols].astype(float).values
    
    # 2. Gaussian Copula on continuous biomarkers
    # Compute rank-based correlation matrix
    rank_data = np.apply_along_axis(stats.rankdata, 0, cont_data) / (len(cont_data) + 1)
    norm_quantiles = stats.norm.ppf(rank_data)
    cov_matrix = np.corrcoef(norm_quantiles, rowvar=False)
    
    # Regularize covariance to ensure positive definiteness
    cov_matrix = (cov_matrix + cov_matrix.T) / 2
    min_eig = np.min(np.linalg.eigvals(cov_matrix))
    if min_eig < 1e-4:
        cov_matrix += np.eye(len(continuous_cols)) * (1e-4 - min_eig)
        
    # Sample from multivariate normal
    mean_vec = np.zeros(len(continuous_cols))
    sampled_norm = np.random.multivariate_normal(mean_vec, cov_matrix, size=n_samples)
    sampled_uniform = stats.norm.cdf(sampled_norm)
    
    # Invert through empirical marginals with gentle Gaussian kernel jitter
    sampled_cont = np.zeros((n_samples, len(continuous_cols)))
    for i, col in enumerate(continuous_cols):
        vals = cont_data[:, i]
        jitter = np.random.normal(0, np.std(vals) * 0.08, size=n_samples)
        empirical_quantiles = np.quantile(vals, sampled_uniform[:, i])
        sampled_cont[:, i] = empirical_quantiles + jitter

    df_synth = pd.DataFrame(sampled_cont, columns=continuous_cols)
    
    # 3. Apply physiological bounds
    df_synth["Age"] = np.clip(np.round(df_synth["Age"]), 30, 86)
    df_synth["Height"] = np.clip(np.round(df_synth["Height"]), 140, 195)
    df_synth["Weight"] = np.clip(np.round(df_synth["Weight"]), 45, 125)
    df_synth["BMI"] = df_synth["Weight"] / ((df_synth["Height"] / 100) ** 2)
    df_synth["BP"] = np.clip(np.round(df_synth["BP"] / 5) * 5, 90, 200) # rounded to 5 mmHg
    df_synth["PR"] = np.clip(np.round(df_synth["PR"]), 50, 125)
    df_synth["FBS"] = np.clip(np.round(df_synth["FBS"]), 65, 350)
    df_synth["Cr"] = np.clip(np.round(df_synth["Cr"], 1), 0.5, 4.5)
    df_synth["TG"] = np.clip(np.round(df_synth["TG"]), 40, 600)
    df_synth["LDL"] = np.clip(np.round(df_synth["LDL"]), 35, 280)
    df_synth["HDL"] = np.clip(np.round(df_synth["HDL"]), 15, 95)
    df_synth["BUN"] = np.clip(np.round(df_synth["BUN"]), 6, 70)
    df_synth["ESR"] = np.clip(np.round(df_synth["ESR"]), 1, 90)
    df_synth["HB"] = np.clip(np.round(df_synth["HB"], 1), 8.0, 19.0)
    df_synth["K"] = np.clip(np.round(df_synth["K"], 1), 2.8, 6.2)
    df_synth["Na"] = np.clip(np.round(df_synth["Na"]), 125, 152)
    df_synth["WBC"] = np.clip(np.round(df_synth["WBC"] / 100) * 100, 3000, 20000)
    df_synth["Lymph"] = np.clip(np.round(df_synth["Lymph"]), 5, 60)
    df_synth["Neut"] = np.clip(np.round(df_synth["Neut"]), 25, 85)
    df_synth["PLT"] = np.clip(np.round(df_synth["PLT"]), 80, 550)
    df_synth["EF-TTE"] = np.clip(np.round(df_synth["EF-TTE"] / 5) * 5, 15, 70)
    
    # 4. Generate conditional categorical and binary features
    # Use donor profile sampling with risk matching for realistic clinical clusters
    # Compute standardized risk score for both source and synthetic
    source_risk = (
        (df["Age"] > 60).astype(int) * 1.5 +
        (df["BP"] > 140).astype(int) * 1.2 +
        (df["LDL"] > 160).astype(int) * 1.5 +
        (df["EF-TTE"] < 50).astype(int) * 1.8
    ).values

    synth_risk = (
        (df_synth["Age"] > 60).astype(int) * 1.5 +
        (df_synth["BP"] > 140).astype(int) * 1.2 +
        (df_synth["LDL"] > 160).astype(int) * 1.5 +
        (df_synth["EF-TTE"] < 50).astype(int) * 1.8
    ).values

    # For each synthetic sample, pick a nearest donor with matching risk
    donor_indices = []
    unique_risks = np.unique(source_risk)
    
    for r in synth_risk:
        closest_r = unique_risks[np.argmin(np.abs(unique_risks - r))]
        matching_donors = np.where(source_risk == closest_r)[0]
        donor_indices.append(np.random.choice(matching_donors))
        
    donor_indices = np.array(donor_indices)
    
    # Copy discrete patterns from matched clinical donors with probabilistic mutation
    for col in binary_cols:
        source_vals = df[col].values[donor_indices].astype(int)
        # 5% mutation rate for variation
        mutations = np.random.binomial(1, 0.05, size=n_samples)
        df_synth[col] = np.abs(source_vals - mutations)
        
    for col in ordinal_cols:
        source_vals = df[col].values[donor_indices].astype(int)
        jitter = np.random.choice([-1, 0, 1], size=n_samples, p=[0.1, 0.8, 0.1])
        df_synth[col] = np.clip(source_vals + jitter, 0, 4)
        
    # Nominal column VHD
    vhd_source = df["VHD"].values[donor_indices]
    df_synth["VHD"] = vhd_source

    # 5. Determine coronary vessel outcomes (LAD, LCX, RCA, CAD)
    # Ground truth is derived from the donor's actual catheterization status coupled with hemodynamics
    lad_donor = (df["LAD"].values[donor_indices] == "Stenotic").astype(int)
    lcx_donor = (df["LCX"].values[donor_indices] == "Stenotic").astype(int)
    rca_donor = (df["RCA"].values[donor_indices] == "Stenotic").astype(int)

    # Moderate hemodynamically linked adjustments (3% consistency adjustment)
    lad_pred = np.where(
        (df_synth["ST Elevation"] == 1) | (df_synth["EF-TTE"] < 40),
        np.random.binomial(1, 0.85, size=n_samples),
        lad_donor
    )
    lcx_pred = np.where(
        (df_synth["ST Depression"] == 1) & (df_synth["TG"] > 220),
        np.random.binomial(1, 0.70, size=n_samples),
        lcx_donor
    )
    rca_pred = np.where(
        (df_synth["Q Wave"] == 1) & (df_synth["BP"] > 150),
        np.random.binomial(1, 0.65, size=n_samples),
        rca_donor
    )

    df_synth["LAD"] = np.where(lad_pred == 1, "Stenotic", "Normal")
    df_synth["LCX"] = np.where(lcx_pred == 1, "Stenotic", "Normal")
    df_synth["RCA"] = np.where(rca_pred == 1, "Stenotic", "Normal")

    cad_positive = (lad_pred == 1) | (lcx_pred == 1) | (rca_pred == 1)
    df_synth["Cath"] = np.where(cad_positive, "CAD", "Normal")

    return df_synth

if __name__ == "__main__":
    import time
    t0 = time.time()
    source_csv = Path(__file__).parent.parent / "data" / "dataset.csv"
    output_csv = Path(__file__).parent.parent / "data" / "dataset_synthetic_50k.csv"
    
    print("Generating 50,000-patient synthetic clinical cohort...")
    df_synthetic = generate_synthetic_cohort(source_csv, n_samples=50000)
    df_synthetic.to_csv(output_csv, index=False)
    
    elapsed = round(time.time() - t0, 2)
    print(f"Successfully generated {len(df_synthetic):,} patients in {elapsed}s.")
    print(f"Saved to: {output_csv}")
    print("CAD Prevalence:", (df_synthetic['Cath'] == 'CAD').mean().round(3))
    print("LAD Stenosis:", (df_synthetic['LAD'] == 'Stenotic').mean().round(3))
    print("LCX Stenosis:", (df_synthetic['LCX'] == 'Stenotic').mean().round(3))
    print("RCA Stenosis:", (df_synthetic['RCA'] == 'Stenotic').mean().round(3))
