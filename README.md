# 🎓 CareerVerse AI - Personalized Career Guidance Platform

CareerVerse AI is a full-featured AI-driven career guidance and mentorship platform specifically engineered for Indian students and young professionals. It empowers students from 10th grade through undergraduate degrees to discover tailored career roadmaps, identify skill gaps, take automated aptitude assessments, and consult an AI career counselor in real-time.

---

## 🌟 Key Capabilities

- **🗺️ Career Navigator**: Tailored roadmaps covering 10th, 12th (Science, Commerce, Arts), Diploma, Degree, and Postgraduate options.
- **🔍 Role Explorer**: In-depth profiles of 10+ high-demand professions (AI Engineer, Data Scientist, CA, Cloud Architect, UI/UX, etc.) with salary trends, career progression, and daily responsibilities.
- **⚡ Skill Gap Analyzer**: Compares existing competencies against target job profiles, computing match percentages and providing actionable learning recommendations.
- **📈 Dynamic Roadmaps**: 3–4 year structured learning pathways with milestones, certifications, and recommended resources.
- **📝 AI-Evaluated Assessment**: Interactive MCQ assessments evaluating technical aptitude, logical reasoning, and domain preferences with Google Gemini AI evaluations.
- **🤖 24/7 AI Career Counselor**: Intelligent conversational assistant powered by Google Gemini with conversation history persisted in Firebase Firestore.
- **🔥 Trending Careers**: Real-time insights on high-growth sectors, hiring demand, and salary benchmarks across India.

---

## 🏗️ Architecture & Project Structure

```
CareerVerse/
├── frontend/             # React 19 + TypeScript + Vite + Tailwind CSS v4 Client
│   ├── src/
│   │   ├── pages/        # View pages (Auth, Dashboard, Assessment, Roadmaps, Explorer, Chatbot)
│   │   ├── components/   # Modular UI, Layout (Navbar, Sidebar), and Chatbot components
│   │   ├── services/     # Firebase Auth, Firestore DB sync, and Gemini AI services
│   │   ├── data/         # Career datasets, question banks, and role definitions
│   │   └── hooks/        # Auth state management hooks
│   └── README.md         # Detailed Frontend documentation
├── backend/              # Node.js backend service
│   ├── server.js         # HTTP API server (port 5000)
│   └── README.md         # Backend documentation
└── docs/                 # Project documentation & architectural notes
```

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Authentication & DB** | [Firebase v12](https://firebase.google.com/) (Auth + Cloud Firestore) |
| **AI Engine** | [Google Generative AI](https://ai.google.dev/) (Gemini 2.5 Flash / Flash Lite) |
| **Icons & Notifications** | [Lucide React](https://lucide.dev/), [Sonner](https://sonner.emilkowal.ski/) |
| **Backend** | [Node.js](https://nodejs.org/) HTTP service |

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- Firebase project credentials
- Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 2. Setup Frontend

```bash
cd frontend
npm install
```

Configure your environment file `frontend/.env`:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Gemini API
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_MODEL=gemini-2.5-flash-lite
```

Start the frontend development server:
```bash
npm run dev
```
> App runs at: `http://localhost:5173`

### 3. Setup Backend (Optional)

```bash
cd backend
npm install
npm start
```
> Backend server listens on: `http://localhost:5000`

---

## 📄 License

This project is licensed under the MIT License.
