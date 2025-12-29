# Riphah International University Alumni Portal

A comprehensive web application designed to connect alumni, students, and the university administration. This portal facilitates networking, job opportunities, event management, and mentorship programs.

## 🚀 Features

- **Alumni Directory**: Browse and connect with alumni from various batches and departments.
- **Job Board**: View and post job opportunities. Includes intelligent job matching based on skills.
- **Events Management**: Stay updated with university events and register for them.
- **Mentorship**: Connect students with alumni mentors for career guidance.
- **Career Support**: Resources and services for career development.
- **User Roles**: distinct functionality for Students, Alumni, and Administrators.

## 🧠 Deep Dive: System Architecture & Internals

### 1. Frontend Architecture (React + Vite)
The frontend is built as a Single Page Application (SPA) using **React 18** and **TypeScript**.
- **Component Design**:
  - **Pages**: Top-level views (e.g., `Jobs.tsx`, `Directory.tsx`) that handle data fetching and layout.
  - **Components**: Reusable UI blocks.
    - `Hero.tsx`: Uses complex CSS animations (gradient flows) and `Reveal` wrapper for scroll-triggered fade-ins.
    - `Card.tsx` / `IconCard.tsx`: Polymorphic card components for displaying jobs and services.
    - `Modal.tsx`: A portal-based overlay for viewing detailed profiles without navigating away.
- **State Management**:
  - Uses `React.Context` (implied or direct prop drilling) for global auth state.
  - **Custom Hooks**: `useInitialData.ts` centralizes the fetching of Alumni, Jobs, and Events to ensure data consistency across the app.
- **Styling**:
  - **Tailwind CSS** is used exclusively.
  - **Glassmorphism**: Heavy use of `backdrop-blur`, `bg-white/10`, and borders to create a modern, translucent UI aesthetic.

### 2. Backend Logic (Node.js/Express)
The backend acts as the orchestrator between the Database, Frontend, and ML Service.
- **Dynamic Role & Skill Mapping**:
  - On startup, the server reads all job postings.
  - **`detectRole(title)`**: Analyzes job titles against a keyword dictionary (e.g., "React" -> "Frontend", "Django" -> "Backend") to auto-categorize jobs.
  - **`buildRoleSkillMap(jobs)`**: Aggregates all skills listed for a specific role (e.g., "Frontend" jobs generally require "React", "CSS", "TypeScript"). This allows the frontend to suggest relevant skills to users dynamically.
- **Data Seeding**:
  - The server checks if collections (`jobs`, `events`, etc.) are empty on startup.
  - If empty, it loads initial data from `src/Frontend/data/*.js` files, ensuring the app is never "blank" for new developers.

### 3. Machine Learning Skill Gap Analysis (Python/FastAPI)
The `backend/server.py` microservice performs resume parsing and fit scoring.
- **Model Import**: `joblib.load("skill_gap_xgb_model.pkl")` loads a pre-trained **XGBoost Regressor** into memory at startup for fast predictions.
- **Core API Binding**: `CORE_API = "http://localhost:3008/api"` is used to fetch job data and skill lists from the Node backend.
- **Endpoints**:
  - `POST /skill-gap/analyze-pdf`: Compare resume skills to a specific job (`/api/jobs/:id`).
  - `POST /skill-gap/analyze-role-level`: Compare resume skills to role+level skill sets produced by the core backend.
- **Workflow**:
  1.  **PDF Parsing (Hybrid)**: Attempts text extraction via **PyMuPDF (fitz)**; falls back to OCR (`pdf2image` + `pytesseract`) for scanned PDFs.
  2.  **Normalization**: Lowercases text and strips special characters for robust matching.
  3.  **Skill Extraction (Strict Ontology)**: Regex word-boundary matching against a curated ontology of 80+ tech skills (e.g., React, Docker, AWS).
  4.  **Comparison**: Intersects resume skills with job/role-level requirements from the Core API.
  5.  **Feature Vector**: `[matchRatio, matchedCount, missingCount, resumeSkillCount, requiredSkillCount]`.
  6.  **Prediction**: XGBoost returns a 0–1 score, reported as a 0–100 `ml_match_percentage`.

### 4. Top-N ("N1") Skill Filtering
Role- and level-specific skill requirements are derived from real job data using frequency-based filtering and level caps.
- **Source**: CSV dataset loaded by `backend-core/utils/loadjobs.js` produces jobs with `role`, `level`, and `skills`.
- **Route**: `GET /api/skills/by-role-level?role=frontend&level=junior`.
- **Algorithm**:
  1.  Filter jobs by `role` AND `level`.
  2.  Count frequency of each skill across filtered jobs.
  3.  Sort skills by frequency (desc).
  4.  Apply level-specific caps: `intern: 8`, `junior: 12`, `senior: 25`.
  5.  Return the Top‑N skills. This single-pass selection is referred to as "N1 filtering".

### 5. Backend Overview (Node.js/Express)
- **Data Sources**:
  - **MongoDB** for runtime CRUD (users, events, admin-posted jobs, alumni, services).
  - **CSV dataset** for role/level jobs via `backend-core/utils/loadjobs.js`, merged with DB results.
- **Routes**:
  - Auth: `POST /api/login`, `POST /api/signup`.
  - Profiles: `GET /api/profile?email=...`, `PUT /api/profile` (upserts alumni/student profile details).
  - Jobs: `GET /api/jobs` (merges DB + CSV), `GET /api/jobs/:id`, `POST/PUT/DELETE /api/jobs`.
  - Roles & Skills: `GET /api/roles`, `GET /api/skills` (vocabulary), `GET /api/skills/by-role/:role`, `GET /api/skills/by-role-level`.
- **Precomputation & Caching**:
  - On startup, jobs from CSV are enriched with `role` using keyword heuristics and used to build a role→skills map.
  - This avoids repeated DB scans and enables fast, deterministic filtering for role/level requests.

---

## 💾 Database Schema (MongoDB)

The application enforces strict **JSON Schema Validation** at the database level to ensure data integrity.

| Collection | Description | Key Fields |
| :--- | :--- | :--- |
| **`users_v2`** | Auth & User Data | `email` (Unique), `passwordHash`, `salt`, `role` ("admin"\|"student"\|"alumni") |
| **`jobs`** | Job Postings | `title`, `company`, `location`, `skills` (Array), `role` (Auto-detected) |
| **`alumni`** | Alumni Profiles | `name`, `batch`, `department`, `current_company`, `designation` |
| **`events`** | University Events | `title`, `date`, `location`, `description` |
| **`mentors`** | Mentorship Profiles | `name`, `expertise` (Array), `availability` |

> **Note on Security**: User passwords are salted and hashed using **SHA-256** before storage.

---

## 🔌 API Reference

### Authentication
- `POST /api/login`: Returns `{ token, user }`. Supports Admin auto-creation via ENV vars.
- `POST /api/signup`: Registers a new user (Student/Alumni).

### Jobs & Skills
- `GET /api/jobs`: List all jobs.
- `GET /api/jobs/:id`: Get details for a specific job.
- `GET /api/skills/by-role/:role`: Get a list of popular skills for a role (e.g., "frontend").

### ML Service
- `POST /skill-gap/analyze-pdf`:
  - **Input**: `resume` (File), `job_id` (Text).
  - **Output**: JSON object containing extracted skills, missing skills, and the ML fit score.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Language**: TypeScript

### Backend (Node.js)
- **Server**: Express.js
- **Database**: MongoDB (with Mongoose/Native Driver)
- **Authentication**: JWT & Custom Auth
- **Utilities**: CSV parsing for data loading

### Machine Learning Service (Python)
- **Framework**: FastAPI
- **Model**: XGBoost (Skill Gap Analysis)
- **Libraries**: Scikit-learn, Pandas, NumPy, PyMuPDF (PDF parsing)

## 📂 Project Structure

```
alumni-portal/
├── src/                # Frontend Source Code
│   ├── Frontend/
│   │   ├── components/ # Reusable UI components (Hero, Navbar, etc.)
│   │   ├── pages/      # Application Pages (Jobs, Directory, etc.)
│   │   ├── data/       # Static/Mock data
│   │   └── hooks/      # Custom React hooks
│   ├── api.ts          # API integration layer
│   └── ui.tsx          # Core UI primitives
├── server/             # Main Node.js Backend
│   └── index.js        # Express server entry point
├── backend/            # Python ML Service
│   ├── server.py       # FastAPI application
│   └── skill_gap_...   # Pre-trained ML models
└── backend-core/       # Core backend utilities
    └── utils/          # Data loading scripts
```

## ⚡ Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.9+)
- MongoDB (Local or Atlas)

### 1. Installation

Clone the repository:
```bash
git clone <repository-url>
cd alumni-portal
```

### 2. Frontend Setup

Install dependencies and start the React app:
```bash
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

### 3. Backend Setup

Start the Node.js server:
```bash
# In a new terminal
npm run server:dev
```
The backend will run on `http://localhost:3008`.

### 4. ML Service Setup (Optional)

If you want to use the resume analysis features:
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

## 📜 Scripts

- `npm run dev`: Start Frontend (Vite)
- `npm run server:dev`: Start Backend (Nodemon)
- `npm run dev:all`: Start both Frontend and Backend concurrently

## 🛡️ Authentication

The system supports three user roles:
1.  **Student**: Access to jobs, mentorship, and events.
2.  **Alumni**: Can post jobs, offer mentorship, and view directory.
3.  **Admin**: Full system management capabilities.

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request