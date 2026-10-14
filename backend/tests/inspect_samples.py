import json
import os
import re
from backend.tests.test_export_faithfulness import simulate_js_inference

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

with open(os.path.join(REPO_ROOT, "frontend/src/api/mockData.ts")) as f:
    text = f.read()

with open(os.path.join(REPO_ROOT, "frontend/public/model/models.json")) as f:
    models = json.load(f)

# Extract patients from mockData.ts
pattern = re.compile(
    r"id:\s*(\d+).*?summary:\s*['\"]([^'\"]+)['\"].*?actual_cad:\s*['\"]([^'\"]+)['\"].*?actual_lad:\s*['\"]([^'\"]+)['\"].*?actual_lcx:\s*['\"]([^'\"]+)['\"].*?actual_rca:\s*['\"]([^'\"]+)['\"].*?features:\s*\{([^}]+)\}",
    re.DOTALL
)

for match in pattern.finditer(text):
    pid = match.group(1)
    summary = match.group(2)
    cad_ref = match.group(3)
    lad_ref = match.group(4)
    lcx_ref = match.group(5)
    rca_ref = match.group(6)
    feat_block = match.group(7)
    
    feats = {}
    for line in feat_block.strip().split("\n"):
        line = line.strip().rstrip(",")
        if ":" in line:
            k, v = line.split(":", 1)
            k = k.strip().strip("'\"")
            v = v.strip().strip("'\"")
            try:
                feats[k] = float(v) if "." in v else int(v)
            except ValueError:
                feats[k] = v
                
    print(f"\n=== Patient #{pid} (Actual: CAD={cad_ref}, LAD={lad_ref}, LCX={lcx_ref}, RCA={rca_ref}) ===")
    for t in ["CAD", "LAD", "LCX", "RCA"]:
        prob = simulate_js_inference(feats, models[t])
        label = "CAD" if (t == "CAD" and prob >= 0.5) else ("Stenotic" if (t != "CAD" and prob >= 0.5) else "Normal")
        print(f"  {t}: {prob:.3f} ({label})")
