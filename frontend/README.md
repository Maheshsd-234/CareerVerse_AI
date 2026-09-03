# 💻 CareerVerse AI Frontend

React 19 + TypeScript + Vite single-page application for the **CareerVerse AI** career guidance, assessment, and real-time live employment platform.

---

## 🌟 Included Capabilities & Stations

- 🧭 **Station 01 · Compass Dashboard**: Personalized route tracking, academic stage selection, and stage-specific guidance.
- 🎓 **Station 02 · Indian Education Route**: Stream selection engine for Class 10 & 12 / PUC (Science MPC/BiPC, Commerce, Arts, Polytechnic, ITI).
- 🏛️ **Station 03 · College & Degree Navigator**: College pathways (B.Tech, B.Sc, BCA, B.Com, BBA, MBBS, Law) and entrance exams (JEE, NEET, CUET, KCET, GATE, CAT).
- 🗺️ **Station 04 · AI Dynamic Roadmaps**: 4-year semester-wise milestones, required tech stacks, open-source projects, and recognized certifications.
- 🔎 **Station 05 · Role Explorer**: 20+ career profiles (AI Engineer, Full Stack Developer, Data Analyst, Cloud Architect, etc.) with real-world Indian salary benchmarks (LPA).
- ⚡ **Station 06 · Skill Gap Analyzer**: Match percentage calculation against target job descriptions with custom bridge plans.
- 📝 **Station 07 · AI Aptitude & Technical Assessment**: Adaptive MCQ assessments evaluated by AI with scoring breakdown and weak-area diagnostics.
- 🤖 **Station 08 · 24/7 AI Career Counselor**: Ultra-fast LLM counseling with Groq Llama 3.3 70B & Gemini 2.5 Flash, synced with Firebase Firestore.
- 📡 **Station 09 · Live Indian Job Radar**: 100% real-time Adzuna India vacancy feed with tech hub filtering (Bengaluru, Hyderabad, Pune, Mumbai, Delhi NCR, Chennai, Remote), strict internship locking, company logo resolution, and in-memory query caching.

---

## 🛠️ Environment Configuration (`.env`)

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# AI Providers
VITE_GROQ_API_KEY=your_groq_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_MODEL=gemini-2.5-flash

# Adzuna Developer API (Live Jobs)
VITE_ADZUNA_APP_ID=your_adzuna_app_id
VITE_ADZUNA_APP_KEY=your_adzuna_app_key
```

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app runs locally on `http://localhost:5173`.
