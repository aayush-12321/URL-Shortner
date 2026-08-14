# URL Shortener

A fast URL shortening service built with FastAPI and React.

## Project Structure

```
├── pyproject.toml    # Root uv project config
├── backend/          # FastAPI backend
│   ├── app/         # Main application code
│   ├── tests/       # Unit tests
│   ├── requirements.txt
│   └── .env.example
├── frontend/        # React frontend (optional)
│   ├── src/
│   └── public/
└── README.md
```

## Backend Setup

### Prerequisites
- Python 3.12+
- `uv` installed (`pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`)

### Installation

1. Open the project root:
```bash
cd URL\ Shortner
```

2. Create and sync the environment with `uv`:
```bash
uv sync
```

This creates the project virtual environment and installs dependencies from the root `pyproject.toml`.

3. Create a `.env` file for the backend:
```bash
cp backend/.env.example backend/.env
```

4. Run the backend in development mode:
```bash
cd backend
uv run fastapi dev
```

If you prefer running the app directly without the FastAPI CLI:
```bash
cd backend
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at `http://localhost:8000`.

> If you are working only inside `backend/` and do not want to use the root project config, this also works:
> ```bash
> cd backend
> uv venv
> uv pip install -r requirements.txt
> ```

<!-- 6. Run with Docker Compose

If you prefer Docker, start the backend and a Postgres DB using:
```bash
docker-compose up --build
``` -->

<!-- The backend service exposes port `8000` on the host. -->

## Frontend Setup

Coming soon...

## API Endpoints

- `POST /shorten` - Create a shortened URL
- `GET /{short_code}` - Redirect to original URL
- `GET /stats/{short_code}` - Get URL statistics
