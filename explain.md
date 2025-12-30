# Project Documentation: Riphah Alumni Portal

## 🌟 Overview
The **Riphah International University Alumni Portal** is a sophisticated web ecosystem designed to bridge the gap between alumni, current students, and the university administration. It facilitates professional networking, career advancement through AI-powered resume analysis, job matching, and event coordination.

---

## 🏗️ System Architecture
The platform follows a **Microservices-inspired Architecture**, separating the core business logic from the heavy-lifting AI/ML components.

### 1. Frontend (SPA)
- **Tech Stack**: React 18, Vite, TypeScript, Tailwind CSS.
- **Design Philosophy**: **Glassmorphism**. High-quality UI with `backdrop-blur` effects, translucent cards, and smooth animations using Framer Motion.
- **Key Logic**: Centralized data fetching via custom hooks (`useInitialData`), ensuring consistent state for Jobs, Events, and Alumni data.

### 2. Core Backend (Orchestrator)
- **Tech Stack**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **Responsibilities**:
    - **Authentication**: JWT-based login/signup with role-based access (Admin, Student, Alumni).
    - **Job Management**: Automatic role detection and skill mapping for job postings.
    - **Data Seeding**: Smart loading from CSV to populate the system on initial run.
    - **Routing**: API gateway for frontend requests.

### 3. ML Microservice (Intelligence Layer)
- **Tech Stack**: FastAPI (Python).
- **Core Modules**:
    - **`parsers/`**: Handles PDF/DOCX extraction using PyMuPDF (fitz) with OCR fallback.
    - **`nlp/`**: 
        - **NER Extractor**: Hybrid system using spaCy + GLiNER (Zero-shot) + Lexicon-based PhraseMatching.
        - **Skill Matcher**: Compares resume skills against JD requirements.
    - **`scoring/`**:
        - **Semantic Scorer**: Uses SBERT (BAAI/bge-base-en-v1.5) to compute cosine similarity between resume and JD.
        - **Diagnostic Scorer**: Deterministic weights for skills, experience, and formatting.
        - **XGBoost/LGBM Predictor**: Predictive model that calibrates the final ATS score.
    - **`reporting/`**: Generates actionable improvement suggestions using YAKE! keyword analysis.

---

## 🚀 Deep Dive: The AI Resume Analysis Pipeline
The "Analyze" endpoint (`/analyze`) is the crown jewel of the project. It executes an 8-phase pipeline:

1.  **Phase 2 (Parsing)**: Structural metadata extraction (word count, sections).
2.  **Phase 3 (NER)**: Extracting skills, degrees, organizations, and job titles.
3.  **Phase 4 (Semantic Scoring)**: Computing the SBERT similarity score (conceptual fit).
4.  **Phase 5 (Suggestions)**: Identifying missing keywords and formatting improvements.
5.  **Phase 6 (Reporting)**: Assembly of the radar chart and final report.
6.  **Phase 8 (Dual-Head Scoring)**: 
    - **Head 1 (Diagnostic)**: Provides granular feedback (e.g., "Add a Work Experience section").
    - **Head 2 (Predictive)**: Blends SBERT (60%) and XGBoost (40%) for the final ATS percentage.

---

## 💾 Data Management
The system uses **MongoDB** with strict schema validation.
- **`users_v2`**: Stores credentials and roles.
- **`jobs`**: Stores job postings with auto-detected roles and required skills.
- **`alumni`**: Profiles for networking and mentorship.
- **`events`**: University event management.

---

## 🛠️ Project Structure
```
alumni-portal/
├── client/             # Frontend (React + Vite)
│   ├── src/components/ # UI Primitives (Hero, Cards, Modals)
│   ├── src/pages/      # Feature views (Jobs, Directory, Mentorship)
├── server/             # Core Backend (Node.js)
│   ├── controllers/    # Business logic
│   ├── models/         # Database schemas
│   ├── routes/         # API endpoints
├── ml/                 # ML Microservices (FastAPI)
│   ├── resume_analyzer/# Real-time Resume/JD Matching
│   │   ├── main.py     # FastAPI Entry Point
│   │   └── ...         # NLP & Scoring Modules
│   └── skillgap_analysis/# Role-based Career Guidance
│       ├── server.py   # FastAPI Entry Point
│       └── models/     # Role-Level XGBoost Models
└── package.json        # Unified orchestration scripts
```

---

## 🧠 Deep Dive: `ml/resume_analyzer` Internals

The `resume_analyzer` is a high-performance Python microservice built with **FastAPI**. It transforms raw resume files into structured, actionable intelligence.

### 1. `parsers/resume_parser.py` (The Extraction Layer)
- **Hybrid Parsing**: It first attempts high-speed text extraction using **PyMuPDF**. 
- **OCR Fallback**: If the PDF is scanned (contains no text layer), it automatically triggers an OCR pipeline using `pdf2image` and `pytesseract`.
- **Structural Cleanup**: Normalizes whitespace, removes encoding artifacts, and prepares the text for NLP analysis.

### 2. `nlp/ner_extractor.py` (The Feature Engine)
- **Multi-Pronged NER**:
    - **spaCy**: Extracts standard entities like Organizations and Job Titles.
    - **Lexicon Matcher**: A custom-built phrase matcher that recognizes 80+ technology skills.
    - **GLiNER**: A modern Zero-Shot NER model used to catch niche or emerging technologies not in the static lexicon.
- **Alias Normalization**: Maps variants (e.g., "ReactJS", "React.js") to a canonical form ("React") for consistent scoring.

### 3. `scoring/` (The Brain)
- **`semantic_scorer.py`**: Uses **Sentence-Transformers (SBERT)** to calculate the "Conceptual Similarity" between a resume and a JD. This ensures a candidate is rewarded for relevant experience even if they don't use exact keywords.
- **`ats_scorer.py`**: Implements the deterministic "Diagnostic Scorer". It checks for:
    - **Contact Info**: Presence of email/phone.
    - **Section Integrity**: Does it have Education, Experience, and Skills?
    - **Formatting**: Penalizes non-standard layouts or missing bullet points.
- **`feature_builder.py`**: Vectorizes all extracted data (skill counts, years of experience, similarity scores) into a numerical format.

### 4. `models/xgb_predictor.py` (The Calibration Layer)
- **Dual-Head Scoring**: The service doesn't rely on a single score.
- **XGBoost/LGBM**: These pre-trained models act as a second opinion, ranking the resume based on historical data patterns.
- **Final Blended Score**: The system produces a final ATS percentage by blending the semantic fit and the machine learning prediction.

### 5. `reporting/suggestions.py` (The Actionable Layer)
- **YAKE! Integration**: Extracts high-frequency keywords from the Job Description.
- **Gap Analysis**: Identifies exactly which keywords from the JD are missing in the resume.
- **Priority Suggestions**: Categorizes fixes into **Critical**, **High**, **Medium**, and **Low** priority based on their estimated impact on the ATS score.


---

## 🔍 Deep Dive: `ml/skillgap_analysis` Internals

While `resume_analyzer` handles specific job postings, the `skillgap_analysis` service is designed for **General Career Guidance**. It helps students understand how they stack up against industry-standard benchmarks for specific roles and experience levels.

### 1. The Core Objective
This service answers the question: *"I want to be a Junior Backend Developer. What am I missing?"* It performs a broad comparison between a student's resume and a **Role-Level Skill Profile** aggregated from hundreds of real-world job postings.

### 2. Cross-Service Communication
Unlike the standalone analyzer, this service relies on a **tight integration with the Node.js Backend**:
- It calls the `/api/skills/by-role-level` endpoint on the core server.
- The core server performs "N1 Skill Filtering" (frequency-based selection) to return the most relevant skills for the requested `role` (e.g., DevOps) and `level` (e.g., Intern).

### 3. Simplified Extraction & Ontology
- **Regex-based Matching**: Uses a curated ontology of **80+ tech skills** (Languages, Frameworks, Cloud, Databases) to extract skills from the resume text.
- **OCR Support**: Like the main analyzer, it includes a robust fallback to Tesseract OCR for scanned PDF resumes.

### 4. Mathematical Match Scoring
The service computes a final `ml_match_percentage` using a weighted formula:
- **XGBoost Prediction (60%)**: A regressor model trained to predict candidate "fit" based on feature vectors (match count, missing count, total skills).
- **SBERT Semantic Similarity (40%)**: Uses the `all-MiniLM-L6-v2` model to understand the semantic distance between the candidate's skills and the role requirements.

### 5. Output Data
- **Required Skills**: The industry benchmark for the role.
- **Matched vs. Missing**: A clear list showing exactly what the student needs to learn next.
- **Semantic Score**: A measure of how "close" their existing skills are to the desired role, even if they don't match exactly.

---

## 🛠️ Thorough Technical Analysis: `ml/resume_analyzer`

The `resume_analyzer` is the most complex component of the portal, acting as a production-grade ATS (Applicant Tracking System) engine.

### 1. The NLP Pipeline (Hybrid NER)
The system doesn't rely on simple keyword matching. It uses a **Hybrid Entity Extraction** strategy:
- **Lexicon-Based**: Uses a curated `skills_lexicon.json` with thousands of technology aliases (e.g., matching "React", "ReactJS", and "React.js" to the same entity).
- **Rule-Based**: Regular expressions identify years of experience, GPA (e.g., `3.8/4.0`), and contact information.
- **Zero-Shot NER (GLiNER)**: For technologies not in the lexicon, the system uses **GLiNER**, allowing it to identify "skills" and "tools" dynamically without retraining.

### 2. Semantic Intelligence (SBERT)
Traditional ATS systems fail if a candidate uses a synonym (e.g., "Web Development" instead of "Frontend"). Our system solves this with **Sentence-BERT (SBERT)**:
- **Model**: `BAAI/bge-base-en-v1.5` (State-of-the-art for retrieval).
- **Process**: It converts the entire Resume and Job Description into high-dimensional vectors (embeddings).
- **Similarity**: It computes the **Cosine Similarity** between these vectors. This measures the *conceptual* overlap, rewarding candidates who have the right "vibe" even if they lack specific keywords.

### 3. The Dual-Head Scoring Architecture
The final ATS score is not a single number; it's a calibrated blend of two distinct "heads":

#### **Head 1: The Diagnostic Scorer (Deterministic)**
- **Role**: Provides absolute feedback.
- **Components**:
    - **Keyword Score**: (Matched Skills / Required Skills).
    - **Section Score**: Checks for mandatory sections (Education, Experience, etc.).
    - **Format Score**: Penalizes complex layouts (tables, multi-column) that break standard parsers.
- **Output**: Granular suggestions (e.g., "Missing 'Experience' section").

#### **Head 2: The Predictive Ranker (XGBoost/LGBM)**
- **Role**: Calibrates the score based on learned patterns.
- **Features**: Vectorizes 15+ metrics, including semantic similarity, total word count, skill density, and years of experience.
- **Model**: **XGBoost Regressor**. It "learns" how a human recruiter might rank a candidate by looking at the interplay between features.
- **Final Blend**: `Final_Score = (SBERT_Score * 0.6) + (XGBoost_Score * 0.4)`.

### 4. Actionable Intelligence (YAKE! + Report Builder)
- **Keyword Extraction**: Uses the **YAKE!** (Yet Another Keyword Extractor) algorithm to find the most "important" words in a Job Description without needing a training set.
- **Gap Analysis**: Cross-references these important JD terms with the resume to find missing high-value keywords.
- **Visualization**: Generates a Base64-encoded **Radar Chart** (Spider Map) comparing the candidate's proficiency across categories (e.g., Backend, Frontend, DevOps, Soft Skills).

---

## ⚡ How to Run
1.  **Install All**: `npm run install:all` (Installs root, client, and server dependencies).
2.  **Run Development**: `npm run dev` (Starts Frontend and Node Backend concurrently).
3.  **Run ML Service**: 
    - `cd ml/resume_analyzer`
    - `source venv/bin/activate`
    - `pip install -r requirements.txt`
    - `uvicorn main:app --reload --port 8000`
