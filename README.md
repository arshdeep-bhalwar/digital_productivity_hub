# Digital Productivity Hub 🚀

Digital Productivity Hub is a modern, student-focused personal productivity web application designed to transform scattered assignments, notes, and goals into clear, prioritized, and executable daily action plans.

![Theme](https://img.shields.io/badge/Theme-Nordic%20Aurora%20Boreal-00FF87?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-v18%2B-0A1628?style=for-the-badge&logo=node.js)
![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini%202.5-8E75FF?style=for-the-badge&logo=google)

---

## 🌟 Core Features

- **🧠 Gemini AI Brain Dump**: Paste unstructured assignment notes or syllabus thoughts to automatically extract structured tasks with deadlines and estimated durations.
- **📋 Priority & Deadline Risk Matrix**: Deterministic 0–100 priority scoring engine combined with real-time deadline risk calculation.
- **🗓️ Smart Day Planner**: Intelligent daily scheduling algorithm allocating task focus blocks with automated 10-minute break buffers.
- **⏱️ Focus Mode Timer**: Pomodoro focus timer with full focus session history and duration logging.
- **🎯 Projects & Goal Milestones**: Interactive project breakdown with live percentage progress tracking (`0% - 100%`) based on subtask completion.
- **🔥 Habit Tracker**: Timezone-aware daily routine streak tracking.
- **📊 Analytics & Productivity DNA**: Live metric calculations and observable behavioral summaries without pseudo-scientific psychological claims.
- **🤖 Generative Productivity Assistant**: Interactive Q&A, exam study planner, and project decomposition tools.

---

## 🏗️ Tech Stack

- **Backend**: Node.js, Express, ES Modules
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security policies)
- **AI Integration**: Google Generative AI (`@google/generative-ai`)
- **Frontend**: Vanilla HTML5, Modern CSS (Nordic Aurora Borealis design system with glassmorphism), Vanilla JS (ES Modules)
- **Testing**: Node.js Native Test Runner (`node --test`)

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18 or higher)
- npm

### 2. Installation & Setup
```bash
# Clone the repository
git clone https://github.com/your-username/digital-productivity-hub.git
cd digital-productivity-hub

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 3. Configure Environment Variables
Edit `.env` to include your Supabase and Gemini credentials:
```env
PORT=5000
APP_ORIGIN=http://localhost:5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

### 4. Database Setup (Supabase)
Run the SQL schema script in your Supabase SQL Editor:
```file
supabase/migrations/01_initial_schema.sql
```

### 5. Running the Application
```bash
# Start local development server
npm start
```

Open your browser at **`http://localhost:5000`** to view the application.

---

## 🧪 Testing

Run the full automated unit test suite:
```bash
npm test
```

---

## 📄 License
MIT License © 2026
