# CareerVerse AI - Backend Intelligence & ML Services

FastAPI-powered machine learning inference, career trajectory prediction, project complexity classification, and semantic resume matching engine.

---

## 📁 Directory Architecture

```
backend/
├── main.py                     # Primary FastAPI application with CORS & REST endpoints
├── predict_cli.py              # CLI testing harness for career path prediction
├── requirements.txt            # Python dependencies (FastAPI, XGBoost, Torch, etc.)
├── README.md                   # Backend architecture documentation
│
└── ml/
    ├── datasets/               # Benchmark engineering & placement training datasets
    │   ├── Eng_student_dataset.csv
    │   ├── Indian_Student_Placement_Dataset_2025.csv
    │   ├── student_placement_career_success_dataset.csv
    │   ├── versatile_multibranch_dataset.csv
    │   └── project_complexity_dataset.csv
    │
    ├── models/                 # Serialized weights, encoders, benchmarks & metrics
    │   ├── xgboost_career_model.joblib
    │   ├── label_encoder.joblib
    │   ├── project_classifier.joblib
    │   ├── project_tfidf.joblib
    │   ├── career_benchmarks.json
    │   ├── feature_columns.json
    │   ├── model_metrics.json
    │   └── project_classifier_metrics.json
    │
    ├── services/               # Runtime inference engines & analyzers
    │   ├── resume_skill_analyzer.py   # Multi-tier project complexity & skill gap scoring
    │   ├── semantic_matcher.py        # SentenceTransformers dense embedding cosine similarity
    │   ├── email_parser.py            # Station 10 NLP email parser (Naukri, Internshala, LinkedIn)
    │   ├── gmail_service.py           # Station 10 Gmail OAuth API & candidate inbox pipeline
    │   └── applications_api.py        # Station 10 REST endpoints & funnel analytics
    │
    └── training/               # Offline training pipelines & dataset preparation
        ├── prepare_versatile_dataset.py
        ├── train_career_model.py
        ├── prepare_project_complexity_dataset.py
        └── train_project_classifier.py
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Server
```bash
python main.py
```
*Or via Uvicorn CLI directly:*
```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Service health check |
| `GET` | `/api/ml/metrics` | Career model accuracy, precision, recall & F1 scores |
| `GET` | `/api/ml/schema` | Feature columns schema required for prediction |
| `POST` | `/api/ml/predict` | Multiclass career path inference with probability distributions |
| `GET` | `/api/resume/roles-benchmark` | Industry benchmark requirements & compensation ladders |
| `POST` | `/api/resume/analyze` | Project maturity evaluation & missing skill gap scoring |
| `POST` | `/api/resume/match-job` | Resume vs. JD semantic embedding cosine match & salary impact |
| `POST` | `/api/applications/sync-email` | Sync candidate Gmail inbox via OAuth/pipeline & parse applications |
| `GET` | `/api/applications/list/{user_id}` | Query all tracked applications with status & platform filtering |
| `GET` | `/api/applications/analytics/{user_id}` | Compute recruitment funnel conversion rates & platform split |
| `PUT` | `/api/applications/update/{user_id}/{app_id}` | Update application status, recruiter notes & interview date |
| `POST` | `/api/applications/create/{user_id}` | Manually log off-portal or direct job applications |
| `GET` | `/api/applications/recommendations/{user_id}` | Derive AI follow-up, interview prep & resume improvement alerts |
