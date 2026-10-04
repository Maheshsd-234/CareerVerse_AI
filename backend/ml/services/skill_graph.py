"""
CareerVerse AI - Prerequisite Skill Graph Engine (TIER 3)
Builds a Directed Acyclic Graph (DAG) of technical competencies, prerequisites,
difficulty weights, and realistic hourly effort estimations using NetworkX.
"""

import networkx as nx
from typing import List, Dict, Any, Set, Tuple, Optional

# Comprehensive Knowledge Base of Skills with Prerequisites, Difficulty (1-5), and Hours
SKILL_REGISTRY: Dict[str, Dict[str, Any]] = {
    # Programming Foundations
    "Programming Fundamentals": {
        "category": "Foundations",
        "difficulty": 1,
        "hours": 35,
        "demand": 95,
        "prerequisites": [],
        "description": "Variables, control flow, loops, functions, memory basics, and I/O."
    },
    "Python": {
        "category": "Programming Languages",
        "difficulty": 2,
        "hours": 40,
        "demand": 98,
        "prerequisites": ["Programming Fundamentals"],
        "description": "Object-oriented Python, list comprehensions, decorators, virtualenvs, pip."
    },
    "Java": {
        "category": "Programming Languages",
        "difficulty": 2,
        "hours": 50,
        "demand": 92,
        "prerequisites": ["Programming Fundamentals"],
        "description": "OOP principles, JVM architecture, Collections framework, Generics, Multithreading."
    },
    "C++": {
        "category": "Programming Languages",
        "difficulty": 3,
        "hours": 55,
        "demand": 88,
        "prerequisites": ["Programming Fundamentals"],
        "description": "Pointers, references, memory management, STL containers and algorithms."
    },
    "JavaScript": {
        "category": "Programming Languages",
        "difficulty": 2,
        "hours": 40,
        "demand": 96,
        "prerequisites": ["Programming Fundamentals"],
        "description": "ES6+ syntax, asynchronous programming, Promises, Event Loop, DOM manipulation."
    },
    "TypeScript": {
        "category": "Programming Languages",
        "difficulty": 2,
        "hours": 30,
        "demand": 94,
        "prerequisites": ["JavaScript"],
        "description": "Static typing, Interfaces, Generics, Type narrowing, TS configuration."
    },
    "Git & GitHub": {
        "category": "Foundations",
        "difficulty": 1,
        "hours": 20,
        "demand": 99,
        "prerequisites": [],
        "description": "Branching, merging, pull requests, resolving merge conflicts, CI workflows."
    },
    "Data Structures & Algorithms": {
        "category": "Computer Science Core",
        "difficulty": 4,
        "hours": 90,
        "demand": 99,
        "prerequisites": ["Programming Fundamentals"],
        "description": "Arrays, HashMaps, Trees, Graphs, Dynamic Programming, Greedy, Complexity Analysis."
    },

    # Database & Backend
    "SQL & Relational Databases": {
        "category": "Databases",
        "difficulty": 2,
        "hours": 35,
        "demand": 95,
        "prerequisites": ["Programming Fundamentals"],
        "description": "Relational schema design, normalization, joins, indexing, transactions, ACID."
    },
    "NoSQL Databases (MongoDB/Redis)": {
        "category": "Databases",
        "difficulty": 2,
        "hours": 30,
        "demand": 89,
        "prerequisites": ["SQL & Relational Databases"],
        "description": "Document storage, key-value caching, pub-sub architectures, TTL indexing."
    },
    "RESTful API Development": {
        "category": "Backend",
        "difficulty": 2,
        "hours": 40,
        "demand": 97,
        "prerequisites": ["SQL & Relational Databases"],
        "description": "HTTP methods, status codes, JWT authentication, pagination, rate limiting, Swagger."
    },
    "Microservices Architecture": {
        "category": "Backend",
        "difficulty": 4,
        "hours": 55,
        "demand": 91,
        "prerequisites": ["RESTful API Development", "NoSQL Databases (MongoDB/Redis)"],
        "description": "Service decomposition, API Gateways, Event-driven communication, Circuit Breakers."
    },
    "System Design & Scalability": {
        "category": "Architecture",
        "difficulty": 5,
        "hours": 70,
        "demand": 96,
        "prerequisites": ["Microservices Architecture", "Data Structures & Algorithms"],
        "description": "Load balancers, sharding, replication, CDN, CAP theorem, distributed consensus."
    },

    # Frontend
    "HTML & CSS Styling": {
        "category": "Frontend",
        "difficulty": 1,
        "hours": 25,
        "demand": 94,
        "prerequisites": [],
        "description": "Semantic markup, Flexbox, CSS Grid, responsive design, Tailwind CSS."
    },
    "React.js": {
        "category": "Frontend",
        "difficulty": 3,
        "hours": 50,
        "demand": 97,
        "prerequisites": ["JavaScript", "HTML & CSS Styling"],
        "description": "Component lifecycle, Hooks (useState, useEffect, useMemo), Context API, Virtual DOM."
    },
    "Next.js & Full-Stack Web": {
        "category": "Frontend",
        "difficulty": 3,
        "hours": 45,
        "demand": 93,
        "prerequisites": ["React.js", "TypeScript", "RESTful API Development"],
        "description": "App Router, SSR, SSG, Server Actions, API routes, edge middleware."
    },

    # DevOps & Cloud
    "Linux & Bash Scripting": {
        "category": "DevOps",
        "difficulty": 2,
        "hours": 25,
        "demand": 92,
        "prerequisites": [],
        "description": "Shell commands, file permissions, cron jobs, SSH, process management."
    },
    "Docker & Containerization": {
        "category": "DevOps",
        "difficulty": 3,
        "hours": 35,
        "demand": 96,
        "prerequisites": ["Linux & Bash Scripting", "RESTful API Development"],
        "description": "Dockerfile optimization, multi-stage builds, docker-compose, volume mapping, networks."
    },
    "Cloud Foundations (AWS/GCP/Azure)": {
        "category": "Cloud",
        "difficulty": 3,
        "hours": 45,
        "demand": 95,
        "prerequisites": ["Linux & Bash Scripting", "Docker & Containerization"],
        "description": "EC2/Compute, S3/Storage, VPC networking, IAM security policies, serverless."
    },
    "Kubernetes & Orchestration": {
        "category": "DevOps",
        "difficulty": 4,
        "hours": 55,
        "demand": 90,
        "prerequisites": ["Docker & Containerization", "Cloud Foundations (AWS/GCP/Azure)"],
        "description": "Pods, Deployments, Services, Ingress, ConfigMaps, Helm charts, auto-scaling."
    },
    "CI/CD Pipelines (GitHub Actions)": {
        "category": "DevOps",
        "difficulty": 3,
        "hours": 30,
        "demand": 93,
        "prerequisites": ["Git & GitHub", "Docker & Containerization"],
        "description": "Automated linting, unit testing, container build & automated cloud deployment."
    },

    # Data Science & Machine Learning
    "NumPy & Pandas Data Wrangling": {
        "category": "Data Science",
        "difficulty": 2,
        "hours": 35,
        "demand": 94,
        "prerequisites": ["Python"],
        "description": "Vectorized computations, DataFrames, groupbys, cleaning nulls, feature transformations."
    },
    "Applied Machine Learning": {
        "category": "AI / ML",
        "difficulty": 3,
        "hours": 60,
        "demand": 95,
        "prerequisites": ["NumPy & Pandas Data Wrangling", "Data Structures & Algorithms"],
        "description": "Scikit-Learn, Regression, Decision Trees, Random Forests, XGBoost, Cross-validation."
    },
    "Deep Learning & PyTorch": {
        "category": "AI / ML",
        "difficulty": 4,
        "hours": 75,
        "demand": 93,
        "prerequisites": ["Applied Machine Learning"],
        "description": "Neural networks, Backpropagation, CNNs, Transformers, GPU acceleration, Model training."
    },
    "LLMs & Generative AI Systems": {
        "category": "AI / ML",
        "difficulty": 4,
        "hours": 50,
        "demand": 98,
        "prerequisites": ["Deep Learning & PyTorch", "RESTful API Development"],
        "description": "Prompt engineering, RAG pipelines, Vector databases (Pinecone/Chroma), LangChain, Groq/OpenAI APIs."
    },

    # Cybersecurity
    "Network Security & Protocols": {
        "category": "Cybersecurity",
        "difficulty": 3,
        "hours": 40,
        "demand": 91,
        "prerequisites": ["Linux & Bash Scripting"],
        "description": "TCP/IP, DNS, SSL/TLS, firewalls, packet analysis with Wireshark, VPNs."
    },
    "Threat Defense & Penetration Testing": {
        "category": "Cybersecurity",
        "difficulty": 4,
        "hours": 60,
        "demand": 92,
        "prerequisites": ["Network Security & Protocols", "Python"],
        "description": "OWASP Top 10, vulnerability scanning, Kali Linux, privilege escalation, ethical hacking."
    },

    # Core Engineering (Mechanical & Civil)
    "Engineering Graphics & CAD": {
        "category": "Core Engineering",
        "difficulty": 2,
        "hours": 40,
        "demand": 85,
        "prerequisites": [],
        "description": "Orthographic projections, 2D drafting, geometric dimensioning and tolerancing (GD&T)."
    },
    "AutoCAD / SolidWorks 3D Modeling": {
        "category": "Mechanical",
        "difficulty": 3,
        "hours": 60,
        "demand": 88,
        "prerequisites": ["Engineering Graphics & CAD"],
        "description": "Parametric part modeling, assembly simulation, FEA basics, sheet metal design."
    },
    "BIM & Revit Structural Modeling": {
        "category": "Civil",
        "difficulty": 3,
        "hours": 55,
        "demand": 86,
        "prerequisites": ["Engineering Graphics & CAD"],
        "description": "Building Information Modeling, parametric structural frames, clash detection, 3D BIM coordination."
    },
    "Embedded Systems & C": {
        "category": "Hardware / IoT",
        "difficulty": 3,
        "hours": 50,
        "demand": 89,
        "prerequisites": ["C++", "Linux & Bash Scripting"],
        "description": "Microcontrollers (ARM, ESP32), GPIO, I2C, SPI, UART, real-time operating systems (FreeRTOS)."
    },
    "IoT Protocols & Cloud Sensors": {
        "category": "Hardware / IoT",
        "difficulty": 3,
        "hours": 40,
        "demand": 87,
        "prerequisites": ["Embedded Systems & C", "Cloud Foundations (AWS/GCP/Azure)"],
        "description": "MQTT, CoAP, edge computing, sensor telemetry data streaming to cloud IoT brokers."
    },

    # Additional Modern Competencies
    "Mathematics & Statistics for Machine Learning": {
        "category": "AI / ML Foundations",
        "difficulty": 3,
        "hours": 40,
        "demand": 95,
        "prerequisites": ["Programming Fundamentals"],
        "description": "Linear algebra, matrix decompositions, multivariable calculus, probability distributions, Bayes theorem, hypothesis testing."
    },
    "Transformers & NLP": {
        "category": "AI / ML",
        "difficulty": 4,
        "hours": 50,
        "demand": 96,
        "prerequisites": ["Deep Learning & PyTorch"],
        "description": "Self-attention mechanism, multi-head attention, BERT, GPT architectures, tokenization, Hugging Face ecosystem."
    },
    "RAG & Vector Search": {
        "category": "AI / ML",
        "difficulty": 4,
        "hours": 45,
        "demand": 98,
        "prerequisites": ["LLMs & Generative AI Systems", "NoSQL Databases (MongoDB/Redis)"],
        "description": "Document chunking, dense vector embeddings, vector databases (Chroma, Pinecone, Qdrant), hybrid search, re-ranking, evaluation."
    },
    "MLOps & Model Deployment": {
        "category": "AI / ML",
        "difficulty": 4,
        "hours": 45,
        "demand": 95,
        "prerequisites": ["Applied Machine Learning", "Docker & Containerization", "RESTful API Development"],
        "description": "Model packaging, Triton/TorchServe, FastAPI inference endpoints, latency profiling, data drift monitoring, feature stores."
    },
    "Tailwind CSS & Design Systems": {
        "category": "Frontend",
        "difficulty": 2,
        "hours": 25,
        "demand": 94,
        "prerequisites": ["HTML & CSS Styling"],
        "description": "Utility-first design tokens, responsive breakpoints, accessible dark mode, micro-animations, component abstractions."
    },
    "Web Performance & Accessibility": {
        "category": "Frontend",
        "difficulty": 3,
        "hours": 30,
        "demand": 92,
        "prerequisites": ["React.js"],
        "description": "Core Web Vitals (LCP, FID, CLS), bundle splitting, image optimization, WCAG 2.1 AA compliance, ARIA attributes."
    },
    "Terraform & Infrastructure as Code": {
        "category": "DevOps",
        "difficulty": 3,
        "hours": 35,
        "demand": 94,
        "prerequisites": ["Cloud Foundations (AWS/GCP/Azure)"],
        "description": "Declarative HCL syntax, state management, provider configuration, reusable modules, multi-environment infrastructure."
    },
    "Application Security & OWASP": {
        "category": "Cybersecurity",
        "difficulty": 3,
        "hours": 40,
        "demand": 93,
        "prerequisites": ["RESTful API Development", "Network Security & Protocols"],
        "description": "SQL injection, XSS, CSRF, insecure direct object references, security headers, JWT tamper defense, automated SAST/DAST."
    },
    "Cloud Security & IAM": {
        "category": "Cybersecurity",
        "difficulty": 4,
        "hours": 40,
        "demand": 94,
        "prerequisites": ["Cloud Foundations (AWS/GCP/Azure)", "Network Security & Protocols"],
        "description": "Least privilege IAM policies, zero-trust network architectures, VPC peering security, KMS envelope encryption, cloud compliance."
    },
    "Product Strategy & Analytics": {
        "category": "Management",
        "difficulty": 3,
        "hours": 35,
        "demand": 91,
        "prerequisites": ["SQL & Relational Databases"],
        "description": "PRD writing, user interview synthesis, North Star metric definition, funnel retention cohorts, RICE roadmap prioritization."
    },
    "UI/UX Design Systems & Figma": {
        "category": "Design",
        "difficulty": 2,
        "hours": 35,
        "demand": 93,
        "prerequisites": ["HTML & CSS Styling"],
        "description": "Figma autolayout, components, variants, design tokens, wireframing, interactive prototyping, usability test benchmarking."
    },
    "Technical Writing & OpenAPI Specs": {
        "category": "Communication & Docs",
        "difficulty": 2,
        "hours": 30,
        "demand": 90,
        "prerequisites": ["Git & GitHub", "RESTful API Development"],
        "description": "Docs-as-code workflow, OpenAPI 3.1 YAML schema definition, Swagger UI/Redoc, Diátaxis documentation framework, Vale prose linting."
    }
}


class SkillGraph:
    """Directed Acyclic Graph (DAG) for validated prerequisite-driven roadmaps."""

    def __init__(self):
        self.graph = nx.DiGraph()
        self._build_graph()

    def _build_graph(self):
        """Construct the NetworkX graph with node metadata and prerequisite directed edges."""
        for skill_name, data in SKILL_REGISTRY.items():
            self.graph.add_node(
                skill_name,
                category=data["category"],
                difficulty=data["difficulty"],
                hours=data["hours"],
                demand=data["demand"],
                description=data["description"]
            )
            for prereq in data["prerequisites"]:
                if prereq in SKILL_REGISTRY:
                    # Directed edge: Prerequisite -> Target Skill
                    self.graph.add_edge(prereq, skill_name)

    def normalize_skill_name(self, name: str) -> Optional[str]:
        """Maps freeform or abbreviated skill name to registry key."""
        target = name.strip().lower()
        alias_map = {
            "python": "Python",
            "java": "Java",
            "c++": "C++",
            "cpp": "C++",
            "javascript": "JavaScript",
            "js": "JavaScript",
            "typescript": "TypeScript",
            "ts": "TypeScript",
            "git": "Git & GitHub",
            "github": "Git & GitHub",
            "dsa": "Data Structures & Algorithms",
            "data structures": "Data Structures & Algorithms",
            "sql": "SQL & Relational Databases",
            "database": "SQL & Relational Databases",
            "databases": "SQL & Relational Databases",
            "nosql": "NoSQL Databases (MongoDB/Redis)",
            "mongodb": "NoSQL Databases (MongoDB/Redis)",
            "redis": "NoSQL Databases (MongoDB/Redis)",
            "rest api": "RESTful API Development",
            "rest apis": "RESTful API Development",
            "apis": "RESTful API Development",
            "backend": "RESTful API Development",
            "microservices": "Microservices Architecture",
            "system design": "System Design & Scalability",
            "html": "HTML & CSS Styling",
            "css": "HTML & CSS Styling",
            "tailwind": "HTML & CSS Styling",
            "react": "React.js",
            "reactjs": "React.js",
            "next.js": "Next.js & Full-Stack Web",
            "nextjs": "Next.js & Full-Stack Web",
            "docker": "Docker & Containerization",
            "containers": "Docker & Containerization",
            "kubernetes": "Kubernetes & Orchestration",
            "k8s": "Kubernetes & Orchestration",
            "cloud": "Cloud Foundations (AWS/GCP/Azure)",
            "aws": "Cloud Foundations (AWS/GCP/Azure)",
            "linux": "Linux & Bash Scripting",
            "ci/cd": "CI/CD Pipelines (GitHub Actions)",
            "devops": "CI/CD Pipelines (GitHub Actions)",
            "pandas": "NumPy & Pandas Data Wrangling",
            "numpy": "NumPy & Pandas Data Wrangling",
            "data science": "NumPy & Pandas Data Wrangling",
            "machine learning": "Applied Machine Learning",
            "ml": "Applied Machine Learning",
            "deep learning": "Deep Learning & PyTorch",
            "pytorch": "Deep Learning & PyTorch",
            "genai": "LLMs & Generative AI Systems",
            "llm": "LLMs & Generative AI Systems",
            "cybersecurity": "Network Security & Protocols",
            "security": "Network Security & Protocols",
            "autocad": "AutoCAD / SolidWorks 3D Modeling",
            "solidworks": "AutoCAD / SolidWorks 3D Modeling",
            "revit": "BIM & Revit Structural Modeling",
            "embedded systems": "Embedded Systems & C",
            "iot": "IoT Protocols & Cloud Sensors",
            "rag": "RAG & Vector Search",
            "vector search": "RAG & Vector Search",
            "vector databases": "RAG & Vector Search",
            "mlops": "MLOps & Model Deployment",
            "model deployment": "MLOps & Model Deployment",
            "nlp": "Transformers & NLP",
            "transformers": "Transformers & NLP",
            "statistics": "Mathematics & Statistics for Machine Learning",
            "math": "Mathematics & Statistics for Machine Learning",
            "tailwind": "Tailwind CSS & Design Systems",
            "terraform": "Terraform & Infrastructure as Code",
            "iac": "Terraform & Infrastructure as Code",
            "owasp": "Application Security & OWASP",
            "appsec": "Application Security & OWASP",
            "cloud security": "Cloud Security & IAM",
            "iam": "Cloud Security & IAM",
            "figma": "UI/UX Design Systems & Figma",
            "ui/ux": "UI/UX Design Systems & Figma",
            "uiux": "UI/UX Design Systems & Figma",
            "technical writing": "Technical Writing & OpenAPI Specs",
            "openapi": "Technical Writing & OpenAPI Specs",
            "product management": "Product Strategy & Analytics",
            "prd": "Product Strategy & Analytics",
        }
        if target in alias_map:
            return alias_map[target]
        for key in SKILL_REGISTRY.keys():
            if target == key.lower():
                return key
            if target in key.lower():
                return key
        return None

    def get_ancestor_prerequisites(self, skill_name: str) -> Set[str]:
        """Returns all prerequisite skills needed to learn the given skill (transitive closure)."""
        if skill_name not in self.graph:
            return set()
        return nx.ancestors(self.graph, skill_name)

    def resolve_topological_roadmap(
        self,
        target_skills: List[str],
        known_skills: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Takes desired target skills and already known skills,
        includes missing ancestor prerequisites, and returns a strictly
        topologically sorted learning sequence.
        """
        # Normalize inputs
        norm_known = set()
        for s in known_skills:
            norm = self.normalize_skill_name(s)
            if norm:
                norm_known.add(norm)

        norm_targets = set()
        for s in target_skills:
            norm = self.normalize_skill_name(s)
            if norm:
                norm_targets.add(norm)

        # Collect all required skills including their missing ancestors
        all_required = set()
        for skill in norm_targets:
            if skill in self.graph:
                all_required.add(skill)
                prereqs = self.get_ancestor_prerequisites(skill)
                all_required.update(prereqs)

        # Subtract skills user already knows
        skills_to_learn = [s for s in all_required if s not in norm_known]

        if not skills_to_learn:
            return []

        # Create induced subgraph and topological sort
        subgraph = self.graph.subgraph(skills_to_learn)
        try:
            sorted_skills = list(nx.topological_sort(subgraph))
        except nx.NetworkXUnfeasible:
            # Fallback if cycle (should not occur in DAG)
            sorted_skills = list(skills_to_learn)

        # Enrich with metadata & direct prerequisites
        roadmap_items = []
        for s in sorted_skills:
            node_data = self.graph.nodes[s]
            direct_prereqs = list(self.graph.predecessors(s))
            roadmap_items.append({
                "skill": s,
                "category": node_data.get("category", "General"),
                "difficulty": node_data.get("difficulty", 2),
                "estimated_hours": node_data.get("hours", 30),
                "market_demand": node_data.get("demand", 80),
                "description": node_data.get("description", ""),
                "prerequisites": direct_prereqs,
                "prerequisites_satisfied": all(p in norm_known or p in sorted_skills[:sorted_skills.index(s)] for p in direct_prereqs)
            })

        return roadmap_items

    def export_graph_for_visualization(self) -> Dict[str, Any]:
        """Exports nodes and edges formatted for frontend graph rendering."""
        nodes = []
        for n, d in self.graph.nodes(data=True):
            nodes.append({
                "id": n,
                "label": n,
                "category": d["category"],
                "difficulty": d["difficulty"],
                "hours": d["hours"],
                "demand": d["demand"]
            })
        edges = []
        for u, v in self.graph.edges():
            edges.append({
                "source": u,
                "target": v
            })
        return {"nodes": nodes, "edges": edges}


# Global singleton instance
skill_graph = SkillGraph()
