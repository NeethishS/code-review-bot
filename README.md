# 🤖 Code Review Bot: AI-Powered Engineering Intelligence

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/your-username/code-review-bot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Groq Powered](https://img.shields.io/badge/AI-Groq%20Llama%203.3-blue)](https://groq.com)

A high-performance, developer-first AI code review platform built to automate peer reviews, detect security vulnerabilities, and generate instant code fixes using **Groq's ultra-fast LLM inference**.

![Main Dashboard](./screenshots/dashboard.png)

---

## 📺 Demo Video
Experience the full workflow in action:
[**Watch Demo Video (Local)**](./screenshots/demo_video.mp4) | [**Download from Google Drive**](https://drive.google.com/uc?id=1UE70qokcnWWCeOavoXwG-mf7U04eRGUi&export=download)

---

## 🚀 Key Features

### 🧠 Advanced AI Analysis
- **Auto-Fix Engine**: AI doesn't just find bugs; it generates formatted diffs to fix them instantly.
- **Security Audit**: Deep scanning for SQL Injection, XSS, Secret Leaks, and OWASP Top 10.
- **Code Explainer**: High-density architectural explanations for complex codebases.
- **Performance Profiling**: Identifies Big O bottlenecks and memory leaks.

### 🔌 Ecosystem Integration
- **GitHub First**: Browse repositories, fetch files, and trigger reviews directly from your GitHub account.
- **PR Automation**: Set up webhooks to automatically review every Pull Request.
- **BYOK (Bring Your Own Key)**: Use system keys or provide your own Groq API key for unlimited analysis.

### 📊 Enterprise Analytics
- **Review History**: Persistent storage of every analysis with token usage and cost tracking.
- **Exportable Reports**: Generate professional PDF and Markdown reports for compliance and sharing.
- **KPI Dashboard**: Real-time metrics on success rates, language distribution, and team velocity.

---

## 🖼️ Application Gallery

| Landing Page | Login Experience |
|--------------|------------------|
| ![Landing](./screenshots/landing_page.png) | ![Login](./screenshots/login_page.png) |

| Upload & Analyse | PR Automation |
|------------------|---------------|
| ![Upload](./screenshots/upload_analyser.png) | ![Webhooks](./screenshots/webhook_config.png) |

| Review History | Setup Guide |
|----------------|-------------|
| ![History](./screenshots/review_history.png) | ![Setup](./screenshots/setup_guide.png) |

---

## 🏗️ Architecture

```mermaid
graph TD
    User((Developer)) -->|React SPA| Frontend[Vite Frontend]
    Frontend -->|REST API| Backend[Express Backend]
    Backend -->|Auth| DB[(PostgreSQL)]
    Backend -->|Webhooks| GitHub[GitHub API]
    
    subgraph "AI Inference Layer"
        Backend -->|Primary| Groq[Groq SDK / Llama 3.3]
        Backend -->|Fallback| RapidAPI[RapidAPI / Backup Model]
    end
    
    Groq -->|Structured JSON| Backend
    Backend -->|Review Results| Frontend
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Monaco Editor (IDE Experience).
- **Backend**: Node.js, Express, TypeScript, PDFKit.
- **Database**: PostgreSQL (Prisma-ready).
- **AI**: Groq Cloud SDK (Llama 3.1/3.3), RapidAPI (Fallback logic).
- **Styling**: Vanilla CSS with a custom "Modern High-Density" design system.

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Groq API Key

### Installation

1. **Clone & Install**
   ```bash
   git clone https://github.com/your-username/code-review-bot.git
   cd code-review-bot
   npm install
   cd backend && npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the `backend/` directory:
   ```env
   # API Keys
   GROQ_API_KEY=your_key_here
   GITHUB_PAT=your_github_token
   
   # Database
   DATABASE_URL=postgresql://user:pass@localhost:5432/review_bot
   
   # Auth
   JWT_SECRET=your_super_secret
   ```

3. **Database Migration**
   ```bash
   cd backend
   npm run migrate
   ```

4. **Launch**
   ```bash
   # Terminal 1 (Backend)
   cd backend && npm run dev
   
   # Terminal 2 (Frontend)
   npm run dev
   ```

---

## 🚢 Deployment

| Component | Provider | Strategy |
|-----------|----------|----------|
| **Frontend** | Vercel / Netlify | Git Push |
| **Backend** | Render / Heroku | Docker / Node Runtime |
| **Database** | Supabase / Railway | Managed Postgres |

---

## 🛡️ Seniority Boost: Engineering Highlights
- **Skeletal Loading**: Progressive UI states for better psychological perceived performance.
- **JSON Fallback Parsing**: Robust regex-based extraction for non-standard LLM outputs.
- **Verbatim Module Syntax**: Enforced TypeScript type-only imports for cleaner builds.
- **Timing Safe Verification**: Webhook signature verification to prevent timing attacks.

---

## 🤝 Contributing
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

*Built for Developers by Developers* 🚀
