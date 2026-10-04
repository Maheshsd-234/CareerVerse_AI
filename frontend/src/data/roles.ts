import type { Role } from "../types";

export const roles: Role[] = [
  // ==========================================
  // SOFTWARE ENGINEERING DOMAIN
  // ==========================================
  {
    id: "software-engineer",
    name: "Software Development Engineer (SDE / SWE)",
    category: "Software Engineering",
    requiredSkills: ["Data Structures & Algorithms", "Java/Go/Python", "System Design", "REST APIs", "SQL", "Unit Testing"],
    salaryRange: "₹6L - ₹25L",
    trendScore: 9.9,
    description: "Design, build, and scale end-to-end software systems and microservices across entry-level to staff engineering tiers.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "frontend-dev",
    name: "Frontend Engineer",
    category: "Software Engineering",
    requiredSkills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Web Performance", "State Management"],
    salaryRange: "₹5L - ₹20L",
    trendScore: 9.4,
    description: "Craft modern, lightning-fast, and responsive user interfaces with pixel-perfect design fidelity, accessibility, and client-side optimization.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "backend-dev",
    name: "Backend Engineer",
    category: "Software Engineering",
    requiredSkills: ["Node.js / Go / Java", "PostgreSQL", "Redis", "Kafka", "Microservices", "Docker", "API Security"],
    salaryRange: "₹6L - ₹24L",
    trendScore: 9.6,
    description: "Build robust, high-throughput backend APIs, transactional database architectures, distributed message queues, and caching systems.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "fullstack-dev",
    name: "Full Stack Developer",
    category: "Software Engineering",
    requiredSkills: ["React", "Node.js", "TypeScript", "PostgreSQL", "REST APIs", "Cloud Deployment"],
    salaryRange: "₹6L - ₹22L",
    trendScore: 9.5,
    description: "Build end-to-end web applications seamlessly bridging interactive user interfaces and backend database services.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "mobile-dev",
    name: "Mobile App Developer (Flutter / React Native)",
    category: "Software Engineering",
    requiredSkills: ["Flutter", "React Native", "Kotlin", "Swift", "State Management", "Mobile CI/CD"],
    salaryRange: "₹5L - ₹18L",
    trendScore: 9.1,
    description: "Build fluid, high-performance native and cross-platform mobile applications for millions of Android and iOS users.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "sdet-qa",
    name: "QA & Automation Engineer (SDET)",
    category: "Software Engineering",
    requiredSkills: ["Playwright", "Selenium", "Cypress", "Python / Java", "API Testing", "CI/CD Test Automation"],
    salaryRange: "₹4.5L - ₹16L",
    trendScore: 8.9,
    description: "Develop automated testing suites, performance benchmarks, and continuous quality assurance pipelines for zero-defect releases.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },

  // ==========================================
  // DATA & ARTIFICIAL INTELLIGENCE DOMAIN
  // ==========================================
  {
    id: "ai-engineer",
    name: "AI & Generative AI Engineer",
    category: "Data & AI",
    requiredSkills: ["Python", "LLMs & Prompting", "RAG Systems", "LangChain / LlamaIndex", "Vector DBs", "PyTorch"],
    salaryRange: "₹8L - ₹28L",
    trendScore: 9.9,
    description: "Design and deploy generative AI applications, intelligent agents, RAG pipelines, and fine-tune foundation models.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "ml-engineer",
    name: "Machine Learning Engineer",
    category: "Data & AI",
    requiredSkills: ["Python", "Machine Learning", "PyTorch", "MLOps", "Model Deployment", "Feature Stores"],
    salaryRange: "₹7.5L - ₹26L",
    trendScore: 9.7,
    description: "Build, train, deploy, and monitor scalable machine learning models and real-time prediction pipelines in production.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "data-scientist",
    name: "Data Scientist",
    category: "Data & AI",
    requiredSkills: ["Python", "SQL", "Statistics", "Machine Learning", "Predictive Modeling", "Data Storytelling"],
    salaryRange: "₹6.5L - ₹24L",
    trendScore: 9.3,
    description: "Extract actionable predictive insights and build algorithmic solutions from complex multi-dimensional datasets.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    category: "Data & AI",
    requiredSkills: ["SQL", "Excel", "PowerBI", "Tableau", "Exploratory Data Analysis", "Business Metrics"],
    salaryRange: "₹4L - ₹15L",
    trendScore: 8.8,
    description: "Analyze business metrics, design executive BI dashboards, and empower data-informed strategic decision-making.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "data-engineer",
    name: "Data Engineer",
    category: "Data & AI",
    requiredSkills: ["Apache Spark", "SQL", "Python", "Airflow", "Snowflake", "Data Warehousing", "Kafka"],
    salaryRange: "₹6L - ₹22L",
    trendScore: 9.5,
    description: "Architect big-data ingestion pipelines, data lakes, and real-time streaming warehouses at enterprise scale.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },

  // ==========================================
  // CLOUD & SECURITY DOMAIN
  // ==========================================
  {
    id: "devops-sre",
    name: "DevOps & SRE Engineer",
    category: "Cloud & Security",
    requiredSkills: ["AWS / Azure / GCP", "Docker", "Kubernetes", "Terraform", "CI/CD Pipelines", "Linux", "Prometheus"],
    salaryRange: "₹6L - ₹22L",
    trendScore: 9.6,
    description: "Automate cloud infrastructure provisioning, container orchestration, zero-downtime deployments, and system reliability.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "cybersecurity-analyst",
    name: "Cybersecurity Analyst & SOC",
    category: "Cloud & Security",
    requiredSkills: ["Network Security", "Penetration Testing", "SIEM (Splunk)", "Threat Analysis", "Cryptography", "Incident Response"],
    salaryRange: "₹5L - ₹18L",
    trendScore: 9.2,
    description: "Safeguard corporate networks, perform vulnerability assessments, and respond to cyber threat incidents.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "cloud-architect",
    name: "Cloud Solutions Architect",
    category: "Cloud & Security",
    requiredSkills: ["Cloud Architecture", "Multi-Cloud Security", "FinOps", "Disaster Recovery", "Terraform", "Enterprise Networking"],
    salaryRange: "₹18L - ₹45L",
    trendScore: 9.7,
    description: "Design resilient, highly-available, and cost-effective cloud governance topologies for large enterprise systems.",
    fresherFriendly: false,
    targetLevel: "Mid-Level"
  },

  // ==========================================
  // PRODUCT & DESIGN DOMAIN
  // ==========================================
  {
    id: "uiux-designer",
    name: "UI/UX Product Designer",
    category: "Product & Design",
    requiredSkills: ["Figma", "User Research", "Wireframing", "Design Systems", "Prototyping", "Usability Testing"],
    salaryRange: "₹4.5L - ₹18L",
    trendScore: 9.2,
    description: "Design intuitive user journeys, wireframes, accessible user interfaces, and scalable design systems.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "product-manager",
    name: "Product Manager (APM / PM)",
    category: "Product & Design",
    requiredSkills: ["Product Strategy", "User Journey Mapping", "Roadmap Planning", "Metrics & Analytics", "Agile / Scrum", "Wireframing"],
    salaryRange: "₹8L - ₹25L",
    trendScore: 9.5,
    description: "Lead product strategy from 0-to-1, prioritize feature roadmaps, and align engineering, design, and business teams.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "technical-writer",
    name: "Technical Writer & Docs Specialist",
    category: "Product & Design",
    requiredSkills: ["API Documentation", "Markdown", "Developer Guides", "Docs-as-Code", "Information Architecture"],
    salaryRange: "₹4.5L - ₹14L",
    trendScore: 8.5,
    description: "Author comprehensive developer documentation, API references, architecture blueprints, and onboarding tutorials.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },

  // ==========================================
  // BUSINESS & FINANCE DOMAIN
  // ==========================================
  {
    id: "financial-analyst",
    name: "Financial Analyst / Investment Banking",
    category: "Business & Finance",
    requiredSkills: ["Financial Modeling", "Valuation (DCF)", "Equity Research", "Advanced Excel", "Corporate Accounting"],
    salaryRange: "₹6L - ₹22L",
    trendScore: 8.8,
    description: "Perform corporate valuations, investment thesis analysis, financial forecasting, and M&A transaction support.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "management-consultant",
    name: "Management Consultant",
    category: "Business & Finance",
    requiredSkills: ["Strategic Problem Solving", "Financial Modeling", "Market Analysis", "Executive Presentations", "Operations"],
    salaryRange: "₹9L - ₹28L",
    trendScore: 8.9,
    description: "Advise Fortune 500 and growth-stage companies on corporate growth, cost optimization, and digital transformation.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "chartered-accountant",
    name: "Chartered Accountant (CA)",
    category: "Business & Finance",
    requiredSkills: ["Statutory Auditing", "Corporate Taxation", "Indian GAAP & IFRS", "Financial Reporting", "Risk Advisory"],
    salaryRange: "₹7L - ₹25L",
    trendScore: 8.6,
    description: "Manage statutory audits, tax governance, internal financial controls, and strategic financial advisory.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "digital-marketer",
    name: "Growth & Performance Marketer",
    category: "Business & Finance",
    requiredSkills: ["Google Ads", "Meta Ads", "SEO / SEM", "Funnel Optimization", "Google Analytics 4", "Conversion Rate Optimization"],
    salaryRange: "₹4L - ₹16L",
    trendScore: 8.9,
    description: "Scale organic and paid user acquisition funnels, analyze marketing ROI, and run high-velocity growth experiments.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },

  // ==========================================
  // CORE ENGINEERING & HARDWARE DOMAIN
  // ==========================================
  {
    id: "vlsi-engineer",
    name: "VLSI / Semiconductor Design Engineer",
    category: "Core Engineering",
    requiredSkills: ["Verilog / SystemVerilog", "RTL Design", "ASIC / FPGA", "Cadence / Synopsys", "Digital Electronics"],
    salaryRange: "₹7.5L - ₹25L",
    trendScore: 9.7,
    description: "Design and verify next-generation microchips, RTL architecture, and high-performance integrated circuits.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "embedded-engineer",
    name: "Embedded Systems & IoT Engineer",
    category: "Core Engineering",
    requiredSkills: ["Embedded C / C++", "Microcontrollers (ARM / ESP32)", "RTOS", "I2C / SPI / UART", "Hardware Debugging"],
    salaryRange: "₹4.5L - ₹18L",
    trendScore: 9.1,
    description: "Develop low-level firmware and connected device hardware for automotive, industrial IoT, and consumer electronics.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "robotics-engineer",
    name: "Robotics & Automation Engineer",
    category: "Core Engineering",
    requiredSkills: ["ROS (Robot Operating System)", "C++", "Python", "Computer Vision", "Control Systems", "Kinematics"],
    salaryRange: "₹5L - ₹20L",
    trendScore: 9.3,
    description: "Build autonomous mobile robots, robotic arms, sensor fusion pipelines, and automated manufacturing systems.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },

  // ==========================================
  // GOVERNMENT & PUBLIC SECTOR DOMAIN
  // ==========================================
  {
    id: "ias",
    name: "IAS (Indian Administrative Service)",
    category: "Government",
    requiredSkills: ["Public Administration", "Policy Formulation", "Crisis Leadership", "Governance Ethics", "Inter-Departmental Coordination"],
    salaryRange: "₹7L - ₹25L",
    trendScore: 8.5,
    description: "Lead district administration, formulate government public policy, and manage nationwide welfare programs.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "ips",
    name: "IPS (Indian Police Service)",
    category: "Government",
    requiredSkills: ["Law Enforcement", "Strategic Security", "Criminal Investigation", "Crisis Command", "Penal Code Application"],
    salaryRange: "₹7L - ₹25L",
    trendScore: 8.2,
    description: "Command law enforcement, internal security operations, intelligence, and crime prevention across Indian states.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  },
  {
    id: "bank-officer",
    name: "PSU Bank Officer / RBI Grade B",
    category: "Government",
    requiredSkills: ["Banking Regulations", "Monetary Policy", "Credit Appraisal", "Risk Management", "Public Financial Services"],
    salaryRange: "₹6.5L - ₹18L",
    trendScore: 8.4,
    description: "Direct retail, commercial, and central banking operations, financial compliance, and credit risk appraisals.",
    fresherFriendly: true,
    targetLevel: "Fresher / Entry"
  }
];

export const trendingRoles = [
  "software-engineer",
  "ai-engineer",
  "frontend-dev",
  "backend-dev",
  "fullstack-dev",
  "data-analyst",
  "devops-sre",
  "vlsi-engineer"
];
