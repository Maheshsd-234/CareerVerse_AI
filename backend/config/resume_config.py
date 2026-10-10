"""Configuration for Station 09: Resume Station Templates, ATS Benchmarks & Rules."""

TEMPLATES = {
    'ats_optimized': {
        'id': 'ats_optimized',
        'name': 'ATS Optimized',
        'description': 'Engineered to pass Applicant Tracking Systems with single-column clean hierarchy.',
        'badge': 'Highest ATS Score',
        'sections': ['personalInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications'],
        'styling': 'minimal',
        'fontFamily': 'Inter, Arial, sans-serif',
        'primaryColor': '#1e293b',
        'accentColor': '#2563eb'
    },
    'modern': {
        'id': 'modern',
        'name': 'Modern Professional',
        'description': 'Sleek contemporary design with subtle accents, ideal for tech & creative roles.',
        'badge': 'Visual Appeal',
        'sections': ['personalInfo', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
        'styling': 'modern',
        'fontFamily': 'Outfit, Inter, sans-serif',
        'primaryColor': '#0f172a',
        'accentColor': '#6366f1'
    },
    'minimal': {
        'id': 'minimal',
        'name': 'Clean Minimal',
        'description': 'Distraction-free typography, elegant spacing, and pristine readability.',
        'badge': 'Classic',
        'sections': ['personalInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications'],
        'styling': 'minimal',
        'fontFamily': 'Georgia, Garamond, serif',
        'primaryColor': '#111827',
        'accentColor': '#475569'
    }
}

ATS_CORE_KEYWORDS = list(dict.fromkeys([
    # Programming Languages
    'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift',
    'Kotlin', 'Scala', 'R', 'SQL',
    
    # ML/AI & Data
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn',
    'XGBoost', 'NLP', 'Computer Vision', 'Neural Networks', 'Keras',
    'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'OpenCV', 'LLM', 'LangChain',
    
    # Cloud & DevOps
    'AWS', 'Google Cloud', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Jenkins',
    'CI/CD', 'Linux', 'Git', 'GitHub', 'Terraform', 'Ansible', 'Microservices',
    
    # Web & Full Stack
    'React', 'Vue', 'Angular', 'Node.js', 'FastAPI', 'Django',
    'Flask', 'REST API', 'GraphQL', 'HTML', 'CSS', 'Tailwind', 'Next.js',
    
    # Databases & Storage
    'MongoDB', 'PostgreSQL', 'MySQL', 'Firebase', 'Firestore',
    'Redis', 'Elasticsearch', 'DynamoDB', 'Cassandra',
    
    # Engineering Practices & Soft Skills
    'Agile', 'Scrum', 'Kanban', 'System Design', 'Code Review', 'Unit Testing',
    'Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Project Management'
]))

HIGH_PRIORITY_KEYWORDS = [
    'Python', 'Machine Learning', 'AWS', 'Docker', 'React', 'SQL', 'FastAPI', 'Kubernetes', 'Git', 'CI/CD'
]

ATS_DOMAIN_KEYWORDS = {
    'Full-Stack & Web Development': [
        'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'HTML', 'CSS',
        'Tailwind', 'REST API', 'GraphQL', 'FastAPI', 'Vue', 'Angular', 'SQL', 'PostgreSQL', 'MongoDB'
    ],
    'Backend & Cloud Engineering': [
        'Python', 'Java', 'Go', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
        'CI/CD', 'Microservices', 'Linux', 'Terraform', 'PostgreSQL', 'Redis', 'SQL', 'Git'
    ],
    'AI, Machine Learning & Data': [
        'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Scikit-learn',
        'Pandas', 'NumPy', 'NLP', 'Computer Vision', 'LLM', 'LangChain', 'Python', 'SQL'
    ],
    'DevOps & Infrastructure': [
        'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'CI/CD',
        'AWS', 'Linux', 'Git', 'GitHub', 'Microservices'
    ],
    'Databases & Architecture': [
        'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'System Design', 'REST API'
    ]
}

UNIVERSAL_BEST_PRACTICES = [
    'Git', 'CI/CD', 'Unit Testing', 'Code Review', 'System Design', 'Agile'
]

POWER_ACTION_VERBS = [
    'architected', 'engineered', 'spearheaded', 'orchestrated', 'streamlined',
    'implemented', 'optimized', 'accelerated', 'automated', 'deployed',
    'designed', 'scaled', 'refactored', 'developed', 'delivered', 'boosted'
]

WEAK_PASSIVE_PHRASES = [
    'worked on', 'helped with', 'responsible for', 'assisted with', 'handled',
    'participated in', 'tasked with', 'duties included', 'attempted to'
]

SCORING_WEIGHTS = {
    'with_jd': {
        'formatting': 0.20,
        'keywords': 0.30,
        'readability': 0.15,
        'metrics': 0.20,
        'jd_match': 0.15
    },
    'without_jd': {
        'formatting': 0.25,
        'keywords': 0.40,
        'readability': 0.15,
        'metrics': 0.20
    }
}
