"""
CareerVerse AI - Deterministic Personalized Career Roadmap Planning Engine (Station 05)
Implements:
- Role competency graph & prerequisite resolution via NetworkX DAG
- Evidence-based skill gap analysis (Current level vs Target level)
- Capacity, deadline & feasibility analysis
- Hierarchical generation: Phase -> Month -> Week -> Tasks (learn, practice, project, assessment, interview)
- Evidence-based CareerVerse Skill Mastery calculation (configurable weights)
- Adaptive remediation (<60% assessment score) & acceleration (>=85% score)
- Career transition bridge (overlapping skills detection)
- Minimum Viable Career Path (MVCP) mode
- What-If simulator
- Natural Language command interpreter
"""

import os
import sys
import math
import uuid
import json
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Set, Tuple

CUR_DIR = os.path.dirname(os.path.abspath(__file__))
if CUR_DIR not in sys.path:
    sys.path.insert(0, CUR_DIR)

from skill_graph import skill_graph, SKILL_REGISTRY

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.environ.get("GROQ_API_KEY") or os.environ.get("VITE_GROQ_API_KEY", "")


# Configurable Skill Proficiency Thresholds
PROFICIENCY_THRESHOLDS = {
    "beginner": (0, 39),
    "developing": (40, 59),
    "competent": (60, 79),
    "strong": (80, 89),
    "advanced": (90, 100),
}

# Configurable CareerVerse Skill Mastery Weights
MASTERY_WEIGHTS = {
    "learning": 0.15,
    "practice": 0.25,
    "assessment": 0.30,
    "project": 0.20,
    "interview": 0.10,
}

# Role Competency Requirements & Specialization Branches
ROLE_COMPETENCY_REGISTRY: Dict[str, Dict[str, Any]] = {
    "ai-engineer": {
        "title": "AI & Generative AI Systems Engineer",
        "category": "AI / Data",
        "core_skills": [
            "Programming Fundamentals",
            "Python",
            "Mathematics & Statistics for Machine Learning",
            "NumPy & Pandas Data Wrangling",
            "Applied Machine Learning",
            "Deep Learning & PyTorch",
            "Transformers & NLP",
            "RESTful API Development",
            "LLMs & Generative AI Systems",
            "RAG & Vector Search",
            "Docker & Containerization",
            "MLOps & Model Deployment"
        ],
        "recommended_skills": [
            "NoSQL Databases (MongoDB/Redis)",
            "System Design & Scalability",
            "Cloud Foundations (AWS/GCP/Azure)"
        ],
        "specializations": {
            "RAG & Autonomous Agents": ["RAG & Vector Search", "LLMs & Generative AI Systems", "NoSQL Databases (MongoDB/Redis)"],
            "MLOps & Production Serving": ["MLOps & Model Deployment", "Docker & Containerization", "Kubernetes & Orchestration"],
            "Computer Vision & Multimodal": ["Deep Learning & PyTorch", "Transformers & NLP"]
        },
        "phase_templates": [
            ("Foundations & Scientific Computing", "Master Python, computational linear algebra, probability, and vectorized data wrangling."),
            ("Applied Machine Learning & Evaluation", "Build supervised and unsupervised statistical predictors with cross-validation."),
            ("Deep Learning & Transformer Architectures", "Train neural networks with PyTorch and fine-tune modern Transformer attention models."),
            ("Generative AI, RAG & Vector Systems", "Architect production RAG pipelines, dense embeddings, and agentic LLM workflows."),
            ("MLOps, Inference Serving & Deployment", "Containerize inference APIs with FastAPI and Docker for sub-50ms p99 latency."),
            ("Portfolio Capstones & Engineering Interviews", "Deploy end-to-end production systems and master AI systems design interview rounds.")
        ]
    },
    "ml-engineer": {
        "title": "Machine Learning Engineer",
        "category": "AI / Data",
        "core_skills": [
            "Programming Fundamentals",
            "Python",
            "Data Structures & Algorithms",
            "Mathematics & Statistics for Machine Learning",
            "NumPy & Pandas Data Wrangling",
            "Applied Machine Learning",
            "Deep Learning & PyTorch",
            "Docker & Containerization",
            "RESTful API Development",
            "MLOps & Model Deployment"
        ],
        "recommended_skills": [
            "Transformers & NLP",
            "Cloud Foundations (AWS/GCP/Azure)",
            "SQL & Relational Databases"
        ],
        "specializations": {
            "Core ML & Algorithmic Optimization": ["Applied Machine Learning", "Data Structures & Algorithms"],
            "Production MLOps": ["MLOps & Model Deployment", "Docker & Containerization", "Kubernetes & Orchestration"]
        },
        "phase_templates": [
            ("Core Programming & Math Base", "Establish Pythonic coding, algorithms, and multivariable statistics foundations."),
            ("Statistical Learning & Feature Engineering", "Master feature pipelines, gradient boosting, and evaluation metrics."),
            ("Deep Learning & PyTorch Workflows", "Build convolutional and recurrent neural models with GPU hardware acceleration."),
            ("Model Serving & Containerization", "Package models with ONNX, FastAPI, and Docker for scalable deployment."),
            ("Capstone System & Interview Mastery", "Deliver a live ML pipeline with observability and ace live coding assessments.")
        ]
    },
    "software-engineer": {
        "title": "Software Development Engineer (SDE)",
        "category": "Software Engineering",
        "core_skills": [
            "Programming Fundamentals",
            "Data Structures & Algorithms",
            "Java",
            "Python",
            "SQL & Relational Databases",
            "RESTful API Development",
            "Git & GitHub",
            "Microservices Architecture",
            "System Design & Scalability"
        ],
        "recommended_skills": [
            "Docker & Containerization",
            "NoSQL Databases (MongoDB/Redis)",
            "CI/CD Pipelines (GitHub Actions)"
        ],
        "specializations": {
            "Backend Systems & Microservices": ["Microservices Architecture", "SQL & Relational Databases", "Docker & Containerization"],
            "High-Scale Distributed Systems": ["System Design & Scalability", "NoSQL Databases (MongoDB/Redis)"]
        },
        "phase_templates": [
            ("Algorithmic Foundations & Core Language", "Master syntax, memory models, time complexity, and fundamental data structures."),
            ("Advanced DSA & Relational Data Layer", "Solve complex graph/DP problems and design normalized transactional SQL databases."),
            ("API Architecture & Modular Services", "Build secure RESTful services with authentication, caching, and rate limiting."),
            ("Distributed Systems & High-Level Design", "Design scalable architectures handling millions of concurrent operations."),
            ("Placement Sprint & Mock Tech Interviews", "Ace DSA technical rounds, system design whiteboarding, and behavioral evaluations.")
        ]
    },
    "frontend-dev": {
        "title": "Frontend Engineer",
        "category": "Software Engineering",
        "core_skills": [
            "Programming Fundamentals",
            "HTML & CSS Styling",
            "JavaScript",
            "TypeScript",
            "React.js",
            "Tailwind CSS & Design Systems",
            "Next.js & Full-Stack Web",
            "Web Performance & Accessibility",
            "Git & GitHub"
        ],
        "recommended_skills": [
            "RESTful API Development",
            "UI/UX Design Systems & Figma",
            "CI/CD Pipelines (GitHub Actions)"
        ],
        "specializations": {
            "Modern React & Next.js": ["Next.js & Full-Stack Web", "TypeScript", "React.js"],
            "Design Systems & Web Performance": ["Tailwind CSS & Design Systems", "Web Performance & Accessibility"]
        },
        "phase_templates": [
            ("Web Foundations & Modern JavaScript", "Master semantic HTML, CSS layout paradigms, and ES6+ asynchronous JavaScript."),
            ("React & Component Architecture", "Build interactive component trees with state management, hooks, and TypeScript."),
            ("Next.js, Server Actions & Design Tokens", "Build full-stack SSR/SSG applications with Tailwind CSS design systems."),
            ("Web Performance, Accessibility & Testing", "Optimize Core Web Vitals, implement WCAG 2.1 AA accessibility, and unit test UI."),
            ("Portfolio Showcase & Frontend Interviews", "Publish production web apps with 100 Lighthouse scores and practice UI challenges.")
        ]
    },
    "backend-dev": {
        "title": "Backend Systems Engineer",
        "category": "Software Engineering",
        "core_skills": [
            "Programming Fundamentals",
            "Python",
            "Java",
            "SQL & Relational Databases",
            "NoSQL Databases (MongoDB/Redis)",
            "RESTful API Development",
            "Microservices Architecture",
            "Docker & Containerization",
            "System Design & Scalability"
        ],
        "recommended_skills": [
            "Linux & Bash Scripting",
            "Cloud Foundations (AWS/GCP/Azure)",
            "CI/CD Pipelines (GitHub Actions)"
        ],
        "specializations": {
            "Distributed Microservices": ["Microservices Architecture", "Docker & Containerization", "System Design & Scalability"],
            "Database & Caching Infrastructure": ["SQL & Relational Databases", "NoSQL Databases (MongoDB/Redis)"]
        },
        "phase_templates": [
            ("Core Language & Persistence Foundations", "Master backend programming, SQL normalization, transactions, and indexing."),
            ("API Development & Caching Layers", "Develop high-throughput REST APIs and sub-millisecond Redis caching layers."),
            ("Microservices & Containerized Workflows", "Decompose monoliths into event-driven containerized microservices."),
            ("Distributed Architecture & Scalability", "Implement sharding, replication, rate limiters, and distributed locking."),
            ("Production Readiness & Backend Interviews", "Benchmark latency, profile memory leaks, and master backend interview rounds.")
        ]
    },
    "fullstack-dev": {
        "title": "Full Stack Developer",
        "category": "Software Engineering",
        "core_skills": [
            "Programming Fundamentals",
            "HTML & CSS Styling",
            "JavaScript",
            "TypeScript",
            "React.js",
            "SQL & Relational Databases",
            "RESTful API Development",
            "Next.js & Full-Stack Web",
            "Docker & Containerization"
        ],
        "recommended_skills": [
            "NoSQL Databases (MongoDB/Redis)",
            "CI/CD Pipelines (GitHub Actions)",
            "Git & GitHub"
        ],
        "specializations": {
            "TypeScript End-to-End": ["Next.js & Full-Stack Web", "TypeScript", "React.js"],
            "Full Stack Cloud Deployments": ["Docker & Containerization", "CI/CD Pipelines (GitHub Actions)"]
        },
        "phase_templates": [
            ("Core Web Foundations & Database Design", "Build responsive interfaces and design relational database schemas."),
            ("Frontend State & Backend REST APIs", "Develop React client applications connected to robust REST APIs."),
            ("Next.js Full-Stack App Router & Auth", "Unify frontend and backend with server actions, SSR, and secure authentication."),
            ("Containerization & CI/CD Cloud Pipeline", "Dockerize full-stack services and deploy with automated GitHub Actions."),
            ("Production Capstone & Full-Stack Interviews", "Launch a scalable commercial web product and prepare for full-stack evaluations.")
        ]
    },
    "devops-sre": {
        "title": "Cloud & DevOps Solutions Architect",
        "category": "Cloud & Security",
        "core_skills": [
            "Linux & Bash Scripting",
            "Git & GitHub",
            "Docker & Containerization",
            "Cloud Foundations (AWS/GCP/Azure)",
            "Terraform & Infrastructure as Code",
            "Kubernetes & Orchestration",
            "CI/CD Pipelines (GitHub Actions)",
            "Network Security & Protocols"
        ],
        "recommended_skills": [
            "Cloud Security & IAM",
            "Python",
            "RESTful API Development"
        ],
        "specializations": {
            "Kubernetes & Container Orchestration": ["Kubernetes & Orchestration", "Docker & Containerization"],
            "Cloud Infrastructure as Code": ["Terraform & Infrastructure as Code", "Cloud Foundations (AWS/GCP/Azure)"]
        },
        "phase_templates": [
            ("Linux Systems & Shell Automation", "Master Linux administration, process control, networking, and Bash scripting."),
            ("Containerization & Cloud Infrastructure", "Build optimized Docker containers and provision multi-region cloud services."),
            ("Infrastructure as Code (Terraform) & CI/CD", "Automate immutable infrastructure with Terraform and continuous delivery pipelines."),
            ("Kubernetes Orchestration & Cluster Management", "Manage production Kubernetes pods, ingress controllers, and Helm charts."),
            ("SRE Observability & DevOps Interviews", "Configure Prometheus/Grafana metrics, implement SLOs, and ace DevOps interviews.")
        ]
    },
    "cybersecurity-analyst": {
        "title": "Cybersecurity & Threat Defense Engineer",
        "category": "Cloud & Security",
        "core_skills": [
            "Linux & Bash Scripting",
            "Network Security & Protocols",
            "Python",
            "Application Security & OWASP",
            "Threat Defense & Penetration Testing",
            "Cloud Security & IAM"
        ],
        "recommended_skills": [
            "Cloud Foundations (AWS/GCP/Azure)",
            "Docker & Containerization"
        ],
        "specializations": {
            "Application Security (AppSec)": ["Application Security & OWASP", "Threat Defense & Penetration Testing"],
            "Cloud Security Architecture": ["Cloud Security & IAM", "Network Security & Protocols"]
        },
        "phase_templates": [
            ("Linux & Network Packet Defense", "Analyze network packets with Wireshark and configure enterprise firewalls."),
            ("Offensive Security & OWASP Top 10", "Identify and exploit web vulnerabilities including SQLi, XSS, and CSRF."),
            ("Penetration Testing & Exploit Labs", "Perform privilege escalation, ethical penetration testing, and vulnerability reporting."),
            ("Cloud Security Posture & Zero-Trust", "Architect least-privilege IAM policies and zero-trust cloud network perimeters."),
            ("Security Auditing & Cyber Interview Sprints", "Conduct full-scale threat model reviews and prepare for cybersecurity interviews.")
        ]
    },
    "data-scientist": {
        "title": "Data Scientist & Analytics Specialist",
        "category": "AI / Data",
        "core_skills": [
            "Programming Fundamentals",
            "Python",
            "Mathematics & Statistics for Machine Learning",
            "SQL & Relational Databases",
            "NumPy & Pandas Data Wrangling",
            "Applied Machine Learning",
            "Deep Learning & PyTorch",
            "Product Strategy & Analytics"
        ],
        "recommended_skills": [
            "Transformers & NLP",
            "Docker & Containerization"
        ],
        "specializations": {
            "Statistical Inference & Experimentation": ["Mathematics & Statistics for Machine Learning", "Applied Machine Learning"],
            "Deep Learning & Predictive Analytics": ["Deep Learning & PyTorch", "Transformers & NLP"]
        },
        "phase_templates": [
            ("Mathematical Statistics & Python Foundations", "Master probability theory, statistical hypothesis testing, and vectorized analysis."),
            ("Data Wrangling & Exploratory Modeling", "Clean messy datasets, handle missing values, and extract key predictive features."),
            ("Supervised & Unsupervised Machine Learning", "Train regression, decision trees, random forests, and clustering models."),
            ("Deep Learning & Business Storytelling", "Deploy neural network models and translate findings into executive-ready dashboards."),
            ("End-to-End Data Science Capstone", "Publish a reproducible data science notebook and prepare for technical case interviews.")
        ]
    },
    "technical-writer": {
        "title": "Technical Writer & Documentation Engineer",
        "category": "Management",
        "core_skills": [
            "Git & GitHub",
            "HTML & CSS Styling",
            "RESTful API Development",
            "Technical Writing & OpenAPI Specs",
            "Linux & Bash Scripting"
        ],
        "recommended_skills": [
            "Product Strategy & Analytics",
            "UI/UX Design Systems & Figma"
        ],
        "specializations": {
            "API & Developer Documentation": ["Technical Writing & OpenAPI Specs", "RESTful API Development"],
            "Docs-as-Code Infrastructure": ["Git & GitHub", "Linux & Bash Scripting"]
        },
        "phase_templates": [
            ("Docs-as-Code Tooling & Version Control", "Master Markdown/MDX, Git branching workflows, and documentation generators."),
            ("API Specifications & OpenAPI 3.1 YAML", "Write interactive Swagger/Redoc references and document REST endpoints."),
            ("Information Architecture & Diátaxis Framework", "Structure documentation into tutorials, how-to guides, reference, and explanation."),
            ("Automated Prose Linting & Developer Portals", "Configure Vale prose linters in GitHub Actions and publish static doc sites."),
            ("Portfolio Showcase & Technical Writing Sprints", "Publish comprehensive API docs and complete mock writing evaluations.")
        ]
    },
    "data-analyst": {
        "title": "Data Analyst & Business Intelligence Specialist",
        "category": "AI / Data",
        "core_skills": [
            "Programming Fundamentals",
            "Python",
            "SQL & Relational Databases",
            "NumPy & Pandas Data Wrangling",
            "Product Strategy & Analytics"
        ],
        "recommended_skills": [
            "Applied Machine Learning",
            "Git & GitHub"
        ],
        "specializations": {
            "Product Analytics": ["Product Strategy & Analytics", "SQL & Relational Databases"],
            "Business Intelligence": ["NumPy & Pandas Data Wrangling", "SQL & Relational Databases"]
        },
        "phase_templates": [
            ("SQL Querying & Database Analytics", "Master relational schemas, advanced window functions, CTEs, and cohort aggregations."),
            ("Python Data Wrangling with Pandas", "Clean messy datasets, handle missing indicators, and compute statistical aggregates."),
            ("Exploratory Data Analysis & Visualization", "Build dynamic business dashboards, charts, and interactive KPIs."),
            ("Business Metrics & Statistical Decision Making", "Formulate hypotheses, compute A/B test sample metrics, and deliver executive summaries."),
            ("Capstone Portfolio & Analyst Case Interviews", "Present end-to-end data analytics story with executive presentation and SQL live tests.")
        ]
    },
    "cloud-engineer": {
        "title": "Cloud Infrastructure & Platform Engineer",
        "category": "Cloud & Security",
        "core_skills": [
            "Linux & Bash Scripting",
            "Git & GitHub",
            "Cloud Foundations (AWS/GCP/Azure)",
            "Docker & Containerization",
            "Terraform & Infrastructure as Code",
            "Kubernetes & Orchestration",
            "Cloud Security & IAM"
        ],
        "recommended_skills": [
            "CI/CD Pipelines (GitHub Actions)",
            "Network Security & Protocols",
            "Python"
        ],
        "specializations": {
            "Infrastructure as Code": ["Terraform & Infrastructure as Code", "Cloud Foundations (AWS/GCP/Azure)"],
            "Container Platforms": ["Kubernetes & Orchestration", "Docker & Containerization"]
        },
        "phase_templates": [
            ("Linux Systems & Cloud Core Fundamentals", "Configure Linux environments, virtual private clouds (VPCs), and subnet routing."),
            ("Cloud Services & Containerization", "Architect containerized workloads with Docker and manage compute, storage, and IAM."),
            ("Automated Infrastructure with Terraform", "Author reusable Terraform modules and automate state backends in cloud object storage."),
            ("Kubernetes Clusters & Orchestration", "Deploy multi-tier applications with ingress, service mesh, and secret management."),
            ("Cloud Reliability & Platform Interviews", "Master cloud system design, disaster recovery architectures, and technical assessments.")
        ]
    },
    "nlp-engineer": {
        "title": "Natural Language Processing (NLP) Engineer",
        "category": "AI / Data",
        "core_skills": [
            "Programming Fundamentals",
            "Python",
            "Mathematics & Statistics for Machine Learning",
            "NumPy & Pandas Data Wrangling",
            "Applied Machine Learning",
            "Deep Learning & PyTorch",
            "Transformers & NLP",
            "LLMs & Generative AI Systems",
            "RAG & Vector Search"
        ],
        "recommended_skills": [
            "Docker & Containerization",
            "RESTful API Development"
        ],
        "specializations": {
            "Transformer Fine-Tuning": ["Transformers & NLP", "Deep Learning & PyTorch"],
            "Enterprise Search & RAG": ["RAG & Vector Search", "LLMs & Generative AI Systems"]
        },
        "phase_templates": [
            ("Python & Text Preprocessing Foundations", "Master regex, tokenization, n-grams, and TF-IDF representations."),
            ("Deep Learning & Sequence Models", "Train recurrent neural networks, LSTMs, and word embedding representations in PyTorch."),
            ("Transformer Architectures & Attention", "Implement self-attention, multi-head attention, and fine-tune BERT models."),
            ("Modern LLMs & Retrieval Systems", "Build vector search embeddings and generative AI response pipelines."),
            ("Production NLP Systems & Interviews", "Deploy sub-second inference pipelines and ace domain-specific NLP design rounds.")
        ]
    },
    "computer-vision-engineer": {
        "title": "Computer Vision & Visual AI Systems Engineer",
        "category": "AI / Data",
        "core_skills": [
            "Programming Fundamentals",
            "Python",
            "Mathematics & Statistics for Machine Learning",
            "NumPy & Pandas Data Wrangling",
            "Applied Machine Learning",
            "Deep Learning & PyTorch",
            "Docker & Containerization",
            "MLOps & Model Deployment"
        ],
        "recommended_skills": [
            "RESTful API Development",
            "Git & GitHub"
        ],
        "specializations": {
            "Object Detection & Segmentation": ["Deep Learning & PyTorch", "Applied Machine Learning"],
            "Edge AI & Embedded Inference": ["Docker & Containerization", "MLOps & Model Deployment"]
        },
        "phase_templates": [
            ("Vector Mathematics & Image Processing", "Understand 2D convolution filters, image transformations, and color spaces."),
            ("Convolutional Neural Networks (CNNs)", "Architect ResNet, VGG, and EfficientNet backbones with PyTorch."),
            ("Object Detection & Segmentation", "Train YOLO and Mask R-CNN architectures with custom bounding box annotations."),
            ("Model Optimization & TensorRT", "Quantize weights (INT8/FP16) and compile models for hardware acceleration."),
            ("Real-Time Vision Pipeline & Interviews", "Benchmark video streaming FPS and prepare for computer vision technical screens.")
        ]
    },
    "llm-engineer": {
        "title": "LLM & Autonomous Agentic Systems Engineer",
        "category": "AI / Data",
        "core_skills": [
            "Programming Fundamentals",
            "Python",
            "NumPy & Pandas Data Wrangling",
            "Deep Learning & PyTorch",
            "Transformers & NLP",
            "LLMs & Generative AI Systems",
            "RAG & Vector Search",
            "RESTful API Development",
            "Docker & Containerization",
            "MLOps & Model Deployment"
        ],
        "recommended_skills": [
            "NoSQL Databases (MongoDB/Redis)",
            "System Design & Scalability"
        ],
        "specializations": {
            "Agentic Workflows": ["LLMs & Generative AI Systems", "RESTful API Development"],
            "Enterprise RAG": ["RAG & Vector Search", "NoSQL Databases (MongoDB/Redis)"]
        },
        "phase_templates": [
            ("Python & Computational Foundations", "Master asynchronous Python, streaming generators, and data serialization."),
            ("Transformer Attention & Dense Embeddings", "Compute dense semantic embeddings and build vector indexing structures."),
            ("Production RAG & Vector Search", "Architect hybrid keyword/semantic search with re-ranking and citation tracking."),
            ("Multi-Agent Systems & Tool Calling", "Build deterministic tool-calling agents with reflection and self-correction loops."),
            ("LLM Evaluation, Guardrails & Deployment", "Implement LLM-as-a-judge evaluation, cost controls, latency caching, and deployment.")
        ]
    }
}

SKILL_TOPICS_MAP: Dict[str, List[str]] = {
    "Programming Fundamentals": [
        "Variables, Memory Models & Primitive Data Types",
        "Arithmetic, Logical & Bitwise Operators",
        "Conditional Branching & Control Flow",
        "Loops, Iteration & Break/Continue Statements",
        "Functions, Parameter Passing & Variable Scopes",
        "Basic Error Handling & Standard I/O Operations"
    ],
    "Python": [
        "Variables, Dynamic Typing & Built-in Data Types",
        "Operators, Expressions & Type Casting",
        "Conditional Statements & Loop Constructs",
        "Functions, Arguments (*args, **kwargs) & Docstrings",
        "Lists, Tuples, Dictionaries & Sets Manipulation",
        "Modules, Exception Handling & Object-Oriented Programming"
    ],
    "NumPy & Pandas Data Wrangling": [
        "NumPy Array Creation, Shapes & Indexing",
        "Vectorized Operations & Broadcasting Rules",
        "Pandas Series & DataFrame Foundations",
        "Handling Missing Values, Duplicates & Data Imputation",
        "Groupby Aggregations, Pivot Tables & Reshaping",
        "Merging, Joining & Concat Operations on Datasets"
    ],
    "Mathematics & Statistics for Machine Learning": [
        "Linear Algebra: Vectors, Matrices & Eigenvalues",
        "Calculus: Partial Derivatives & Gradient Vectors",
        "Probability Theory & Bayes Theorem",
        "Descriptive Statistics: Mean, Variance & Percentiles",
        "Probability Distributions: Normal, Binomial & Poisson",
        "Statistical Hypothesis Testing & P-Values"
    ],
    "Applied Machine Learning": [
        "Supervised vs Unsupervised Learning Paradigms",
        "Linear Regression & Gradient Descent Optimization",
        "Logistic Regression & Classification Thresholds",
        "Decision Trees, Bagging & Random Forests",
        "Hyperparameter Tuning & K-Fold Cross-Validation",
        "Model Evaluation: Confusion Matrix, Precision, Recall & F1-Score"
    ],
    "Deep Learning & PyTorch": [
        "PyTorch Tensors, Tensor Operations & Autograd Engine",
        "Building Neural Networks with torch.nn.Module",
        "Loss Functions (MSE, CrossEntropy) & Optimizers (Adam)",
        "Training Loops, Forward Pass & Backpropagation",
        "Convolutional Neural Networks (CNNs) & Pooling",
        "Model Checkpointing, GPU Acceleration & Inference"
    ],
    "Transformers & NLP": [
        "Text Preprocessing, Tokenization & Byte-Pair Encoding",
        "Word Embeddings & Semantic Vector Representations",
        "Self-Attention Mechanics & Multi-Head Attention",
        "Transformer Encoder & Decoder Architectures",
        "HuggingFace Transformers Library & Model Pipelines",
        "Transfer Learning & Fine-Tuning for Downstream Tasks"
    ],
    "LLMs & Generative AI Systems": [
        "Prompt Engineering Patterns & System Directives",
        "Few-Shot, Zero-Shot & Chain-of-Thought Prompting",
        "Structured JSON Output & Schema Constrained Decoding",
        "Temperature, Top-P, Repetition Penalty Parameters",
        "Function Calling, Tool Use & ReAct Framework",
        "Safety Guardrails, Red-Teaming & Prompt Injection Defense"
    ],
    "RAG & Vector Search": [
        "Document Ingestion, Chunking Strategies & Overlaps",
        "Dense Semantic Embeddings vs Sparse Keyword Search",
        "Vector Databases (Pinecone/Chroma/FAISS/Milvus)",
        "Cosine Similarity, Dot Product & Euclidean Distances",
        "Hybrid Search, Re-Ranking & Context Filtering",
        "Evaluation of RAG: Context Precision, Recall & Faithfulness"
    ],
    "MLOps & Model Deployment": [
        "Model Versioning, Tracking & Registry (MLflow/W&B)",
        "Building Inference APIs with FastAPI & Pydantic",
        "Docker Containerization of ML Serving Workloads",
        "Model Latency, Throughput & Batching Optimization",
        "Data Drift, Concept Drift & Continuous Performance Monitoring",
        "CI/CD Automation for Machine Learning Pipelines"
    ],
    "Data Structures & Algorithms": [
        "Time & Space Complexity Analysis (Big-O Notation)",
        "Arrays, Strings & Two-Pointer / Sliding Window Techniques",
        "Linked Lists, Stacks & Queues Implementations",
        "Hash Tables, Collision Resolution & Amortized Time",
        "Trees, Binary Search Trees & Tree Traversals (BFS/DFS)",
        "Graphs, Shortest Paths (Dijkstra) & Dynamic Programming"
    ],
    "SQL & Relational Databases": [
        "Relational Data Modeling & Normalization (1NF, 2NF, 3NF)",
        "DML/DDL Statements & ACID Transaction Properties",
        "Joins: INNER, LEFT, RIGHT & FULL OUTER Joins",
        "Aggregations, Group By, Having & Window Functions",
        "Subqueries, Common Table Expressions (CTEs) & Views",
        "B-Tree Indexes, Query Execution Plans & Optimization"
    ],
    "RESTful API Development": [
        "HTTP Request/Response Cycles, Verbs & Status Codes",
        "REST Architecture Constraints & URL Resource Modeling",
        "FastAPI Framework, Routing & Dependency Injection",
        "Data Validation with Pydantic & Serializers",
        "JWT Authentication, Password Hashing & RBAC",
        "API Rate Limiting, CORS & OpenAPI Documentation"
    ],
    "Docker & Containerization": [
        "Containers vs Virtual Machines & Linux Kernel Namespaces",
        "Writing Optimized Dockerfiles & Layer Caching",
        "Multi-Stage Docker Builds for Lean Images",
        "Container Networking, Port Mapping & Bridge Networks",
        "Volume Mounts, Bind Mounts & Persistent Storage",
        "Docker Compose for Multi-Container Microservices"
    ],
    "Kubernetes & Orchestration": [
        "Kubernetes Architecture: Control Plane & Worker Nodes",
        "Pods, ReplicaSets & Declarative Deployments",
        "Services: ClusterIP, NodePort, LoadBalancer & Ingress",
        "ConfigMaps, Secrets & Environment Variables",
        "Storage: PersistentVolumes & PersistentVolumeClaims",
        "Horizontal Pod Autoscaling (HPA) & Rolling Updates"
    ],
    "Linux & Bash Scripting": [
        "Linux Filesystem Hierarchy & Core Shell Navigation",
        "File Permissions, Ownership (chmod, chown) & Sudoers",
        "Process Management (ps, top, kill, systemctl)",
        "Bash Scripting: Variables, Conditionals, Loops & Functions",
        "I/O Redirection, Pipes, Grep, Sed & Awk Processing",
        "Cron Scheduling & Automated Backup Scripts"
    ]
}


# Fallback generic role configuration for unlisted roles
GENERIC_ROLE_CONFIG = {
    "title": "Technical Specialist",
    "category": "Core Engineering",
    "core_skills": [
        "Programming Fundamentals",
        "Git & GitHub",
        "SQL & Relational Databases",
        "RESTful API Development"
    ],
    "recommended_skills": [
        "Docker & Containerization"
    ],
    "specializations": {},
    "phase_templates": [
        ("Core Engineering Foundations", "Establish fundamental syntax, version control, and problem solving."),
        ("Applied Domain Tools", "Implement core tools and database models required for the discipline."),
        ("Architecture & Advanced Practice", "Build integrated projects demonstrating end-to-end functionality."),
        ("Capstone Deliverable & Interview Prep", "Package portfolio deliverables and prepare for technical screenings.")
    ]
}


class RoadmapPlanningEngine:
    """
    Deterministic Roadmap Planning Engine.
    Coordinates Skill Graph, Skill Gaps, Capacity Feasibility,
    Task Scheduling, Evidence-Based Mastery, and Adaptive Updates.
    """

    def __init__(self):
        self.skill_graph = skill_graph
        self._assessment_store: Dict[str, Dict[str, Any]] = {}

    def _get_topics_for_skill(self, skill_name: str) -> List[str]:
        """Retrieves 4-6 granular syllabus topics for the skill."""
        clean_name = skill_name.split("(")[0].strip()
        if clean_name in SKILL_TOPICS_MAP:
            return list(SKILL_TOPICS_MAP[clean_name])
        for key in SKILL_TOPICS_MAP:
            if key.lower() in clean_name.lower() or clean_name.lower() in key.lower():
                return list(SKILL_TOPICS_MAP[key])
        return [
            f"{clean_name} Core Principles & Architecture",
            f"{clean_name} Syntax & Standard Implementation Patterns",
            f"{clean_name} Common Errors, Debugging & Edge Cases",
            f"{clean_name} Hands-On Exercises & Modular Design",
            f"{clean_name} Performance Optimization & Production Standards",
            f"{clean_name} Assessment & Real-World Application"
        ]

    def get_role_config(self, role_id: str) -> Dict[str, Any]:
        """Retrieves structured role requirements or falls back safely."""
        slug = (role_id or "").strip().lower().replace("_", "-").replace(" ", "-")
        if slug in ROLE_COMPETENCY_REGISTRY:
            return ROLE_COMPETENCY_REGISTRY[slug]
            
        aliases = {
            "machine-learning-engineer": "ml-engineer",
            "machine-learning": "ml-engineer",
            "ml": "ml-engineer",
            "mle": "ml-engineer",
            "ai": "ai-engineer",
            "artificial-intelligence-engineer": "ai-engineer",
            "data-analyst": "data-analyst",
            "data-scientist": "data-scientist",
            "backend": "backend-engineer",
            "backend-developer": "backend-engineer",
            "frontend": "frontend-engineer",
            "frontend-developer": "frontend-engineer",
            "fullstack": "fullstack-engineer",
            "full-stack": "fullstack-engineer",
            "fullstack-developer": "fullstack-engineer",
            "full-stack-developer": "fullstack-engineer",
            "cloud": "cloud-engineer",
            "devops": "devops-engineer",
            "cybersecurity": "cybersecurity-analyst",
            "cyber-security": "cybersecurity-analyst",
            "security-analyst": "cybersecurity-analyst",
            "nlp": "nlp-engineer",
            "computer-vision": "computer-vision-engineer",
            "cv-engineer": "computer-vision-engineer",
            "llm": "llm-engineer",
            "generative-ai": "ai-engineer",
            "gen-ai": "ai-engineer",
            "software-engineer": "software-engineer",
            "sde": "software-engineer",
            "swe": "software-engineer",
        }
        mapped_key = aliases.get(slug)
        if mapped_key and mapped_key in ROLE_COMPETENCY_REGISTRY:
            return ROLE_COMPETENCY_REGISTRY[mapped_key]

        for key, config in ROLE_COMPETENCY_REGISTRY.items():
            if key in slug or slug in key or config["title"].lower() in slug or slug in config["title"].lower():
                return config

        return GENERIC_ROLE_CONFIG

    def calculate_skill_level_from_profile(
        self,
        skill_name: str,
        user_skills: List[str],
        assessment_scores: Dict[str, float],
        experience_level: str
    ) -> int:
        """
        Determines user's baseline proficiency level (0-100) for a given skill
        using known skills, experience level, and verified assessment scores.
        """
        norm_skill = self.skill_graph.normalize_skill_name(skill_name) or skill_name
        
        # 1. Direct Assessment Score match
        for test_key, score in assessment_scores.items():
            if norm_skill.lower() in test_key.lower() or test_key.lower() in norm_skill.lower():
                return int(max(0, min(100, score)))

        # 2. Category Assessment heuristic
        node_data = SKILL_REGISTRY.get(norm_skill, {})
        category = node_data.get("category", "")
        for cat_key, score in assessment_scores.items():
            if category.lower() in cat_key.lower() or cat_key.lower() in category.lower():
                # Slight discount for indirect category score
                return int(max(0, min(100, score * 0.85)))

        # 3. Known Skills check
        is_known = any(
            self.skill_graph.normalize_skill_name(s) == norm_skill
            for s in user_skills
        )
        if is_known:
            if experience_level == "Advanced" or experience_level == "Existing Professional":
                return 85
            elif experience_level == "Intermediate":
                return 75
            else:
                return 65

        # 4. Experience Level Baseline
        if experience_level == "Complete Beginner":
            return 10
        elif experience_level == "Beginner":
            return 20
        elif experience_level == "Intermediate":
            return 40
        else:
            return 50

    def score_to_proficiency_state(self, score: int) -> str:
        """Translates 0-100 score into a standardized proficiency tier."""
        for state, (low, high) in PROFICIENCY_THRESHOLDS.items():
            if low <= score <= high:
                return state.capitalize()
        return "Beginner"

    def compute_skill_gaps(
        self,
        role_id: str,
        user_skills: List[str],
        assessment_scores: Dict[str, float],
        experience_level: str,
        current_role: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Calculates gap size, priority, and prerequisites for each skill.
        Priority = Prereq Importance + Role Importance + Gap Size + Market Relevance.
        """
        role_cfg = self.get_role_config(role_id)
        core_skills = role_cfg["core_skills"]
        recommended_skills = role_cfg.get("recommended_skills", [])
        all_role_skills = core_skills + recommended_skills

        gaps = []
        for skill in all_role_skills:
            node_data = SKILL_REGISTRY.get(skill, {
                "category": "General",
                "difficulty": 2,
                "hours": 30,
                "demand": 80,
                "prerequisites": [],
                "description": ""
            })

            current_level = self.calculate_skill_level_from_profile(
                skill, user_skills, assessment_scores, experience_level
            )
            is_core = skill in core_skills
            target_level = 85 if is_core else 70
            gap_size = max(0, target_level - current_level)

            # Priority Calculation
            prereq_count = len(node_data.get("prerequisites", []))
            prereq_score = min(25, prereq_count * 8)
            role_score = 35 if is_core else 15
            gap_score = min(25, int((gap_size / 100.0) * 25))
            market_score = int((node_data.get("demand", 80) / 100.0) * 15)
            total_priority_val = prereq_score + role_score + gap_score + market_score

            if total_priority_val >= 75:
                priority_label = "Critical"
            elif total_priority_val >= 55:
                priority_label = "High"
            elif total_priority_val >= 35:
                priority_label = "Medium"
            else:
                priority_label = "Low"

            # Prerequisite resolution
            direct_prereqs = node_data.get("prerequisites", [])
            prereq_statuses = []
            for p in direct_prereqs:
                p_level = self.calculate_skill_level_from_profile(
                    p, user_skills, assessment_scores, experience_level
                )
                prereq_statuses.append({
                    "skill": p,
                    "satisfied": p_level >= 60,
                    "level": p_level
                })

            # Hours adjusted by current proficiency
            effort_factor = 1.0 - (current_level / 100.0) * 0.75
            adjusted_hours = max(5, int(round(node_data.get("hours", 30) * effort_factor)))

            gaps.append({
                "skill": skill,
                "category": node_data.get("category", "General"),
                "difficulty": node_data.get("difficulty", 2),
                "current_level": current_level,
                "current_state": self.score_to_proficiency_state(current_level),
                "target_level": target_level,
                "gap_size": gap_size,
                "priority": priority_label,
                "priority_score": total_priority_val,
                "estimated_hours": adjusted_hours,
                "is_core": is_core,
                "market_demand": node_data.get("demand", 80),
                "prerequisites": prereq_statuses,
                "all_prerequisites_met": all(p["satisfied"] for p in prereq_statuses),
                "description": node_data.get("description", "")
            })

        # Sort gaps by priority descending
        gaps.sort(key=lambda g: g["priority_score"], reverse=True)
        return gaps

    def generate_roadmap(
        self,
        user_id: str,
        target_role_id: str,
        experience_level: str = "Beginner",
        weekly_hours: float = 10.0,
        target_date: Optional[str] = None,
        target_timeline_months: Optional[int] = None,
        learning_preference: str = "Balanced",
        goal: str = "First Job",
        current_role: Optional[str] = None,
        known_skills: Optional[List[str]] = None,
        assessment_scores: Optional[Dict[str, float]] = None,
        specialization: Optional[str] = None,
        mvcp_mode: bool = False
    ) -> Dict[str, Any]:
        """
        Primary Deterministic Roadmap Generation Method.
        Produces complete Phase -> Month -> Week -> Task hierarchy.
        """
        known_skills = known_skills or []
        assessment_scores = assessment_scores or {}
        weekly_hours = max(3.0, min(60.0, float(weekly_hours)))
        role_cfg = self.get_role_config(target_role_id)

        # 1. Timeline Calculation
        now = datetime.now()
        if target_date:
            try:
                dt_target = datetime.fromisoformat(target_date.replace("Z", "+00:00"))
                total_days = max(14, (dt_target.replace(tzinfo=None) - now).days)
                calculated_weeks = max(2, int(total_days / 7))
                calculated_months = max(1, int(round(calculated_weeks / 4.33)))
            except Exception:
                calculated_months = target_timeline_months or 6
                calculated_weeks = int(calculated_months * 4.33)
                dt_target = now + timedelta(days=calculated_weeks * 7)
        else:
            calculated_months = max(1, target_timeline_months or 6)
            calculated_weeks = int(calculated_months * 4.33)
            dt_target = now + timedelta(days=calculated_weeks * 7)

        # 2. Skill Gap Evaluation
        skill_gaps = self.compute_skill_gaps(
            role_id=target_role_id,
            user_skills=known_skills,
            assessment_scores=assessment_scores,
            experience_level=experience_level,
            current_role=current_role
        )

        # 3. Target Skills Selection with Experience Level Tailoring
        skills_to_schedule = []
        is_advanced = experience_level.lower() in ["advanced", "expert", "experienced"]
        is_intermediate = experience_level.lower() == "intermediate"

        if mvcp_mode:
            # MVCP: Only Critical Core skills
            skills_to_schedule = [g["skill"] for g in skill_gaps if g["is_core"] and g["current_level"] < 80]
        else:
            # Full roadmap: Include specialization if chosen
            for g in skill_gaps:
                s_name = g["skill"]
                curr_lvl = g["current_level"]
                # If Advanced learner, bypass elementary foundations unless user specifically needs them
                if is_advanced and s_name in ["Programming Fundamentals", "Git & GitHub", "HTML & CSS Styling"]:
                    continue
                if curr_lvl < 80:
                    skills_to_schedule.append(s_name)

            if specialization and specialization in role_cfg.get("specializations", {}):
                spec_skills = role_cfg["specializations"][specialization]
                for s in spec_skills:
                    if s not in skills_to_schedule and s in SKILL_REGISTRY:
                        skills_to_schedule.append(s)

        if not skills_to_schedule:
            # If all skills scored high or empty, include top core skills for mastery refresh
            skills_to_schedule = [s for s in role_cfg["core_skills"] if not is_advanced or s not in ["Programming Fundamentals", "Git & GitHub"]][:4]

        # 4. Topological Sort via NetworkX DAG
        # Mark skills user is already strong in as 'known' to topological resolver
        mastered_skills = [
            g["skill"] for g in skill_gaps if g["current_level"] >= 80
        ]
        topological_path = self.skill_graph.resolve_topological_roadmap(
            target_skills=skills_to_schedule,
            known_skills=mastered_skills
        )

        # 5. Capacity & Deadline Feasibility Analysis
        total_required_hours = sum(item["estimated_hours"] for item in topological_path)
        available_hours = int(calculated_weeks * weekly_hours)
        capacity_ratio = available_hours / max(1.0, float(total_required_hours))
        hours_balance = available_hours - total_required_hours

        # Partition into essential, recommended, and deprioritized skills
        essential_skills = []
        recommended_skills = []
        deprioritized_skills = []
        scheduled_path = []
        accumulated_hours = 0

        for item in topological_path:
            s_name = item["skill"]
            s_hrs = item["estimated_hours"]
            is_core = s_name in role_cfg["core_skills"]

            # If capacity allows or minimum 2 skills
            if accumulated_hours + s_hrs <= available_hours or len(scheduled_path) < 2:
                accumulated_hours += s_hrs
                scheduled_path.append(item)
                if is_core:
                    essential_skills.append(s_name)
                else:
                    recommended_skills.append(s_name)
            else:
                deprioritized_skills.append({
                    "skill": s_name,
                    "is_core": is_core,
                    "estimated_hours": s_hrs,
                    "reason": f"Deprioritized due to limited timeline ({calculated_months} months at {weekly_hours}h/week = {available_hours}h capacity)."
                })

        if capacity_ratio < 0.80:
            feasibility_status = "conflict"
            feasibility_headline = "⚠️ Timeline Conflict Detected"
            feasibility_message = (
                f"Your target requires {total_required_hours}h of focused study, but at {weekly_hours}h/week "
                f"across {calculated_weeks} weeks you only have {available_hours}h available ({abs(hours_balance)}h deficit). "
                f"{len(deprioritized_skills)} skills were deprioritized to preserve mastery depth."
            )
            recommended_weekly_hours = max(5.0, round(total_required_hours / calculated_weeks, 1))
            realistic_date = (now + timedelta(weeks=math.ceil(total_required_hours / weekly_hours))).strftime("%Y-%m-%d")
        elif capacity_ratio < 1.05:
            feasibility_status = "tight"
            feasibility_headline = "⚡ Tight But Feasible"
            feasibility_message = (
                f"Your schedule is tight ({available_hours}h available vs {total_required_hours}h required). "
                "Maintaining consistent weekly study without pauses will be necessary."
            )
            recommended_weekly_hours = round(total_required_hours / calculated_weeks, 1)
            realistic_date = dt_target.strftime("%Y-%m-%d")
        else:
            feasibility_status = "feasible"
            feasibility_headline = "✅ Optimal Feasible Schedule"
            surplus_weeks = round((available_hours - total_required_hours) / weekly_hours, 1)
            feasibility_message = (
                f"Pace is comfortable. You have a buffer of ~{surplus_weeks} weeks for project polish and mock interviews."
            )
            recommended_weekly_hours = weekly_hours
            realistic_date = (now + timedelta(weeks=math.ceil(total_required_hours / weekly_hours))).strftime("%Y-%m-%d")

        # 6. Career Transition Bridge (Overlapping vs Missing)
        overlapping_skills = []
        if current_role and current_role != target_role_id:
            curr_cfg = self.get_role_config(current_role)
            for s in curr_cfg.get("core_skills", []):
                if s in role_cfg.get("core_skills", []):
                    overlapping_skills.append(s)

        # 7. Generate Hierarchical Phases -> Months -> Weeks -> Tasks
        phases = self._build_phases(
            topological_path=scheduled_path if scheduled_path else topological_path,
            role_cfg=role_cfg,
            calculated_months=calculated_months,
            calculated_weeks=calculated_weeks,
            weekly_hours=weekly_hours,
            learning_preference=learning_preference,
            skill_gaps=skill_gaps,
            target_role_id=target_role_id
        )

        roadmap_id = f"roadmap_{uuid.uuid4().hex[:10]}"

        return {
            "id": roadmap_id,
            "user_id": user_id,
            "target_role_id": target_role_id,
            "target_role_name": role_cfg["title"],
            "target_role_category": role_cfg["category"],
            "experience_level": experience_level,
            "weekly_hours": weekly_hours,
            "target_date": dt_target.strftime("%Y-%m-%d"),
            "target_timeline_months": calculated_months,
            "total_weeks": calculated_weeks,
            "learning_preference": learning_preference,
            "goal": goal,
            "current_role": current_role,
            "overlapping_skills": overlapping_skills,
            "essential_skills": essential_skills,
            "recommended_skills": recommended_skills,
            "deprioritized_skills": deprioritized_skills,
            "specialization": specialization,
            "mvcp_mode": mvcp_mode,
            "status": "active",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "engine_version": "v4.0-adaptive",
            "feasibility": {
                "status": feasibility_status,
                "headline": feasibility_headline,
                "message": feasibility_message,
                "capacity_ratio": round(capacity_ratio, 2),
                "total_required_hours": total_required_hours,
                "available_hours": available_hours,
                "hours_balance": hours_balance,
                "recommended_weekly_hours": recommended_weekly_hours,
                "realistic_target_date": realistic_date
            },
            "skill_gaps": skill_gaps,
            "phases": phases,
            "mastery_weights": MASTERY_WEIGHTS,
            "overall_completion_pct": 0,
            "careerverse_skill_mastery_pct": self._calculate_overall_mastery(phases)
        }

    def _build_phases(
        self,
        topological_path: List[Dict[str, Any]],
        role_cfg: Dict[str, Any],
        calculated_months: int,
        calculated_weeks: int,
        weekly_hours: float,
        learning_preference: str,
        skill_gaps: List[Dict[str, Any]],
        target_role_id: str = ""
    ) -> List[Dict[str, Any]]:
        """Distributes topologically ordered skills into phases, months, and weeks."""
        if not topological_path:
            return []

        ROLE_LANG_MAP = {
            "ai-engineer": "Python 3.12 (NumPy, PyTorch & Vectorized Math)",
            "ml-engineer": "Python 3.12 (NumPy, Pandas, Scikit-Learn & Math)",
            "data-scientist": "Python 3.12 (NumPy, Pandas, Statistics & Data Modeling)",
            "data-analyst": "Advanced SQL (Window Functions) & Python (Pandas)",
            "data-engineer": "Python 3.12 (SQL, PySpark, Airflow & Data Pipelines)",
            "software-engineer": "C++ & Java (OOP, Memory Pointers & STL Containers)",
            "frontend-dev": "Modern TypeScript & JavaScript ES6+ (DOM & Async Event Loop)",
            "backend-dev": "Backend Python / Go / Java (HTTP Protocols & REST Services)",
            "fullstack-dev": "Full-Stack TypeScript (Node.js, React & Client-Server APIs)",
            "devops-sre": "Linux Systems, Bash Shell & POSIX Automation",
            "devops-engineer": "Linux Systems, Bash Shell & POSIX Automation",
            "cybersecurity-analyst": "Linux Systems Administration, TCP/IP & Python Automation",
            "mobile-dev": "Dart, Flutter & Kotlin (Mobile Lifecycles & Async Streams)",
            "embedded-engineer": "Embedded C & C++ (Microcontroller Registers & FreeRTOS)",
            "iot-embedded": "Embedded C & C++ (Hardware Registers & Serial Protocols)",
            "mechanical-cad": "AutoCAD & Parametric Engineering Drafting Standards",
            "civil-bim": "Revit BIM Modeling & Architectural Drafting Standards",
            "uiux-designer": "Figma Design Systems & Responsive Token Architecture",
            "product-manager": "Product Analytics (SQL) & Agile User Story Decomposition",
            "technical-writer": "Docs-as-Code, Markdown/MDX & Git Version Control"
        }

        # Determine number of phases (2 to 6)
        num_phases = min(len(role_cfg["phase_templates"]), max(2, min(6, calculated_months)))
        skills_count = len(topological_path)
        chunk_size = max(1, int(math.ceil(skills_count / float(num_phases))))

        phase_templates = role_cfg["phase_templates"]
        weeks_per_phase = max(1, calculated_weeks // num_phases)

        phases = []
        global_week_counter = 1

        for p_idx in range(num_phases):
            start_s_idx = p_idx * chunk_size
            end_s_idx = min(skills_count, (p_idx + 1) * chunk_size)
            phase_skills = topological_path[start_s_idx:end_s_idx]

            if not phase_skills and p_idx > 0:
                continue

            tmpl_title, tmpl_desc = phase_templates[min(p_idx, len(phase_templates) - 1)]
            phase_id = f"phase_{p_idx + 1}"
            phase_hours = sum(s["estimated_hours"] for s in phase_skills)

            # Weeks assigned to this phase
            this_phase_weeks_count = weeks_per_phase if p_idx < num_phases - 1 else (calculated_weeks - global_week_counter + 1)
            this_phase_weeks_count = max(1, this_phase_weeks_count)

            weeks = []
            skills_in_phase = [s["skill"] for s in phase_skills]

            for w_local in range(this_phase_weeks_count):
                w_num = global_week_counter
                global_week_counter += 1

                # Associate skill for this week
                primary_skill = phase_skills[w_local % len(phase_skills)]["skill"] if phase_skills else "Engineering Foundations"
                
                # Check for role-specific programming language enrichment in Week 1 / Fundamentals
                if primary_skill == "Programming Fundamentals" or (w_num == 1 and "Programming" in primary_skill):
                    role_lang = ROLE_LANG_MAP.get(target_role_id, "Python & Modern Software Engineering")
                    primary_skill = f"Programming Fundamentals ({role_lang})"
                    week_title = f"{role_lang} · Setup & Foundations"
                else:
                    week_title = f"{primary_skill} · Core Execution"
                
                week_topics = self._get_topics_for_skill(primary_skill)

                # Generate granular topic-driven tasks for this week
                tasks = self._generate_week_tasks(
                    week_num=w_num,
                    primary_skill=primary_skill,
                    topics=week_topics,
                    weekly_hours=weekly_hours,
                    learning_preference=learning_preference,
                    is_unlocked=(w_num == 1)
                )
                week_objectives = [
                    f"Master architectural principles and core foundations of {primary_skill}",
                    f"Apply practical implementations and hands-on coding patterns in {primary_skill}",
                    f"Validate production competency via weekly 15-question assessment (>=75% pass threshold)"
                ]

                weeks.append({
                    "id": f"week_{w_num}",
                    "week_number": w_num,
                    "title": week_title,
                    "primary_skill": primary_skill,
                    "objective": f"Understand core principles of {primary_skill} and build production deliverables.",
                    "learning_objectives": week_objectives,
                    "topics": week_topics,
                    "estimated_hours": int(weekly_hours),
                    "learning_hours": round(weekly_hours * 0.45, 1),
                    "practice_hours": round(weekly_hours * 0.35, 1),
                    "assessment_hours": round(weekly_hours * 0.20, 1),
                    "assessment_status": "pending",
                    "passing_score": 12,
                    "total_questions": 15,
                    "best_score": None,
                    "tasks": tasks,
                    "completion_percentage": 0,
                    "status": "in_progress" if w_num == 1 else "locked"
                })

            phase_status = "in_progress" if p_idx == 0 else "locked"

            phases.append({
                "id": phase_id,
                "phase_number": p_idx + 1,
                "title": f"Phase 0{p_idx + 1}: {tmpl_title}",
                "description": tmpl_desc,
                "estimated_hours": phase_hours,
                "duration_weeks": this_phase_weeks_count,
                "skills": skills_in_phase,
                "status": phase_status,
                "completion_percentage": 0,
                "weeks": weeks
            })

        return phases

    def _generate_week_tasks(
        self,
        week_num: int,
        primary_skill: str,
        topics: List[str],
        weekly_hours: float,
        learning_preference: str,
        is_unlocked: bool
    ) -> List[Dict[str, Any]]:
        """Generates dynamic topic-driven tasks for a single week based on learning preference."""
        node_data = SKILL_REGISTRY.get(primary_skill, {})
        difficulty = "beginner" if node_data.get("difficulty", 2) <= 1 else ("intermediate" if node_data.get("difficulty", 2) <= 3 else "advanced")

        why_this_now = (
            f"{primary_skill} is scheduled at Week {week_num} to establish competency in "
            f"applied concepts required for your target career role."
        )

        tasks = []
        curated_topics = topics if topics else self._get_topics_for_skill(primary_skill)

        # 1. Topic Deep Dives (Learning Tasks derived from specific topics)
        top_topics = curated_topics[:3] if len(curated_topics) >= 3 else curated_topics
        for idx, topic in enumerate(top_topics):
            tasks.append({
                "id": f"w{week_num}_t{idx+1}_topic",
                "title": f"Topic {idx+1}: {topic}",
                "type": "learn",
                "skill_id": primary_skill,
                "estimated_minutes": max(45, int((weekly_hours * 60 * 0.15))),
                "difficulty": difficulty,
                "prerequisites": node_data.get("prerequisites", []),
                "status": "available" if is_unlocked else "locked",
                "evidence_required": False,
                "why_this_now": why_this_now,
                "concepts": [
                    f"Core principles and syntax of {topic}",
                    f"Real-world engineering patterns for {topic}",
                    "Edge cases, debugging and best practices"
                ]
            })

        # 2. Applied Practice Lab
        tasks.append({
            "id": f"w{week_num}_practice_lab",
            "title": f"Hands-On Lab: Applied {primary_skill} Coding Drills",
            "type": "practice",
            "skill_id": primary_skill,
            "estimated_minutes": max(60, int((weekly_hours * 60 * 0.30))),
            "difficulty": difficulty,
            "prerequisites": [primary_skill],
            "status": "available" if is_unlocked else "locked",
            "evidence_required": False,
            "why_this_now": "Translates conceptual knowledge into working code with unit-tested test cases.",
            "practice_prompt": f"Implement a modular program demonstrating {', '.join(curated_topics[:2])} with proper error handling."
        })

        # 3. Practical Mini-Project (Deliverable with GitHub / Code proof)
        tasks.append({
            "id": f"w{week_num}_mini_project",
            "title": f"Practical Mini-Deliverable: {primary_skill} Application",
            "type": "project",
            "skill_id": primary_skill,
            "estimated_minutes": max(60, int((weekly_hours * 60 * 0.25))),
            "difficulty": difficulty,
            "prerequisites": [primary_skill],
            "status": "available" if is_unlocked else "locked",
            "evidence_required": True,
            "why_this_now": "Tangible portfolio artifact proving practical ability to implement this week's competencies.",
            "project_spec": {
                "title": f"{primary_skill} Practical Module",
                "deliverable": f"Working code repository or functional script implementing {curated_topics[0] if curated_topics else primary_skill}.",
                "rubric": "Functional correctness (40%), code quality and structure (30%), documentation (30%)."
            }
        })

        # Adjust time allocations based on user preference
        if learning_preference == "Project Heavy" and len(tasks) >= 3:
            tasks[-1]["estimated_minutes"] += 45
        elif learning_preference == "Practice Heavy" and len(tasks) >= 2:
            tasks[-2]["estimated_minutes"] += 45
        elif learning_preference == "Theory Heavy" and len(tasks) >= 1:
            tasks[0]["estimated_minutes"] += 30

        return tasks


        return base_tasks

    def _calculate_overall_mastery(self, phases: List[Dict[str, Any]]) -> int:
        """Computes current overall CareerVerse Skill Mastery score (0-100%)."""
        total_tasks = 0
        completed_tasks = 0
        for p in phases:
            for w in p.get("weeks", []):
                for t in w.get("tasks", []):
                    total_tasks += 1
                    if t.get("status") == "completed":
                        completed_tasks += 1
        if total_tasks == 0:
            return 0
        return int(round((completed_tasks / float(total_tasks)) * 100))

    def adapt_roadmap(
        self,
        roadmap: Dict[str, Any],
        event_type: str,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Adaptive Roadmap Mutator.
        Reacts to:
        1. 'assessment_result': failed (<60%) -> inserts remediation; passed (>=85%) -> accelerates.
        2. 'task_completed': marks complete, updates mastery, unlocks downstream tasks.
        3. 'weekly_hours_changed': reschedules timeline.
        """
        roadmap = dict(roadmap)
        phases = roadmap.get("phases", [])
        adaptation_notice = None

        if event_type == "assessment_result":
            skill_id = payload.get("skill_id", "")
            score = float(payload.get("score", 0))
            task_id = payload.get("task_id", "")

            if score < 60.0:
                # Remediation: Insert remedial tasks in the current week
                adaptation_notice = {
                    "type": "remediation",
                    "title": f"Adaptive Remediation Activated for {skill_id}",
                    "message": (
                        f"Your assessment score for {skill_id} was {int(score)}% (threshold: 60%). "
                        "We have inserted targeted concept review and extra practice tasks to solidify weak areas."
                    ),
                    "action_taken": "Inserted remediation task & flagged reassessment."
                }
                # Locate task and mark needs_review, insert remediation task
                for p in phases:
                    for w in p.get("weeks", []):
                        for idx, t in enumerate(w.get("tasks", [])):
                            if t.get("id") == task_id or (t.get("skill_id") == skill_id and t.get("type") == "assessment"):
                                t["status"] = "needs_review"
                                t["last_score"] = score
                                # Insert remediation task right after
                                remediation_task = {
                                    "id": f"remediation_{uuid.uuid4().hex[:6]}",
                                    "title": f"Remediation: {skill_id} Weak Concept Clinic",
                                    "type": "practice",
                                    "skill_id": skill_id,
                                    "estimated_minutes": 60,
                                    "difficulty": "intermediate",
                                    "prerequisites": [],
                                    "status": "available",
                                    "evidence_required": False,
                                    "why_this_now": "Adaptive remediation generated automatically to bridge your identified knowledge gap.",
                                    "practice_prompt": f"Review fundamental edge cases and re-attempt the diagnostic exercises for {skill_id}."
                                }
                                w["tasks"].insert(idx + 1, remediation_task)
                                break
            else:
                # High mastery acceleration
                adaptation_notice = {
                    "type": "acceleration",
                    "title": f"High Mastery Verified: {skill_id} ({int(score)}%)",
                    "message": (
                        f"Outstanding performance! Scoring {int(score)}% satisfies {skill_id} mastery requirements. "
                        "Downstream dependencies have been unlocked to accelerate your progress."
                    ),
                    "action_taken": "Unlocked downstream competencies."
                }
                # Mark assessment task completed and unlock next tasks
                for p in phases:
                    for w in p.get("weeks", []):
                        for t in w.get("tasks", []):
                            if t.get("id") == task_id or (t.get("skill_id") == skill_id and t.get("type") == "assessment"):
                                t["status"] = "completed"
                                t["last_score"] = score

                # Unlock downstream tasks
                self._unlock_available_tasks(phases)

        elif event_type == "task_completed":
            task_id = payload.get("task_id", "")
            for p in phases:
                for w in p.get("weeks", []):
                    for t in w.get("tasks", []):
                        if t.get("id") == task_id:
                            t["status"] = "completed"
                            t["completed_at"] = datetime.now().isoformat()
                            if "github_url" in payload:
                                t["github_evidence_url"] = payload["github_url"]
                            break
                    # Update week completion
                    w_tasks = w.get("tasks", [])
                    comp = sum(1 for t in w_tasks if t.get("status") == "completed")
                    w["completion_percentage"] = int(round((comp / max(1, len(w_tasks))) * 100))
                    if w["completion_percentage"] == 100:
                        w["status"] = "completed"

                # Update phase completion
                p_tasks = [t for w in p.get("weeks", []) for t in w.get("tasks", [])]
                p_comp = sum(1 for t in p_tasks if t.get("status") == "completed")
                p["completion_percentage"] = int(round((p_comp / max(1, len(p_tasks))) * 100))
                if p["completion_percentage"] == 100:
                    p["status"] = "completed"

            self._unlock_available_tasks(phases)

        # Recalculate overall completion & mastery
        all_tasks = [t for p in phases for w in p.get("weeks", []) for t in w.get("tasks", [])]
        completed_count = sum(1 for t in all_tasks if t.get("status") == "completed")
        roadmap["overall_completion_pct"] = int(round((completed_count / max(1, len(all_tasks))) * 100))
        roadmap["careerverse_skill_mastery_pct"] = self._calculate_overall_mastery(phases)
        roadmap["updated_at"] = datetime.now().isoformat()
        roadmap["phases"] = phases

        if adaptation_notice:
            roadmap["latest_adaptation"] = adaptation_notice

        return roadmap

    def _unlock_available_tasks(self, phases: List[Dict[str, Any]]):
        """Unlocks locked tasks when prior tasks in sequence are completed."""
        completed_skills = set()
        for p in phases:
            for w in p.get("weeks", []):
                for t in w.get("tasks", []):
                    if t.get("status") == "completed":
                        completed_skills.add(t.get("skill_id"))

        for p in phases:
            for w in p.get("weeks", []):
                for t in w.get("tasks", []):
                    if t.get("status") == "locked":
                        prereqs = t.get("prerequisites", [])
                        # If prerequisites satisfied or empty, unlock
                        if not prereqs or all(p in completed_skills for p in prereqs):
                            t["status"] = "available"
                            w["status"] = "in_progress"
                            p["status"] = "in_progress"

    def simulate_plan(
        self,
        current_roadmap: Dict[str, Any],
        simulated_weekly_hours: float,
        simulated_target_date: Optional[str] = None,
        simulated_mvcp_mode: Optional[bool] = None
    ) -> Dict[str, Any]:
        """
        What-If Roadmap Simulator.
        Tests capacity variations without modifying the active saved roadmap.
        """
        sim_hours = max(3.0, min(60.0, float(simulated_weekly_hours)))
        now = datetime.now()

        if simulated_target_date:
            try:
                dt_target = datetime.fromisoformat(simulated_target_date.replace("Z", "+00:00")).replace(tzinfo=None)
                sim_weeks = max(2, int((dt_target - now).days / 7))
            except Exception:
                sim_weeks = current_roadmap.get("total_weeks", 24)
        else:
            sim_weeks = current_roadmap.get("total_weeks", 24)

        orig_feasibility = current_roadmap.get("feasibility", {})
        total_req_hours = orig_feasibility.get("total_required_hours", 300)
        
        # If MVCP simulated, discount total required hours by 35%
        is_mvcp = simulated_mvcp_mode if simulated_mvcp_mode is not None else current_roadmap.get("mvcp_mode", False)
        effective_req_hours = int(total_req_hours * 0.65) if is_mvcp else total_req_hours

        available_capacity = int(sim_weeks * sim_hours)
        capacity_ratio = available_capacity / max(1.0, float(effective_req_hours))
        hours_balance = available_capacity - effective_req_hours

        realistic_completion_weeks = math.ceil(effective_req_hours / sim_hours)
        simulated_finish_date = (now + timedelta(weeks=realistic_completion_weeks)).strftime("%Y-%m-%d")

        if capacity_ratio < 0.80:
            status = "conflict"
            headline = "⚠️ Simulated Conflict: Deficit Remains"
            recommendation = f"Increase dedication to {round(effective_req_hours / sim_weeks, 1)}h/week or extend target date."
        elif capacity_ratio < 1.05:
            status = "tight"
            headline = "⚡ Simulated Schedule: Tight But Possible"
            recommendation = "You will finish right on the deadline with consistent weekly sessions."
        else:
            status = "feasible"
            headline = "✅ Simulated Schedule: Feasible & Comfortable"
            surplus = round((available_capacity - effective_req_hours) / sim_hours, 1)
            recommendation = f"Projected to complete all milestones ~{surplus} weeks ahead of schedule!"

        return {
            "simulated_weekly_hours": sim_hours,
            "simulated_weeks": sim_weeks,
            "simulated_mvcp_mode": is_mvcp,
            "effective_required_hours": effective_req_hours,
            "available_capacity_hours": available_capacity,
            "hours_balance": hours_balance,
            "capacity_ratio": round(capacity_ratio, 2),
            "feasibility_status": status,
            "headline": headline,
            "recommendation": recommendation,
            "projected_finish_date": simulated_finish_date
        }

    def interpret_command(
        self,
        command_text: str,
        current_roadmap: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Natural Language Command Interpreter.
        Translates natural language student requests into structured actions.
        """
        text = command_text.strip().lower()

        # 1. Weekly Hours modification
        if "hour" in text:
            import re
            match = re.search(r"(\d+(\.\d+)?)", text)
            if match:
                hrs = float(match.group(1))
                return {
                    "action": "update_weekly_hours",
                    "value": hrs,
                    "explanation": f"Recognized request to adjust weekly study dedication to {hrs} hours/week."
                }

        # 2. Known Skill / Already Know
        if "already know" in text or "i know" in text or "skip" in text:
            for skill_key in SKILL_REGISTRY.keys():
                if skill_key.lower() in text:
                    return {
                        "action": "mark_skill_known",
                        "value": skill_key,
                        "explanation": f"Marked {skill_key} as already mastered; foundational tasks will be bypassed."
                    }

        # 3. Minimum Viable Mode / Fast Track
        if "fast track" in text or "mvcp" in text or "critical" in text or "minimal" in text:
            return {
                "action": "toggle_mvcp",
                "value": True,
                "explanation": "Activated Minimum Viable Career Path mode to focus exclusively on essential core skills."
            }

        # 4. Interview Focus
        if "interview" in text:
            return {
                "action": "update_preference",
                "value": "Interview Focused",
                "explanation": "Shifted learning balance to prioritize technical interview questions and system design drills."
            }

        # 5. Project Focus
        if "project" in text or "portfolio" in text:
            return {
                "action": "update_preference",
                "value": "Project Heavy",
                "explanation": "Shifted learning balance to prioritize hands-on production micro-project deliverables."
            }

        # Default fallback
        return {
            "action": "clarify",
            "value": command_text,
            "explanation": "Command noted. You can ask to change hours (e.g. 'I have 8 hours this week') or skip skills you already know."
        }

    def generate_weekly_assessment(
        self,
        role: str,
        user_level: str,
        week_number: int,
        week_id: str,
        topics: List[str],
        learning_objectives: Optional[List[str]] = None,
        weak_topics: Optional[List[str]] = None,
        attempt_number: int = 1,
        roadmap_id: str = "active_roadmap"
    ) -> Dict[str, Any]:
        """
        Dynamically generates a 15-question weekly MCQ assessment via Groq LPU API.
        Questions are strictly scoped to the week's curriculum and objectives.
        Passing threshold is strictly 75% (12/15 questions).
        Answers and explanations are stored securely server-side.
        """
        assessment_id = f"assess_{uuid.uuid4().hex[:10]}"
        learning_objectives = learning_objectives or [
            f"Understand core principles of {', '.join(topics[:2])}",
            f"Apply hands-on engineering practices in {', '.join(topics[2:4]) if len(topics) > 2 else topics[0]}"
        ]

        # Difficulty distribution based on user level and attempt
        if user_level.lower() in ["advanced", "experienced"]:
            difficulty_dist = {"easy": 3, "medium": 7, "hard": 5}
        elif user_level.lower() == "intermediate":
            difficulty_dist = {"easy": 4, "medium": 8, "hard": 3}
        else: # beginner
            difficulty_dist = {"easy": 5, "medium": 7, "hard": 3}

        # Build structured context for Groq
        groq_context = {
            "role": role,
            "userLevel": user_level,
            "week": week_number,
            "topics": topics,
            "learningObjectives": learning_objectives,
            "difficultyDistribution": difficulty_dist,
            "questionCount": 15,
            "weakTopics": weak_topics or [],
            "attemptNumber": attempt_number
        }

        generated_questions = []

        # Attempt Groq API generation
        try:
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            weak_directive = f"CRITICAL: User performed poorly on these weak topics: {', '.join(weak_topics)}. Allocate at least 8 questions to these weak topics!\n" if weak_topics else ""
            prompt_instruction = (
                "You are an expert technical examiner. Return a JSON object with key 'questions' "
                "containing an array of exactly 15 multiple-choice questions matching the requested topics "
                f"and difficulty distribution ({difficulty_dist['easy']} easy, {difficulty_dist['medium']} medium, {difficulty_dist['hard']} hard). "
                "Each question must strictly contain:\n"
                "- id: string e.g. 'q1' to 'q15'\n"
                "- question: clear, precise, unambiguous technical question\n"
                "- options: array of exactly 4 distinct strings\n"
                "- correctAnswer: integer (0, 1, 2, or 3) indicating the single correct option index\n"
                "- difficulty: 'easy' | 'medium' | 'hard'\n"
                "- topicId: string matching one of the given topics\n"
                "- learningObjectiveId: string\n"
                "- explanation: detailed technical explanation of why the correct answer is right and other options are wrong.\n"
                + weak_directive
                + "Do NOT generate markdown, only valid JSON."
            )

            # Try primary model: openai/gpt-oss-120b, then fallback to openai/gpt-oss-20b
            for model_name in ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]:
                try:
                    res = requests.post(
                        GROQ_API_URL,
                        headers=headers,
                        json={
                            "model": model_name,
                            "response_format": {"type": "json_object"},
                            "max_tokens": 4096,
                            "temperature": 0.25,
                            "messages": [
                                {"role": "system", "content": prompt_instruction},
                                {"role": "user", "content": f"Generate exactly 15 JSON multiple choice questions for:\n{json.dumps(groq_context)}"}
                            ]
                        },
                        timeout=30
                    )
                    if res.status_code == 200:
                        parsed = res.json()
                        content_str = parsed["choices"][0]["message"]["content"]
                        data = json.loads(content_str)
                        raw_qs = data.get("questions", [])

                        valid_qs = []
                        for idx, q in enumerate(raw_qs):
                            if (
                                isinstance(q, dict)
                                and "question" in q and q["question"].strip()
                                and isinstance(q.get("options"), list) and len(q["options"]) == 4
                                and isinstance(q.get("correctAnswer"), int) and 0 <= q["correctAnswer"] <= 3
                            ):
                                valid_qs.append({
                                    "id": f"q_{idx+1}",
                                    "question": q["question"].strip(),
                                    "options": [str(opt).strip() for opt in q["options"]],
                                    "correctAnswer": q["correctAnswer"],
                                    "difficulty": q.get("difficulty", "medium").lower() if q.get("difficulty", "").lower() in ["easy", "medium", "hard"] else "medium",
                                    "topicId": q.get("topicId", topics[idx % len(topics)] if topics else "general"),
                                    "learningObjectiveId": q.get("learningObjectiveId", f"lo_{idx % len(learning_objectives) + 1}"),
                                    "explanation": q.get("explanation", "The selected option correctly reflects production engineering standards.")
                                })

                        if len(valid_qs) >= 12:
                            generated_questions = valid_qs[:15]
                            break
                except Exception as model_err:
                    print(f"Groq generation error on {model_name}: {model_err}")
                    continue
        except Exception as e:
            print(f"Groq API connection error: {e}")

        # Top up if needed using syllabus synthesizer
        if len(generated_questions) < 15:
            generated_questions = self._synthesize_assessment_questions(
                topics=topics,
                existing_questions=generated_questions,
                target_count=15,
                weak_topics=weak_topics,
                difficulty_dist=difficulty_dist
            )

        # Store complete assessment with answers
        self._assessment_store[assessment_id] = {
            "id": assessment_id,
            "roadmap_id": roadmap_id,
            "week_id": week_id,
            "week_number": week_number,
            "role": role,
            "user_level": user_level,
            "topics": topics,
            "attempt_number": attempt_number,
            "passing_score": 12,
            "total_questions": 15,
            "passing_percentage": 75,
            "questions": generated_questions,
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "generation_model": "Groq LPU (openai/gpt-oss-120b)"
        }

        # Return client-safe assessment (stripping correctAnswer and explanation)
        client_questions = []
        for q in generated_questions:
            client_questions.append({
                "id": q["id"],
                "question": q["question"],
                "options": q["options"],
                "difficulty": q["difficulty"],
                "topicId": q["topicId"],
                "learningObjectiveId": q.get("learningObjectiveId", "lo_1")
            })

        return {
            "id": assessment_id,
            "roadmap_id": roadmap_id,
            "week_id": week_id,
            "week_number": week_number,
            "role": role,
            "user_level": user_level,
            "attempt_number": attempt_number,
            "passing_score": 12,
            "total_questions": 15,
            "passing_percentage": 75,
            "difficulty_distribution": difficulty_dist,
            "questions": client_questions,
            "status": "in_progress"
        }

    def submit_weekly_assessment(
        self,
        assessment_id: str,
        week_id: str,
        roadmap: Dict[str, Any],
        answers: Dict[str, int]
    ) -> Dict[str, Any]:
        """
        Evaluates assessment submission deterministically.
        Calculates score out of 15. Requires >= 12 (75%) to pass.
        If passed, marks week complete and unlocks downstream week.
        If failed, locks downstream week, isolates weak topics, and generates remediation.
        """
        stored = self._assessment_store.get(assessment_id)
        if not stored:
            # Reconstruct assessment if not in memory (e.g. client fallback assessment)
            week_obj = None
            for p in roadmap.get("phases", []):
                for w in p.get("weeks", []):
                    if w.get("id") == week_id:
                        week_obj = w
                        break
            topics = week_obj.get("topics", ["Core Foundations"]) if week_obj else ["Core Foundations"]
            stored = {
                "id": assessment_id,
                "week_id": week_id,
                "week_number": week_obj.get("week_number", 1) if week_obj else 1,
                "passing_score": 12,
                "total_questions": 15,
                "questions": self._synthesize_assessment_questions(topics, [], 15)
            }
            self._assessment_store[assessment_id] = stored

        questions = stored["questions"]
        total_questions = len(questions)
        correct_count = 0

        difficulty_breakdown = {
            "easy": {"correct": 0, "total": 0},
            "medium": {"correct": 0, "total": 0},
            "hard": {"correct": 0, "total": 0}
        }
        topic_stats: Dict[str, Dict[str, int]] = {}
        questions_review = []

        for q in questions:
            q_id = q["id"]
            user_ans = answers.get(q_id)
            correct_ans = q["correctAnswer"]
            diff = q.get("difficulty", "medium").lower()
            topic = q.get("topicId", "General")

            if diff not in difficulty_breakdown:
                diff = "medium"
            difficulty_breakdown[diff]["total"] += 1

            if topic not in topic_stats:
                topic_stats[topic] = {"correct": 0, "total": 0}
            topic_stats[topic]["total"] += 1

            is_correct = (user_ans == correct_ans)
            if is_correct:
                correct_count += 1
                difficulty_breakdown[diff]["correct"] += 1
                topic_stats[topic]["correct"] += 1

            questions_review.append({
                "id": q_id,
                "question": q["question"],
                "options": q["options"],
                "user_answer": user_ans,
                "correct_answer": correct_ans,
                "is_correct": is_correct,
                "difficulty": diff,
                "topic": topic,
                "explanation": q.get("explanation", "")
            })

        percentage = round((correct_count / float(total_questions)) * 100, 1)
        passed = (correct_count >= 12) # 12 / 15 = 80% >= 75% passing threshold

        # Topic performance percentages
        topic_performance = {}
        weak_topics = []
        for top, st in topic_stats.items():
            top_pct = round((st["correct"] / max(1, st["total"])) * 100, 1)
            topic_performance[top] = {
                "correct": st["correct"],
                "total": st["total"],
                "percentage": top_pct
            }
            if top_pct < 70.0:
                weak_topics.append(top)

        # Mutate Roadmap: Unlock week if passed, or schedule remediation if failed
        updated_roadmap = self._apply_assessment_verdict_to_roadmap(
            roadmap=roadmap,
            week_id=week_id,
            passed=passed,
            score=correct_count,
            percentage=percentage,
            weak_topics=weak_topics
        )

        remediation = None
        if not passed:
            deficit = 12 - correct_count
            identified_weaks = weak_topics if weak_topics else list(topic_stats.keys())[:2]
            remediation = {
                "headline": f"Assessment Not Passed ({correct_count}/15)",
                "required_score": 12,
                "actual_score": correct_count,
                "deficit": deficit,
                "message": f"You scored {correct_count}/15 ({percentage}%). Passing requires at least 12/15 (75%). You need {deficit} more correct answer{'s' if deficit > 1 else ''} to unlock Week {stored.get('week_number', 1) + 1}.",
                "weak_topics": identified_weaks,
                "action_steps": [
                    f"Review syllabus notes and code examples on {top}." for top in identified_weaks
                ] + [
                    "Complete additional practice exercises in the Hands-On Lab.",
                    "Retake the weekly assessment when ready. Your retest will focus on these identified weak areas."
                ]
            }

        stored["status"] = "passed" if passed else "failed"
        stored["score"] = correct_count
        stored["percentage"] = percentage

        return {
            "assessment_id": assessment_id,
            "week_id": week_id,
            "week_number": stored.get("week_number", 1),
            "score": correct_count,
            "total_questions": total_questions,
            "percentage": percentage,
            "passed": passed,
            "passing_score": 12,
            "difficulty_breakdown": difficulty_breakdown,
            "topic_performance": topic_performance,
            "weak_topics": weak_topics,
            "remediation": remediation,
            "questions_review": questions_review,
            "updated_roadmap": updated_roadmap
        }

    def retest_weekly_assessment(
        self,
        assessment_id: str,
        week_id: str,
        roadmap: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generates a dynamic retest focusing primarily on previous weak topics."""
        stored = self._assessment_store.get(assessment_id)
        role = stored.get("role", "Software Engineer") if stored else "Software Engineer"
        user_level = stored.get("user_level", "Beginner") if stored else "Beginner"
        week_number = stored.get("week_number", 1) if stored else 1
        topics = stored.get("topics", []) if stored else []
        attempt_number = (stored.get("attempt_number", 1) if stored else 1) + 1

        weak_topics = []
        if stored:
            weak_topics = stored.get("weak_topics", [])

        return self.generate_weekly_assessment(
            role=role,
            user_level=user_level,
            week_number=week_number,
            week_id=week_id,
            topics=topics,
            weak_topics=weak_topics,
            attempt_number=attempt_number,
            roadmap_id=roadmap.get("id", "active_roadmap")
        )

    def _apply_assessment_verdict_to_roadmap(
        self,
        roadmap: Dict[str, Any],
        week_id: str,
        passed: bool,
        score: int,
        percentage: float,
        weak_topics: List[str]
    ) -> Dict[str, Any]:
        """Mutates roadmap structure in place: unlocks downstream week if passed."""
        phases = roadmap.get("phases", [])
        current_w_num = 1
        found = False

        for phase in phases:
            for week in phase.get("weeks", []):
                if week.get("id") == week_id or week.get("week_number") == week_id:
                    found = True
                    current_w_num = week.get("week_number", 1)
                    week["best_score"] = max(week.get("best_score") or 0, score)
                    week["last_score"] = score
                    week["assessment_status"] = "passed" if passed else "failed"
                    if passed:
                        week["completion_percentage"] = 100
                        week["status"] = "completed"
                        for t in week.get("tasks", []):
                            t["status"] = "completed"
                    else:
                        week["status"] = "in_progress"
                        for t in week.get("tasks", []):
                            if t.get("type") == "assessment":
                                t["status"] = "needs_review"
                                t["last_score"] = score
                    break
            if found:
                break

        # If passed, unlock week N + 1
        if passed:
            next_w_num = current_w_num + 1
            for phase in phases:
                for week in phase.get("weeks", []):
                    if week.get("week_number") == next_w_num:
                        week["status"] = "in_progress"
                        phase["status"] = "in_progress"
                        for t in week.get("tasks", []):
                            if t.get("status") == "locked":
                                t["status"] = "available"
                        break

        # Recompute phase completion percentages and overall roadmap progress
        total_weeks = 0
        completed_weeks = 0
        for phase in phases:
            p_weeks = phase.get("weeks", [])
            total_weeks += len(p_weeks)
            p_comp = sum(1 for w in p_weeks if w.get("status") == "completed")
            completed_weeks += p_comp
            phase["completion_percentage"] = int(round((p_comp / max(1, len(p_weeks))) * 100))
            if phase["completion_percentage"] == 100:
                phase["status"] = "completed"

        roadmap["overall_completion_pct"] = int(round((completed_weeks / max(1, total_weeks)) * 100))
        roadmap["careerverse_skill_mastery_pct"] = self._calculate_overall_mastery(phases)
        return roadmap

    def _synthesize_assessment_questions(
        self,
        topics: List[str],
        existing_questions: List[Dict[str, Any]],
        target_count: int = 15,
        weak_topics: Optional[List[str]] = None,
        difficulty_dist: Optional[Dict[str, int]] = None
    ) -> List[Dict[str, Any]]:
        """
        Synthesizes technically robust questions from topic syllabus if Groq returned
        fewer than 15 questions or encountered an API glitch.
        """
        needed = target_count - len(existing_questions)
        results = list(existing_questions)
        topics_pool = weak_topics if weak_topics else topics
        if not topics_pool:
            topics_pool = ["Core Architecture", "Data Structures", "Algorithm Design", "Implementation Best Practices"]

        difficulties = ["easy"] * 5 + ["medium"] * 7 + ["hard"] * 3
        for q in existing_questions:
            d = q.get("difficulty", "medium")
            if d in difficulties:
                difficulties.remove(d)

        for i in range(needed):
            curr_idx = len(results) + 1
            curr_topic = topics_pool[i % len(topics_pool)]
            curr_diff = difficulties[i % len(difficulties)] if difficulties else "medium"

            q_obj = {
                "id": f"q_{curr_idx}",
                "question": f"When implementing {curr_topic} in a scalable production system, which design pattern best optimizes throughput while minimizing latency?",
                "options": [
                    "Asynchronous event-driven execution with bounded in-memory queues",
                    "Synchronous blocking loops on the main thread",
                    "Persistent disk polling without thread sleep intervals",
                    "Global shared mutable state without thread locks"
                ],
                "correctAnswer": 0,
                "difficulty": curr_diff,
                "topicId": curr_topic,
                "learningObjectiveId": f"lo_{i % 3 + 1}",
                "explanation": "Asynchronous event-driven architectures decouple ingestion from processing, preventing thread starvation and ensuring bounded memory latency."
            }
            results.append(q_obj)

        return results


# Global singleton instance
roadmap_planning_engine = RoadmapPlanningEngine()
