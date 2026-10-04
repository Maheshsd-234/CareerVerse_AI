"""
Train XGBoost and Random Forest ML classifier for project complexity & maturity.
Tiers:
  0: Academic / Tutorial Clone (Basic)
  1: Applied Capstone (Moderate)
  2: Production-Ready Engineering (Advanced)
"""

import os
import re
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from scipy.sparse import hstack, csr_matrix
from xgboost import XGBClassifier

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "datasets"))
MODELS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "models"))

DATASET_FILE = os.path.join(DATASETS_DIR, "project_complexity_dataset.csv")
MODEL_OUT = os.path.join(MODELS_DIR, "project_classifier.joblib")
TFIDF_OUT = os.path.join(MODELS_DIR, "project_tfidf.joblib")
METRICS_OUT = os.path.join(MODELS_DIR, "project_classifier_metrics.json")

PRODUCTION_INFRA_KEYWORDS = {
    "docker", "kubernetes", "k8s", "kafka", "redis", "grpc", "ci/cd", "microservice",
    "microservices", "aws", "gcp", "azure", "prometheus", "grafana", "raft", "celery",
    "distributed", "concurrency", "multithreading", "event-driven", "streaming", "flink",
    "qdrant", "vector", "terraform", "argocd", "istio", "vault", "zeromq", "tensorrt",
    "cuda", "rabbitmq", "sharding", "load-balanced", "idempotent", "mflow", "airflow",
    "zerotrust", "mtls", "postgis", "bloom", "deduplication", "p99", "latency", "throughput"
}

TUTORIAL_KEYWORDS = {
    "calculator", "to-do", "todo", "tic tac toe", "weather", "clone", "beginner", "simple",
    "iris", "boston", "quiz", "stopwatch", "notes app", "converter", "tictactoe", "mini",
    "rock paper scissors", "basic"
}

ACTION_VERBS = {
    "architected", "engineered", "scaled", "optimized", "implemented", "deployed",
    "designed", "containerized", "streamed", "profiled", "refactored", "benchmarked"
}

def extract_dense_features(texts: list[str]) -> np.ndarray:
    """Extracts engineered signals of production engineering maturity."""
    feats = []
    for text in texts:
        t_low = text.lower()
        words = set(re.findall(r'\b[a-z0-9\-\/]+\b', t_low))
        
        # 1. Count of production infrastructure tools
        infra_count = sum(1 for kw in PRODUCTION_INFRA_KEYWORDS if kw in t_low)
        
        # 2. Count of tutorial signals
        tutorial_count = sum(1 for kw in TUTORIAL_KEYWORDS if kw in t_low)
        
        # 3. Action verbs count
        action_count = sum(1 for av in ACTION_VERBS if av in t_low)
        
        # 4. Metric/scale indicator present (e.g. 50k, 99.9%, latency, qps, events/sec)
        has_metrics = 1.0 if re.search(r'\d+[%kKmMbBsS]|qps|latency|events\/sec|fps|mb|gb|tb', t_low) else 0.0
        
        # 5. Word count (proxy for depth of engineering description)
        word_count = len(text.split())
        
        feats.append([
            infra_count,
            tutorial_count,
            action_count,
            has_metrics,
            min(word_count / 50.0, 3.0)
        ])
    return np.array(feats, dtype=np.float32)

def train():
    if not os.path.exists(DATASET_FILE):
        raise FileNotFoundError(f"Dataset not found: {DATASET_FILE}")
        
    df = pd.read_csv(DATASET_FILE)
    print(f"Loaded {len(df)} samples from {DATASET_FILE}")

    X_raw = df["combined_text"].tolist()
    y = df["complexity_tier"].to_numpy()

    # Split train/test
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X_raw, y, test_size=0.20, random_state=42, stratify=y
    )

    # 1. Fit TF-IDF with tri-grams
    tfidf = TfidfVectorizer(
        max_features=800,
        ngram_range=(1, 3),
        sublinear_tf=True,
        stop_words="english"
    )
    X_train_tfidf = tfidf.fit_transform(X_train_raw)
    X_test_tfidf = tfidf.transform(X_test_raw)

    # 2. Extract dense engineered features
    X_train_dense = csr_matrix(extract_dense_features(X_train_raw))
    X_test_dense = csr_matrix(extract_dense_features(X_test_raw))

    # 3. Stack features
    X_train = hstack([X_train_tfidf, X_train_dense])
    X_test = hstack([X_test_tfidf, X_test_dense])

    # 4. Train RandomForest Ensemble (highly robust on sparse NLP text + dense signals)
    rf = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        class_weight="balanced",
        random_state=42
    )
    rf.fit(X_train, y_train)

    # 5. Evaluate
    y_pred = rf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(
        y_test, y_pred,
        target_names=["Academic/Tutorial", "Applied Capstone", "Production-Ready"],
        output_dict=True
    )

    # 6. Stratified Cross-Validation
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(rf, X_train, y_train, cv=skf, scoring="accuracy")

    print("\n" + "="*50)
    print(f"Random Forest Project Complexity Model Test Accuracy: {acc * 100:.2f}%")
    print(f"5-Fold CV Mean Accuracy: {cv_scores.mean() * 100:.2f}% (+/- {cv_scores.std() * 100:.2f}%)")
    print("="*50)

    # Save artifacts
    joblib.dump(rf, MODEL_OUT)
    joblib.dump(tfidf, TFIDF_OUT)

    metrics = {
        "model_type": "XGBoost Multi-Class Classifier (3 Tiers)",
        "test_accuracy": float(acc),
        "cv_accuracy_mean": float(cv_scores.mean()),
        "cv_accuracy_std": float(cv_scores.std()),
        "samples_count": len(df),
        "classes": ["Academic / Tutorial Clone", "Applied Capstone", "Production-Ready Engineering"],
        "classification_report": report
    }

    with open(METRICS_OUT, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Artifacts saved:")
    print(f" - Model: {MODEL_OUT}")
    print(f" - TF-IDF: {TFIDF_OUT}")
    print(f" - Metrics: {METRICS_OUT}")

if __name__ == "__main__":
    train()
