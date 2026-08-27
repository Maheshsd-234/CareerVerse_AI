# CareerVerse AI - Career Guidance Platform

A production-ready web application that provides AI-powered career guidance to Indian students, helping them discover the perfect career path based on their skills and interests.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-blue?logo=tailwindcss)
![Firebase](https://img.shields.io/badge/Firebase-v12-orange?logo=firebase)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)

## 🚀 Features

### Core Features
- ✅ Email/Password Authentication with Firebase Auth
- ✅ Interactive Dashboard with personalized recommendations & progress tracking
- ✅ Career Navigator for 10th, 12th (Science/Commerce/Arts), Diploma & Degree paths
- ✅ Role Explorer covering Tech, Business, and Creative career profiles
- ✅ Skill Gap Analyzer with match percentage algorithms and tailored learning suggestions
- ✅ Dynamic Career Roadmap Generator with multi-year milestones
- ✅ MCQ Aptitude & Interest Assessment evaluated by Gemini AI
- ✅ Real-time AI Career Counselor Chatbot powered by Google Gemini
- ✅ Trending Careers display with industry demand insights and salary projections
- ✅ Real-time Cloud Firestore synchronization
- ✅ Fully responsive SaaS UI optimized for mobile, tablet, and desktop

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite
- **Authentication & Database**: Firebase v12 (Modular SDK - Auth + Firestore)
- **AI Engine**: Google Generative AI (Gemini 2.5 Flash / Flash Lite)
- **Routing**: React Router DOM v7
- **UI & Icons**: Lucide React, Sonner (Toasts)

## 📋 Prerequisites

- Node.js 18+
- Firebase Project with Auth and Firestore enabled
- Google Gemini API Key from Google AI Studio

## 🔧 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Firebase
1. Create a project at [firebase.google.com](https://firebase.google.com)
2. Enable **Email/Password** authentication under *Authentication > Sign-in method*
3. Create a **Firestore Database** in test or production mode
4. Copy your web app configuration credentials

### 3. Get Gemini API Key
Visit [Google AI Studio](https://aistudio.google.com/) to generate an API key.

### 4. Configure Environment
Create a `.env` or `.env.local` file in the `frontend` root:
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

### 5. Run Development Server
```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

## 📁 Project Structure

```
src/
├── components/         # Reusable UI, layout (Navbar, Sidebar), and chat components
│   ├── chatbot/        # AI chat interface & floating widgets
│   ├── layout/         # Header navigation and persistent sidebar
│   └── ui/             # Reusable UI primitives
├── pages/              # View pages
│   ├── assistant/      # DashboardPage, ChatbotPage
│   ├── auth/           # LoginPage, RegisterPage, ProtectedRoute
│   └── career/         # AssessmentPage, CareerNavigatorPage, RoadmapPage,
│                       # RoleExplorerPage, SkillGapPage, TrendingPage
├── services/           # External API & service integrations
│   ├── authService.ts      # Firebase Auth login/signup/logout
│   ├── firestoreService.ts # User profile, assessments, and chat history sync
│   └── geminiService.ts    # AI prompt engineering & Gemini API integration
├── hooks/              # Custom React hooks (useAuth)
├── firebase/           # Firebase initialization & SDK configuration
├── data/               # Static datasets (career paths, roles, skills, questions)
├── types/              # TypeScript interface definitions
└── utils/              # Helper utilities
```

## 🎯 Career Paths & Roles Covered

- **After 10th**: Science | Commerce | Arts | Polytechnic / ITI
- **After 12th (Science)**: CSE, AI/ML, Data Science, ECE, Mechanical, Civil, Medical
- **After 12th (Commerce)**: B.Com, CA, Banking, BBA, Financial Analysis
- **After 12th (Arts/Humanities)**: Law (BA LLB), Civil Services (UPSC), Journalism, Design
- **Professional Careers**: AI Engineer, Full Stack Developer, Data Scientist, Cloud Architect, Cybersecurity Analyst, Chartered Accountant, Product Manager, UI/UX Designer, and more.

## 📊 Database Schema (Firestore)

### Users (`users/{uid}`)
```json
{
  "email": "student@example.com",
  "displayName": "Student Name",
  "skills": ["JavaScript", "Python"],
  "selectedCareer": "AI Engineer",
  "assessmentScore": 85,
  "createdAt": "Timestamp"
}
```

### Assessments (`users/{uid}/assessments/{assessmentId}`)
```json
{
  "score": 85,
  "recommendedCareer": "AI Engineer",
  "categories": { "tech": 90, "business": 70, "creative": 65 },
  "completedAt": "Timestamp"
}
```

## 🚀 Build & Deployment

To create an optimized production build:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```

Deployable to Firebase Hosting, Vercel, Netlify, or AWS Amplify.

## 🐛 Troubleshooting

**Firebase Error?**
- Check your `.env` configuration keys.
- Verify that Email/Password auth and Firestore are enabled in the Firebase Console.

**Gemini API Error?**
- Verify your API key at [Google AI Studio](https://aistudio.google.com/).
- Check model quotas and network access.

## 📄 License

MIT License - Built with ❤️ for Indian Students 🎯
