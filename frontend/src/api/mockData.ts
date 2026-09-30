import { FeatureSchema, SamplePatientDetail, MetricsBundle, Explanation, Target, PredictResponse } from './types';

export const MOCK_SCHEMA: FeatureSchema = {
  total_features: 55,
  groups: ['Demographic', 'Symptom & Examination', 'ECG', 'Laboratory & Echo'],
  features: [
    // Demographic
    { name: 'Age', label: 'Age', type: 'numeric', group: 'Demographic', unit: 'years', min: 30, max: 86, default: 58, modifiable: false, description: 'Patient age' },
    { name: 'Sex', label: 'Sex', type: 'binary', group: 'Demographic', options: ['Female (0)', 'Male (1)'], default: 1, modifiable: false, description: 'Biological sex (1=Male, 0=Female)' },
    { name: 'Weight', label: 'Weight', type: 'numeric', group: 'Demographic', unit: 'kg', min: 48, max: 120, default: 76, modifiable: true, description: 'Body weight' },
    { name: 'Height', label: 'Height', type: 'numeric', group: 'Demographic', unit: 'cm', min: 140, max: 195, default: 172, modifiable: false, description: 'Standing height' },
    { name: 'BMI', label: 'BMI', type: 'numeric', group: 'Demographic', unit: 'kg/m²', min: 18, max: 42, default: 25.7, modifiable: true, description: 'Body Mass Index' },
    { name: 'DM', label: 'Diabetes Mellitus', type: 'binary', group: 'Demographic', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: true, description: 'History of Diabetes Mellitus' },
    { name: 'HTN', label: 'Hypertension', type: 'binary', group: 'Demographic', options: ['No (0)', 'Yes (1)'], default: 1, modifiable: true, description: 'Documented hypertension' },
    { name: 'Current Smoker', label: 'Current Smoker', type: 'binary', group: 'Demographic', options: ['No (0)', 'Yes (1)'], default: 1, modifiable: true, description: 'Active smoking status' },
    { name: 'Ex-Smoker', label: 'Ex-Smoker', type: 'binary', group: 'Demographic', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Previous smoker history' },
    { name: 'FH', label: 'Family History', type: 'binary', group: 'Demographic', options: ['No (0)', 'Yes (1)'], default: 1, modifiable: false, description: 'Family history of early CAD' },
    { name: 'Obesity', label: 'Obesity (BMI ≥ 30)', type: 'binary', group: 'Demographic', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: true, description: 'Clinical obesity status' },
    { name: 'CRF', label: 'Chronic Renal Failure', type: 'binary', group: 'Demographic', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Documented CRF' },
    { name: 'CVA', label: 'Cerebrovascular Accident', type: 'binary', group: 'Demographic', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Stroke or TIA history' },
    { name: 'Airway disease', label: 'Airway Disease (COPD/Asthma)', type: 'binary', group: 'Demographic', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Chronic respiratory illness' },
    { name: 'Thyroid Disease', label: 'Thyroid Disease', type: 'binary', group: 'Demographic', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Thyroid dysfunction history' },
    { name: 'CHF', label: 'Congestive Heart Failure', type: 'binary', group: 'Demographic', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Documented CHF' },
    { name: 'DLP', label: 'Dyslipidemia', type: 'binary', group: 'Demographic', options: ['No (0)', 'Yes (1)'], default: 1, modifiable: true, description: 'Abnormal lipid profile' },

    // Symptom & Examination
    { name: 'BP', label: 'Systolic Blood Pressure', type: 'numeric', group: 'Symptom & Examination', unit: 'mmHg', min: 90, max: 200, default: 135, modifiable: true, description: 'Resting systolic blood pressure' },
    { name: 'PR', label: 'Pulse Rate', type: 'numeric', group: 'Symptom & Examination', unit: 'bpm', min: 50, max: 125, default: 74, modifiable: true, description: 'Resting heart rate' },
    { name: 'Edema', label: 'Peripheral Edema', type: 'binary', group: 'Symptom & Examination', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Lower extremity swelling' },
    { name: 'Weak Peripheral Pulse', label: 'Weak Peripheral Pulse', type: 'binary', group: 'Symptom & Examination', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Diminished pedal pulses' },
    { name: 'Lung rales', label: 'Lung Rales / Crackles', type: 'binary', group: 'Symptom & Examination', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Pulmonary crackles on auscultation' },
    { name: 'Systolic Murmur', label: 'Systolic Murmur', type: 'binary', group: 'Symptom & Examination', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Heart murmur during systole' },
    { name: 'Diastolic Murmur', label: 'Diastolic Murmur', type: 'binary', group: 'Symptom & Examination', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Heart murmur during diastole' },
    { name: 'Typical Chest Pain', label: 'Typical Chest Pain', type: 'binary', group: 'Symptom & Examination', options: ['No (0)', 'Yes (1)'], default: 1, modifiable: true, description: 'Substernal pressure exacerbated by exertion' },
    { name: 'Dyspnea', label: 'Dyspnea', type: 'binary', group: 'Symptom & Examination', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: true, description: 'Shortness of breath' },
    { name: 'Function Class', label: 'NYHA Function Class', type: 'ordinal', group: 'Symptom & Examination', min: 0, max: 4, default: 2, modifiable: true, description: 'NYHA Functional Classification (0-4)' },
    { name: 'Atypical', label: 'Atypical Symptoms', type: 'binary', group: 'Symptom & Examination', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Non-classical cardiac presentation' },
    { name: 'Nonanginal CP', label: 'Nonanginal Chest Pain', type: 'binary', group: 'Symptom & Examination', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Sharp, positional chest discomfort' },
    { name: 'Exertional CP', label: 'Exertional Chest Pain', type: 'binary', group: 'Symptom & Examination', options: ['No (0)', 'Yes (1)'], default: 1, modifiable: true, description: 'Pain strictly related to physical effort' },
    { name: 'LowTH Ang', label: 'Low-Threshold Angina', type: 'binary', group: 'Symptom & Examination', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Angina triggered at minimal effort' },

    // ECG
    { name: 'Rhythm', label: 'ECG Rhythm', type: 'nominal', group: 'ECG', options: ['Sinus (NSR)', 'AFib', 'Bradycardia', 'Tachycardia'], default: 'Sinus (NSR)', modifiable: false, description: 'Baseline cardiac rhythm' },
    { name: 'Q Wave', label: 'Pathological Q Wave', type: 'binary', group: 'ECG', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Evidence of prior myocardial infarction' },
    { name: 'ST Elevation', label: 'ST Segment Elevation', type: 'binary', group: 'ECG', options: ['No (0)', 'Yes (1)'], default: 1, modifiable: false, description: 'Acute epicardial injury current' },
    { name: 'ST Depression', label: 'ST Segment Depression', type: 'binary', group: 'ECG', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Subendocardial ischemia marker' },
    { name: 'T inversion', label: 'T Wave Inversion', type: 'binary', group: 'ECG', options: ['No (0)', 'Yes (1)'], default: 1, modifiable: false, description: 'Repolarization abnormality' },
    { name: 'LVH', label: 'Left Ventricular Hypertrophy', type: 'binary', group: 'ECG', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Voltage criteria for LVH' },
    { name: 'Poor R Progression', label: 'Poor R Wave Progression', type: 'binary', group: 'ECG', options: ['No (0)', 'Yes (1)'], default: 0, modifiable: false, description: 'Delayed R wave increase across V1-V4' },

    // Laboratory & Echo
    { name: 'FBS', label: 'Fasting Blood Sugar', type: 'numeric', group: 'Laboratory & Echo', unit: 'mg/dL', min: 60, max: 350, default: 112, modifiable: true, description: 'Fasting serum glucose' },
    { name: 'Cr', label: 'Serum Creatinine', type: 'numeric', group: 'Laboratory & Echo', unit: 'mg/dL', min: 0.5, max: 4.5, default: 1.0, modifiable: false, description: 'Renal function marker' },
    { name: 'TG', label: 'Triglycerides', type: 'numeric', group: 'Laboratory & Echo', unit: 'mg/dL', min: 40, max: 600, default: 175, modifiable: true, description: 'Serum triglycerides' },
    { name: 'LDL', label: 'LDL Cholesterol', type: 'numeric', group: 'Laboratory & Echo', unit: 'mg/dL', min: 30, max: 280, default: 154, modifiable: true, description: 'Low-density lipoprotein cholesterol' },
    { name: 'HDL', label: 'HDL Cholesterol', type: 'numeric', group: 'Laboratory & Echo', unit: 'mg/dL', min: 15, max: 95, default: 38, modifiable: true, description: 'High-density lipoprotein cholesterol' },
    { name: 'BUN', label: 'Blood Urea Nitrogen', type: 'numeric', group: 'Laboratory & Echo', unit: 'mg/dL', min: 5, max: 70, default: 16, modifiable: false, description: 'Kidney clearance indicator' },
    { name: 'ESR', label: 'Erythrocyte Sed. Rate', type: 'numeric', group: 'Laboratory & Echo', unit: 'mm/hr', min: 1, max: 90, default: 14, modifiable: false, description: 'Systemic inflammation rate' },
    { name: 'HB', label: 'Hemoglobin', type: 'numeric', group: 'Laboratory & Echo', unit: 'g/dL', min: 8, max: 19, default: 14.2, modifiable: false, description: 'Blood oxygen carrying capacity' },
    { name: 'K', label: 'Serum Potassium', type: 'numeric', group: 'Laboratory & Echo', unit: 'mEq/L', min: 2.8, max: 6.2, default: 4.3, modifiable: false, description: 'Electrolyte balance' },
    { name: 'Na', label: 'Serum Sodium', type: 'numeric', group: 'Laboratory & Echo', unit: 'mEq/L', min: 125, max: 152, default: 140, modifiable: false, description: 'Serum osmolality regulator' },
    { name: 'WBC', label: 'White Blood Cell Count', type: 'numeric', group: 'Laboratory & Echo', unit: 'x10³/µL', min: 3.0, max: 20.0, default: 7.2, modifiable: false, description: 'Immune cell count' },
    { name: 'Lymph', label: 'Lymphocytes', type: 'numeric', group: 'Laboratory & Echo', unit: '%', min: 5, max: 60, default: 30, modifiable: false, description: 'Lymphocyte differential' },
    { name: 'Neut', label: 'Neutrophils', type: 'numeric', group: 'Laboratory & Echo', unit: '%', min: 25, max: 85, default: 62, modifiable: false, description: 'Neutrophil differential' },
    { name: 'PLT', label: 'Platelet Count', type: 'numeric', group: 'Laboratory & Echo', unit: 'x10³/µL', min: 80, max: 550, default: 220, modifiable: false, description: 'Thrombocyte count' },
    { name: 'EF-TTE', label: 'Ejection Fraction (Echo)', type: 'numeric', group: 'Laboratory & Echo', unit: '%', min: 15, max: 70, default: 45, modifiable: true, description: 'Left ventricular ejection fraction' },
    { name: 'Region with RWMA', label: 'Regional Wall Motion (RWMA)', type: 'ordinal', group: 'Laboratory & Echo', min: 0, max: 4, default: 2, modifiable: false, description: 'Number of myocardial segments with RWMA' },
    { name: 'VHD', label: 'Valvular Heart Disease', type: 'nominal', group: 'Laboratory & Echo', options: ['Normal', 'Mild', 'Moderate', 'Severe'], default: 'Mild', modifiable: false, description: 'Echocardiographic valvular assessment' },
  ],
};

export const MOCK_SAMPLE_PATIENTS: SamplePatientDetail[] = [
  {
    id: 101,
    summary: 'Patient #101 · 62M · HTN, Smoker · Severe LAD/RCA Risk',
    actual_cad: 'CAD',
    actual_lad: 'Stenotic',
    actual_lcx: 'Normal',
    actual_rca: 'Stenotic',
    risk_tier: 'high',
    features: {
      Age: 62,
      Sex: 1,
      Weight: 84,
      Height: 174,
      BMI: 27.7,
      DM: 1,
      HTN: 1,
      'Current Smoker': 1,
      'Ex-Smoker': 0,
      FH: 1,
      Obesity: 0,
      CRF: 0,
      CVA: 0,
      'Airway disease': 0,
      'Thyroid Disease': 0,
      CHF: 0,
      DLP: 1,
      BP: 150,
      PR: 78,
      Edema: 0,
      'Weak Peripheral Pulse': 0,
      'Lung rales': 0,
      'Systolic Murmur': 0,
      'Diastolic Murmur': 0,
      'Typical Chest Pain': 1,
      Dyspnea: 1,
      'Function Class': 3,
      Atypical: 0,
      'Nonanginal CP': 0,
      'Exertional CP': 1,
      'LowTH Ang': 1,
      Rhythm: 'Sinus (NSR)',
      'Q Wave': 1,
      'ST Elevation': 1,
      'ST Depression': 0,
      'T inversion': 1,
      LVH: 1,
      'Poor R Progression': 1,
      FBS: 165,
      Cr: 1.2,
      TG: 245,
      LDL: 178,
      HDL: 32,
      BUN: 22,
      ESR: 28,
      HB: 13.8,
      K: 4.4,
      Na: 139,
      WBC: 8.9,
      Lymph: 22,
      Neut: 72,
      PLT: 260,
      'EF-TTE': 38,
      'Region with RWMA': 3,
      VHD: 'Moderate',
    },
  },
  {
    id: 102,
    summary: 'Patient #102 · 46F · Non-smoker, Low-risk control',
    actual_cad: 'Normal',
    actual_lad: 'Normal',
    actual_lcx: 'Normal',
    actual_rca: 'Normal',
    risk_tier: 'low',
    features: {
      Age: 46,
      Sex: 0,
      Weight: 58,
      Height: 163,
      BMI: 21.8,
      DM: 0,
      HTN: 0,
      'Current Smoker': 0,
      'Ex-Smoker': 0,
      FH: 0,
      Obesity: 0,
      CRF: 0,
      CVA: 0,
      'Airway disease': 0,
      'Thyroid Disease': 0,
      CHF: 0,
      DLP: 0,
      BP: 115,
      PR: 68,
      Edema: 0,
      'Weak Peripheral Pulse': 0,
      'Lung rales': 0,
      'Systolic Murmur': 0,
      'Diastolic Murmur': 0,
      'Typical Chest Pain': 0,
      Dyspnea: 0,
      'Function Class': 0,
      Atypical: 0,
      'Nonanginal CP': 1,
      'Exertional CP': 0,
      'LowTH Ang': 0,
      Rhythm: 'Sinus (NSR)',
      'Q Wave': 0,
      'ST Elevation': 0,
      'ST Depression': 0,
      'T inversion': 0,
      LVH: 0,
      'Poor R Progression': 0,
      FBS: 88,
      Cr: 0.8,
      TG: 95,
      LDL: 82,
      HDL: 62,
      BUN: 12,
      ESR: 6,
      HB: 13.1,
      K: 4.1,
      Na: 141,
      WBC: 5.8,
      Lymph: 35,
      Neut: 55,
      PLT: 210,
      'EF-TTE': 60,
      'Region with RWMA': 0,
      VHD: 'Normal',
    },
  },
  {
    id: 103,
    summary: 'Patient #103 · 57M · Isolated LCX Stenosis with Dyslipidemia',
    actual_cad: 'CAD',
    actual_lad: 'Normal',
    actual_lcx: 'Stenotic',
    actual_rca: 'Normal',
    risk_tier: 'moderate',
    features: {
      Age: 57,
      Sex: 1,
      Weight: 79,
      Height: 171,
      BMI: 27.0,
      DM: 0,
      HTN: 1,
      'Current Smoker': 0,
      'Ex-Smoker': 1,
      FH: 1,
      Obesity: 0,
      CRF: 0,
      CVA: 0,
      'Airway disease': 0,
      'Thyroid Disease': 0,
      CHF: 0,
      DLP: 1,
      BP: 138,
      PR: 72,
      Edema: 0,
      'Weak Peripheral Pulse': 0,
      'Lung rales': 0,
      'Systolic Murmur': 0,
      'Diastolic Murmur': 0,
      'Typical Chest Pain': 1,
      Dyspnea: 0,
      'Function Class': 2,
      Atypical: 0,
      'Nonanginal CP': 0,
      'Exertional CP': 1,
      'LowTH Ang': 0,
      Rhythm: 'Sinus (NSR)',
      'Q Wave': 0,
      'ST Elevation': 0,
      'ST Depression': 1,
      'T inversion': 1,
      LVH: 0,
      'Poor R Progression': 0,
      FBS: 108,
      Cr: 1.0,
      TG: 210,
      LDL: 162,
      HDL: 39,
      BUN: 15,
      ESR: 12,
      HB: 14.8,
      K: 4.2,
      Na: 138,
      WBC: 6.9,
      Lymph: 28,
      Neut: 64,
      PLT: 235,
      'EF-TTE': 52,
      'Region with RWMA': 1,
      VHD: 'Mild',
    },
  },
  {
    id: 104,
    summary: 'Patient #104 · 68M · Multi-vessel CAD with Heart Failure',
    actual_cad: 'CAD',
    actual_lad: 'Stenotic',
    actual_lcx: 'Stenotic',
    actual_rca: 'Stenotic',
    risk_tier: 'high',
    features: {
      Age: 68,
      Sex: 1,
      Weight: 88,
      Height: 175,
      BMI: 28.7,
      DM: 1,
      HTN: 1,
      'Current Smoker': 1,
      'Ex-Smoker': 0,
      FH: 1,
      Obesity: 0,
      CRF: 1,
      CVA: 0,
      'Airway disease': 0,
      'Thyroid Disease': 0,
      CHF: 1,
      DLP: 1,
      BP: 165,
      PR: 88,
      Edema: 1,
      'Weak Peripheral Pulse': 1,
      'Lung rales': 1,
      'Systolic Murmur': 1,
      'Diastolic Murmur': 0,
      'Typical Chest Pain': 1,
      Dyspnea: 1,
      'Function Class': 4,
      Atypical: 0,
      'Nonanginal CP': 0,
      'Exertional CP': 1,
      'LowTH Ang': 1,
      Rhythm: 'Sinus (NSR)',
      'Q Wave': 1,
      'ST Elevation': 1,
      'ST Depression': 1,
      'T inversion': 1,
      LVH: 1,
      'Poor R Progression': 1,
      FBS: 198,
      Cr: 2.1,
      TG: 290,
      LDL: 194,
      HDL: 29,
      BUN: 34,
      ESR: 42,
      HB: 12.1,
      K: 4.8,
      Na: 136,
      WBC: 10.4,
      Lymph: 16,
      Neut: 78,
      PLT: 310,
      'EF-TTE': 28,
      'Region with RWMA': 4,
      VHD: 'Severe',
    },
  },
];

export const MOCK_METRICS: MetricsBundle = {
  CAD: {
    accuracy: 0.92,
    precision: 0.91,
    recall: 0.94,
    f1: 0.925,
    roc_auc: 0.942,
    cv: {
      roc_auc_mean: 0.938,
      roc_auc_std: 0.024,
    },
    plots: {
      roc: '/static/plots/CAD_roc.png',
      calibration: '/static/plots/CAD_cal.png',
      confusion: '/static/plots/CAD_cm.png',
    },
    top_features: [
      { feature: 'Typical Chest Pain', importance: 0.24 },
      { feature: 'EF-TTE', importance: 0.18 },
      { feature: 'Age', importance: 0.14 },
      { feature: 'Region with RWMA', importance: 0.12 },
      { feature: 'ST Elevation', importance: 0.10 },
      { feature: 'LDL', importance: 0.09 },
      { feature: 'HTN', importance: 0.07 },
      { feature: 'Current Smoker', importance: 0.06 },
    ],
  },
  LAD: {
    accuracy: 0.86,
    precision: 0.85,
    recall: 0.88,
    f1: 0.865,
    roc_auc: 0.884,
    cv: {
      roc_auc_mean: 0.879,
      roc_auc_std: 0.031,
    },
    plots: {
      roc: '/static/plots/LAD_roc.png',
      calibration: '/static/plots/LAD_cal.png',
      confusion: '/static/plots/LAD_cm.png',
    },
    top_features: [
      { feature: 'Typical Chest Pain', importance: 0.26 },
      { feature: 'ST Elevation', importance: 0.21 },
      { feature: 'EF-TTE', importance: 0.17 },
      { feature: 'T inversion', importance: 0.13 },
      { feature: 'LDL', importance: 0.09 },
      { feature: 'Region with RWMA', importance: 0.08 },
    ],
  },
  LCX: {
    accuracy: 0.83,
    precision: 0.81,
    recall: 0.84,
    f1: 0.825,
    roc_auc: 0.851,
    cv: {
      roc_auc_mean: 0.846,
      roc_auc_std: 0.037,
    },
    plots: {
      roc: '/static/plots/LCX_roc.png',
      calibration: '/static/plots/LCX_cal.png',
      confusion: '/static/plots/LCX_cm.png',
    },
    top_features: [
      { feature: 'ST Depression', importance: 0.22 },
      { feature: 'DLP', importance: 0.19 },
      { feature: 'TG', importance: 0.16 },
      { feature: 'LDL', importance: 0.15 },
      { feature: 'Age', importance: 0.14 },
      { feature: 'Function Class', importance: 0.08 },
    ],
  },
  RCA: {
    accuracy: 0.85,
    precision: 0.83,
    recall: 0.86,
    f1: 0.845,
    roc_auc: 0.872,
    cv: {
      roc_auc_mean: 0.868,
      roc_auc_std: 0.029,
    },
    plots: {
      roc: '/static/plots/RCA_roc.png',
      calibration: '/static/plots/RCA_cal.png',
      confusion: '/static/plots/RCA_cm.png',
    },
    top_features: [
      { feature: 'Inferior Q Wave', importance: 0.23 },
      { feature: 'HTN', importance: 0.20 },
      { feature: 'BP', importance: 0.17 },
      { feature: 'Typical Chest Pain', importance: 0.14 },
      { feature: 'Current Smoker', importance: 0.12 },
      { feature: 'BMI', importance: 0.08 },
    ],
  },
};

/**
 * Realistic Mock Predict Function
 * Evaluates clinical weighted heuristics on input features to produce dynamic, continuous probabilities.
 */
export function generateMockPredictions(features: Record<string, number | string>): PredictResponse {
  const age = Number(features.Age || 58);
  const bp = Number(features.BP || 135);
  const ldl = Number(features.LDL || 154);
  const fbs = Number(features.FBS || 112);
  const ef = Number(features.EF_TTE || features['EF-TTE'] || 45);
  const smoker = Number(features['Current Smoker'] || 0);
  const typicalCP = Number(features['Typical Chest Pain'] || 0);
  const stElev = Number(features['ST Elevation'] || 0);
  const stDep = Number(features['ST Depression'] || 0);
  const rwma = Number(features['Region with RWMA'] || 1);

  // Baseline risk calculation
  let baseScore = 0.20;
  baseScore += (age - 45) * 0.008;
  baseScore += (bp - 120) * 0.003;
  baseScore += (ldl - 100) * 0.002;
  baseScore += (fbs - 100) * 0.001;
  baseScore += (55 - ef) * 0.007;
  baseScore += smoker * 0.12;
  baseScore += typicalCP * 0.22;
  baseScore += rwma * 0.05;

  const clamp = (v: number) => Math.max(0.04, Math.min(0.96, Number(v.toFixed(3))));

  const cadProb = clamp(baseScore + (stElev || stDep ? 0.14 : 0));
  const ladProb = clamp(baseScore * 0.95 + stElev * 0.24 + (typicalCP ? 0.10 : 0) - (ef > 55 ? 0.15 : 0));
  const lcxProb = clamp(baseScore * 0.70 + stDep * 0.22 + ((ldl > 150) ? 0.12 : 0));
  const rcaProb = clamp(baseScore * 0.85 + (bp > 140 ? 0.12 : 0) + (smoker ? 0.10 : 0));

  return {
    model_version: '1.0.0-mock',
    inference_time_ms: 18,
    predictions: {
      CAD: {
        label: cadProb >= 0.5 ? 'CAD' : 'Normal',
        probability: cadProb,
        confidence: Number((0.75 + Math.abs(cadProb - 0.5) * 0.45).toFixed(2)),
      },
      LAD: {
        label: ladProb >= 0.5 ? 'Stenotic' : 'Normal',
        probability: ladProb,
        confidence: Number((0.70 + Math.abs(ladProb - 0.5) * 0.45).toFixed(2)),
      },
      LCX: {
        label: lcxProb >= 0.5 ? 'Stenotic' : 'Normal',
        probability: lcxProb,
        confidence: Number((0.68 + Math.abs(lcxProb - 0.5) * 0.45).toFixed(2)),
      },
      RCA: {
        label: rcaProb >= 0.5 ? 'Stenotic' : 'Normal',
        probability: rcaProb,
        confidence: Number((0.69 + Math.abs(rcaProb - 0.5) * 0.45).toFixed(2)),
      },
    },
    warnings: [],
  };
}

/**
 * Realistic Mock SHAP Explainer
 */
export function generateMockExplanation(
  features: Record<string, number | string>,
  target: Target
): Explanation {
  const preds = generateMockPredictions(features);
  const targetPred = preds.predictions[target].probability;
  const ldl = Number(features.LDL || 154);
  const bp = Number(features.BP || 135);
  const ef = Number(features.EF_TTE || features['EF-TTE'] || 45);
  const cp = Number(features['Typical Chest Pain'] || 0);
  const smoker = Number(features['Current Smoker'] || 0);

  const baseValues: Record<Target, number> = {
    CAD: 0.35,
    LAD: 0.31,
    LCX: 0.24,
    RCA: 0.28,
  };

  const baseVal = baseValues[target];

  const contributions = [
    {
      feature: 'Typical Chest Pain',
      value: cp === 1 ? 'Present' : 'Absent',
      shap: cp === 1 ? 0.18 : -0.09,
      direction: cp === 1 ? 'increases' as const : 'decreases' as const,
      population_reference: '54% population baseline',
    },
    {
      feature: 'Ejection Fraction (EF-TTE)',
      value: `${ef}%`,
      shap: ef < 50 ? Number(((50 - ef) * 0.008).toFixed(3)) : -0.07,
      direction: ef < 50 ? 'increases' as const : 'decreases' as const,
      population_reference: 'Normal reference: ≥ 55%',
    },
    {
      feature: 'LDL Cholesterol',
      value: `${ldl} mg/dL`,
      shap: ldl > 100 ? Number(((ldl - 100) * 0.0012).toFixed(3)) : -0.05,
      direction: ldl > 100 ? 'increases' as const : 'decreases' as const,
      population_reference: 'Optimal target: < 100 mg/dL',
    },
    {
      feature: 'Systolic Blood Pressure',
      value: `${bp} mmHg`,
      shap: bp > 120 ? Number(((bp - 120) * 0.0018).toFixed(3)) : -0.04,
      direction: bp > 120 ? 'increases' as const : 'decreases' as const,
      population_reference: 'Normal reference: < 120 mmHg',
    },
    {
      feature: 'Current Smoker',
      value: smoker === 1 ? 'Active' : 'No',
      shap: smoker === 1 ? 0.08 : -0.05,
      direction: smoker === 1 ? 'increases' as const : 'decreases' as const,
      population_reference: 'Cardiovascular risk factor',
    },
  ];

  // Sort contributions by absolute SHAP magnitude descending
  contributions.sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap));

  const topPos = contributions.filter((c) => c.direction === 'increases').slice(0, 2);
  const narrative = topPos.length > 0
    ? `Elevated ${target} risk (${(targetPred * 100).toFixed(0)}%) is primarily driven by ${topPos.map((c) => c.feature).join(' and ')}.`
    : `Low ${target} risk is supported by favorable clinical and hemodynamic markers.`;

  return {
    target,
    base_value: baseVal,
    prediction: targetPred,
    contributions,
    narrative,
    generated_at: new Date().toISOString(),
  };
}
