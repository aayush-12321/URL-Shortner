# 🔗 Shortlink — Modern URL Shortener & Analytics

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python)](https://www.python.org/)
[![uv](https://img.shields.io/badge/Package_Manager-uv-DE5B8B?style=flat-square)](https://github.com/astral-sh/uv)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

A high-performance, full-stack URL shortening service with real-time click tracking, custom link descriptions, user authentication, and a clean, grounded dashboard UI.

---

## ✨ Features

- ⚡ **Instant URL Shortening**: Convert long, messy links into clean short URLs in milliseconds.
- 🐳 **Dockerized Deployment**: Package and run the FastAPI application consistently with Docker.
- 🚀 **Automated GitHub → Railway Deployment**: Deploy changes automatically from GitHub to Railway.
- 🔒 **User Authentication**: Secure JWT-based registration and login via sleek popup modals.
- 📋 **Link Dashboard**: View all your shortened URLs with real-time click counters and creation timestamps.
- ✏️ **Full Link Management**:
  - One-click **Copy to Clipboard** with instant visual confirmation.
  - One-click **Open Link** in new tab.
  - **Edit Notes & Descriptions** via popup dialogs.
  - **Delete Links** with safe two-step confirmation.
  - **Search & Filter** saved links instantly.
- 🎨 **Grounded UI/UX**: Clean dark-slate design system with responsive layouts and accessible micro-interactions.
- 🛡️ **Guest & User Modes**: Shorten links anonymously as a guest or log in to track analytics and manage saved links.

---

## 🏗️ Tech Stack

- Python 3.12+
- [FastAPI](https://fastapi.tiangolo.com/)
- [SQLModel](https://sqlmodel.tiangolo.com/)
- SQLite
- JWT authentication
- Docker
- [uv](https://github.com/astral-sh/uv)
- [Railway](https://railway.com/)
- React 18 with Axios and vanilla CSS for the frontend

## 🧩 Architecture

The project is split into a React frontend and a FastAPI backend. The frontend communicates with the backend over the `/api/v1` REST API. FastAPI handles authentication, URL management, redirects, and analytics; SQLModel persists application data in SQLite. The Docker image runs the backend with `uvicorn`, while `/app/data` is mounted to persistent storage in production.

```text
React frontend
   │ REST API (/api/v1)
   ▼
FastAPI backend ── SQLModel ── SQLite (/app/data)
   │
   └── JWT authentication and URL analytics
```

---

## 📁 Directory Structure

```text
URL Shortener/
├── pyproject.toml         # Root Python & uv dependency configuration
├── docker-compose.yml     # Container orchestration setup
├── backend/               # FastAPI Backend Service
│   ├── app/
│   │   ├── auth/          # JWT security & authentication routes
│   │   ├── database/      # DB session & SQLModel setup
│   │   ├── models/        # Pydantic & SQLModel schemas
│   │   ├── routes/        # URL shorten, list, stats, edit, & delete endpoints
│   │   ├── services/      # Business logic & click tracking service
│   │   └── main.py        # FastAPI app entry point & CORS configuration
│   └── data/      
        ├── database.db    # SQLite database storage
└── frontend/              # React Frontend Web App
    ├── public/            # Public assets & HTML template
    └── src/
        ├── components/    # Reusable UI components (Navbar, AuthModal, UrlList, etc.)
        ├── App.js         # Main application container & state orchestration
        └── index.css      # Design system & component stylesheet
```

---

## 🚀 Running Locally

### Prerequisites
- **Python 3.12+**
- **Node.js 18+** & **npm**
- **uv** package manager (`pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`)

---

### Backend

1. Navigate to the project root and install Python dependencies:
   ```bash
   uv sync
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Start the FastAPI development server:
   ```bash
   uv run uvicorn backend.app.main:app --reload --port 8000
   ```
   or
   ```bash
   uv run fastapi dev
   ```
   > 💡 The backend API server will run at **`http://localhost:8000`**.  
   > 📖 Interactive Swagger API Docs available at **`http://localhost:8000/docs`**.

---

### Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```
   > 🌐 The Web Application will automatically open at **`http://localhost:3000`**.

By default, the frontend uses the relative `/api/v1` path, which works with the
development proxy and with a reverse proxy serving the frontend and backend
together. If the backend is hosted on a different origin, create
`frontend/.env.local` with:

```env
REACT_APP_API_BASE_URL=https://api.example.com/api/v1
```

Restart the frontend after changing this value. React environment variables
are read when the app is built, so the value must be provided during deployment
as well.

---

## 📡 API Reference Summary

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/shorten` | Optional | Create a shortened URL with optional description |
| `GET` | `/api/v1/{short_code}` | No | Redirect to original URL (increments click counter) |
| `POST` | `/api/v1/auth/register` | No | Register a new user account |
| `POST` | `/api/v1/auth/login` | No | Authenticate user and receive JWT access token |
| `POST` | `/api/v1/auth/logout` | Yes | Invalidate user session |
| `GET` | `/api/v1/auth/me` | Yes | Fetch currently authenticated user profile |
| `GET` | `/api/v1/list/all` | Yes | List all shortened URLs owned by current user |
| `GET` | `/api/v1/stats/{short_code}` | Yes | Get click analytics and metadata for a short link |
| `PATCH` | `/api/v1/stats/{short_code}` | Yes | Update link metadata (description / expiration) |
| `DELETE` | `/api/v1/stats/{short_code}` | Yes | Delete a shortened URL and its click logs |

---

## 🐳 Running with Docker

Build the Docker image:

```bash
docker build -t url-shortener .
```

Create a Docker volume for persistent database storage:

```bash
docker volume create url-shortener-data
```
 
Run the application using your `.env` file and the persistent volume:

```bash
docker run --env-file .env -p 8000:8000 -v url-shortener-data:/app/data url-shortener
```

The SQLite database is stored in `data/` and persists in the `url-shortener-data` Docker volume.
---

## 📝 License

This project is open-source under the [MIT License](LICENSE).
