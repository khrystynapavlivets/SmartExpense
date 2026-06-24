# SmartExpense

A FastAPI-based REST API for processing receipts and tracking expenses. Receipts are parsed using an LLM vision pipeline (Groq) and stored in a PostgreSQL database.

## Features

- Upload and parse receipt images (vendor, total, date, address)
- CRUD API for expense records
- PostgreSQL storage via SQLAlchemy
- Docker Compose setup for the database
- Sample dataset downloader using the SROIE Kaggle dataset

## Tech Stack

- **Python 3.12+**
- **FastAPI** — web framework
- **SQLAlchemy** — ORM
- **PostgreSQL** — database
- **LangChain + Groq** — LLM vision model for receipt parsing
- **Pillow** — image loading
- **Docker Compose** — local database

## Getting Started

### Prerequisites

- Python 3.12+
- PostgreSQL running locally or via Docker
- Groq API key
- Kaggle API token (for sample dataset)

### Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd SmartExpense
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Copy and configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. Start the database:
   ```bash
   docker compose up -d
   ```

5. Run the API:
   ```bash
   python main.py
   ```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### Sample Dataset

Download a small set of SROIE receipt images for testing:

```bash
python setup_dataset.py
```

Requires a valid Kaggle API token set in `.env`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/expenses/` | List all expenses |
| GET | `/api/v1/expenses/{id}` | Get expense by ID |
| POST | `/api/v1/expenses/` | Create expense |
| DELETE | `/api/v1/expenses/{id}` | Delete expense |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_DB` | Database name |
| `GROQ_API_KEY` | Groq API key for LLM vision |
| `KAGGLE_API_TOKEN` | Kaggle API token for dataset download |
| `SECRET_KEY` | Application secret key |
| `APP_ENV` | Environment (`development` / `production`) |
