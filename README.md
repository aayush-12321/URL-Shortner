# URL Shortener

A fast and simple URL shortening service built with FastAPI and React.

## Project Structure

```
├── backend/          # FastAPI backend
│   ├── app/         # Main application code
│   ├── tests/       # Unit tests
│   └── requirements.txt
├── frontend/        # React frontend (optional)
│   ├── src/
│   └── public/
└── README.md
```

## Backend Setup

### Prerequisites
- Python 3.8+
- pip

### Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

5. Run the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## Frontend Setup

Coming soon...

## API Endpoints

- `POST /shorten` - Create a shortened URL
- `GET /{short_code}` - Redirect to original URL
- `GET /stats/{short_code}` - Get URL statistics
