import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import xgboost as xgb

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "datasets"))
MODELS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "models"))

DATA_FILE = os.path.join(DATASETS_DIR, "versatile_multibranch_dataset.csv")
if not os.path.exists(DATA_FILE):
    DATA_FILE = os.path.join(DATASETS_DIR, "Eng_student_dataset.csv")

MODEL_FILE = os.path.join(MODELS_DIR, "xgboost_career_model.joblib")
ENCODER_FILE = os.path.join(MODELS_DIR, "label_encoder.joblib")
METRICS_FILE = os.path.join(MODELS_DIR, "model_metrics.json")
FEATURES_FILE = os.path.join(MODELS_DIR, "feature_columns.json")
BENCHMARKS_FILE = os.path.join(MODELS_DIR, "career_benchmarks.json")

SKILLS_LIST = [
    "Python", "Java", "C++", "SQL", "Machine Learning", 
    "Data Science", "Web Development", "AutoCAD", "SolidWorks", 
    "Embedded Systems", "IoT", "MATLAB", "Revit", "Cloud/DevOps",
    "Cybersecurity"
]

CLUBS_LIST = [
    "Coding Club", "Robotics", "Literary Society", 
    "Sports Club", "Entrepreneurship Cell", "Cultural Club"
]

BRANCHES_LIST = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"]

# Realistic Tier-aware Indian CTC benchmarks (LPA)
ROLE_BENCHMARKS = {
    "Full-Stack Software Engineer (SDE)": {
        "base_ctc": 13.5,
        "tier_1": 18.5,
        "tier_2": 12.0,
        "tier_3": 8.5,
        "skills": ["Web Development", "Java", "Python", "Cloud/DevOps", "SQL"],
        "tools_to_learn": ["Docker", "Kubernetes", "Next.js", "Redis", "REST APIs"]
    },
    "AI & Machine Learning Engineer": {
        "base_ctc": 16.0,
        "tier_1": 22.0,
        "tier_2": 14.5,
        "tier_3": 10.0,
        "skills": ["Machine Learning", "Python", "Data Science", "SQL"],
        "tools_to_learn": ["PyTorch", "Hugging Face", "LangChain", "MLflow", "Vector DBs"]
    },
    "Data Scientist & Analytics Specialist": {
        "base_ctc": 12.5,
        "tier_1": 16.5,
        "tier_2": 11.0,
        "tier_3": 8.0,
        "skills": ["Data Science", "SQL", "Python", "Machine Learning"],
        "tools_to_learn": ["Tableau", "PowerBI", "Pandas", "Snowflake", "dbt"]
    },
    "Cloud & DevOps Solutions Architect": {
        "base_ctc": 14.0,
        "tier_1": 19.5,
        "tier_2": 13.0,
        "tier_3": 9.0,
        "skills": ["Cloud/DevOps", "Python", "SQL", "Java"],
        "tools_to_learn": ["AWS/GCP", "Terraform", "CI/CD Pipelines", "Linux", "Prometheus"]
    },
    "Embedded Systems & IoT Engineer": {
        "base_ctc": 11.0,
        "tier_1": 15.0,
        "tier_2": 10.0,
        "tier_3": 7.5,
        "skills": ["Embedded Systems", "IoT", "C++", "MATLAB"],
        "tools_to_learn": ["FreeRTOS", "STM32/ESP32", "CAN Bus", "KiCad", "I2C/SPI"]
    },
    "Robotics & Automation Specialist": {
        "base_ctc": 12.0,
        "tier_1": 16.5,
        "tier_2": 11.0,
        "tier_3": 8.0,
        "skills": ["Robotics", "Python", "C++", "SolidWorks"],
        "tools_to_learn": ["ROS2", "Gazebo", "Computer Vision", "Control Theory", "Kinematics"]
    },
    "CAD/CAE Mechanical Systems Designer": {
        "base_ctc": 9.5,
        "tier_1": 13.0,
        "tier_2": 9.0,
        "tier_3": 6.8,
        "skills": ["AutoCAD", "SolidWorks", "MATLAB"],
        "tools_to_learn": ["ANSYS FEA", "GD&T", "Catia", "CFD", "3D Printing"]
    },
    "Civil BIM & Structural Engineer": {
        "base_ctc": 9.0,
        "tier_1": 12.5,
        "tier_2": 8.5,
        "tier_3": 6.5,
        "skills": ["AutoCAD", "Revit", "MATLAB"],
        "tools_to_learn": ["STAAD Pro", "ETABS", "BIM 360", "GIS Mapping", "Primavera"]
    },
    "Technical Product Manager (PM)": {
        "base_ctc": 15.5,
        "tier_1": 21.0,
        "tier_2": 14.0,
        "tier_3": 9.5,
        "skills": ["SQL", "Web Development", "Python"],
        "tools_to_learn": ["A/B Testing", "Figma", "JIRA", "Mixpanel", "PRD Writing"]
    },
    "Strategy & Management Consultant": {
        "base_ctc": 16.5,
        "tier_1": 22.5,
        "tier_2": 15.0,
        "tier_3": 10.0,
        "skills": ["SQL", "Python", "Data Science"],
        "tools_to_learn": ["Financial Modeling", "Market Sizing", "Excel VBA", "Executive Comms"]
    },
    "Cybersecurity & Threat Defense Engineer": {
        "base_ctc": 14.5,
        "tier_1": 20.0,
        "tier_2": 13.5,
        "tier_3": 9.0,
        "skills": ["Cybersecurity", "Linux Systems", "Python", "Cloud/DevOps"],
        "tools_to_learn": ["Wireshark", "Burp Suite", "Metasploit", "SIEM (Splunk)", "Zero Trust Architecture"]
    }
}

def build_features(df):
    features = pd.DataFrame()
    
    # 1. Branch encoding
    for b in BRANCHES_LIST:
        features[f"branch_{b}"] = (df["Branch"].astype(str).str.strip().str.upper() == b).astype(int)
        
    # 2. Academic scores
    features["avg_gpa"] = df["Average GPA"].fillna(df["Average GPA"].median()).astype(float)
    features["backlogs"] = df["Backlogs"].fillna(0).astype(float)
    features["attendance"] = df["Attendance (%)"].fillna(75.0).astype(float)
    
    if "Sem8 GPA" in df.columns and "Sem1 GPA" in df.columns:
        sem8 = pd.to_numeric(df["Sem8 GPA"], errors="coerce").fillna(features["avg_gpa"])
        sem1 = pd.to_numeric(df["Sem1 GPA"], errors="coerce").fillna(features["avg_gpa"])
        features["gpa_trend"] = sem8 - sem1
    else:
        features["gpa_trend"] = 0.0
        
    # 3. Individual skill indicators
    for skill in SKILLS_LIST:
        col = f"skill_{skill.lower().replace(' ', '_').replace('/', '_')}"
        features[col] = df["Skills"].fillna("").apply(lambda s: 1 if skill.lower() in str(s).lower() else 0)
        
    # 4. Domain Skill Aggregations
    features["coding_skill_density"] = (
        features["skill_python"] + features["skill_java"] + features["skill_c++"] + features["skill_web_development"]
    )
    features["data_skill_density"] = (
        features["skill_machine_learning"] + features["skill_data_science"] + features["skill_sql"]
    )
    features["hardware_cad_density"] = (
        features["skill_autocad"] + features["skill_solidworks"] + features["skill_embedded_systems"] + features["skill_iot"] + features["skill_revit"]
    )
    
    # 5. Clubs indicators
    for club in CLUBS_LIST:
        col = f"club_{club.lower().replace(' ', '_')}"
        features[col] = df["Clubs"].fillna("").apply(lambda c: 1 if club.lower() in str(c).lower() else 0)
        
    # 6. Internship indicator
    features["internship_done"] = df["Internship Done"].fillna("No").apply(
        lambda x: 1 if str(x).strip().lower() == "yes" else 0
    )
    
    return features

def train_versatile_model():
    print(f"Loading {DATA_FILE}...")
    df = pd.read_csv(DATA_FILE)
    
    # Determine target column (use Granular Role if available)
    target_col = "Granular Role" if "Granular Role" in df.columns else "Placement Domain"
    
    # Filter classes with at least 5 samples
    counts = df[target_col].value_counts()
    valid_classes = counts[counts >= 5].index.tolist()
    df = df[df[target_col].isin(valid_classes)].copy()
    
    print("\nTraining Target Role Distribution:")
    print(df[target_col].value_counts())
    
    X = build_features(df)
    feature_cols = list(X.columns)
    
    le = LabelEncoder()
    y = le.fit_transform(df[target_col])
    classes = list(le.classes_)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.18, random_state=42, stratify=y
    )
    
    model = xgb.XGBClassifier(
        n_estimators=220,
        max_depth=6,
        learning_rate=0.06,
        subsample=0.88,
        colsample_bytree=0.88,
        random_state=42,
        eval_metric="mlogloss"
    )
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    acc = float(accuracy_score(y_test, y_pred))
    prec_weighted = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
    prec_macro = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
    rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
    f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
    cm = confusion_matrix(y_test, y_pred).tolist()
    report = classification_report(y_test, y_pred, target_names=classes, output_dict=True, zero_division=0)
    
    importances = model.feature_importances_
    sorted_features = [
        {"feature": f, "importance": round(float(imp), 4)}
        for f, imp in sorted(zip(feature_cols, importances), key=lambda x: x[1], reverse=True)
    ]
    
    metrics = {
        "model_name": "CareerVerse XGBoost Multi-Role Engine (Versatile Industry Tracks)",
        "dataset_source": "Synthesized Multi-Branch Indian Engineering Benchmarks (39,000+ Records)",
        "total_records": len(df),
        "validation_samples": len(X_test),
        "classes": classes,
        "overall_accuracy": round(acc * 100, 2),
        "precision_weighted": round(prec_weighted * 100, 2),
        "precision_macro": round(prec_macro * 100, 2),
        "recall_weighted": round(rec * 100, 2),
        "f1_score": round(f1 * 100, 2),
        "confusion_matrix": cm,
        "per_class_metrics": {
            cls: {
                "precision": round(report[cls]["precision"] * 100, 1),
                "recall": round(report[cls]["recall"] * 100, 1),
                "f1_score": round(report[cls]["f1-score"] * 100, 1),
                "support": int(report[cls]["support"])
            }
            for cls in classes
        },
        "top_features": sorted_features[:12]
    }
    
    # Save artifacts
    joblib.dump(model, MODEL_FILE)
    joblib.dump(le, ENCODER_FILE)
    with open(METRICS_FILE, "w") as f:
        json.dump(metrics, f, indent=2)
    with open(FEATURES_FILE, "w") as f:
        json.dump(feature_cols, f, indent=2)
    with open(BENCHMARKS_FILE, "w") as f:
        json.dump(ROLE_BENCHMARKS, f, indent=2)
        
    print("\n" + "=" * 60)
    print("TRAINING SUCCESSFUL!")
    print(f"Overall Accuracy: {metrics['overall_accuracy']}%")
    print(f"Weighted Precision: {metrics['precision_weighted']}%")
    print(f"Roles ({len(classes)}): {classes}")
    print("=" * 60)
    return metrics

if __name__ == "__main__":
    train_versatile_model()
