"""
Generate comprehensive engineering project complexity dataset with 3 labeled tiers:
- 0: Academic / Tutorial Clone (Basic, low hiring signal)
- 1: Applied Capstone (Moderate, full-stack/database integrated)
- 2: Production-Ready Engineering (Advanced, scalable, distributed, containerized)
"""

import os
import pandas as pd
import numpy as np

projects_data = [
    # --- TIER 0: Academic / Tutorial / Clone (Basic) ---
    ("Calculator app with simple UI in HTML, CSS and JavaScript", "HTML, CSS, JavaScript", 0, "Basic mathematical operations with simple button layout and event listeners."),
    ("To-Do List application using vanilla JavaScript and localStorage", "JavaScript, HTML, CSS", 0, "Allows users to add, mark complete and delete daily tasks saved in browser local storage."),
    ("Weather app using OpenWeather API in React", "React, CSS, JavaScript", 0, "Fetches current temperature and weather description from a public API based on city name."),
    ("Tic Tac Toe game with basic minimax algorithm", "Python, Tkinter", 0, "2-player desktop game with basic game loop and winner detection."),
    ("Student record management system with file handling", "C++, File I/O", 0, "Console-based CRUD application storing student marks and names in a text file."),
    ("Simple portfolio website with HTML5 and Bootstrap", "HTML5, CSS3, Bootstrap", 0, "Static personal resume portfolio with about me, education and contact form."),
    ("Random password generator with copy to clipboard feature", "JavaScript, HTML", 0, "Generates random alphanumeric strings with customizable length."),
    ("Iris flower classification using Scikit-Learn Logistic Regression", "Python, Scikit-learn, Pandas", 0, "Standard beginner dataset predicting flower species with 95% accuracy."),
    ("House price prediction using Linear Regression on Boston Housing dataset", "Python, Scikit-Learn", 0, "Basic single-model regression predicting housing prices with MSE evaluation."),
    ("Simple quiz application with score calculation", "Python, Tkinter", 0, "Multiple choice question quiz with countdown timer and final score display."),
    ("Unit converter application for currency and length", "Java, Swing", 0, "Desktop GUI for converting miles to kilometers and USD to INR."),
    ("Digital clock and stopwatch application", "JavaScript, CSS", 0, "Browser clock with start, stop, lap and reset functionalities."),
    ("Color palette generator using random hex codes", "HTML, CSS, JavaScript", 0, "Displays 5 random color tiles with hex code copy functionality."),
    ("Basic blog website with SQLite and Flask", "Python, Flask, SQLite", 0, "Basic CRUD app where admin can write posts and view them in a list."),
    ("Rock Paper Scissors game with computer AI", "Python", 0, "CLI game played against random computer choices."),
    ("Barcode generator and reader using Python libraries", "Python, OpenCV", 0, "Generates QR codes and reads barcodes from camera feed."),
    ("Alarm clock GUI with snooze button", "Python, Tkinter, Pygame", 0, "Plays sound when target time is reached."),
    ("Simple notes app with local database", "Android, SQLite, Java", 0, "Basic notes app with title, content and delete options."),
    ("Age and gender predictor using OpenCV pre-trained Caffe model", "Python, OpenCV", 0, "Runs face detection and passes bounding boxes to pre-trained model weights."),
    ("Basic sentiment analysis on movie reviews with Naive Bayes", "Python, NLTK", 0, "Classifies positive and negative reviews on IMDb dataset."),
    ("Expense tracker in Excel and Python", "Python, Pandas", 0, "Reads CSV transactions and prints monthly category expense totals."),
    ("URL Shortener using Python and TinyURL API wrapper", "Python", 0, "Calls public API to shorten URLs without custom redirection server."),
    ("Simple file explorer with directory traversal in C", "C, OS calls", 0, "Navigates directories and prints file sizes in terminal."),
    ("Spam email classifier using CountVectorizer and MultinomialNB", "Python, Scikit-Learn", 0, "Standard Kaggle SMS spam dataset classification tutorial."),
    ("Snake game with retro graphics in Pygame", "Python, Pygame", 0, "Controls 2D snake eating food and growing length with collision detection."),

    # --- TIER 1: Applied Capstone (Full-Stack, Auth, Relational DB) ---
    ("Full-Stack E-Commerce Web Platform with Stripe Checkout", "React, Node.js, Express, MongoDB, Stripe API, JWT", 1, "Engineered end-to-end shopping application with product catalogs, shopping cart, user JWT authentication, order tracking and secure Stripe checkout payment integration."),
    ("Hospital Management and Doctor Appointment Scheduling System", "React, Spring Boot, MySQL, REST API", 1, "Role-based access system for doctors, patients and admins to book appointments, view medical records, manage prescription history and export PDF reports."),
    ("Real-Time Collaborative Chat Application with WebSockets", "React, Node.js, Socket.io, Express, MongoDB", 1, "Enables instant one-on-one and group messaging, online presence tracking, message typing indicators and media sharing with WebSockets."),
    ("College Placement Management and Student Tracking Portal", "Next.js, FastAPI, PostgreSQL, TailwindCSS", 1, "Automated drive registration, student eligibility filtering, resume download batching and placement statistics dashboard for university T&P cell."),
    ("Learning Management System (LMS) with Course Video Streaming", "Django, PostgreSQL, React, AWS S3", 1, "Platform with instructor dashboard, video course uploading, quiz grading, progress tracking and course completion certificate generation."),
    ("Real Estate Property Marketplace with Mapbox Integration", "MERN Stack, Mapbox GL, Redux Toolkit, Cloudinary", 1, "Interactive property listing portal with geospatial search, filtering by price and square footage, image uploading and agent contact messaging."),
    ("Customer Relationship Management (CRM) System with Lead Pipeline", "Vue.js, Python, Flask, PostgreSQL, Celery", 1, "Tracks sales leads through kanban stages, schedules follow-up email notifications and displays monthly revenue conversion charts."),
    ("Automated Resume Screening Tool with TF-IDF Matching", "Python, Streamlit, Scikit-Learn, PyPDF2", 1, "Uploads multiple candidate resumes, extracts keywords and calculates cosine similarity against recruiter job descriptions with ranking table."),
    ("Food Delivery App with Live Order Status Updates", "React Native, Node.js, Express, MongoDB, Socket.io", 1, "Cross-platform mobile application with restaurant menus, cart management, address geocoding and real-time order status lifecycle."),
    ("Personal Finance & Budget Tracking Web App with Plaid API", "React, TypeScript, Node.js, PostgreSQL, Chart.js", 1, "Aggregates bank transactions, categorizes monthly expenses with interactive charts, and alerts users when category budgets exceed limits."),
    ("Job Board Platform with Employer Dashboard & Candidate Application Tracking", "Next.js, Supabase, Tailwind CSS, Prisma", 1, "Allows employers to post listings, manage applicants in candidate pipelines, and lets job seekers apply with profile resumes."),
    ("Gym Membership and Workout Scheduling Management System", "Angular, .NET Core, SQL Server", 1, "Tracks member subscriptions, biometric attendance logging, trainer schedules and invoice billing generation."),
    ("Inventory Management System with Low-Stock Automated Alerts", "PHP, Laravel, MySQL, Bootstrap", 1, "Monitors warehouse SKU quantities, tracks supplier purchase orders, and triggers automated email warnings when inventory falls below threshold."),
    ("Online Code Execution Platform with Sandboxed Runner", "React, Node.js, Docker, Express, MongoDB", 1, "Allows users to write and execute code in Python and C++ inside isolated Docker containers with execution time and memory limits."),
    ("AI Image Generation SaaS App with Credits and Subscription Billing", "Next.js, Replicate API, Stripe, Supabase, Tailwind", 1, "Enables users to generate photorealistic images via Stable Diffusion, with user credits deduction, gallery storage, and Stripe webhooks."),
    ("Library Management System with RFID Barcode Scanning", "Java, JavaFX, MySQL, iText PDF", 1, "Automated book checkout, late fee calculation, return date notifications, and student membership verification."),
    ("Peer-to-Peer Car Rental Platform with Calendar Booking", "React, Express, MongoDB, Cloudinary", 1, "Enables vehicle owners to list cars with daily rates, manage reservation calendars, and receive renter reviews."),
    ("Social Media Analytics Dashboard with Automated PDF Reports", "Python, Flask, React, Chart.js, Pandas", 1, "Connects to social APIs, tracks follower growth, engagement rates and sentiment, with automated weekly executive PDF summaries."),
    ("Event Ticketing and QR Code Check-in Mobile App", "Flutter, Firebase Firestore, Cloud Functions", 1, "Mobile app for event discovery, ticket purchasing with QR generation, and volunteer ticket scanner verification."),
    ("Hotel Booking and Room Reservation System", "Ruby on Rails, PostgreSQL, StimulusJS", 1, "Handles room availability searches, seasonal pricing rules, guest check-in/out workflows and automated booking confirmation emails."),

    # --- TIER 2: Production-Ready Engineering (Scalable, Microservices, Cloud, Distributed) ---
    ("Distributed High-Throughput Event Streaming Pipeline with Apache Kafka and Flink", "Python, Go, Apache Kafka, Apache Flink, Docker, Kubernetes, Prometheus", 2, "Architected a real-time event streaming pipeline processing 60,000+ events/sec. Implemented distributed consumer groups with partition rebalancing, stateful stream windowing, dead-letter queues, and Prometheus/Grafana latency monitoring."),
    ("Production-Grade RAG Search Engine with Vector Database and Hybrid Sparse-Dense Retrieval", "FastAPI, Qdrant, LangChain, PyTorch, Docker, Celery, Redis", 2, "Engineered an enterprise RAG knowledge engine utilizing hybrid BM25 and dense vector embeddings (BGE-large) indexed in Qdrant. Containerized with Docker, deployed with asynchronous Celery workers for PDF chunking, sub-120ms p99 latency, and Redis query caching."),
    ("High-Concurrency Microservices E-Commerce Backend with gRPC and Distributed Tracing", "Go, gRPC, Docker, Kubernetes, PostgreSQL, Redis, Jaeger, Nginx", 2, "Designed decoupled microservices (Auth, Inventory, Orders, Payments) communicating over protobuf gRPC. Implemented distributed transactions with Saga pattern, distributed Redis locking for race-condition prevention, and Jaeger tracing for latency profiling."),
    ("Multi-Cloud Kubernetes Automated CI/CD Infrastructure with GitOps and Terraform", "Terraform, AWS EKS, ArgoCD, Docker, GitHub Actions, Helm, Vault", 2, "Automated zero-downtime infrastructure provisioning on AWS with Terraform. Configured ArgoCD GitOps pipelines, canary deployments with Istio service mesh, HashiCorp Vault secret injection, and automated blue-green rollouts."),
    ("Enterprise Threat Detection SIEM Engine with Distributed Log Ingestion", "Python, Elasticsearch, Logstash, Kibana, Kafka, Docker", 2, "Built a real-time security log analysis pipeline ingesting 15M+ daily network logs. Implemented automated anomaly detection rules for brute-force attacks and port scanning, alerting incident response teams via webhooks within 2 seconds."),
    ("Fault-Tolerant Distributed Key-Value Store with Raft Consensus Algorithm", "Go, Raft Protocol, gRPC, LevelDB", 2, "Engineered a distributed, strongly-consistent key-value storage engine from scratch implementing the Raft consensus protocol. Handled leader election, log replication, snapshotting, and simulated network partitions with 99.99% data consistency."),
    ("High-Frequency Algorithmic Trading Execution Engine with Low-Latency Order Routing", "C++, ZeroMQ, Redis, Multithreading, Linux Sockets", 2, "Developed an order execution engine in modern C++ with lock-free ring buffers, sub-millisecond execution over ZeroMQ, WebSocket market depth feeds, and automated risk check circuit breakers."),
    ("Fintech Payment Gateway Gateway with Idempotency and Webhook Retry Orchestrator", "Python, FastAPI, Redis, PostgreSQL, Celery, Docker, AWS SQS", 2, "Built an idempotent payment orchestration system preventing double-charge anomalies. Engineered exponential backoff retry workers with dead-letter queue handling, HMAC signature verification, and PCI-DSS compliant database encryption."),
    ("Multi-Tenant SaaS Backend with Row-Level Security and Dynamic Schema Provisioning", "Node.js, TypeScript, PostgreSQL, Prisma, Redis, Docker", 2, "Architected multi-tenant cloud architecture supporting 500+ enterprise organizations with tenant data isolation via PostgreSQL Row-Level Security (RLS), tenant-scoped Redis caching, and Stripe usage metering."),
    ("Autonomous Edge Computer Vision Pipeline with TensorRT Optimization and RTSP Streaming", "C++, Python, TensorRT, CUDA, DeepStream, Docker, OpenCV", 2, "Optimized deep learning YOLO detection models using TensorRT FP16 quantization on Jetson edge devices, maintaining 45 FPS over 8 concurrent RTSP video streams with under 15W power consumption."),
    ("Distributed Rate Limiter and API Gateway with Token Bucket Algorithm", "Go, Redis, Docker, Nginx, Prometheus", 2, "Engineered an edge API gateway implementing sliding window and token bucket rate limiting algorithms backed by atomic Redis Lua scripts, throttling 100k requests/sec with under 2ms overhead."),
    ("End-to-End MLOps Pipeline for Production Model Drift Monitoring and Auto-Retraining", "Python, MLflow, Airflow, Docker, FastAPI, Prometheus, Evidently AI", 2, "Architected continuous training pipeline tracking data and concept drift on live inference traffic. Automated model registry versioning in MLflow, canary rollout evaluation, and trigger-based retraining via Apache Airflow DAGs."),
    ("Federated Learning Privacy-Preserving Health Analytics Framework", "Python, PySyft, PyTorch, Docker, Cryptography", 2, "Implemented decentralized model training across simulated hospital nodes without centralizing patient data, utilizing differential privacy noise addition and secure multi-party computation (SMPC)."),
    ("Cloud-Native Serverless Data Pipeline with EventBridge, Lambda and Snowflake", "Python, AWS Lambda, EventBridge, S3, Snowflake, dbt", 2, "Engineered automated serverless ETL ingestion handling 2TB monthly analytics data, transforming raw JSON payloads via dbt models into optimized dimensional data warehouses."),
    ("Zero-Trust Identity and Access Management (IAM) Proxy with Mutual TLS (mTLS)", "Go, mTLS, OAuth2, OpenID Connect, Envoy, Docker", 2, "Engineered zero-trust proxy enforcing cryptographic client certificate authentication and fine-grained Open Policy Agent (OPA) RBAC rules across internal microservice endpoints."),
    ("Real-Time Geospatial Driver-Rider Matching Engine with H3 Hexagonal Hierarchical Spatial Index", "Go, Redis Geospatial, PostgreSQL, PostGIS, WebSockets", 2, "Built a high-scale ride-hailing dispatch engine utilizing Uber H3 hexagonal spatial indexing, sub-50ms driver clustering, spatial nearest-neighbor search, and real-time GPS telemetry broadcasting."),
    ("Compiler and Bytecode Virtual Machine for Custom Statically-Typed Language", "Rust, LLVM, AST Parsing", 2, "Engineered a custom compiled programming language in Rust with hand-written recursive descent parser, static type checker, LLVM IR codegen, and JIT execution runtime with garbage collection."),
    ("Scalable Video Transcoding Distributed Queue with FFmpeg and Spot Instances", "Python, Celery, Redis, AWS S3, Docker, FFmpeg", 2, "Engineered chunked video transcoding engine splitting 4K uploads into parallel segments, encoding HLS adaptive bitrate streams across auto-scaling spot worker instances, saving 65% compute costs."),
    ("Distributed Web Crawler and Search Indexer with Politeness and Deduplication", "Python, Scrapy, Redis, Elasticsearch, Docker", 2, "Built a distributed web crawler indexing 500k web pages daily, featuring URL frontier priority queues in Redis, Bloom filter deduplication, robots.txt compliance, and Elasticsearch full-text indexing."),
    ("Autonomous Drone Flight Controller with Extended Kalman Filter and ROS 2", "C++, ROS 2, PX4, Gazebo, Kalman Filter", 2, "Developed flight state estimation algorithms fusing IMU, barometer and GPS sensor streams via Extended Kalman Filter (EKF) with sub-10cm position hold accuracy under simulated wind disturbance.")
]

def generate_expanded_dataset():
    """Expands dataset by adding natural variations in student phrasing."""
    rows = []
    
    for title, stack, label, desc in projects_data:
        rows.append({
            "project_title": title,
            "tech_stack": stack,
            "project_description": desc,
            "combined_text": f"{title}. Tech stack: {stack}. Description: {desc}",
            "complexity_tier": label,
            "tier_name": "Academic/Tutorial" if label == 0 else ("Applied Capstone" if label == 1 else "Production-Ready")
        })
        
        # Variation 1: Emphasize tech stack prefix
        rows.append({
            "project_title": title,
            "tech_stack": stack,
            "project_description": f"Built using {stack}. {desc}",
            "combined_text": f"Project: {title}. Implemented using {stack}. {desc}",
            "complexity_tier": label,
            "tier_name": "Academic/Tutorial" if label == 0 else ("Applied Capstone" if label == 1 else "Production-Ready")
        })
        
        # Variation 2: Action-verb first resume bullet format
        rows.append({
            "project_title": title,
            "tech_stack": stack,
            "project_description": f"Key Highlights: {desc} Technologies applied: {stack}.",
            "combined_text": f"{title} | {stack} | {desc}",
            "complexity_tier": label,
            "tier_name": "Academic/Tutorial" if label == 0 else ("Applied Capstone" if label == 1 else "Production-Ready")
        })

    df = pd.DataFrame(rows)
    # Shuffle
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
    return df

if __name__ == "__main__":
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets"))
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "project_complexity_dataset.csv")
    df.to_csv(output_path, index=False)
    print(f"Created project complexity dataset with {len(df)} samples at {output_path}")
    print(f"Class distribution:\n{df['tier_name'].value_counts()}")
