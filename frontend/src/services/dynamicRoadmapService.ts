/**
 * CareerVerse AI - Station 05 Dynamic Roadmap Client Service
 * Interacts with FastAPI backend (/api/roadmap/*), Cloud Firestore, and LocalStorage.
 */

import axios from "axios";
import { db } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { roles } from "../data/roles";
import type {
  RoadmapPlan,
  RoadmapCreationParams,
  RoadmapSimulationResult,
  AdaptationNotice,
  RoadmapPhase,
  RoadmapWeek,
  RoadmapTask,
  SkillGapItem,
  WeeklyAssessment,
  AssessmentQuestion,
  AssessmentSubmissionResult,
} from "../types/roadmapEngine.types";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const LOCAL_STORAGE_KEY = (uid: string) => `cv_dynamic_roadmap_v5_${uid}`;

export const dynamicRoadmapService = {
  /**
   * Generates a personalized deterministic roadmap via FastAPI planning engine.
   */
  async generatePlan(params: RoadmapCreationParams): Promise<RoadmapPlan> {
    try {
      const response = await axios.post<RoadmapPlan>(
        `${BACKEND_URL}/api/roadmap/generate-plan`,
        {
          user_id: params.userId || "guest_user",
          target_role_id: params.targetRoleId,
          experience_level: params.experienceLevel,
          weekly_hours: params.weeklyHours,
          target_date: params.targetDate,
          target_timeline_months: params.targetTimelineMonths || 6,
          learning_preference: params.learningPreference,
          goal: params.goal,
          current_role: params.currentRole,
          known_skills: params.knownSkills || [],
          assessment_scores: params.assessmentScores || {},
          specialization: params.specialization,
          mvcp_mode: params.mvcpMode || false,
        },
        { timeout: 15000 }
      );

      const plan = response.data;
      if (params.userId) {
        await this.savePlan(params.userId, plan);
      }
      return plan;
    } catch (error) {
      console.warn("Backend generate-plan unavailable or errored, activating client fallback:", error);
      return this._generateClientFallback(params);
    }
  },

  /**
   * Adapts the roadmap based on an event (assessment result, task completed, etc.).
   */
  async adaptPlan(
    roadmap: RoadmapPlan,
    eventType: "assessment_result" | "task_completed" | "weekly_hours_changed",
    payload: Record<string, unknown>
  ): Promise<RoadmapPlan> {
    try {
      const response = await axios.post<RoadmapPlan>(
        `${BACKEND_URL}/api/roadmap/adapt-plan`,
        {
          roadmap,
          event_type: eventType,
          payload,
        },
        { timeout: 15000 }
      );

      const updated = response.data;
      if (roadmap.user_id) {
        await this.savePlan(roadmap.user_id, updated);
      }
      return updated;
    } catch (error) {
      console.warn("Backend adapt-plan unavailable, applying client-side state mutation:", error);
      return this._adaptClientFallback(roadmap, eventType, payload);
    }
  },

  /**
   * Simulates variations in hours, deadlines, and MVCP mode without altering the active roadmap.
   */
  async simulatePlan(
    roadmap: RoadmapPlan,
    params: {
      weeklyHours: number;
      targetDate?: string;
      mvcpMode?: boolean;
    }
  ): Promise<RoadmapSimulationResult> {
    try {
      const response = await axios.post<RoadmapSimulationResult>(
        `${BACKEND_URL}/api/roadmap/simulate-plan`,
        {
          current_roadmap: roadmap,
          simulated_weekly_hours: params.weeklyHours,
          simulated_target_date: params.targetDate,
          simulated_mvcp_mode: params.mvcpMode,
        },
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.warn("Backend simulate-plan unavailable, applying client heuristic simulation:", error);
      return this._simulateClientFallback(roadmap, params);
    }
  },

  /**
   * Interprets natural language prompt into a structured command.
   */
  async interpretCommand(
    commandText: string,
    roadmap: RoadmapPlan
  ): Promise<{ action: string; value: unknown; explanation: string }> {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/roadmap/interpret-command`,
        {
          command_text: commandText,
          current_roadmap: roadmap,
        },
        { timeout: 8000 }
      );
      return response.data;
    } catch (error) {
      console.warn("Backend interpret-command unavailable, using rule-based parsing:", error);
      return this._interpretCommandFallback(commandText);
    }
  },

  /**
   * Fetches active roadmap from LocalStorage or Firestore.
   */
  async getActivePlan(uid: string): Promise<RoadmapPlan | null> {
    // 1. Try local storage for instant render
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY(uid));
      if (raw) {
        return JSON.parse(raw) as RoadmapPlan;
      }
    } catch (e) {
      console.warn("Could not read local roadmap cache:", e);
    }

    // 2. Fetch from Cloud Firestore
    try {
      const docRef = doc(db, "users", uid, "data", "roadmap_v4");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as RoadmapPlan;
        localStorage.setItem(LOCAL_STORAGE_KEY(uid), JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn("Firestore roadmap read failed:", e);
    }

    return null;
  },

  /**
   * Persists active roadmap to Cloud Firestore and LocalStorage.
   */
  async savePlan(uid: string, plan: RoadmapPlan): Promise<void> {
    // 1. LocalStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY(uid), JSON.stringify(plan));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }

    // 2. Cloud Firestore
    try {
      const docRef = doc(db, "users", uid, "data", "roadmap_v4");
      await setDoc(docRef, plan, { merge: true });
    } catch (e) {
      console.warn("Firestore save error:", e);
    }
  },

  /**
   * Generates dynamic 15-question assessment for a week via FastAPI or Groq LPU.
   */
  async generateWeeklyAssessment(params: {
    roadmapId: string;
    weekId: string;
    weekNumber: number;
    role: string;
    userLevel: string;
    topics: string[];
    learningObjectives?: string[];
    weakTopics?: string[];
    attemptNumber?: number;
  }): Promise<WeeklyAssessment> {
    try {
      const response = await axios.post<WeeklyAssessment>(
        `${BACKEND_URL}/api/roadmap/weeks/${params.weekId}/assessment/generate`,
        {
          roadmap_id: params.roadmapId,
          week_id: params.weekId,
          week_number: params.weekNumber,
          role: params.role,
          user_level: params.userLevel,
          topics: params.topics,
          learning_objectives: params.learningObjectives || [],
          weak_topics: params.weakTopics || [],
          attempt_number: params.attemptNumber || 1,
        },
        { timeout: 35000 }
      );
      return response.data;
    } catch (error) {
      console.warn("Backend weekly assessment generation error, using client Groq LPU fallback:", error);
      return this._generateAssessmentGroqFallback(params);
    }
  },

  /**
   * Evaluates weekly assessment submission deterministically.
   * Requires >= 12 / 15 (75%) to pass.
   */
  async submitWeeklyAssessment(params: {
    assessmentId: string;
    weekId: string;
    roadmap: RoadmapPlan;
    answers: Record<string, number>;
  }): Promise<AssessmentSubmissionResult> {
    try {
      const response = await axios.post<AssessmentSubmissionResult>(
        `${BACKEND_URL}/api/roadmap/assessments/submit`,
        {
          assessment_id: params.assessmentId,
          week_id: params.weekId,
          roadmap: params.roadmap,
          answers: params.answers,
        },
        { timeout: 15000 }
      );
      const result = response.data;
      if (params.roadmap.user_id) {
        await this.savePlan(params.roadmap.user_id, result.updated_roadmap);
      }
      return result;
    } catch (error) {
      console.warn("Backend submit assessment error, using client deterministic evaluation:", error);
      const res = this._submitAssessmentClientFallback(params);
      if (params.roadmap.user_id) {
        await this.savePlan(params.roadmap.user_id, res.updated_roadmap);
      }
      return res;
    }
  },

  /**
   * Generates dynamic retest for a failed week focusing on weak topics.
   */
  async retestWeeklyAssessment(params: {
    assessmentId: string;
    weekId: string;
    roadmap: RoadmapPlan;
    role: string;
    userLevel: string;
    weekNumber: number;
    topics: string[];
    weakTopics: string[];
  }): Promise<WeeklyAssessment> {
    try {
      const response = await axios.post<WeeklyAssessment>(
        `${BACKEND_URL}/api/roadmap/assessments/${params.assessmentId}/retest`,
        {
          assessment_id: params.assessmentId,
          week_id: params.weekId,
          roadmap: params.roadmap,
          answers: {},
        },
        { timeout: 35000 }
      );
      return response.data;
    } catch (error) {
      console.warn("Backend retest assessment error, using client Groq retest fallback:", error);
      return this._generateAssessmentGroqFallback({
        roadmapId: params.roadmap.id,
        weekId: params.weekId,
        weekNumber: params.weekNumber,
        role: params.role,
        userLevel: params.userLevel,
        topics: params.topics,
        weakTopics: params.weakTopics,
        attemptNumber: 2,
      });
    }
  },

  /**
   * Clears/archives the active roadmap.
   */
  async archivePlan(uid: string): Promise<void> {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY(uid));
      const docRef = doc(db, "users", uid, "data", "roadmap_v4");
      await setDoc(docRef, { status: "archived", archived_at: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Failed to archive roadmap:", e);
    }
  },

  // --------------------------------------------------------------------------
  // CLIENT-SIDE OFFLINE FALLBACK IMPLEMENTATIONS
  // --------------------------------------------------------------------------

  _generateClientFallback(params: RoadmapCreationParams): RoadmapPlan {
    const roleId = params.targetRoleId;
    const roleDef = roles.find((r) => r.id === roleId);
    const roleName = roleDef?.name || roleId.replace(/-/g, " ").toUpperCase();
    const category = roleDef?.category || "Software Engineering";
    const requiredSkills = roleDef?.requiredSkills && roleDef.requiredSkills.length > 0
      ? roleDef.requiredSkills
      : ["Programming Fundamentals", "Data Structures & Algorithms", "System Design", "Cloud & Deployment"];

    const curriculum: any = {
      oneMonthSprint: []
    };

    // Timeline calculation: 1 month = 4 weeks, 3 months = 12 weeks, 6 months = 24 weeks, etc.
    const months = Math.max(1, params.targetTimelineMonths || 6);
    const totalWeeks = Math.max(4, Math.round(months * 4));
    const requiredHours = totalWeeks * 10;
    const availableHours = Math.round(totalWeeks * params.weeklyHours);
    const capacityRatio = Math.round((availableHours / Math.max(1, requiredHours)) * 100) / 100;

    // Explicit role-to-language and tooling blueprints for Week 1 & Core foundations
    const ROLE_LANGUAGE_SPECS: Record<string, {
      language: string;
      week1Title: string;
      concepts: string[];
      practiceLab: string;
      projectDeliverable: string;
      quizQuestion: {
        question: string;
        options: string[];
        correct_index: number;
        explanation: string;
      };
      interviewQuestion: {
        question: string;
        hint: string;
      };
    }> = {
      "ai-engineer": {
        language: "Python 3.12 (NumPy, PyTorch & Vectorized Math)",
        week1Title: "Python 3.12 Core Syntax, NumPy Vectorization & Virtual Environments",
        concepts: [
          "Python 3.12 Data Models, Generators, List/Dict Comprehensions & Type Hinting",
          "NumPy N-dimensional Arrays, Strides, Broadcasting & Vectorized Matrix Computations",
          "Modern Virtual Environment Tooling (uv / poetry / conda) & Dependency Locking",
        ],
        practiceLab: "Implement vectorized matrix transformations and Euclidean distance metrics in pure NumPy without loops.",
        projectDeliverable: "CLI Exploratory Data Analysis & Statistical Matrix Calculator in Python.",
        quizQuestion: {
          question: "Why is vectorized computation in NumPy significantly faster than standard Python loops?",
          options: [
            "NumPy executes compiled C/Fortran code over contiguous memory blocks without Python GIL overhead",
            "NumPy runs in the browser JavaScript engine",
            "Python loops use more disk space",
            "NumPy automatically compresses code files",
          ],
          correct_index: 0,
          explanation: "NumPy arrays are stored in contiguous memory chunks and vectorized operations execute in compiled C/Fortran kernels using SIMD vector registers.",
        },
        interviewQuestion: {
          question: "How does NumPy broadcasting handle array arithmetic between tensors of unequal shapes?",
          hint: "Explain the two rules: dimensions are compared element-wise from right to left; they are compatible if they are equal or one of them is 1.",
        },
      },
      "ml-engineer": {
        language: "Python 3.12 (NumPy, Pandas & Scikit-Learn)",
        week1Title: "Python 3.12 Scientific Stacks, Feature Engineering & Linear Models",
        concepts: [
          "Scientific Python environment setup (uv, JupyterLab, Pandas, Scikit-Learn)",
          "Vectorized data manipulation with Pandas Series and DataFrames",
          "Linear algebra fundamentals: Eigenvalues, Dot Products, and Matrix Inversions",
        ],
        practiceLab: "Build an end-to-end data cleaning and imputation pipeline using Pandas and NumPy.",
        projectDeliverable: "Automated Data Profiler & Feature Distribution Visualizer in Python.",
        quizQuestion: {
          question: "What is data leakage during feature preprocessing and how is it prevented?",
          options: [
            "Using test set statistics to normalize training features; prevented using Scikit-Learn Pipelines",
            "Storing data without encryption keys",
            "When RAM runs out during gradient descent",
            "When CSV files have empty values",
          ],
          correct_index: 0,
          explanation: "Data leakage happens when information from outside the training dataset (like test set mean/std) is used to fit transformers. Sklearn Pipeline guarantees transformers fit only on training folds.",
        },
        interviewQuestion: {
          question: "Explain the Bias-Variance tradeoff and how regularization (L1/L2) affects model capacity.",
          hint: "High bias causes underfitting; high variance causes overfitting. L1 encourages sparsity, L2 penalizes large weights.",
        },
      },
      "data-scientist": {
        language: "Python 3.12 (NumPy, Pandas, SciPy & Statistics)",
        week1Title: "Python 3.12 Data Wrangling, Descriptive Statistics & EDA",
        concepts: [
          "Python 3.12 statistical computing: SciPy, Statsmodels, and Pandas aggregations",
          "Hypothesis testing: p-values, z-tests, t-tests, and Confidence Intervals",
          "Data visualization architectures: Seaborn, Matplotlib & distribution fitting",
        ],
        practiceLab: "Perform an exploratory statistical analysis testing normality and calculating correlation matrices on an empirical dataset.",
        projectDeliverable: "Automated Statistical EDA & Outlier Detection CLI Engine in Python.",
        quizQuestion: {
          question: "What does a p-value less than 0.05 signify in a two-tailed hypothesis test?",
          options: [
            "There is less than 5% probability of observing the result by random chance assuming null hypothesis is true",
            "The probability that the alternate hypothesis is false is 95%",
            "The sample size was too small",
            "The data must be normally distributed",
          ],
          correct_index: 0,
          explanation: "The p-value measures the probability of obtaining test results at least as extreme as the observed results, assuming the null hypothesis is true.",
        },
        interviewQuestion: {
          question: "What is Simpson's Paradox and how can aggregating data mislead statistical conclusions?",
          hint: "A trend appears in several different groups of data but disappears or reverses when these groups are combined due to confounding variables.",
        },
      },
      "software-engineer": {
        language: "C++ & Java (OOP, Memory Pointers & STL Containers)",
        week1Title: "C++ & Java Foundations: Memory Pointers, Stack vs Heap & OOP",
        concepts: [
          "Memory layout: Stack frames vs Heap allocations, pointer arithmetic, and references",
          "Object-Oriented Design: Polymorphism, Encapsulation, Inheritance & Abstract Interfaces",
          "Standard Template Library (STL) / Collections: Vectors, ArrayLists, HashMaps & Big-O trade-offs",
        ],
        practiceLab: "Implement a generic dynamically-resizing Array and Singly Linked List with manual memory management.",
        projectDeliverable: "High-Performance CLI Financial Transaction Ledger with Memory Safety in C++/Java.",
        quizQuestion: {
          question: "What is the primary difference between Stack and Heap memory allocation in C++/Java?",
          options: [
            "Stack is fast, contiguous, and automatically freed on function return; Heap is dynamic, manual/GC-managed, and can fragment",
            "Stack is stored on the hard drive; Heap is in CPU registers",
            "Heap is faster than Stack for small integers",
            "Stack allows arbitrary pointer reallocations at runtime",
          ],
          correct_index: 0,
          explanation: "Stack memory is managed automatically via LIFO stack frames (very fast pointer bump); Heap allocations are dynamic and require explicit deallocation or garbage collection.",
        },
        interviewQuestion: {
          question: "How does a HashMap resolve hash collisions and what is its worst-case vs amortized lookup time?",
          hint: "Discuss separate chaining (linked list / red-black tree) vs open addressing, amortized O(1), and worst-case O(n) under adverse hash collisions.",
        },
      },
      "frontend-dev": {
        language: "Modern TypeScript & JavaScript (ES6+)",
        week1Title: "TypeScript 5.x, Modern DOM Architecture & Asynchronous Event Loop",
        concepts: [
          "TypeScript strict typing: Generics, Discriminated Unions, Type Narrowing & Utility Types",
          "JavaScript runtime engine: Call Stack, Event Loop, Microtask Queue & Async/Await",
          "DOM rendering tree: Critical Rendering Path, Event Delegation & MutationObserver",
        ],
        practiceLab: "Build an in-memory Pub/Sub event bus in pure TypeScript with strict generic type constraints.",
        projectDeliverable: "Interactive Drag-and-Drop Kanban Task Board in Vanilla TypeScript & LocalStorage.",
        quizQuestion: {
          question: "In what order does JavaScript execute: synchronous code, Promise.then() microtasks, and setTimeout() macrotasks?",
          options: [
            "Synchronous code -> Promise.then() microtasks -> setTimeout() macrotask",
            "setTimeout() -> Promise.then() -> Synchronous code",
            "Promise.then() -> setTimeout() -> Synchronous code",
            "All execute in parallel on separate operating system threads",
          ],
          correct_index: 0,
          explanation: "The JavaScript event loop runs all synchronous call-stack frames first, exhausts the microtask queue (Promises), and then processes macrotasks (setTimeout).",
        },
        interviewQuestion: {
          question: "What causes unnecessary re-renders in modern component libraries and how do you optimize them?",
          hint: "Discuss reference inequality in props/state, memoization (useMemo/useCallback), context splitting, and component composition.",
        },
      },
      "backend-dev": {
        language: "Python / Go / Java Backend Services",
        week1Title: "Backend Systems: HTTP Protocols, Socket Networking & REST Standards",
        concepts: [
          "HTTP/1.1 vs HTTP/2: Headers, Status codes, Keep-Alive connections & Idempotent verbs",
          "Concurrency primitives: Non-blocking I/O event loops, thread pools & goroutines",
          "RESTful resource design: URI hierarchies, cursor pagination, and standardized error envelopes",
        ],
        practiceLab: "Build a raw TCP socket server in Python/Go that parses HTTP GET/POST headers and returns JSON responses.",
        projectDeliverable: "Production RESTful Microservice with Bearer Authentication, Rate Limiting & Swagger Specs.",
        quizQuestion: {
          question: "Which HTTP status code should be returned when a request is authenticated but the user lacks permission to access the resource?",
          options: [
            "403 Forbidden",
            "401 Unauthorized",
            "400 Bad Request",
            "404 Not Found",
          ],
          correct_index: 0,
          explanation: "401 Unauthorized means unauthenticated (missing or invalid credentials); 403 Forbidden means authenticated but insufficient access permissions.",
        },
        interviewQuestion: {
          question: "How do you guarantee idempotency in distributed payment or booking REST endpoints?",
          hint: "Discuss Idempotency-Key headers, unique constraint database tables, Redis distributed locking, and transactional state machines.",
        },
      },
      "fullstack-dev": {
        language: "Full-Stack TypeScript (React & Node.js)",
        week1Title: "Full-Stack TypeScript: Node.js Runtime & Client-Server Type Contracts",
        concepts: [
          "End-to-end type safety: Sharing TypeScript interfaces and Zod schemas between client and server",
          "Node.js asynchronous event-driven I/O model vs multi-threaded web servers",
          "RESTful API consumption: Optimistic UI updates, caching layers, and token authentication",
        ],
        practiceLab: "Build an end-to-end full-stack counter and session store with strict shared Zod validation schemas.",
        projectDeliverable: "Full-Stack TypeScript Product Catalog with Secure Authentication & Persistent Database.",
        quizQuestion: {
          question: "What is the primary advantage of validating request bodies with Zod/TypeBox on the backend?",
          options: [
            "Ensures runtime validation and infers compile-time TypeScript types without manual duplication",
            "Makes the backend compile faster than C++",
            "Eliminates the need for a database",
            "Automatically styles frontend HTML",
          ],
          correct_index: 0,
          explanation: "Zod parses runtime inputs and automatically produces TypeScript static types, ensuring type safety both at compile-time and runtime.",
        },
        interviewQuestion: {
          question: "Compare Server-Side Rendering (SSR) vs Static Site Generation (SSG) vs Client-Side Rendering (CSR).",
          hint: "Discuss Time to First Byte (TTFB), SEO benefits, server CPU costs, and data freshness tradeoffs.",
        },
      },
      "devops-sre": {
        language: "Linux Systems, Bash Shell & POSIX Automation",
        week1Title: "Linux Kernel Architecture, POSIX Administration & Shell Scripting",
        concepts: [
          "Linux filesystem hierarchy, POSIX file permissions (chmod, chown, umask) & file descriptors",
          "Process management: PID, signals (SIGTERM, SIGKILL), systemd service units & cron daemons",
          "Bash scripting: Shell parameter expansion, stream redirection (stdout/stderr), sed & awk parsing",
        ],
        practiceLab: "Write an automated system health auditor bash script that monitors CPU, memory, and disk inode usage.",
        projectDeliverable: "Linux Server Auto-Provisioning & Backup Automation Daemon with Webhook Alerts.",
        quizQuestion: {
          question: "What happens when an application receives signal 15 (SIGTERM) vs signal 9 (SIGKILL)?",
          options: [
            "SIGTERM can be caught/handled by the process for graceful shutdown; SIGKILL immediately terminates the process via the kernel",
            "SIGTERM reboots the server; SIGKILL deletes the executable",
            "SIGKILL allows cleanup handlers to run; SIGTERM does not",
            "Both signals do the exact same thing",
          ],
          correct_index: 0,
          explanation: "SIGTERM (15) requests polite termination allowing open connections and files to close cleanly; SIGKILL (9) cannot be caught or ignored and terminates immediately.",
        },
        interviewQuestion: {
          question: "Describe what happens under the hood from the moment you run a command in Bash until it finishes execution.",
          hint: "Discuss fork(), execve(), PATH resolution, file descriptor duplication, and waitpid().",
        },
      },
      "cybersecurity-analyst": {
        language: "Linux Administration, TCP/IP & Python Automation",
        week1Title: "TCP/IP Protocol Dissection, Linux Hardening & Python Security Scripting",
        concepts: [
          "TCP/IP stack: Packet headers, 3-way handshakes, ARP, DNS resolution, and Wireshark dissection",
          "Linux hardening: UFW/iptables firewall rules, SSH public-key hardening & PAM controls",
          "Python socket programming for network discovery, port scanning, and banner grabbing",
        ],
        practiceLab: "Analyze pcap network captures using Wireshark and tcpdump to detect cleartext credential transmissions.",
        projectDeliverable: "Multi-Threaded Port Scanner & Security Vulnerability Banner Detector in Python.",
        quizQuestion: {
          question: "In a TCP 3-way handshake, what flags are sent across the three phases between client and server?",
          options: [
            "SYN -> SYN-ACK -> ACK",
            "ACK -> SYN -> FIN",
            "SYN -> RST -> ACK",
            "HELO -> AUTH -> OK",
          ],
          correct_index: 0,
          explanation: "The client sends SYN, the server responds with SYN-ACK, and the client confirms with ACK, establishing the bidirectional connection.",
        },
        interviewQuestion: {
          question: "Explain the difference between Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF).",
          hint: "XSS executes malicious code in the victim's browser context; CSRF tricks an authenticated browser into submitting unauthorized requests.",
        },
      },
      "data-analyst": {
        language: "Advanced SQL & Python Data Manipulation",
        week1Title: "Relational SQL (Window Functions & CTEs) & Python (Pandas) Data Wrangling",
        concepts: [
          "Advanced SQL: Window functions (RANK, DENSE_RANK, ROW_NUMBER, LAG/LEAD) & CTEs",
          "Relational schema normalization (1NF-3NF), primary/foreign keys & B-tree indexes",
          "Python Pandas: DataFrame indexing, groupbys, pivot tables & handling missing data",
        ],
        practiceLab: "Write complex SQL queries solving 30-day cohort retention and month-over-month revenue trends.",
        projectDeliverable: "Automated SQL + Pandas Data Hygiene & Cohort Analysis Pipeline.",
        quizQuestion: {
          question: "What is the difference between RANK() and DENSE_RANK() in SQL window functions?",
          options: [
            "RANK() skips subsequent rank numbers after ties; DENSE_RANK() produces consecutive rank numbers",
            "RANK() only works on numbers; DENSE_RANK() works on strings",
            "DENSE_RANK() requires ORDER BY DESC; RANK() defaults to ASC",
            "There is no difference",
          ],
          correct_index: 0,
          explanation: "If two rows tie for 1st place, RANK() gives 1, 1, 3 (skips 2); DENSE_RANK() gives 1, 1, 2.",
        },
        interviewQuestion: {
          question: "How do you investigate and diagnose an unexpected 15% drop in weekly active users (WAU)?",
          hint: "Segment by device, OS, geography, traffic source, new vs returning users, release dates, and tracking instrumentation.",
        },
      },
      "mobile-dev": {
        language: "Dart, Flutter & Kotlin Fundamentals",
        week1Title: "Mobile Framework Syntax, Component Lifecycles & Reactive State",
        concepts: [
          "Modern mobile language features: Null safety, type inference & asynchronous streams",
          "Widget/Component rendering trees, build contexts, and lifecycle hooks",
          "Device platform bridges: Native APIs, sandboxed filesystems, and permission models",
        ],
        practiceLab: "Build an interactive multi-screen mobile counter with persistent local state storage.",
        projectDeliverable: "Mobile Personal Expense & Budget Tracker App with Local SQLite / Hive Storage.",
        quizQuestion: {
          question: "What is the difference between Hot Reload and Hot Restart in Flutter / React Native?",
          options: [
            "Hot Reload updates UI code while preserving application state; Hot Restart destroys state and restarts the app runtime",
            "Hot Reload only works on iOS; Hot Restart is for Android",
            "Hot Restart recompiles native C++ code",
            "Hot Reload is for production releases only",
          ],
          correct_index: 0,
          explanation: "Hot Reload injects updated source code into the running VM without losing current app state; Hot Restart completely resets VM state.",
        },
        interviewQuestion: {
          question: "How do you prevent UI stutter (jank) and maintain 60/120 FPS on resource-constrained mobile devices?",
          hint: "Keep the main UI thread free by delegating heavy computations to background isolates/workers, optimizing image caching, and reusing list items.",
        },
      },
    };

    // Fallback language spec for unlisted roles
    const activeLangSpec = ROLE_LANGUAGE_SPECS[roleId] || {
      language: `${requiredSkills[0]} & Modern Architecture`,
      week1Title: `${requiredSkills[0]} Foundations & Core Environment`,
      concepts: [
        `Core principles, taxonomy, and execution paradigms of ${requiredSkills[0]}`,
        "Professional development environment setup, automated linters, and version control",
        "Clean architecture, memory bounds, and defensive programming standards",
      ],
      practiceLab: `Implement an end-to-end baseline application demonstrating clean code patterns in ${requiredSkills[0]}.`,
      projectDeliverable: `CLI Production Prototype in ${requiredSkills[0]} with Automated Unit Tests.`,
      quizQuestion: {
        question: `What is the primary architectural guideline when initiating a production project in ${requiredSkills[0]}?`,
        options: [
          "Separation of concerns, deterministic testing, and explicit error handling",
          "Minimizing variable character counts",
          "Avoiding all external documentation",
          "Hardcoding configuration credentials",
        ],
        correct_index: 0,
        explanation: "Separation of concerns and test coverage guarantee maintainability and zero regressions in production.",
      },
      interviewQuestion: {
        question: `Explain how you evaluate technical trade-offs when selecting tools for ${roleName}.`,
        hint: "Discuss developer velocity vs latency, community ecosystem support, maintenance costs, and team competency.",
      },
    };

    // Distribute totalWeeks across 3 or 4 phases
    const numPhases = totalWeeks <= 4 ? 2 : totalWeeks <= 12 ? 3 : 4;
    const weeksPerPhase = Math.ceil(totalWeeks / numPhases);

    const phaseThemes = [
      {
        title: "Phase 01: Core Foundations & Language Paradigms",
        description: `Master syntax, memory models, environment tooling, and algorithmic basics in ${activeLangSpec.language}.`,
      },
      {
        title: "Phase 02: Architecture, Frameworks & State Integration",
        description: `Build modular components, design transactional schemas, and integrate core production libraries.`,
      },
      {
        title: "Phase 03: Production Systems, Testing & Cloud Workflows",
        description: `Implement automated CI/CD, security hardening, performance profiling, and containerized deployment.`,
      },
      {
        title: "Phase 04: Capstone Deliverables & Technical Interview Placement",
        description: `Deploy production portfolio projects, conduct system design whiteboarding, and master behavioral evaluations.`,
      },
    ];

    const phases: RoadmapPhase[] = [];
    let globalWeekCounter = 1;

    for (let pIdx = 0; pIdx < numPhases; pIdx++) {
      const theme = phaseThemes[pIdx];
      const phaseWeeksCount = pIdx === numPhases - 1
        ? totalWeeks - globalWeekCounter + 1
        : Math.min(weeksPerPhase, totalWeeks - globalWeekCounter + 1);

      if (phaseWeeksCount <= 0) break;

      const phaseWeeks: RoadmapWeek[] = [];
      const phaseSkills: string[] = [];

      for (let wIdx = 0; wIdx < phaseWeeksCount; wIdx++) {
        const wNum = globalWeekCounter;
        globalWeekCounter++;

        let primarySkill = "";
        let weekTitle = "";
        let concepts: string[] = [];
        let practiceLab = "";
        let projectDeliverable = "";
        let quizQ = activeLangSpec.quizQuestion;
        let interviewQ = activeLangSpec.interviewQuestion;

        if (wNum === 1) {
          primarySkill = activeLangSpec.language;
          weekTitle = activeLangSpec.week1Title;
          concepts = activeLangSpec.concepts;
          practiceLab = activeLangSpec.practiceLab;
          projectDeliverable = activeLangSpec.projectDeliverable;
        } else if (wNum <= 4 && curriculum.oneMonthSprint[wNum - 1]) {
          const unit = curriculum.oneMonthSprint[wNum - 1];
          primarySkill = requiredSkills[(wNum - 1) % requiredSkills.length];
          weekTitle = unit.title;
          concepts = unit.topics.flatMap((t: any) => t.subtopics).slice(0, 3);
          practiceLab = `Implement hands-on code labs for ${unit.title} following industry standards.`;
          projectDeliverable = unit.microProject.title;
          interviewQ = {
            question: unit.interviewQuestions[0] || `Explain your approach to ${unit.title}.`,
            hint: "Structure your response with clear architectural rationale and concrete examples.",
          };
        } else {
          const skillIndex = (wNum - 1) % requiredSkills.length;
          const assignedSkill = requiredSkills[skillIndex];
          primarySkill = assignedSkill;

          if (wNum <= 8) {
            weekTitle = `${assignedSkill} · Modular Architecture & Design`;
            concepts = [
              `Component decomposition and service interfaces with ${assignedSkill}`,
              "Error handling, input validation, and boundary conditions",
              "Database schemas, transactional isolation, and query optimization",
            ];
            practiceLab = `Build a modular service implementing clean architecture with ${assignedSkill}.`;
            projectDeliverable = `Modular ${assignedSkill} Service Prototype with Automated Integration Tests.`;
          } else if (wNum <= 16) {
            weekTitle = `${assignedSkill} · Scaling, Security & Performance Profiling`;
            concepts = [
              `Performance benchmarking and memory leak diagnostics in ${assignedSkill}`,
              "Authentication, authorization, and OWASP security controls",
              "Containerization with Docker and multi-stage production builds",
            ];
            practiceLab = `Profile CPU and memory bottlenecks under simulated load using benchmark suites.`;
            projectDeliverable = `Hardened, Containerized ${assignedSkill} Production Pipeline with Docker.`;
          } else {
            weekTitle = `${assignedSkill} · System Design & Interview Placement Sprint`;
            concepts = [
              "High-Level System Design (HLD) and distributed consensus principles",
              "Low-Level Design (LLD): Gang of Four design patterns and SOLID principles",
              "Technical interview drills, live coding whiteboard screening, and STAR stories",
            ];
            practiceLab = `Solve advanced algorithmic problems and whiteboard system architectures under timed conditions.`;
            projectDeliverable = `Full-Scale Production Capstone Showcase with Architectural Case Study.`;
          }

          quizQ = {
            question: `What is the primary factor when scaling ${assignedSkill} under high concurrent load?`,
            options: [
              "Horizontal scaling with stateless services, caching, and connection pooling",
              "Increasing the font size of code comments",
              "Running all services on a single bare-metal core",
              "Eliminating database indexes",
            ],
            correct_index: 0,
            explanation: "Stateless architectures paired with caching (Redis) and database connection pools allow elastic horizontal scaling.",
          };
          interviewQ = {
            question: `How do you diagnose and resolve a severe production latency degradation in ${assignedSkill}?`,
            hint: "Discuss APM telemetry, p99 latency breakdowns, slow query logs, thread contention, and caching strategies.",
          };
        }

        if (!phaseSkills.includes(primarySkill)) {
          phaseSkills.push(primarySkill);
        }

        const weekTopics = concepts.length > 0 ? concepts : [
          `${primarySkill} Foundations & Architecture`,
          `${primarySkill} Applied Patterns & Best Practices`,
          `${primarySkill} Production Implementation & Edge Cases`,
        ];

        // Generate topic-driven tasks for this week (No fake hardcoded quiz tasks)
        const weekTasks: RoadmapTask[] = [
          {
            id: `w${wNum}_t1_topic`,
            title: `Topic 1: ${weekTopics[0]}`,
            type: "learn",
            skill_id: primarySkill,
            estimated_minutes: Math.max(45, Math.round(params.weeklyHours * 60 * 0.2)),
            difficulty: wNum <= 2 ? "beginner" : wNum <= 8 ? "intermediate" : "advanced",
            prerequisites: wNum === 1 ? [] : [requiredSkills[0]],
            status: wNum === 1 ? "available" : "locked",
            evidence_required: false,
            why_this_now: `Week ${wNum} establishes the core conceptual framework for ${primarySkill} required by ${roleName}.`,
            concepts: [weekTopics[0], "Design Principles & Syntax", "Standard Patterns"],
          },
          {
            id: `w${wNum}_t2_topic`,
            title: `Topic 2: ${weekTopics[1] || `${primarySkill} Applied Patterns`}`,
            type: "learn",
            skill_id: primarySkill,
            estimated_minutes: Math.max(45, Math.round(params.weeklyHours * 60 * 0.2)),
            difficulty: wNum <= 2 ? "beginner" : wNum <= 8 ? "intermediate" : "advanced",
            prerequisites: [primarySkill],
            status: wNum === 1 ? "available" : "locked",
            evidence_required: false,
            why_this_now: "Applies architectural principles to modular software components.",
            concepts: [weekTopics[1] || `${primarySkill} Patterns`, "Error Handling & Robustness"],
          },
          {
            id: `w${wNum}_t3_practice`,
            title: `Hands-On Lab: ${primarySkill} Implementation Drills`,
            type: "practice",
            skill_id: primarySkill,
            estimated_minutes: Math.max(60, Math.round(params.weeklyHours * 60 * 0.3)),
            difficulty: wNum <= 2 ? "beginner" : wNum <= 8 ? "intermediate" : "advanced",
            prerequisites: [primarySkill],
            status: wNum === 1 ? "available" : "locked",
            evidence_required: false,
            why_this_now: "Hands-on execution solidifies syntax and algorithmic fluency with automated test verification.",
            practice_prompt: practiceLab,
          },
          {
            id: `w${wNum}_t4_project`,
            title: `Practical Mini-Deliverable: ${projectDeliverable}`,
            type: "project",
            skill_id: primarySkill,
            estimated_minutes: Math.max(60, Math.round(params.weeklyHours * 60 * 0.3)),
            difficulty: wNum <= 2 ? "beginner" : wNum <= 8 ? "intermediate" : "advanced",
            prerequisites: [primarySkill],
            status: wNum === 1 ? "available" : "locked",
            evidence_required: true,
            why_this_now: "Builds a public portfolio artifact demonstrating clean code, documentation, and automated tests.",
            project_spec: {
              title: `${primarySkill} Practical Module`,
              deliverable: projectDeliverable,
              rubric: "Functional correctness (40%), test coverage (30%), architecture documentation (30%).",
            },
          },
        ];

        phaseWeeks.push({
          id: `week_${wNum}`,
          week_number: wNum,
          title: weekTitle,
          primary_skill: primarySkill,
          objective: `Understand core principles of ${primarySkill} and build production deliverables.`,
          learning_objectives: [
            `Master architectural principles and core foundations of ${primarySkill}`,
            `Apply practical implementations and hands-on coding patterns in ${primarySkill}`,
            `Validate production competency via weekly 15-question assessment (>=75% pass threshold)`,
          ],
          topics: weekTopics,
          estimated_hours: Math.round(params.weeklyHours),
          learning_hours: Math.round(params.weeklyHours * 0.45 * 10) / 10,
          practice_hours: Math.round(params.weeklyHours * 0.35 * 10) / 10,
          assessment_hours: Math.round(params.weeklyHours * 0.20 * 10) / 10,
          assessment_status: "pending",
          passing_score: 12,
          total_questions: 15,
          tasks: weekTasks,
          completion_percentage: 0,
          status: wNum === 1 ? "in_progress" : "locked",
        });
      }

      phases.push({
        id: `phase_${pIdx + 1}`,
        phase_number: pIdx + 1,
        title: theme.title,
        description: theme.description,
        estimated_hours: phaseWeeksCount * Math.round(params.weeklyHours),
        duration_weeks: phaseWeeksCount,
        skills: phaseSkills,
        status: pIdx === 0 ? "in_progress" : "locked",
        completion_percentage: 0,
        weeks: phaseWeeks,
      });
    }

    const skillGaps: SkillGapItem[] = requiredSkills.map((s, idx) => ({
      skill: s,
      category: idx === 0 ? "Foundations" : idx < 3 ? "Core Engineering" : "Advanced Systems",
      difficulty: idx === 0 ? 1 : idx < 3 ? 2 : 3,
      current_level: idx === 0 ? 30 : 15,
      current_state: idx === 0 ? "Developing" : "Beginner",
      target_level: 85,
      gap_size: idx === 0 ? 55 : 70,
      priority: idx === 0 ? "Critical" : "High",
      priority_score: 90 - idx * 8,
      estimated_hours: 30 + idx * 5,
      is_core: idx < 3,
      market_demand: 95 - idx * 3,
      prerequisites: idx === 0 ? [] : [{ skill: requiredSkills[0], satisfied: true, level: 1 }],
      all_prerequisites_met: true,
      description: `Core requirement for ${roleName}.`,
    }));

    return {
      id: `roadmap_local_${Date.now()}`,
      user_id: params.userId || "guest_user",
      target_role_id: roleId,
      target_role_name: roleName,
      target_role_category: category,
      experience_level: params.experienceLevel,
      weekly_hours: params.weeklyHours,
      target_date: params.targetDate || new Date(Date.now() + totalWeeks * 7 * 86400000).toISOString().split("T")[0],
      target_timeline_months: months,
      total_weeks: totalWeeks,
      learning_preference: params.learningPreference,
      goal: params.goal,
      current_role: params.currentRole,
      overlapping_skills: [],
      specialization: params.specialization,
      mvcp_mode: params.mvcpMode || false,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      engine_version: "v4.0-adaptive",
      feasibility: {
        status: capacityRatio >= 1 ? "feasible" : capacityRatio >= 0.8 ? "tight" : "conflict",
        headline: capacityRatio >= 1 ? "Optimal Schedule" : "Capacity Adjustment Recommended",
        message: `At ${params.weeklyHours} hrs/week you have ${availableHours}h available for ${requiredHours}h of coursework across ${totalWeeks} weeks.`,
        capacity_ratio: capacityRatio,
        total_required_hours: requiredHours,
        available_hours: availableHours,
        hours_balance: availableHours - requiredHours,
        recommended_weekly_hours: Math.max(5, Math.round(requiredHours / totalWeeks)),
        realistic_target_date: new Date(Date.now() + Math.ceil(requiredHours / params.weeklyHours) * 7 * 86400000).toISOString().split("T")[0],
      },
      skill_gaps: skillGaps,
      phases,
      mastery_weights: { learning: 0.15, practice: 0.25, assessment: 0.3, project: 0.2, interview: 0.1 },
      overall_completion_pct: 0,
      careerverse_skill_mastery_pct: 0,
    };
  },

  _adaptClientFallback(
    roadmap: RoadmapPlan,
    eventType: string,
    payload: Record<string, unknown>
  ): RoadmapPlan {
    const copy = JSON.parse(JSON.stringify(roadmap)) as RoadmapPlan;
    let notice: AdaptationNotice | undefined;

    if (eventType === "task_completed") {
      const taskId = String(payload.task_id || "");
      for (const p of copy.phases) {
        for (const w of p.weeks) {
          for (const t of w.tasks) {
            if (t.id === taskId) {
              t.status = "completed";
              t.completed_at = new Date().toISOString();
              if (payload.github_url) {
                t.github_evidence_url = String(payload.github_url);
              }
            }
          }
          const wDone = w.tasks.filter((t) => t.status === "completed").length;
          w.completion_percentage = Math.round((wDone / Math.max(1, w.tasks.length)) * 100);
          if (w.completion_percentage === 100) w.status = "completed";
        }
        const allPTasks = p.weeks.flatMap((w) => w.tasks);
        const pDone = allPTasks.filter((t) => t.status === "completed").length;
        p.completion_percentage = Math.round((pDone / Math.max(1, allPTasks.length)) * 100);
        if (p.completion_percentage === 100) p.status = "completed";
      }

      // Unlock next week sequentially if previous week is 100% complete
      const flatWeeks = copy.phases.flatMap((phase) => phase.weeks);
      for (let i = 0; i < flatWeeks.length - 1; i++) {
        if (flatWeeks[i].completion_percentage === 100 && flatWeeks[i + 1].status === "locked") {
          flatWeeks[i + 1].status = "in_progress";
          flatWeeks[i + 1].tasks.forEach((task) => {
            if (task.status === "locked") task.status = "available";
          });
          for (const phase of copy.phases) {
            if (phase.weeks.some((week) => week.id === flatWeeks[i + 1].id) && phase.status === "locked") {
              phase.status = "in_progress";
            }
          }
        }
      }
    } else if (eventType === "assessment_result") {
      const score = Number(payload.score || 0);
      const skillId = String(payload.skill_id || "");
      const taskId = String(payload.task_id || "");

      if (score < 60) {
        notice = {
          type: "remediation",
          title: `Adaptive Remediation Activated for ${skillId}`,
          message: `Score of ${score}% is below the 60% threshold. Inserted concept review and extra practice.`,
          action_taken: "Inserted remediation clinic task.",
        };
        for (const p of copy.phases) {
          for (const w of p.weeks) {
            const idx = w.tasks.findIndex((t) => t.id === taskId);
            if (idx !== -1) {
              w.tasks[idx].status = "needs_review";
              w.tasks[idx].last_score = score;
              w.tasks.splice(idx + 1, 0, {
                id: `remediation_${Date.now()}`,
                title: `Remediation Clinic: ${skillId} Knowledge Boost`,
                type: "practice",
                skill_id: skillId,
                estimated_minutes: 60,
                difficulty: "intermediate",
                prerequisites: [],
                status: "available",
                evidence_required: false,
                why_this_now: "Targeted remediation generated to address diagnostic quiz misconceptions.",
                practice_prompt: `Review edge cases and re-solve fundamentals for ${skillId}.`,
              });
              break;
            }
          }
        }
      } else {
        notice = {
          type: "acceleration",
          title: `High Mastery: ${skillId} (${score}%)`,
          message: `Great job! Downstream milestones unlocked.`,
          action_taken: "Unlocked next modules.",
        };
        for (const p of copy.phases) {
          for (const w of p.weeks) {
            const t = w.tasks.find((t) => t.id === taskId);
            if (t) {
              t.status = "completed";
              t.last_score = score;
            }
          }
        }
      }
    }

    const allTasks = copy.phases.flatMap((p) => p.weeks.flatMap((w) => w.tasks));
    const compCount = allTasks.filter((t) => t.status === "completed").length;
    copy.overall_completion_pct = Math.round((compCount / Math.max(1, allTasks.length)) * 100);
    copy.careerverse_skill_mastery_pct = copy.overall_completion_pct;
    copy.latest_adaptation = notice;
    copy.updated_at = new Date().toISOString();

    return copy;
  },

  _simulateClientFallback(
    roadmap: RoadmapPlan,
    params: { weeklyHours: number; targetDate?: string; mvcpMode?: boolean }
  ): RoadmapSimulationResult {
    const weeks = roadmap.total_weeks || 24;
    const reqHours = params.mvcpMode ? Math.round(roadmap.feasibility.total_required_hours * 0.65) : roadmap.feasibility.total_required_hours;
    const availHours = Math.round(weeks * params.weeklyHours);
    const ratio = availHours / Math.max(1, reqHours);
    const realisticWeeks = Math.ceil(reqHours / params.weeklyHours);
    const finishDate = new Date(Date.now() + realisticWeeks * 7 * 86400000).toISOString().split("T")[0];

    return {
      simulated_weekly_hours: params.weeklyHours,
      simulated_weeks: weeks,
      simulated_mvcp_mode: params.mvcpMode || false,
      effective_required_hours: reqHours,
      available_capacity_hours: availHours,
      hours_balance: availHours - reqHours,
      capacity_ratio: Math.round(ratio * 100) / 100,
      feasibility_status: ratio >= 1 ? "feasible" : ratio >= 0.8 ? "tight" : "conflict",
      headline: ratio >= 1 ? "Simulated Schedule: Feasible & Comfortable" : "Simulated Schedule: Adjustment Required",
      recommendation: ratio >= 1 ? "Projected to finish comfortably on schedule." : "Increase weekly hours to stay ahead.",
      projected_finish_date: finishDate,
    };
  },

  async _generateAssessmentGroqFallback(params: {
    roadmapId: string;
    weekId: string;
    weekNumber: number;
    role: string;
    userLevel: string;
    topics: string[];
    learningObjectives?: string[];
    weakTopics?: string[];
    attemptNumber?: number;
  }): Promise<WeeklyAssessment> {
    const groqApiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
    const assessmentId = `assess_${Math.random().toString(36).substring(2, 11)}`;
    const difficultyDist = params.userLevel.toLowerCase() === "advanced"
      ? { easy: 3, medium: 7, hard: 5 }
      : params.userLevel.toLowerCase() === "intermediate"
      ? { easy: 4, medium: 8, hard: 3 }
      : { easy: 5, medium: 7, hard: 3 };

    if (groqApiKey) {
      try {
        const promptInstruction = `You are an expert technical examiner. Return a JSON object with key "questions" containing an array of exactly 15 multiple-choice questions matching the requested topics and difficulty distribution (${difficultyDist.easy} easy, ${difficultyDist.medium} medium, ${difficultyDist.hard} hard). Each question must strictly contain:
- id: string e.g. "q1" to "q15"
- question: clear, precise, unambiguous technical question
- options: array of exactly 4 distinct strings
- correctAnswer: integer (0, 1, 2, or 3) indicating the single correct option index
- difficulty: "easy" | "medium" | "hard"
- topicId: string matching one of the given topics
- learningObjectiveId: string
- explanation: detailed technical explanation
${params.weakTopics && params.weakTopics.length > 0 ? `CRITICAL: Focus at least 8 questions on these weak topics: ${params.weakTopics.join(", ")}.` : ""}
Do NOT generate markdown, only valid JSON.`;

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            response_format: { type: "json_object" },
            max_tokens: 4096,
            temperature: 0.25,
            messages: [
              { role: "system", content: promptInstruction },
              {
                role: "user",
                content: `Generate exactly 15 JSON multiple choice questions for role: ${params.role}, level: ${params.userLevel}, week: ${params.weekNumber}, topics: ${params.topics.join(", ")}`,
              },
            ],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = JSON.parse(data.choices[0].message.content);
          if (Array.isArray(content.questions) && content.questions.length >= 10) {
            const rawQs: AssessmentQuestion[] = content.questions.map((q: any, idx: number) => ({
              id: q.id || `q_${idx + 1}`,
              question: q.question,
              options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
              difficulty: q.difficulty || "medium",
              topicId: q.topicId || (params.topics[idx % params.topics.length] || "General"),
              learningObjectiveId: q.learningObjectiveId || `lo_${(idx % 3) + 1}`,
              explanation: q.explanation || "Correct answer validates core competency standards.",
            }));

            sessionStorage.setItem(`cv_assess_answers_${assessmentId}`, JSON.stringify(rawQs));

            return {
              id: assessmentId,
              roadmap_id: params.roadmapId,
              week_id: params.weekId,
              week_number: params.weekNumber,
              role: params.role,
              user_level: params.userLevel,
              attempt_number: params.attemptNumber || 1,
              passing_score: 12,
              total_questions: 15,
              passing_percentage: 75,
              difficulty_distribution: difficultyDist,
              questions: rawQs.map((q) => ({
                id: q.id,
                question: q.question,
                options: q.options,
                difficulty: q.difficulty,
                topicId: q.topicId,
                learningObjectiveId: q.learningObjectiveId,
              })),
              status: "in_progress",
            };
          }
        }
      } catch (err) {
        console.warn("Client Groq direct call failed, synthesizing questions:", err);
      }
    }

    const synQs = this._synthesizeClientQuestions(params.topics, params.weakTopics);
    sessionStorage.setItem(`cv_assess_answers_${assessmentId}`, JSON.stringify(synQs));

    return {
      id: assessmentId,
      roadmap_id: params.roadmapId,
      week_id: params.weekId,
      week_number: params.weekNumber,
      role: params.role,
      user_level: params.userLevel,
      attempt_number: params.attemptNumber || 1,
      passing_score: 12,
      total_questions: 15,
      passing_percentage: 75,
      difficulty_distribution: difficultyDist,
      questions: synQs.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        difficulty: q.difficulty,
        topicId: q.topicId,
        learningObjectiveId: q.learningObjectiveId,
      })),
      status: "in_progress",
    };
  },

  _submitAssessmentClientFallback(params: {
    assessmentId: string;
    weekId: string;
    roadmap: RoadmapPlan;
    answers: Record<string, number>;
  }): AssessmentSubmissionResult {
    let storedQuestions: AssessmentQuestion[] = [];
    const cached = sessionStorage.getItem(`cv_assess_answers_${params.assessmentId}`);
    if (cached) {
      storedQuestions = JSON.parse(cached);
    } else {
      let foundWeek: RoadmapWeek | undefined;
      for (const p of params.roadmap.phases) {
        foundWeek = p.weeks.find((w) => w.id === params.weekId);
        if (foundWeek) break;
      }
      storedQuestions = this._synthesizeClientQuestions(foundWeek?.topics || ["Foundations"]);
    }

    let correctCount = 0;
    const diffBreakdown: Record<string, { correct: number; total: number }> = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
    };
    const topicStats: Record<string, { correct: number; total: number }> = {};
    const questionsReview = [];

    for (const q of storedQuestions) {
      const userAns = params.answers[q.id];
      const correctAns = q.correctAnswer ?? 0;
      const diff = q.difficulty || "medium";
      const topic = q.topicId || "General";

      if (!diffBreakdown[diff]) diffBreakdown[diff] = { correct: 0, total: 0 };
      diffBreakdown[diff].total += 1;

      if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
      topicStats[topic].total += 1;

      const isCorrect = userAns === correctAns;
      if (isCorrect) {
        correctCount += 1;
        diffBreakdown[diff].correct += 1;
        topicStats[topic].correct += 1;
      }

      questionsReview.push({
        id: q.id,
        question: q.question,
        options: q.options,
        user_answer: userAns,
        correct_answer: correctAns,
        is_correct: isCorrect,
        difficulty: diff,
        topic,
        explanation: q.explanation || "Correct answer validates established industry practices.",
      });
    }

    const percentage = Math.round((correctCount / Math.max(1, storedQuestions.length)) * 100);
    const passed = correctCount >= 12;

    const topicPerformance: Record<string, { correct: number; total: number; percentage: number }> = {};
    const weakTopics: string[] = [];
    for (const [top, st] of Object.entries(topicStats)) {
      const pct = Math.round((st.correct / Math.max(1, st.total)) * 100);
      topicPerformance[top] = { correct: st.correct, total: st.total, percentage: pct };
      if (pct < 70) weakTopics.push(top);
    }

    const copy = JSON.parse(JSON.stringify(params.roadmap)) as RoadmapPlan;
    let currentWeekNum = 1;
    for (const p of copy.phases) {
      for (const w of p.weeks) {
        if (w.id === params.weekId) {
          currentWeekNum = w.week_number;
          w.best_score = Math.max(w.best_score || 0, correctCount);
          w.last_score = correctCount;
          w.assessment_status = passed ? "passed" : "failed";
          if (passed) {
            w.completion_percentage = 100;
            w.status = "completed";
            w.tasks.forEach((t) => (t.status = "completed"));
          } else {
            w.status = "in_progress";
            const aTask = w.tasks.find((t) => t.type === "assessment");
            if (aTask) {
              aTask.status = "needs_review";
              aTask.last_score = correctCount;
            }
          }
        }
      }
    }

    if (passed) {
      const nextNum = currentWeekNum + 1;
      for (const p of copy.phases) {
        for (const w of p.weeks) {
          if (w.week_number === nextNum) {
            w.status = "in_progress";
            p.status = "in_progress";
            w.tasks.forEach((t) => {
              if (t.status === "locked") t.status = "available";
            });
          }
        }
      }
    }

    const allWeeks = copy.phases.flatMap((p) => p.weeks);
    const completedWeeks = allWeeks.filter((w) => w.status === "completed").length;
    copy.overall_completion_pct = Math.round((completedWeeks / Math.max(1, allWeeks.length)) * 100);

    let remediation = null;
    if (!passed) {
      const deficit = 12 - correctCount;
      const weaks = weakTopics.length > 0 ? weakTopics : Object.keys(topicStats).slice(0, 2);
      remediation = {
        headline: `Assessment Not Passed (${correctCount}/15)`,
        required_score: 12,
        actual_score: correctCount,
        deficit,
        message: `You scored ${correctCount}/15 (${percentage}%). Passing requires at least 12/15 (75%). You need ${deficit} more correct answer${deficit > 1 ? "s" : ""} to unlock Week ${currentWeekNum + 1}.`,
        weak_topics: weaks,
        action_steps: [
          ...weaks.map((top) => `Review concepts and error handling in ${top}.`),
          "Practice key exercises in the Hands-On Lab.",
          "Retake the weekly assessment when ready. Your retest will focus on these identified weak areas.",
        ],
      };
    }

    return {
      assessment_id: params.assessmentId,
      week_id: params.weekId,
      week_number: currentWeekNum,
      score: correctCount,
      total_questions: storedQuestions.length,
      percentage,
      passed,
      passing_score: 12,
      difficulty_breakdown: diffBreakdown,
      topic_performance: topicPerformance,
      weak_topics: weakTopics,
      remediation,
      questions_review: questionsReview,
      updated_roadmap: copy,
    };
  },

  _synthesizeClientQuestions(topics: string[], weakTopics?: string[]): AssessmentQuestion[] {
    const pool = weakTopics && weakTopics.length > 0 ? weakTopics : topics;
    const activePool = pool.length > 0 ? pool : ["Core Concepts", "Implementation", "Debugging", "Optimization"];
    const difficulties: ("easy" | "medium" | "hard")[] = [
      "easy", "easy", "easy", "easy", "easy",
      "medium", "medium", "medium", "medium", "medium", "medium", "medium",
      "hard", "hard", "hard"
    ];

    return Array.from({ length: 15 }, (_, i) => {
      const top = activePool[i % activePool.length];
      const diff = difficulties[i];
      return {
        id: `q_${i + 1}`,
        question: `When designing production systems around ${top}, which architecture pattern ensures optimal throughput while avoiding concurrency bottlenecks?`,
        options: [
          "Asynchronous event-driven pipelines with bounded message queues",
          "Synchronous blocking loops on the main rendering/execution thread",
          "Continuous disk polling without thread sleep intervals",
          "Global shared mutable state without thread locks",
        ],
        correctAnswer: 0,
        difficulty: diff,
        topicId: top,
        learningObjectiveId: `lo_${(i % 3) + 1}`,
        explanation: "Asynchronous event-driven architectures decouple ingestion from heavy execution, preventing main-thread blocking and providing bounded memory latency.",
      };
    });
  },

  _interpretCommandFallback(commandText: string): { action: string; value: unknown; explanation: string } {
    const text = commandText.toLowerCase();
    const match = text.match(/(\d+(\.\d+)?)/);
    if (match && text.includes("hour")) {
      const hrs = parseFloat(match[1]);
      return {
        action: "update_weekly_hours",
        value: hrs,
        explanation: `Interpreted request to change study dedication to ${hrs} hrs/week.`,
      };
    }
    if (text.includes("fast track") || text.includes("mvcp") || text.includes("minimal")) {
      return {
        action: "toggle_mvcp",
        value: true,
        explanation: "Enabled Minimum Viable Career Path mode to focus on core essentials.",
      };
    }
    return {
      action: "clarify",
      value: commandText,
      explanation: "Request received. You can adjust hours or ask to skip skills.",
    };
  },
};
