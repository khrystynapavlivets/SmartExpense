# SmartExpense

A FastAPI-based REST API for processing receipts and tracking expenses. Receipt images are sent to Groq's vision model (Llama 4 Scout) for OCR, parsed into structured data via `instructor`, classified by document type, and stored in PostgreSQL.

## Features

- Upload and parse receipt images (vendor, total, date, address, line items)
- Automatic document classification (receipt / taxi / invoice / utility bill)
- CRUD API for expense records
- PostgreSQL storage via SQLAlchemy + Alembic migrations
- Docker Compose setup for the database
- Sample dataset downloader using the SROIE Kaggle dataset

## Tech Stack

- **Python 3.14+**
- **FastAPI** — web framework
- **SQLAlchemy** — ORM
- **PostgreSQL** — database
- **Groq** — LLM API (Llama 4 Scout for vision OCR, Llama 3.1 8B for classification)
- **instructor** — structured output parsing from LLM responses
- **Pillow** — image loading
- **Alembic** — database migrations
- **Docker Compose** — local database

## Getting Started

### Prerequisites

- Python 3.14+
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
| POST | `/api/v1/expenses/` | Create expense manually |
| POST | `/api/v1/expenses/upload` | Upload receipt image → OCR → classify → save |
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
