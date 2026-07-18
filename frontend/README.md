# CareerVerse AI - Career Guidance Platform

A production-ready web application that provides AI-powered career guidance to Indian students, helping them discover the perfect career path based on their skills and interests.

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-blue?logo=tailwindcss)
![Firebase](https://img.shields.io/badge/Firebase-v9-orange?logo=firebase)

## 🚀 Features

### Core Features
- ✅ Email/Password Authentication with Firebase
- ✅ Dashboard with personalized career recommendations
- ✅ Career Navigator for 10th, 12th, Diploma & Degree paths
- ✅ Role Explorer with 9+ professional careers
- ✅ Skill Gap Analyzer with match percentages
- ✅ Dynamic Career Roadmap Generator
- ✅ MCQ Assessment for career recommendations
- ✅ AI Chatbot powered by Google Gemini
- ✅ Trending careers display
- ✅ Real-time Firestore data sync
- ✅ Mobile responsive design
- ✅ Modern SaaS UI

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Firebase (Auth + Firestore)
- **AI**: Google Generative AI (Gemini)
- **Routing**: React Router DOM
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 16+
- Firebase Project
- Google Gemini API Key

## 🔧 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Firebase
1. Create project at [firebase.google.com](https://firebase.google.com)
2. Enable Email/Password authentication
3. Create Firestore Database
4. Copy your config

### 3. Get Gemini API Key
Visit [Google AI Studio](https://makersuite.google.com/app/apikey)

### 4. Configure Environment
Create `.env.local`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173`

## 📁 Project Structure

```
src/
├── pages/              # Page components
├── components/         # Reusable components
├── services/           # API services
├── hooks/              # Custom hooks
├── firebase/           # Firebase config
├── data/               # Static data (roles, paths, skills)
├── types/              # TypeScript types
└── utils/              # Utilities
```

## 🎯 Career Paths

### After 10th
- Science | Commerce | Arts

### After 12th
- Science: CSE, AI/ML, ECE, Mechanical, Civil
- Commerce: B.Com, CA, Banking, BBA
- Arts: BA, UPSC, Law

### Professional Roles Covered
- AI Engineer
- Full Stack Developer
- Data Scientist
- Cybersecurity Analyst
- Chartered Accountant
- Banker & Government roles

## 📊 Database Schema

### Users
```
users/{uid}
├── email
├── displayName
├── skills: []
├── selectedCareer
├── assessmentScore
└── createdAt
```

### Assessments
```
users/{uid}/assessments/{timestamp}
├── score
├── recommendedCareer
└── categories: {tech, business, creative}
```

## 🚀 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Other: Vercel, Netlify, GitHub Pages

## 📱 Responsive
- Mobile optimized
- Tablet friendly
- Desktop full-featured
- Touch-friendly UI

## 🔐 Security
- Firebase Authentication
- Protected routes
- Environment variables
- Firestore security rules (configure)

## 📈 Performance
- ~150KB gzipped bundle
- Code splitting
- Lazy loading
- Fast Vite builds

## ✨ UI Features
- Modern SaaS design
- Smooth animations
- Gradient backgrounds
- Loading states
- Card-based layout
- Responsive sidebar

## 🤖 AI Features
- Gemini-powered chatbot
- Career recommendations
- Real-time responses
- Chat history persistence

## 📚 Learning Paths
3-4 year structured paths with:
- Year-by-year milestones
- Skill progression
- Exam information
- Resource links

## 🐛 Troubleshooting

**Firebase Error?**
- Check .env.local
- Verify API keys
- Check Firebase console

**Gemini API Error?**
- Verify API key
- Check quota
- Review console logs

**Build Issues?**
- Delete node_modules
- Run npm install
- Clear cache

## 📄 License

MIT License

## 🎓 Built For
Indian students seeking career guidance with AI assistance

---

**Live Demo**: [Coming Soon]
**Support**: [Add your contact]

Made with ❤️ for Indian Students 🎯

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
