// Adaptive Assessment Service for all student stages (10th, 12th, College)
// Initial 25 questions across 3 sections + Dynamic tie-breakers up to 50 questions max

export type StudentStage = "10th" | "12th" | "college";

export interface QuestionOption {
  text: string;
  domain: string;
  points: number;
}

export interface AssessmentQuestion {
  id: number;
  sectionNumber: 1 | 2 | 3 | 4; // Section 1: Aptitude (1-8), Section 2: Domain/Interests (9-17), Section 3: Scenarios (18-25), Section 4: Dynamic Tie-Breakers (26-50)
  sectionTitle: string;
  category: string;
  question: string;
  options: QuestionOption[];
}

/**
 * Robust Fisher-Yates shuffle to randomize question options so roles/domains
 * are never positioned in the same predictable slots.
 */
export function shuffleOptions(options: QuestionOption[]): QuestionOption[] {
  const array = [...options];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Returns a question set with all options dynamically shuffled.
 */
export function getQuestionsWithShuffledOptions(questions: AssessmentQuestion[]): AssessmentQuestion[] {
  return questions.map((q) => ({
    ...q,
    options: shuffleOptions(q.options),
  }));
}

// ----------------------------------------------------
// CLASS 10TH QUESTION BANK (Stream Exploration)
// ----------------------------------------------------
export const CLASS_10_QUESTIONS: AssessmentQuestion[] = [
  // SECTION 1: Aptitude, Logic & Problem Solving (Q1-Q8)
  {
    id: 1,
    sectionNumber: 1,
    sectionTitle: "Section 1: Cognitive Aptitude & Problem-Solving Logic",
    category: "Analytical Logic",
    question: "When faced with an unfamiliar puzzle or math problem, what is your approach?",
    options: [
      { text: "Break it down into numerical formulas and geometric theorems", domain: "Science PCM", points: 10 },
      { text: "Analyze natural laws, biological diagrams, and observation", domain: "Science PCB", points: 10 },
      { text: "Look at economic patterns, trade-offs, and financial logic", domain: "Commerce", points: 10 },
      { text: "Understand historical context, human emotions, and social dynamics", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 2,
    sectionNumber: 1,
    sectionTitle: "Section 1: Cognitive Aptitude & Problem-Solving Logic",
    category: "Scientific Reasoning",
    question: "Which subject topic do you find naturally easiest to understand without rote memorization?",
    options: [
      { text: "Physics principles (Mechanics, Electricity, Optics)", domain: "Science PCM", points: 10 },
      { text: "Life Sciences (Human anatomy, Genetics, Plant physiology)", domain: "Science PCB", points: 10 },
      { text: "Business studies, Money management, and Accounting", domain: "Commerce", points: 10 },
      { text: "Languages, Literature, History, and Creative Arts", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 3,
    sectionNumber: 1,
    sectionTitle: "Section 1: Cognitive Aptitude & Problem-Solving Logic",
    category: "Curiosity Profile",
    question: "If given an entire free weekend to watch educational documentaries, you would pick:",
    options: [
      { text: "Space exploration, robotics, and cutting-edge software", domain: "Science PCM", points: 10 },
      { text: "Medical breakthroughs, brain neuroscience, and wildlife ecosystems", domain: "Science PCB", points: 10 },
      { text: "The rise of global stock markets and billion-dollar startups", domain: "Commerce", points: 10 },
      { text: "World civilizations, philosophy, law, and visual cinema", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 4,
    sectionNumber: 1,
    sectionTitle: "Section 1: Cognitive Aptitude & Problem-Solving Logic",
    category: "Decision Making",
    question: "How do you make an important decision in your life or school projects?",
    options: [
      { text: "Strict mathematical logic and objective calculations", domain: "Science PCM", points: 10 },
      { text: "Careful biological observation and empathy for living beings", domain: "Science PCB", points: 10 },
      { text: "Cost-benefit analysis and strategic return on investment", domain: "Commerce", points: 10 },
      { text: "Ethical reflection, creativity, and cultural value", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 5,
    sectionNumber: 1,
    sectionTitle: "Section 1: Cognitive Aptitude & Problem-Solving Logic",
    category: "Lab & Practical",
    question: "Which school practical or laboratory experience gave you the most satisfaction?",
    options: [
      { text: "Building circuits, using prisms, or programming computer scripts", domain: "Science PCM", points: 10 },
      { text: "Dissecting plant stems, microscope viewing, and chemical titrations", domain: "Science PCB", points: 10 },
      { text: "Managing school exhibition budgets and running commerce stalls", domain: "Commerce", points: 10 },
      { text: "Debating historical reforms, drama plays, or essay competitions", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 6,
    sectionNumber: 1,
    sectionTitle: "Section 1: Cognitive Aptitude & Problem-Solving Logic",
    category: "Memory & Learning Style",
    question: "How does your memory work best when preparing for exams?",
    options: [
      { text: "Deriving proofs and solving practice problem sets", domain: "Science PCM", points: 10 },
      { text: "Visual diagrams, biological cycles, and anatomical terminology", domain: "Science PCB", points: 10 },
      { text: "Balance sheets, formulaic tables, and economic laws", domain: "Commerce", points: 10 },
      { text: "Storytelling, critical essays, and thematic arguments", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 7,
    sectionNumber: 1,
    sectionTitle: "Section 1: Cognitive Aptitude & Problem-Solving Logic",
    category: "Abstract Thinking",
    question: "What kind of intellectual question excites you most to ponder?",
    options: [
      { text: "'How can quantum computers and machines think?'", domain: "Science PCM", points: 10 },
      { text: "'How can we cure terminal diseases and engineer DNA?'", domain: "Science PCB", points: 10 },
      { text: "'How do interest rates and international trade govern nations?'", domain: "Commerce", points: 10 },
      { text: "'What makes a society truly just, ethical, and creatively fulfilled?'", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 8,
    sectionNumber: 1,
    sectionTitle: "Section 1: Cognitive Aptitude & Problem-Solving Logic",
    category: "Mental Endurance",
    question: "Where do you have the highest patience to sit and work for hours without feeling bored?",
    options: [
      { text: "Cracking a tough coding algorithm or complex math problem", domain: "Science PCM", points: 10 },
      { text: "Reading in-depth medical or biological case studies", domain: "Science PCB", points: 10 },
      { text: "Analyzing spreadsheets, business charts, and accounting ledgers", domain: "Commerce", points: 10 },
      { text: "Writing an original story, painting, or researching social history", domain: "Arts & Humanities", points: 10 },
    ],
  },

  // SECTION 2: Domain Affinity & Preferences (Q9-Q17)
  {
    id: 9,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Work Style Preferences",
    category: "Career Vision",
    question: "Looking ahead, which professional role sounds most appealing to you?",
    options: [
      { text: "Software Architect, AI Scientist, or Robotics Engineer", domain: "Science PCM", points: 10 },
      { text: "Surgeon, Doctor, Geneticist, or Biotech Researcher", domain: "Science PCB", points: 10 },
      { text: "Chartered Accountant, Investment Banker, or Startup Founder", domain: "Commerce", points: 10 },
      { text: "Supreme Court Lawyer, Design Director, Journalist, or Civil Servant (IAS)", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 10,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Work Style Preferences",
    category: "Technology Interaction",
    question: "How do you like to interact with computers and digital tools?",
    options: [
      { text: "I want to understand the backend code, algorithms, and build software", domain: "Science PCM", points: 10 },
      { text: "I want to use technology to analyze bio-medical scans and genetics", domain: "Science PCB", points: 10 },
      { text: "I want to use software to optimize marketing, finance, and ecommerce sales", domain: "Commerce", points: 10 },
      { text: "I want to use digital media to create visual designs, videos, and articles", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 11,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Work Style Preferences",
    category: "Team Role",
    question: "In a group project with 4 friends, which role do you naturally volunteer for?",
    options: [
      { text: "The technical builder who sets up the apparatus or digital system", domain: "Science PCM", points: 10 },
      { text: "The researcher who investigates factual scientific data and citations", domain: "Science PCB", points: 10 },
      { text: "The treasurer and manager who keeps budget and pitch on track", domain: "Commerce", points: 10 },
      { text: "The spokesperson who designs the slides and writes the compelling script", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 12,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Work Style Preferences",
    category: "Calculus & Quantitative Comfort",
    question: "How do you feel about high-level math (Calculus, Trigonometry, Vectors)?",
    options: [
      { text: "I love it, it feels like solving elegant logical riddles", domain: "Science PCM", points: 10 },
      { text: "I can manage basic statistics, but prefer conceptual biology", domain: "Science PCB", points: 10 },
      { text: "I prefer practical financial math (Percentages, Profit/Loss, Statistics)", domain: "Commerce", points: 10 },
      { text: "I prefer descriptive, conceptual, and qualitative analysis over formulas", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 13,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Work Style Preferences",
    category: "Social Contribution",
    question: "What is your primary personal definition of a meaningful career?",
    options: [
      { text: "Inventing new technologies and engineering faster systems", domain: "Science PCM", points: 10 },
      { text: "Saving human lives, health healing, and bio-environmental protection", domain: "Science PCB", points: 10 },
      { text: "Building economic prosperity, employment, and wealth generation", domain: "Commerce", points: 10 },
      { text: "Defending justice, creating inspiring culture, and shaping public thought", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 14,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Work Style Preferences",
    category: "Reading Preferences",
    question: "When picking up an article or magazine, you instinctively gravitate towards:",
    options: [
      { text: "Tech Crunch, Wired, Scientific American", domain: "Science PCM", points: 10 },
      { text: "National Geographic, Health & Medical Journals", domain: "Science PCB", points: 10 },
      { text: "Economic Times, Forbes, Harvard Business Review", domain: "Commerce", points: 10 },
      { text: "The Atlantic, Architectural Digest, History & Politics Review", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 15,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Work Style Preferences",
    category: "Handling Ambiguity",
    question: "Do you prefer problems with one exact correct answer or open-ended interpretations?",
    options: [
      { text: "Exact single correct numerical proof (Math/Code)", domain: "Science PCM", points: 10 },
      { text: "Evidence-backed scientific diagnosis with clear facts", domain: "Science PCB", points: 10 },
      { text: "Data-driven commercial trade-offs with risk assessment", domain: "Commerce", points: 10 },
      { text: "Nuanced, open-ended discussions with multiple perspectives", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 16,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Work Style Preferences",
    category: "Competitive Exams",
    question: "If you had to prepare for a major national competitive exam, which one motivates you most?",
    options: [
      { text: "JEE Main / JEE Advanced (Engineering & Technology)", domain: "Science PCM", points: 10 },
      { text: "NEET UG (Medical, Dental & Biomedical Sciences)", domain: "Science PCB", points: 10 },
      { text: "CA Foundation / IPMAT / CUET Commerce (Finance & Management)", domain: "Commerce", points: 10 },
      { text: "CLAT (Law) / NID (Design) / UPSC Civil Services", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 17,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Work Style Preferences",
    category: "Global Impact",
    question: "Which global crisis would you feel most empowered to help solve?",
    options: [
      { text: "Renewable energy grids, clean transportation, and cyber defense", domain: "Science PCM", points: 10 },
      { text: "Global pandemic prevention, cancer cures, and food biotechnology", domain: "Science PCB", points: 10 },
      { text: "Financial inflation, supply-chain logistics, and corporate governance", domain: "Commerce", points: 10 },
      { text: "Human rights justice, mental health access, and educational equality", domain: "Arts & Humanities", points: 10 },
    ],
  },

  // SECTION 3: Real-World Scenarios & Applications (Q18-Q25)
  {
    id: 18,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & Practical Execution",
    category: "Crisis Management",
    question: "A company’s central service crashes. What type of specialist do you instinctively look for?",
    options: [
      { text: "The Systems Engineer who can debug code architecture and server networks", domain: "Science PCM", points: 10 },
      { text: "The Ergonomics & Safety specialist who ensures no biological hazard occurred", domain: "Science PCB", points: 10 },
      { text: "The Risk Analyst who calculates monetary liabilities and client contracts", domain: "Commerce", points: 10 },
      { text: "The PR & Communications strategist who manages public trust and ethics", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 19,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & Practical Execution",
    category: "Product Innovation",
    question: "When developing a new electric scooter, what phase would you want to lead?",
    options: [
      { text: "Battery software algorithms, motor mechanics, and autonomous sensors", domain: "Science PCM", points: 10 },
      { text: "Ergonomic human posture safety, environmental eco-materials, and bio-testing", domain: "Science PCB", points: 10 },
      { text: "Cost estimation, vendor negotiations, pricing strategy, and showroom sales", domain: "Commerce", points: 10 },
      { text: "Aesthetic industrial design, advertising campaign, and brand narrative", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 20,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & Practical Execution",
    category: "Intellectual Challenge",
    question: "What type of difficulty feels most rewarding when overcome?",
    options: [
      { text: "Finding a subtle flaw in a complex technical calculation", domain: "Science PCM", points: 10 },
      { text: "Identifying an obscure medical symptom or botanical specimen", domain: "Science PCB", points: 10 },
      { text: "Balancing a difficult financial ledger to the exact rupee", domain: "Commerce", points: 10 },
      { text: "Formulating a powerful, persuasive legal or philosophical argument", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 21,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & Practical Execution",
    category: "Tool Affinity",
    question: "Which workstation setup would you be happiest working at every day?",
    options: [
      { text: "Dual monitors showing code compilers, hardware schematics, and simulation terminals", domain: "Science PCM", points: 10 },
      { text: "A sterile lab bench with diagnostic screens, microscopes, and chemical reagents", domain: "Science PCB", points: 10 },
      { text: "A modern corporate office with Bloomberg terminals, Excel models, and CRM metrics", domain: "Commerce", points: 10 },
      { text: "A creative studio with drafting tablets, legal brief library, and design moodboards", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 22,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & Practical Execution",
    category: "Entrepreneurship Bias",
    question: "If you started your own company right now, what would it sell?",
    options: [
      { text: "AI software platform, robotics automation, or clean energy technology", domain: "Science PCM", points: 10 },
      { text: "Diagnostic clinic, organic biotechnology, or pharmaceutical healthcare", domain: "Science PCB", points: 10 },
      { text: "Fintech payment app, e-commerce marketplace, or investment advisory", domain: "Commerce", points: 10 },
      { text: "Design agency, media production studio, or legal consultancy", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 23,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & Practical Execution",
    category: "Learning Under Pressure",
    question: "When you have 24 hours before a final exam, what material can you master fastest?",
    options: [
      { text: "Formulas, numerical problem patterns, and logic shortcuts", domain: "Science PCM", points: 10 },
      { text: "Detailed biology charts, organ systems, and chemical properties", domain: "Science PCB", points: 10 },
      { text: "Account balance formats, commercial laws, and economic concepts", domain: "Commerce", points: 10 },
      { text: "Essay arguments, thematic summaries, and historical timelines", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 24,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & Practical Execution",
    category: "Success Criteria",
    question: "Which compliment from a mentor would mean the most to you?",
    options: [
      { text: "'You have exceptional technical problem-solving and mathematical ability.'", domain: "Science PCM", points: 10 },
      { text: "'Your scientific observational precision and empathy are unmatched.'", domain: "Science PCB", points: 10 },
      { text: "'You possess remarkable commercial instinct and strategic business sense.'", domain: "Commerce", points: 10 },
      { text: "'Your creative eloquence, original expression, and depth are inspiring.'", domain: "Arts & Humanities", points: 10 },
    ],
  },
  {
    id: 25,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & Practical Execution",
    category: "Final Check",
    question: "If you had to pick your 11th & 12th subjects right this moment, your strongest inclination is:",
    options: [
      { text: "Physics, Chemistry, and Mathematics (PCM) — with Computer Science", domain: "Science PCM", points: 10 },
      { text: "Physics, Chemistry, and Biology (PCB) — with Biotechnology/Psychology", domain: "Science PCB", points: 10 },
      { text: "Commerce with Mathematics / Accountancy & Economics", domain: "Commerce", points: 10 },
      { text: "Humanities / Arts (History, Political Science, Psychology, Sociology, Design)", domain: "Arts & Humanities", points: 10 },
    ],
  },
];

// ----------------------------------------------------
// CLASS 12TH / INTERMEDIATE QUESTION BANK (Degree & Branch Exploration)
// ----------------------------------------------------
export const CLASS_12_QUESTIONS: AssessmentQuestion[] = [
  // SECTION 1: Stream Specialization & Broad Career Orientation (Q1-Q8)
  {
    id: 1,
    sectionNumber: 1,
    sectionTitle: "Section 1: Academic Stream & Career Direction",
    category: "12th Stream & Subject Combination",
    question: "What stream or major subject combination did you study in Class 11th & 12th?",
    options: [
      { text: "PCM / PCMC / PCMCs (Physics, Chemistry, Mathematics & Computer Science)", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "PCB / PCMB (Physics, Chemistry, Biology with Math or Biotechnology)", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
      { text: "Commerce with Math / Accountancy, Business Studies & Economics", domain: "Commerce, CA & Corporate Finance", points: 10 },
      { text: "Humanities / Arts, Vocational Stream, or Polytechnic Technical Diploma", domain: "Law, Civil Services & Public Policy", points: 10 },
      { text: "Pure Science PCM with interest in Hardware, Robotics & Aerospace", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
    ],
  },
  {
    id: 2,
    sectionNumber: 1,
    sectionTitle: "Section 1: Academic Stream & Career Direction",
    category: "Broad Higher Education Ambition",
    question: "Which broad higher education path feels most aligned with your personal ambitions?",
    options: [
      { text: "4-Year B.Tech / B.E in high-demand Computer Science, AI, or Core Engineering", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "Medical & Life Sciences: MBBS, BDS, B.Pharm, Biotech, or Allied Healthcare", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
      { text: "Commerce & Corporate: B.Com, BBA, Chartered Accountancy (CA), or Economics", domain: "Commerce, CA & Corporate Finance", points: 10 },
      { text: "Law, Public Policy, Civil Services (UPSC), Defense, or Creative Design (B.Des)", domain: "Law, Civil Services & Public Policy", points: 10 },
    ],
  },
  {
    id: 3,
    sectionNumber: 1,
    sectionTitle: "Section 1: Academic Stream & Career Direction",
    category: "Engineering Branch Affinity",
    question: "If you join an Engineering (B.Tech / B.E) college, which domain excites you most?",
    options: [
      { text: "Software Engineering, Web/App Development, Cloud, and Machine Learning (CSE/IT)", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "Microprocessors, Chip Design (VLSI), Telecom, IoT, and Robotics (ECE/EEE)", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "Automobiles, Electric Vehicles, Aerospace, Drones, and CAD Machines (Mech/Aero)", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "Smart Cities, Green Structural Design, Bridges, and Modern Architecture (Civil/B.Arch)", domain: "Civil, Environmental & Architecture", points: 10 },
    ],
  },
  {
    id: 4,
    sectionNumber: 1,
    sectionTitle: "Section 1: Academic Stream & Career Direction",
    category: "Healthcare & Life Sciences Direction",
    question: "If exploring the Medical or Biology landscape, which specialization calls to you?",
    options: [
      { text: "Clinical Patient Care, Surgery, Diagnostics, and Hospital Rounds (MBBS/BDS)", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
      { text: "Pharmaceutical Drug Formulation, Vaccine Research, and Genetics (B.Pharm/Biotech)", domain: "Biotechnology, Pharmacy & Bio-Sciences", points: 10 },
      { text: "Healthcare AI, Bio-medical Device Engineering, and Hospital Systems", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "Hospital Administration, Healthcare Business, and Public Health Policy", domain: "Management, Business & Entrepreneurship", points: 10 },
    ],
  },
  {
    id: 5,
    sectionNumber: 1,
    sectionTitle: "Section 1: Academic Stream & Career Direction",
    category: "Commerce, Finance & Management",
    question: "If drawn towards Commerce or Business, which career trajectory interests you?",
    options: [
      { text: "Auditing, Taxation, Corporate Finance, and clearing Chartered Accountancy (CA)", domain: "Commerce, CA & Corporate Finance", points: 10 },
      { text: "Product Management, Startup Entrepreneurship, Venture Strategy, and BBA/BMS", domain: "Management, Business & Entrepreneurship", points: 10 },
      { text: "Algorithmic Trading, Fintech Software, and Quantitative Financial Analysis", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "Corporate Mergers, Commercial Contracts, and Business Legal Compliance (Law)", domain: "Law, Civil Services & Public Policy", points: 10 },
    ],
  },
  {
    id: 6,
    sectionNumber: 1,
    sectionTitle: "Section 1: Academic Stream & Career Direction",
    category: "Design, Media & Public Governance",
    question: "If exploring creative, legal, or civil service tracks, what is your strongest passion?",
    options: [
      { text: "User Experience (UI/UX) Design, Digital Products, Animation, and Branding (B.Des)", domain: "Design, UI/UX & Creative Media", points: 10 },
      { text: "Constitutional Law, Cyber Law, Criminal Litigation, and Corporate Judiciary (BA LLB)", domain: "Law, Civil Services & Public Policy", points: 10 },
      { text: "Civil Services (UPSC IAS/IPS), Defense Services (NDA), and Public Administration", domain: "Law, Civil Services & Public Policy", points: 10 },
      { text: "Designing physical architectural blueprints, sustainable buildings, and town planning", domain: "Civil, Environmental & Architecture", points: 10 },
    ],
  },
  {
    id: 7,
    sectionNumber: 1,
    sectionTitle: "Section 1: Academic Stream & Career Direction",
    category: "Target Entrance Examination",
    question: "Which major national or state entrance exam are you preparing for or most inclined towards?",
    options: [
      { text: "JEE Main / JEE Advanced / BITSAT / State Engineering CETs", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "NEET UG / AIIMS / State Medical & Pharmacy Entrance Exams", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
      { text: "CUET Commerce / CA Foundation / IPMAT (IIM 5-Year Integrated Management)", domain: "Commerce, CA & Corporate Finance", points: 10 },
      { text: "CLAT / AILET (Law), UCEED / NID (Design), NATA (Arch), or NDA (Armed Forces)", domain: "Law, Civil Services & Public Policy", points: 10 },
    ],
  },
  {
    id: 8,
    sectionNumber: 1,
    sectionTitle: "Section 1: Academic Stream & Career Direction",
    category: "College Milestone Vision",
    question: "What is your primary milestone during your 3 to 4 years in undergraduate college?",
    options: [
      { text: "Securing a top Software / Tech campus placement or contributing to open-source", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "Securing a top rank in NEET-PG / Hospital Residency / Medical Research Fellowship", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
      { text: "Qualifying CA Intermediate, clearing CFA level-1, or securing top Finance placement", domain: "Commerce, CA & Corporate Finance", points: 10 },
      { text: "Publishing physical engineering designs, drone prototypes, or Formula Student racing", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
    ],
  },

  // SECTION 2: Domain Affinity & Branch Specialization Deep Dive (Q9-Q17)
  {
    id: 9,
    sectionNumber: 2,
    sectionTitle: "Section 2: Branch Affinity & Practical Problem Solving",
    category: "Coding vs Hands-on Building",
    question: "How do you prefer solving technical problems?",
    options: [
      { text: "Writing code scripts, building software applications, and debugging logic", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "Connecting electronic circuits, sensors, Arduino/Raspberry Pi, and robotics boards", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "Assembling mechanical gears, 3D printing components, and working with tools", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "Performing biological assays, clinical investigations, and chemical experiments", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
    ],
  },
  {
    id: 10,
    sectionNumber: 2,
    sectionTitle: "Section 2: Branch Affinity & Practical Problem Solving",
    category: "Mathematics Comfort Level",
    question: "What kind of mathematical problem solving do you find most natural and rewarding?",
    options: [
      { text: "Discrete math, logic algorithms, binary calculations, and graph theory", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "Calculus, vectors, trigonometry, and complex electrical waveform equations", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "Applied mechanics, thermodynamic formulas, and structural force calculations", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "Commercial arithmetic, balance sheet ratios, tax percentages, and statistics", domain: "Commerce, CA & Corporate Finance", points: 10 },
    ],
  },
  {
    id: 11,
    sectionNumber: 2,
    sectionTitle: "Section 2: Branch Affinity & Practical Problem Solving",
    category: "Daily Workstation Setup",
    question: "Which everyday workstation setup sounds most appealing for your college and career?",
    options: [
      { text: "Dual computer screens running modern code editors (VS Code), terminal, and cloud apps", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "An electronics bench with breadboards, multimeters, oscilloscopes, and soldering kits", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "A mechanical workshop with 3D CAD modeling software, machine tools, and engine bays", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "A sterile hospital clinic or diagnostic laboratory with medical instruments", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
    ],
  },
  {
    id: 12,
    sectionNumber: 2,
    sectionTitle: "Section 2: Branch Affinity & Practical Problem Solving",
    category: "Emerging Technology Curiosity",
    question: "Which breakthrough modern technology fascinates you the most?",
    options: [
      { text: "Artificial Intelligence, Large Language Models, and Autonomous Cyber Defense", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "Semiconductor chip fabrication (VLSI), 5G/6G communication, and bionic prosthetics", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "Electric Vehicles (EV), reusable space rockets (ISRO/SpaceX), and supersonic aircraft", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "CRISPR gene editing, mRNA cancer vaccines, and personalized biomedical therapy", domain: "Biotechnology, Pharmacy & Bio-Sciences", points: 10 },
    ],
  },
  {
    id: 13,
    sectionNumber: 2,
    sectionTitle: "Section 2: Branch Affinity & Practical Problem Solving",
    category: "College Project Dream",
    question: "If given full funding to build a dream project in your 1st year of college, you build:",
    options: [
      { text: "An AI-powered mobile app with thousands of active student users", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "An autonomous line-following or obstacle-avoiding surveillance drone/robot", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "An ultra-efficient electric bike prototype or aerodynamic Formula racing kart", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "A low-cost water purification system, healthcare diagnostic kit, or organic bio-filter", domain: "Biotechnology, Pharmacy & Bio-Sciences", points: 10 },
    ],
  },
  {
    id: 14,
    sectionNumber: 2,
    sectionTitle: "Section 2: Branch Affinity & Practical Problem Solving",
    category: "Core Academic Strength",
    question: "Which 12th standard subject or chapter did you intuitively enjoy the most?",
    options: [
      { text: "Computer Science / Informatics Practices / Boolean Logic / Python Programming", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "Physics: Current Electricity, Electromagnetic Induction & Semiconductor Electronics", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "Physics: Laws of Motion, Rotational Dynamics, Thermodynamics & Fluid Mechanics", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "Biology: Human Physiology, Genetics, Molecular Basis of Inheritance & Biotechnology", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
    ],
  },
  {
    id: 15,
    sectionNumber: 2,
    sectionTitle: "Section 2: Branch Affinity & Practical Problem Solving",
    category: "Career Impact & Purpose",
    question: "How do you want your future work to create value in the real world?",
    options: [
      { text: "Writing scalable digital software and intelligent algorithms that automate human tasks", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "Building reliable hardware electronics, smart grids, and robotic automation", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "Manufacturing sustainable vehicles, aerospace propulsion, and physical machinery", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "Directly curing diseases, treating patients, and relieving human physical pain", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
    ],
  },
  {
    id: 16,
    sectionNumber: 2,
    sectionTitle: "Section 2: Branch Affinity & Practical Problem Solving",
    category: "Software Tool Curiosity",
    question: "Which software tool or professional platform would you be most eager to learn in college?",
    options: [
      { text: "Python, C++, Java, React, GitHub, and Cloud Deployment platforms", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "MATLAB, Simulink, Arduino IDE, Keil MicroVision, and KiCad PCB Designer", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "AutoCAD, SolidWorks, CATIA, and ANSYS Engineering Simulation", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "Tally Prime, Advanced Excel, Bloomberg Financial Terminals, or Python for Finance", domain: "Commerce, CA & Corporate Finance", points: 10 },
    ],
  },
  {
    id: 17,
    sectionNumber: 2,
    sectionTitle: "Section 2: Branch Affinity & Practical Problem Solving",
    category: "Role Model / Inspiration",
    question: "Which type of public figure or career achievement inspires you most?",
    options: [
      { text: "Tech visionaries like Sundar Pichai or Linus Torvalds who built global software empires", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "Electronics and chip architects who design microprocessors powering the modern world", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "Aerospace and automotive pioneers who build rockets, electric cars, and machines", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "Renowned surgeons and medical researchers who eradicate deadly health epidemics", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
    ],
  },

  // SECTION 3: Real-World Scenarios & Degree Trade-offs (Q18-Q25)
  {
    id: 18,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & College Trade-Offs",
    category: "College vs Branch Dilemma",
    question: "If counseling offers you two choices, which one do you pick?",
    options: [
      { text: "Take Computer Science / AI / IT in a reputable college because software is your passion", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "Take Electronics & Communication (ECE) to get the best blend of hardware, chips, and coding", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "Take Mechanical or Aerospace Engineering in a top-tier institution (IIT/NIT/BITS)", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "Choose a focused Medical, Commerce, or Law seat because that matches your long-term goal", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
    ],
  },
  {
    id: 19,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & College Trade-Offs",
    category: "Post-College 5-Year Goal",
    question: "Where do you envision yourself 5 years from today?",
    options: [
      { text: "Working as a Software Development Engineer (SDE) at a top product tech company", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "Working as a Chip Designer, Embedded Systems Architect, or Robotics Specialist", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "Working as a Design/R&D Engineer in Automotive, Defense (DRDO/ISRO), or Aerospace", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "Practicing as a Doctor / Resident Surgeon, or working as a Clinical Healthcare Specialist", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
    ],
  },
  {
    id: 20,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & College Trade-Offs",
    category: "Handling Academic Pressure",
    question: "When facing a heavy syllabus with limited time, how do you perform best?",
    options: [
      { text: "Practicing coding algorithms, logic questions, and solving test cases", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "Deriving mathematical circuits, physics formulas, and schematic diagrams", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "Visualizing 3D mechanical motions, force vectors, and practical machine laws", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "Deep conceptual memorization of biological pathways, anatomical terms, and medical facts", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
    ],
  },
  {
    id: 21,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & College Trade-Offs",
    category: "Campus Extracurricular Passion",
    question: "Which college student club would you join on day 1?",
    options: [
      { text: "Google Developer Student Club (GDSC) or Competitive Programming / Web Dev Club", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "Robotics Society, Drone Club, or Electronics Maker Club", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "Formula Student Racing Team, Aero-Design Club, or 3D Printing Workshop", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "Red Cross Medical Youth Volunteer Club, Bio-Science Society, or Healthcare Outreach", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
    ],
  },
  {
    id: 22,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & College Trade-Offs",
    category: "Higher Studies vs Immediate Job",
    question: "What is your mindset towards higher studies after your bachelor's degree?",
    options: [
      { text: "Aiming for high campus placement in software tech right after graduation", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "Pursuing M.Tech or MS in Microelectronics, AI, or Robotics in India/Abroad", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "Appearing for GATE / PSU exams or pursuing MS in Aerospace / Automotive engineering", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "Clearing NEET-PG / INI-CET for specialized Doctor of Medicine (MD/MS) residency", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
    ],
  },
  {
    id: 23,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & College Trade-Offs",
    category: "Startup vs Corporate",
    question: "If you were to co-found a technology venture with college friends, what would it build?",
    options: [
      { text: "An AI SaaS application, cloud service, or consumer mobile platform", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "A smart hardware device, IoT sensor system, or home automation robotics company", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "An Electric Vehicle (EV) component, drone delivery system, or clean energy engine", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "A digital health diagnostics startup, telemedicine portal, or bio-pharma brand", domain: "Biotechnology, Pharmacy & Bio-Sciences", points: 10 },
    ],
  },
  {
    id: 24,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & College Trade-Offs",
    category: "Personal Working Style",
    question: "What type of technical problem energizes you rather than draining you?",
    options: [
      { text: "A complex software bug that takes 4 hours of code trace analysis to isolate and fix", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "A short-circuit on a circuit board where you trace signals pin-by-pin using a probe", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "A physical mechanical gear or bracket that fails under stress until redesigned in CAD", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "Diagnosing an unusual medical symptom or biological puzzle through scientific data", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
    ],
  },
  {
    id: 25,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & College Trade-Offs",
    category: "Final Destination Confirmation",
    question: "When you step into college for admissions, your clear top priority choice is:",
    options: [
      { text: "B.Tech Computer Science, Artificial Intelligence, or Information Technology", domain: "Computer Science, AI & IT Engineering", points: 10 },
      { text: "B.Tech Electronics & Communication (ECE), Electrical (EEE), or Robotics", domain: "Electronics, Electrical & Robotics Engineering", points: 10 },
      { text: "B.Tech Mechanical, Aerospace, Automobile, or Core Engineering disciplines", domain: "Mechanical, Aerospace & Core Engineering", points: 10 },
      { text: "MBBS, BDS, B.Pharm, Biotechnology, or Professional Medical & Healthcare Degrees", domain: "Medicine & Clinical Healthcare (MBBS/BDS)", points: 10 },
    ],
  },
];

// ----------------------------------------------------
// COLLEGE / GRADUATE QUESTION BANK (All Modern Opportunities)
// ----------------------------------------------------
export const COLLEGE_QUESTIONS: AssessmentQuestion[] = [
  // SECTION 1: Problem Solving & Computational Logic (Q1-Q8)
  {
    id: 1,
    sectionNumber: 1,
    sectionTitle: "Section 1: Cognitive Aptitude & Problem-Solving Logic",
    category: "Algorithmic Thinking",
    question: "When designing a large-scale system, what is your primary architectural concern?",
    options: [
      { text: "Scalable microservices, low API latency, and automated CI/CD pipelines", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Zero-Trust security, cryptographically signed payloads, and threat detection", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Real-time model inference, vector embedding indices, and low hallucination rates", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Kinematic motion accuracy, real-time ROS2 communication, and actuator responsiveness", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Finite element stress limits, thermal dissipation, and CAD tolerances", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Target customer adoption, unit economics, and feature development roadmap", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 2,
    sectionNumber: 1,
    sectionTitle: "Section 1: Cognitive Aptitude & Problem-Solving Logic",
    category: "Mathematical Depth",
    question: "Which mathematical branch do you enjoy applying in practice?",
    options: [
      { text: "Graph theory, discrete mathematics, and distributed hash tables", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Elliptic curve cryptography, modular arithmetic, and probability theory", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Multivariable calculus, linear algebra, and stochastic gradient descent", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Matrix transformations, forward/inverse kinematics, and PID control math", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Differential equations, fluid mechanics, and structural statics", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Business econometrics, statistical risk modeling, and A/B test significance", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 3,
    sectionNumber: 1,
    sectionTitle: "Section 1: Cognitive Aptitude & Problem-Solving Logic",
    category: "Debugging Behavior",
    question: "When a system fails in production, what do you inspect first?",
    options: [
      { text: "Distributed server traces, memory heap dumps, and HTTP 5xx error rates", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Network packet dumps, unauthorized privilege changes, and authentication logs", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Training data drift, precision/recall drop-offs, and unexpected token outputs", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "LiDAR/camera sensor feedback, motor telemetry, and CAN-bus latency spikes", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Oscilloscope voltage spikes, structural strain gauge readings, and mechanical wear", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "SLA breach penalties, customer churn impact, and executive incident response", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 4,
    sectionNumber: 1,
    sectionTitle: "Section 1: Cognitive Aptitude & Problem-Solving Logic",
    category: "Optimization Style",
    question: "How do you define an 'optimal' project outcome?",
    options: [
      { text: "Sub-50ms latency, high availability, and 99.99% uptime in multi-region cloud", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Zero vulnerability exploits, impenetrable endpoints, and automated patch compliance", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "High accuracy, minimal model latency, and bias-free predictive intelligence", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Smooth autonomous trajectory execution and flawless physical obstacle avoidance", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Highest structural factor of safety, low bill-of-materials, and robust build", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "High user retention, healthy profit margins, and swift market validation", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 5,
    sectionNumber: 1,
    sectionTitle: "Section 1: Cognitive Aptitude & Problem-Solving Logic",
    category: "Code & Scripting Comfort",
    question: "How do you rate your relationship with coding?",
    options: [
      { text: "I write clean, modular full-stack and backend code daily with ease", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "I script Python and Bash to automate penetration tests and exploit payloads", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "I write Python using PyTorch, Pandas, and LangChain to build neural pipelines", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "I write C++ for microcontrollers and Python for ROS2 robot nodes", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "I write MATLAB scripts and configure parametric formulas inside CAD tools", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "I write SQL queries and Python data scripts, but prioritize strategic leadership", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 6,
    sectionNumber: 1,
    sectionTitle: "Section 1: Cognitive Aptitude & Problem-Solving Logic",
    category: "Abstraction Level",
    question: "Which layer of the technology stack do you feel most drawn to?",
    options: [
      { text: "Distributed Cloud layer: Containerized microservices, APIs, and web/mobile apps", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Defensive Security layer: Firewalls, SOC telemetry, and endpoint security", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Cognitive Intelligence layer: Generative LLMs, transformer models, and embeddings", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Mechatronic layer: Motors, computer vision cameras, LiDAR, and robotic arms", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Physical & Structural layer: Machine parts, civil BIM layouts, and power circuits", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Business & Strategy layer: Market positioning, user value proposition, and tech ROI", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 7,
    sectionNumber: 1,
    sectionTitle: "Section 1: Cognitive Aptitude & Problem-Solving Logic",
    category: "Project Approach",
    question: "When starting a capstone or major team project, what is your initial reflex?",
    options: [
      { text: "Set up the GitHub repo, Docker containers, and scaffold the full-stack architecture", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Threat-model the architecture, inspect open ports, and review permission vectors", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Assemble the dataset, train baseline models, and inspect predictive accuracy", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Design the kinematic mechanism, wire the sensors, and test the motor controller", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Draft 3D CAD models, run stress FEA simulations, and verify material specs", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Survey prospective users, write product specifications (PRD), and timeline goals", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 8,
    sectionNumber: 1,
    sectionTitle: "Section 1: Cognitive Aptitude & Problem-Solving Logic",
    category: "Analytical Rigor",
    question: "Which technical challenge excites you most?",
    options: [
      { text: "Handling 1,000,000 requests per minute with zero downtime and sub-second response", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Discovering a zero-day exploit and fortifying systems against nation-state attacks", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Fine-tuning an LLM to reason through multi-step medical or technical queries", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Building a drone or rover that maps and navigates GPS-denied environments", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Designing a lightweight drone chassis or bridge structure that withstands high winds", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Taking a cutting-edge deep tech invention and scaling it into a profitable venture", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },

  // SECTION 2: Domain Affinity & Modern Industry Tools (Q9-Q17)
  {
    id: 9,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Modern Industry Tools",
    category: "Developer Toolset",
    question: "Which set of developer tools do you use or want to master most?",
    options: [
      { text: "React, Next.js, Node.js, Docker, Kubernetes, PostgreSQL", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Wireshark, Kali Linux, Burp Suite, Metasploit, Splunk SIEM", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "PyTorch, Hugging Face, LangChain, OpenAI API, Python Pandas", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "ROS2, Gazebo, OpenCV, Arduino, STM32, LiDAR/IMU drivers", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "SolidWorks, AutoCAD, ANSYS FEA, MATLAB Simulink, Revit", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Jira, Figma, Mixpanel, Notion, Product Analytics, Excel", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 10,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Modern Industry Tools",
    category: "Target Role",
    question: "Which job title on LinkedIn or Naukri would you be most proud to hold?",
    options: [
      { text: "Principal Software Engineer / Cloud Solutions Architect", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Lead Cybersecurity Specialist / Penetration Tester", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "AI Research Scientist / Generative AI Engineer", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Robotics Engineer / Autonomous Vehicles Specialist", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "CAD/CAE Systems Designer / BIM Structural Engineer", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Technical Product Manager (PM) / Strategy Consultant", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 11,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Modern Industry Tools",
    category: "Work Environment",
    question: "What is your ideal day-to-day workspace environment?",
    options: [
      { text: "Fast shipping cadence, asynchronous code reviews, and cloud deployments", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Security operations center (SOC), ethical bug bounties, and defense war games", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "AI research benchmarks, model tuning pipelines, and data experimentation", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Robotics lab, sensor testing grounds, and physical hardware benches", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Design studio, CAD workstations, structural site visits, and manufacturing floors", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Executive strategy syncs, cross-functional sprints, and customer interviews", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 12,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Modern Industry Tools",
    category: "Tech Evolution",
    question: "What recent technology paradigm excites you most?",
    options: [
      { text: "Serverless architectures, WebAssembly, and edge cloud runtimes", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Zero Trust networks, quantum-safe encryption, and AI-powered threat detection", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Agentic AI workflows, multimodal LLMs, and foundation reasoning models", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Humanoid robotics, autonomous drones, and vision-guided manipulation", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Digital twin simulations, generative CAD design, and EV powertrain advances", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Product-led tech scaleups, venture financing, and AI business transformations", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 13,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Modern Industry Tools",
    category: "Portfolio Showcase",
    question: "What would be the standout showpiece in your engineering portfolio?",
    options: [
      { text: "A live deployed full-stack SaaS app with real paying users and high uptime", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "A CVE vulnerability disclosure, bug bounty award, or custom firewall tool", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "A custom fine-tuned transformer model or automated computer vision system", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "A working self-balancing robot, rover with SLAM navigation, or smart IoT device", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "An intricate 3D CAD mechanical assembly with dynamic simulation stress analysis", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "A launched product teardown, business viability study, and growth roadmap", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 14,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Modern Industry Tools",
    category: "Communication Balance",
    question: "What balance of technical deep-dive vs collaboration suits your personality?",
    options: [
      { text: "80% coding & system design / 20% team sprint planning", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "85% offensive/defensive security auditing / 15% risk briefings to management", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "75% model architecture and data tuning / 25% sharing insights with stakeholders", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "70% mechatronic calibration and code / 30% hardware team integration", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "75% CAD modeling and calculations / 25% vendor and production syncs", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "40% technical evaluation / 60% strategic pitching, leadership, and roadmap driving", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 15,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Modern Industry Tools",
    category: "Academic Favorites",
    question: "Which university subjects did you find most natural and engaging?",
    options: [
      { text: "Data Structures & Algorithms, Web Tech, Operating Systems, Computer Networks", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Cryptography, Network Security, Information Assurance, Ethical Hacking", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Machine Learning, Deep Neural Networks, Natural Language Processing, Linear Algebra", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Control Systems, Microcontrollers, Mechatronics, Kinematics, Computer Vision", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Machine Design, Fluid Mechanics, Structural Analysis, Finite Element Methods", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Project Management, Technical Economics, Entrepreneurship, Systems Engineering", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 16,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Modern Industry Tools",
    category: "Industry Sector",
    question: "Which industry company would you be most thrilled to join?",
    options: [
      { text: "Tier-1 Cloud and SaaS leaders (Google Cloud, AWS, Microsoft, Atlassian)", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Elite Security firms (Palo Alto Networks, CrowdStrike, CERT-In, Cloudflare)", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Frontier AI Labs (OpenAI, Anthropic, Google DeepMind, Nvidia)", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Autonomous Systems & Robotics pioneers (Boston Dynamics, Tesla Autopilot, ISRO)", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Engineering & Mobility giants (L&T, Tata Motors, Boeing, Siemens, Airbus)", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Top Tier Management & Strategy firms (McKinsey, BCG, Bain, High-Growth Unicorns)", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 17,
    sectionNumber: 2,
    sectionTitle: "Section 2: Domain Affinity & Modern Industry Tools",
    category: "Long-term Aspirations",
    question: "Where do you envision yourself 7 years into your career?",
    options: [
      { text: "VP of Engineering or Chief Cloud Architect", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Chief Information Security Officer (CISO) protecting vital digital infrastructure", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Chief AI Scientist developing next-generation intelligent reasoning systems", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Head of Robotics & Autonomous Systems leading smart robotics fleets", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Chief Mechanical/Structural Engineer overseeing mega engineering projects", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Chief Product Officer (CPO) or Tech Startup Founder/CEO", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },

  // SECTION 3: Real-World Scenarios & Production Cases (Q18-Q25)
  {
    id: 18,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & Practical Execution",
    category: "Crisis Management",
    question: "An ecommerce app experiences a massive unexpected traffic surge. What is your priority?",
    options: [
      { text: "Spin up auto-scaling container pods, implement database query caching, and inspect CDN", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Defend against DDoS bots, rate-limit suspicious IPs, and prevent credential stuffing", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Ensure real-time recommendation models handle throughput without inferencing bottlenecks", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Ensure warehouse automated sorting robotics and fulfillment conveyors stay synchronized", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Verify facility power grid reserves and structural mechanical warehouse safety", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Track checkout conversion rates and coordinate emergency executive response", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 19,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & Practical Execution",
    category: "Technical Debt",
    question: "How do you handle aging legacy code or physical equipment?",
    options: [
      { text: "Refactor into isolated microservices with comprehensive automated unit tests", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Patch known CVE vulnerabilities, revoke old SSL certs, and enforce Zero Trust", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Retrain outdated models with fresh data and replace heuristic rules with ML models", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Upgrade motor controllers, replace aging sensors, and rewrite embedded firmware in modern C++", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Re-engineer parts in 3D CAD using modern alloys and conduct fatigue stress re-evaluations", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Calculate the financial cost of technical debt vs new feature ROI to decide replacement timing", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 20,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & Practical Execution",
    category: "Speed vs Quality",
    question: "When forced to make a rapid release under tight deadlines, what will you NEVER compromise on?",
    options: [
      { text: "Data integrity and core transactional database consistency", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Authentication security, encryption standards, and vulnerability scanning", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Model accuracy validation and checking against catastrophic hallucinations", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Physical emergency stop (E-stop) mechanisms and robotic obstacle detection safety", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Structural load calculations and physical factor of safety margins", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Core customer value proposition and basic usable product user experience", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 21,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & Practical Execution",
    category: "Automation Philosophy",
    question: "What is your philosophy on automated systems?",
    options: [
      { text: "Every repetitive deployment, build, and test pipeline must be 100% CI/CD automated", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Automated vulnerability scanning and AI threat quarantine must run continuously", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "AI agents should automate complex unstructured workflows and data synthesis", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Robots and physical actuators should handle dangerous, repetitive physical labor", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Parametric CAD and generative design should automate component geometry optimization", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Automation is only valuable when it directly lowers cost-per-unit or accelerates sales", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 22,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & Practical Execution",
    category: "Failure Analysis",
    question: "When an unexpected bug or glitch surfaces, what is your investigative mindset?",
    options: [
      { text: "Reproduce in a staging sandbox, isolate code diffs, and inspect API responses", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Analyze attack vectors, inspect reverse shells, and check firewall breach signatures", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Inspect training sample anomalies, loss curve divergence, and feature outliers", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Inspect sensor noise, check encoder ticks, and debug RTOS thread deadlocks", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Inspect physical fracture points, thermal hotspots, and material shear stresses", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Determine user impact severity, organize triage huddle, and align team on fix timeline", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 23,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & Practical Execution",
    category: "Ethical Responsibility",
    question: "Which modern tech dilemma concerns you most deeply?",
    options: [
      { text: "Cloud platform monopolies, data lock-in, and mass internet service outages", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Critical infrastructure cyberattacks, ransomware extortions, and surveillance abuse", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Uncontrolled artificial superintelligence, deepfakes, and algorithmic bias", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Autonomous lethal robotics weapons and uncontrolled robotic workplace displacement", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Structural bridge/building collapses, industrial plant accidents, and e-waste", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Ethical consumer manipulation, predatory monetization algorithms, and tech monopoly power", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 24,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & Practical Execution",
    category: "Personal Curiosity",
    question: "When you spend a free weekend exploring new tech on GitHub or YouTube, what is it?",
    options: [
      { text: "Building with Next.js 15, Go microservices, Rust web servers, or Docker Swarms", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Ethical hacking tutorials, exploring CTF challenges, or analyzing malware binaries", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Exploring latest Hugging Face models, training LoRA adapters, or RAG agents", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Simulating robotic arms in Gazebo, programming ESP32 drones, or testing OpenCV", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Designing 3D printable mechanical gadgets in SolidWorks or rendering BIM blueprints", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Analyzing startup business models, reading TechCrunch, and teardowns of unicorn strategies", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
  {
    id: 25,
    sectionNumber: 3,
    sectionTitle: "Section 3: Real-World Scenarios & Practical Execution",
    category: "Ultimate Choice",
    question: "If offered multiple dream job roles tomorrow with identical compensation, you accept:",
    options: [
      { text: "Senior Software Development Engineer (SDE) architecting global cloud products", domain: "Full-Stack Software & Cloud/DevOps", points: 10 },
      { text: "Cybersecurity Operations & Threat Defense Specialist guarding critical infrastructure", domain: "Cybersecurity & Threat Defense", points: 10 },
      { text: "Machine Learning / Applied AI Specialist building cutting-edge intelligence systems", domain: "AI, Machine Learning & GenAI", points: 10 },
      { text: "Robotics & Autonomous Systems Engineer deploying intelligent physical machines", domain: "Robotics & Autonomous Systems", points: 10 },
      { text: "Lead CAD/CAE Systems Designer or BIM Structural Engineer shaping physical structures", domain: "Core Engineering & CAD/BIM", points: 10 },
      { text: "Technical Product Manager (PM) or Tech Strategy Consultant leading high-stakes roadmaps", domain: "Tech Product Management & Consulting", points: 10 },
    ],
  },
];

// ----------------------------------------------------
// TIE BREAKER POOL (Up to Question 50)
// ----------------------------------------------------
export const EXTENDED_TIE_BREAKERS: AssessmentQuestion[] = [
  {
    id: 26,
    sectionNumber: 4,
    sectionTitle: "Section 4: Adaptive Tie-Breaker (Clarity Calibration)",
    category: "Code vs Data Deep Dive",
    question: "Between building a robust user-facing feature vs training a machine learning model, what brings you more satisfaction?",
    options: [
      { text: "Crafting end-to-end user features, APIs, and seeing people use the app", domain: "Software Engineering", points: 12 },
      { text: "Extracting hidden mathematical patterns and training high-accuracy prediction models", domain: "Data Science & AI", points: 12 },
      { text: "Writing firmware and integrating physical sensors/mechanisms", domain: "Core Engineering & Hardware", points: 12 },
      { text: "Deciding which feature to prioritize based on customer interviews and market data", domain: "Tech Consulting & Product Management", points: 12 },
    ],
  },
  {
    id: 27,
    sectionNumber: 4,
    sectionTitle: "Section 4: Adaptive Tie-Breaker (Clarity Calibration)",
    category: "Theory vs Building",
    question: "Do you prefer spending time analyzing statistical distributions or architecting software modules?",
    options: [
      { text: "Architecting modular software codebases and reducing technical debt", domain: "Software Engineering", points: 12 },
      { text: "Evaluating statistical hypotheses, loss functions, and probability distributions", domain: "Data Science & AI", points: 12 },
      { text: "Simulating physical stress, thermodynamic properties, and circuit boards", domain: "Core Engineering & Hardware", points: 12 },
      { text: "Conducting market competitor research and evaluating business unit economics", domain: "Tech Consulting & Product Management", points: 12 },
    ],
  },
  {
    id: 28,
    sectionNumber: 4,
    sectionTitle: "Section 4: Adaptive Tie-Breaker (Clarity Calibration)",
    category: "Physical vs Digital",
    question: "Would you rather work exclusively on digital cloud software or interact with physical machines and hardware?",
    options: [
      { text: "100% digital cloud software, web infrastructure, and mobile apps", domain: "Software Engineering", points: 12 },
      { text: "Data algorithms that operate in the cloud on enterprise data", domain: "Data Science & AI", points: 12 },
      { text: "Physical machines: Robotics, autonomous cars, IoT devices, or building construction", domain: "Core Engineering & Hardware", points: 12 },
      { text: "Strategic business models across both digital and physical sectors", domain: "Tech Consulting & Product Management", points: 12 },
    ],
  },
  {
    id: 29,
    sectionNumber: 4,
    sectionTitle: "Section 4: Adaptive Tie-Breaker (Clarity Calibration)",
    category: "Management vs Hands-on",
    question: "If a project has 5 engineers, would you prefer writing the hardest code or leading the team roadmap?",
    options: [
      { text: "Writing the most complex, mission-critical code algorithms myself", domain: "Software Engineering", points: 12 },
      { text: "Designing the data pipeline and mathematical prediction engine", domain: "Data Science & AI", points: 12 },
      { text: "Leading hardware bench testing and structural quality assurance", domain: "Core Engineering & Hardware", points: 12 },
      { text: "Leading team vision, managing stakeholders, removing roadblocks, and tracking milestones", domain: "Tech Consulting & Product Management", points: 12 },
    ],
  },
  {
    id: 30,
    sectionNumber: 4,
    sectionTitle: "Section 4: Adaptive Tie-Breaker (Clarity Calibration)",
    category: "Final Disambiguation",
    question: "Which of these single tasks would you pick for a 48-hour hackathon sprint?",
    options: [
      { text: "Ship a full-stack web/mobile application with authentication and database", domain: "Software Engineering", points: 15 },
      { text: "Train and fine-tune a specialized AI model to uncover non-obvious insights", domain: "Data Science & AI", points: 15 },
      { text: "Build an IoT device or mechanical gadget using 3D printing and sensors", domain: "Core Engineering & Hardware", points: 15 },
      { text: "Create a complete business plan, product pitch, market analysis, and financial forecast", domain: "Tech Consulting & Product Management", points: 15 },
    ],
  },
];

// Helper to check margin and ambiguity
export function checkClarityStatus(
  scores: Record<string, number>,
  currentCount: number
): {
  isAmbiguous: boolean;
  topDomain: string;
  runnerUpDomain: string;
  marginPercent: number;
  message: string;
} {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length < 2) {
    return {
      isAmbiguous: false,
      topDomain: sorted[0]?.[0] || "General",
      runnerUpDomain: "",
      marginPercent: 100,
      message: "High Clarity Achieved",
    };
  }

  const [topDomain, topScore] = sorted[0];
  const [runnerUpDomain, runnerUpScore] = sorted[1];
  const total = Math.max(1, topScore + runnerUpScore);
  const marginPercent = Math.round(((topScore - runnerUpScore) / total) * 100);

  // Ambiguity criteria: margin under 15% and count is within tie-breaker range (<50)
  const isAmbiguous = marginPercent < 15 && currentCount < 50;

  let message = "High Clarity Achieved";
  if (isAmbiguous) {
    message = `Close match between ${topDomain} and ${runnerUpDomain}. Tie-breakers active.`;
  } else if (marginPercent < 25) {
    message = `Clear leaning towards ${topDomain} with strong secondary interest in ${runnerUpDomain}.`;
  }

  return {
    isAmbiguous,
    topDomain,
    runnerUpDomain,
    marginPercent,
    message,
  };
}

// ----------------------------------------------------
// DYNAMIC 2026 LIVE TREND ENGINE (Groq LPU Powered)
// ----------------------------------------------------
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-20b";

export interface LiveTrendResult {
  questions: AssessmentQuestion[];
  isLiveAI: boolean;
  paradigms: string[];
}

export async function fetchLiveTrendQuestions(
  stage: StudentStage,
  branch: string = "CSE"
): Promise<LiveTrendResult> {
  const paradigms = [
    "Cybersecurity & Zero Trust",
    "Generative AI & LLM Agents",
    "Robotics & Autonomous ROS2",
    "Cloud-Native & Distributed Systems",
    "CAD/CAM Digital Twins & BIM"
  ];

  if (stage === "10th") {
    return { 
      questions: getQuestionsWithShuffledOptions(CLASS_10_QUESTIONS), 
      isLiveAI: false, 
      paradigms: ["Science PCM", "Science PCB", "Commerce", "Arts & Humanities"] 
    };
  }

  if (stage === "12th") {
    return {
      questions: getQuestionsWithShuffledOptions(CLASS_12_QUESTIONS),
      isLiveAI: false,
      paradigms: [
        "Computer Science, AI & IT Engineering",
        "Electronics, Electrical & Robotics Engineering",
        "Mechanical, Aerospace & Core Engineering",
        "Civil, Environmental & Architecture",
        "Medicine & Clinical Healthcare (MBBS/BDS)",
        "Commerce, CA & Corporate Finance"
      ]
    };
  }

  const cacheKey = `cv_trend_q_${stage}_${branch}_2026`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length >= 20) {
        return { questions: getQuestionsWithShuffledOptions(parsed), isLiveAI: true, paradigms };
      }
    }
  } catch (e) {
    // ignore
  }

  const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
  if (!apiKey) {
    return { questions: getQuestionsWithShuffledOptions(COLLEGE_QUESTIONS), isLiveAI: false, paradigms };
  }

  const prompt = `You are the lead Career & Industry Assessment AI for CareerVerse.
Generate 17 modern 2026 industry career assessment questions (id 9 to 25) for an engineering student (${branch} branch).
The questions must calibrate affinity across these exact 6 domains:
1. "Full-Stack Software & Cloud/DevOps"
2. "Cybersecurity & Threat Defense"
3. "AI, Machine Learning & GenAI"
4. "Robotics & Autonomous Systems"
5. "Core Engineering & CAD/BIM"
6. "Tech Product Management & Consulting"

Format as a valid JSON array of objects:
[
  {
    "id": 9,
    "sectionNumber": 2,
    "sectionTitle": "Section 2: Domain Affinity & Modern Industry Tools",
    "category": "string",
    "question": "string",
    "options": [
      {"text": "string", "domain": "Full-Stack Software & Cloud/DevOps", "points": 10},
      {"text": "string", "domain": "Cybersecurity & Threat Defense", "points": 10},
      {"text": "string", "domain": "AI, Machine Learning & GenAI", "points": 10},
      {"text": "string", "domain": "Robotics & Autonomous Systems", "points": 10},
      {"text": "string", "domain": "Core Engineering & CAD/BIM", "points": 10},
      {"text": "string", "domain": "Tech Product Management & Consulting", "points": 10}
    ]
  }
]
Output ONLY raw valid JSON array.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      const start = text.indexOf("[");
      const end = text.lastIndexOf("]");
      if (start !== -1 && end > start) {
        const parsed = JSON.parse(text.slice(start, end + 1));
        if (Array.isArray(parsed) && parsed.length >= 8) {
          const section1 = COLLEGE_QUESTIONS.slice(0, 8);
          const fullSet = [...section1, ...parsed];
          try {
            localStorage.setItem(cacheKey, JSON.stringify(fullSet));
          } catch (e) {
            // cache quota safe
          }
          return { questions: getQuestionsWithShuffledOptions(fullSet), isLiveAI: true, paradigms };
        }
      }
    }
  } catch (err) {
    console.warn("Groq dynamic generation fallback to benchmark questions:", err);
  }

  return { questions: getQuestionsWithShuffledOptions(COLLEGE_QUESTIONS), isLiveAI: false, paradigms };
}

