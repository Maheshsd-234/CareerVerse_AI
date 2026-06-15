import type { CareerPath } from "../types";

export const careerPaths: CareerPath[] = [
  // After 10th
  {
    id: "10th-science",
    name: "Science",
    category: "After 10th",
    subcategory: "Stream Selection",
    careerOptions: ["Engineering", "Medicine", "Research"],
    requiredSkills: ["Mathematics", "Physics", "Chemistry", "English", "Problem Solving"],
    governmentExams: ["JEE Main", "NEET", "KCET (Karnataka)", "COMEDK (Karnataka)"],
    salaryRange: "₹3L - ₹50L+",
    futureScope: "High - Multiple career paths in tech, medicine, and research",
    duration: 2,
    streams: {
      PCMCs: {
        title: "PCMCs (Maths + CS focus)",
        roles: ["Software Developer", "AI Engineer", "Data Analyst", "Cybersecurity Analyst"],
        eligibility: ["Strong in Maths", "Interest in coding/computers", "Good logical thinking"],
        exams: ["KCET (Karnataka)", "COMEDK (Karnataka)", "JEE Main (India)", "BITSAT (optional)"],
        mustKnow: [
          "Start with one language (Python) + basic problem solving",
          "Projects matter: build small apps/websites while studying",
          "Choose 11th/12th subject combo based on strengths",
        ],
      },
      PCM: {
        title: "PCM (Engineering focus)",
        roles: ["Mechanical Engineer", "Civil Engineer", "ECE Engineer", "Embedded Systems Engineer"],
        eligibility: ["Strong Physics + Maths", "Interest in engineering/building things"],
        exams: ["KCET (Karnataka)", "COMEDK (Karnataka)", "JEE Main (India)"],
        mustKnow: [
          "Core engineering needs hands-on learning and internships",
          "Communication + teamwork are critical for placements",
          "Keep a balance: boards + entrance prep + mini projects",
        ],
      },
      PCMB: {
        title: "PCMB (Bio + Medical/Research option)",
        roles: ["Doctor (MBBS)", "Pharmacist", "Biotech Researcher", "Health Data Analyst"],
        eligibility: ["Strong Biology", "Interest in healthcare/science", "Good memory + consistency"],
        exams: ["NEET (India)", "KCET (Karnataka - for some health courses)", "IISER Aptitude (optional)"],
        mustKnow: [
          "NEET is the main path for MBBS; plan long-term from early",
          "Research routes exist if you like science deeply (IISER etc.)",
          "PCMB keeps options open but workload is higher—manage time well",
        ],
      },
    },
  },
  {
    id: "10th-commerce",
    name: "Commerce",
    category: "After 10th",
    subcategory: "Stream Selection",
    careerOptions: ["Accounting", "Finance", "Business"],
    requiredSkills: ["Accounting", "Economics", "Business Studies", "English", "Numerical"],
    governmentExams: ["CA Foundation", "CS Foundation", "CUET (UG)", "Karnataka (college admissions vary)"],
    salaryRange: "₹2L - ₹40L+",
    futureScope: "High - Growing demand in finance and business sectors",
    duration: 2,
    streams: {
      Accountancy: {
        title: "Accountancy (CA/Tax/Audit route)",
        roles: ["Chartered Accountant", "Auditor", "Tax Consultant", "Financial Analyst"],
        eligibility: ["Comfort with numbers", "Attention to detail", "Consistency with study"],
        exams: ["CA Foundation", "CS Foundation", "Bank PO (later)", "CUET (UG)"],
        mustKnow: [
          "Excel + accounting basics give you a strong early advantage",
          "Internships after 1st year build real confidence",
          "Stay consistent—professional courses reward discipline",
        ],
      },
      Business: {
        title: "Business/Management (BBA/MBA route)",
        roles: ["Business Analyst", "Marketing Associate", "Operations Associate", "HR Associate"],
        eligibility: ["Communication", "Leadership mindset", "Interest in markets/business"],
        exams: ["CUET (UG)", "IPMAT (optional)", "CAT (later)"],
        mustKnow: [
          "Build soft skills: presentation + writing + communication",
          "Do mini projects: case studies, business plans, market research",
          "Networking + internships matter as much as marks",
        ],
      },
    },
  },
  {
    id: "10th-arts",
    name: "Arts",
    category: "After 10th",
    subcategory: "Stream Selection",
    careerOptions: ["Civil Services", "Law", "Journalism"],
    requiredSkills: ["English", "History", "Geography", "General Knowledge", "Communication"],
    governmentExams: ["UPSC", "State PSC", "Law Entrance Exams"],
    salaryRange: "₹1.5L - ₹2.5Cr",
    futureScope: "Excellent - Government jobs and law sectors",
    duration: 2
  },

  // After 12th - Science
  {
    id: "12th-science-cse",
    name: "Computer Science Engineering",
    category: "After 12th",
    subcategory: "Science",
    careerOptions: ["Software Developer", "AI Engineer", "Cybersecurity Analyst"],
    requiredSkills: ["Programming", "Data Structures", "Database Design", "Web Development"],
    governmentExams: ["JEE Main", "JEE Advanced", "GATE", "ISRO"],
    salaryRange: "₹6L - ₹40L+",
    futureScope: "Highest - Massive global demand",
    duration: 4,
    streams: {
      PCMCs: {
        title: "PCMCs (Engineering / CS focus)",
        roles: ["Software Developer", "Full Stack Developer", "AI Engineer", "Cybersecurity Analyst"],
        eligibility: [
          "Strong in Maths & Physics",
          "Comfortable with logic/problem-solving",
          "Interest in computers/technology",
        ],
        exams: ["JEE Main", "JEE Advanced", "BITSAT", "VITEEE", "COMEDK"],
        mustKnow: [
          "Pick colleges based on branch + placements, not just brand",
          "Start coding early (Python/JS) and build small projects",
          "Maths matters for CS, AI, and analytics",
        ],
      },
      PCM: {
        title: "PCM (Core engineering)",
        roles: ["Mechanical Engineer", "Civil Engineer", "ECE Engineer", "Embedded Engineer"],
        eligibility: ["Strong in Maths & Physics", "Good fundamentals in Chemistry", "Interest in building/engineering"],
        exams: ["JEE Main", "JEE Advanced", "State CETs"],
        mustKnow: [
          "Core branches are strong if you build practical skills + internships",
          "CAD/Simulation + projects make a big difference",
          "Learn communication + teamwork alongside technical skills",
        ],
      },
    },
  },
  {
    id: "12th-science-aiml",
    name: "AI/ML Engineering",
    category: "After 12th",
    subcategory: "Science",
    careerOptions: ["AI Engineer", "ML Engineer", "Data Scientist"],
    requiredSkills: ["Python", "Machine Learning", "Deep Learning", "Statistics"],
    governmentExams: ["JEE Main", "GATE", "ISRO"],
    salaryRange: "₹8L - ₹50L+",
    futureScope: "Highest - Future-focused technology",
    duration: 4,
    streams: {
      PCMCs: {
        title: "PCMCs (AI/ML route)",
        roles: ["ML Engineer", "Data Scientist", "AI Engineer", "Data Analyst"],
        eligibility: ["Maths + Statistics interest", "Problem-solving mindset", "Comfort with coding"],
        exams: ["JEE Main", "GATE (later)", "ISRO (later)"],
        mustKnow: [
          "Build projects: Kaggle, small ML apps, dashboards",
          "Learn Python + statistics early; don’t skip maths",
          "AI is competitive: portfolio matters a lot",
        ],
      },
      PCMB: {
        title: "PCMB (Bio + AI/Healthtech)",
        roles: ["Bioinformatics Analyst", "Health Data Analyst", "AI in Healthcare Engineer"],
        eligibility: ["Interest in Biology + Data", "Curiosity for healthcare problems"],
        exams: ["NEET (if medical)", "JEE Main (if engineering)", "IISER/Research routes"],
        mustKnow: [
          "You can combine biology + data for healthtech careers",
          "Research paths exist (IISER/IITs) if you like science deeply",
          "Keep options open in 11th/12th; decide based on strengths",
        ],
      },
    },
  },
  {
    id: "12th-science-ece",
    name: "Electronics & Communication Engineering",
    category: "After 12th",
    subcategory: "Science",
    careerOptions: ["Embedded Systems", "Telecom Engineer", "Hardware Designer"],
    requiredSkills: ["Electronics", "Signal Processing", "Digital Systems"],
    governmentExams: ["JEE Main", "JEE Advanced", "GATE"],
    salaryRange: "₹5L - ₹30L",
    futureScope: "High - Critical infrastructure demand",
    duration: 4
  },
  {
    id: "12th-science-mechanical",
    name: "Mechanical Engineering",
    category: "After 12th",
    subcategory: "Science",
    careerOptions: ["Manufacturing Engineer", "Automotive Engineer", "Design Engineer"],
    requiredSkills: ["Thermodynamics", "Mechanics", "CAD", "Manufacturing"],
    governmentExams: ["JEE Main", "JEE Advanced", "GATE"],
    salaryRange: "₹4L - ₹25L",
    futureScope: "Good - Industrial and automotive sectors",
    duration: 4
  },
  {
    id: "12th-science-civil",
    name: "Civil Engineering",
    category: "After 12th",
    subcategory: "Science",
    careerOptions: ["Structural Engineer", "Site Engineer", "Infrastructure Manager"],
    requiredSkills: ["Structural Analysis", "Building Design", "Project Management"],
    governmentExams: ["JEE Main", "GATE", "RRB"],
    salaryRange: "₹3.5L - ₹20L",
    futureScope: "Good - Infrastructure development",
    duration: 4
  },

  // After 12th - Commerce
  {
    id: "12th-commerce-bcom",
    name: "Bachelor of Commerce",
    category: "After 12th",
    subcategory: "Commerce",
    careerOptions: ["Accountant", "Financial Analyst", "Auditor"],
    requiredSkills: ["Accounting", "Finance", "Taxation", "Audit"],
    governmentExams: ["CA Intermediate", "CS Intermediate", "Bank PO"],
    salaryRange: "₹3L - ₹30L",
    futureScope: "High - Financial sector growth",
    duration: 3,
    streams: {
      Accountancy: {
        title: "Accountancy-focused (CA/Audit/Tax)",
        roles: ["Accountant", "Auditor", "Tax Consultant", "Financial Analyst"],
        eligibility: ["Comfort with numbers", "Attention to detail", "Consistency with study"],
        exams: ["CA Foundation", "CA Intermediate", "CS Foundation"],
        mustKnow: [
          "Internships + Excel + basics of GST/Tax are powerful early wins",
          "Communication skills matter for client-facing roles",
          "Start building a portfolio: spreadsheets, reports, basic finance models",
        ],
      },
      Business: {
        title: "Business/Management-focused",
        roles: ["Business Analyst", "Operations Associate", "HR Associate", "Sales/Marketing Associate"],
        eligibility: ["Communication + leadership", "Interest in markets/business"],
        exams: ["CUET", "CAT (later)", "MBA entrances (later)"],
        mustKnow: [
          "Learn Excel + presentation + basic analytics",
          "Work on small projects: business plans, case studies",
          "Networking and internships are key in management tracks",
        ],
      },
    },
  },
  {
    id: "12th-commerce-ca",
    name: "Chartered Accountancy",
    category: "After 12th",
    subcategory: "Commerce",
    careerOptions: ["CA", "Auditor", "Tax Consultant"],
    requiredSkills: ["Accounting", "Taxation", "Auditing", "Compliance"],
    governmentExams: ["CA Foundation", "CA Intermediate", "CA Final"],
    salaryRange: "₹5L - ₹50L+",
    futureScope: "Excellent - High earning potential",
    duration: 5
  },
  {
    id: "12th-commerce-banking",
    name: "Banking & Finance",
    category: "After 12th",
    subcategory: "Commerce",
    careerOptions: ["Banker", "Investment Analyst", "Risk Manager"],
    requiredSkills: ["Banking", "Finance", "Economics", "Numeracy"],
    governmentExams: ["Bank PO", "Bank Clerk", "IBPS"],
    salaryRange: "₹3L - ₹20L",
    futureScope: "High - Banking sector expansion",
    duration: 3
  },
  {
    id: "12th-commerce-bba",
    name: "Bachelor of Business Administration",
    category: "After 12th",
    subcategory: "Commerce",
    careerOptions: ["Business Manager", "HR Manager", "Operations Manager"],
    requiredSkills: ["Business Management", "Leadership", "Economics"],
    governmentExams: ["CAT", "MAT", "CMAT"],
    salaryRange: "₹4L - ₹30L",
    futureScope: "High - Management positions in demand",
    duration: 3
  },

  // After 12th - Arts
  {
    id: "12th-arts-ba",
    name: "Bachelor of Arts",
    category: "After 12th",
    subcategory: "Arts",
    careerOptions: ["Journalist", "Teacher", "Researcher"],
    requiredSkills: ["Communication", "Research", "English"],
    governmentExams: ["UGC NET", "State PSC"],
    salaryRange: "₹2L - ₹15L",
    futureScope: "Moderate - Teaching and media sectors",
    duration: 3,
    streams: {
      Humanities: {
        title: "Humanities (Govt, Teaching, Policy)",
        roles: ["UPSC Aspirant", "Teacher", "Policy Analyst", "Researcher"],
        eligibility: ["Reading habit", "Writing + communication", "Curiosity for society"],
        exams: ["UPSC (later)", "UGC NET", "State PSC"],
        mustKnow: [
          "Build writing: essays, summaries, current affairs notes",
          "Consistency beats intensity for long exams like UPSC",
          "Internships in NGOs/media/research help you explore",
        ],
      },
      Creative: {
        title: "Design/Media (Creative careers)",
        roles: ["Content Creator", "Journalist", "UI/UX Designer", "Digital Marketer"],
        eligibility: ["Creativity + communication", "Comfort with tools + iteration"],
        exams: ["Design entrances (optional)", "Portfolio-based selections"],
        mustKnow: [
          "Portfolio is everything: publish work regularly",
          "Learn one tool deeply (Figma, Premiere, etc.)",
          "Combine creativity with business/analytics for faster growth",
        ],
      },
    },
  },
  {
    id: "12th-arts-upsc",
    name: "UPSC Civil Services",
    category: "After 12th",
    subcategory: "Arts",
    careerOptions: ["IAS", "IPS", "IFS"],
    requiredSkills: ["General Knowledge", "Current Affairs", "Writing"],
    governmentExams: ["UPSC Prelims", "UPSC Mains", "Interview"],
    salaryRange: "₹3.6L - ₹2.5Cr",
    futureScope: "Excellent - Prestigious government positions",
    duration: 3
  },
  {
    id: "12th-arts-law",
    name: "Bachelor of Laws",
    category: "After 12th",
    subcategory: "Arts",
    careerOptions: ["Lawyer", "Judge", "Legal Consultant"],
    requiredSkills: ["Legal Knowledge", "Analysis", "Communication"],
    governmentExams: ["Law Entrance Exam", "Bar Council", "Judicial Services"],
    salaryRange: "₹3L - ₹50L+",
    futureScope: "High - Legal sector demand",
    duration: 3
  },

  // Diploma
  {
    id: "diploma-engineering",
    name: "Diploma in Engineering",
    category: "Diploma",
    subcategory: "Technical",
    careerOptions: ["Technician", "Supervisory Engineer", "Higher Studies"],
    requiredSkills: ["Technical Knowledge", "Hands-on Skills", "Problem Solving"],
    governmentExams: ["GATE", "Polytechnic Entrance"],
    salaryRange: "₹1.5L - ₹10L",
    futureScope: "Good - Skill-based employment",
    duration: 3
  },

  // Degree
  {
    id: "degree-professional",
    name: "Professional Degrees",
    category: "Degree",
    subcategory: "Advanced",
    careerOptions: ["Specialist Professional", "Researcher", "Entrepreneur"],
    requiredSkills: ["Advanced Technical Skills", "Research", "Leadership"],
    governmentExams: ["GATE", "UGC NET", "CAT"],
    salaryRange: "₹5L - ₹100L+",
    futureScope: "Highest - Premium career paths",
    duration: 2
  }
] as CareerPath[];
