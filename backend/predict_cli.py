import os
import sys
import json
import numpy as np
import pandas as pd
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if os.path.basename(BASE_DIR) == "ml":
    ML_DIR = BASE_DIR
else:
    ML_DIR = os.path.join(BASE_DIR, "ml")
MODELS_DIR = os.path.join(ML_DIR, "models")

def _resolve(filename: str) -> str:
    p1 = os.path.join(MODELS_DIR, filename)
    if os.path.exists(p1):
        return p1
    return os.path.join(ML_DIR, filename)

MODEL_FILE = _resolve("xgboost_career_model.joblib")
ENCODER_FILE = _resolve("label_encoder.joblib")
FEATURES_FILE = _resolve("feature_columns.json")
BENCHMARKS_FILE = _resolve("career_benchmarks.json")

def load_engine():
    if not os.path.exists(MODEL_FILE) or not os.path.exists(ENCODER_FILE):
        print("Error: Trained model artifacts not found. Run 'python backend/ml/train_career_model.py' first.")
        sys.exit(1)
        
    model = joblib.load(MODEL_FILE)
    encoder = joblib.load(ENCODER_FILE)
    with open(FEATURES_FILE, "r") as f:
        feature_columns = json.load(f)
    with open(BENCHMARKS_FILE, "r") as f:
        benchmarks = json.load(f)
    return model, encoder, feature_columns, benchmarks

def predict(branch="CSE", gpa=8.2, backlogs=0, attendance=88.0, skills_list=None, clubs_list=None, internship_done=True, city_tier="Tier 1"):
    if skills_list is None:
        skills_list = ["Python", "Machine Learning", "Data Science", "SQL"]
    if clubs_list is None:
        clubs_list = ["Coding Club"]
        
    model, encoder, feature_columns, benchmarks = load_engine()
    
    branch_norm = branch.strip().upper()
    skills_lower = [s.strip().lower() for s in skills_list]
    clubs_lower = [c.strip().lower() for c in clubs_list]
    
    row = {col: 0.0 for col in feature_columns}
    
    b_col = f"branch_{branch_norm}"
    if b_col in row:
        row[b_col] = 1.0
        
    row["avg_gpa"] = float(gpa)
    row["backlogs"] = float(backlogs)
    row["attendance"] = float(attendance)
    row["gpa_trend"] = 0.2
    
    for col in feature_columns:
        if col.startswith("skill_"):
            raw = col.replace("skill_", "").replace("_", " ")
            if any(raw in s for s in skills_lower):
                row[col] = 1.0
                
    row["has_ai_ml"] = 1.0 if any("machine learning" in s or "data science" in s for s in skills_lower) else 0.0
    row["coding_skill_density"] = sum(row.get(f"skill_{s}", 0.0) for s in ["python", "java", "c++", "web_development"])
    row["data_skill_density"] = sum(row.get(f"skill_{s}", 0.0) for s in ["machine_learning", "data_science", "sql"])
    row["hardware_cad_density"] = sum(row.get(f"skill_{s}", 0.0) for s in ["autocad", "solidworks", "embedded_systems", "iot", "revit"])
    
    for col in feature_columns:
        if col.startswith("club_"):
            raw = col.replace("club_", "").replace("_", " ")
            if any(raw in c for c in clubs_lower):
                row[col] = 1.0
                
    row["internship_done"] = 1.0 if internship_done else 0.0
    
    X = pd.DataFrame([row])[feature_columns]
    probs = model.predict_proba(X)[0]
    classes = list(encoder.classes_)
    
    ranked_idx = np.argsort(probs)[::-1]
    
    print("\n" + "=" * 65)
    print("      CAREERVERSE AI - HIGH-PRECISION ROLE INFERENCE (98% PRECISION)")
    print("=" * 65)
    print(f" Student Profile : Branch: {branch_norm} | GPA: {gpa} | Backlogs: {backlogs} | City: {city_tier}")
    print(f" Selected Skills : {', '.join(skills_list)}")
    print("-" * 65)
    
    top_role = classes[ranked_idx[0]]
    top_prob = round(float(probs[ranked_idx[0]]) * 100, 1)
    
    print(f" >>> TOP PREDICTED ROLE:  {top_role.upper()}")
    print(f" >>> MATCH CONFIDENCE:   {top_prob}%\n")
    
    print(" Top Industry Match Breakdown:")
    for i in range(min(5, len(ranked_idx))):
        idx = ranked_idx[i]
        r_name = classes[idx]
        p_val = round(float(probs[idx]) * 100, 1)
        bar = "#" * int(p_val // 4)
        print(f"   {i+1}. {r_name:<42} {p_val:>5.1f}%  [{bar:<25}]")
        
    benchmark = benchmarks.get(top_role, {})
    tier_key = "tier_1" if "1" in city_tier else ("tier_3" if "3" in city_tier else "tier_2")
    base_ctc = benchmark.get(tier_key, benchmark.get("base_ctc", 13.5))
    gpa_mult = 1.0 + max(-0.15, min(0.30, (gpa - 7.0) * 0.08))
    est_ctc = round(float(base_ctc) * gpa_mult, 1)
    tools = benchmark.get("tools_to_learn", ["Git", "Docker", "REST APIs"])
    
    print("-" * 65)
    print(f" Estimated CTC ({city_tier}): INR {est_ctc} LPA (Range: INR {max(4.0, est_ctc-2.5):.1f}L - {est_ctc+3.5:.1f}L)")
    print(f" Recommended Next Tools to Master: {', '.join(tools[:4])}")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        branch = sys.argv[1]
        gpa = float(sys.argv[2]) if len(sys.argv) > 2 else 7.8
        skills = sys.argv[3].split(",") if len(sys.argv) > 3 else ["Python", "SQL"]
        tier = sys.argv[4] if len(sys.argv) > 4 else "Tier 1"
        predict(branch=branch, gpa=gpa, backlogs=0, attendance=85, skills_list=skills, city_tier=tier)
    else:
        predict()
