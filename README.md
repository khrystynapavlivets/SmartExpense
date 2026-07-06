# SmartExpense

A full-stack expense tracking application that turns receipt photos into structured financial data. Upload a receipt image, and the app uses Groq's vision model (Llama 4 Scout) to extract vendor, total, date, address, and line items — then classifies the document type and stores everything in PostgreSQL.

The React frontend provides a dashboard with spending analytics, a searchable expense list, detail views with the original receipt image, and full create/edit/delete capabilities. Authentication is JWT-based with per-user data isolation.

## Demo

<video src="https://github.com/user-attachments/assets/6fa6ac64-5fb3-4fd8-b40a-228b294916a9" controls width="100%"></video>

## Features

- **Receipt OCR** — upload JPEG, PNG, WEBP, or PDF; vendor, total, date, address, and line items are extracted automatically
- **Document classification** — receipts, invoices, taxi rides, and utility bills are classified automatically
- **Dashboard** — total spend, document count, breakdown by category with a pie chart, and a 6-month spending bar chart
- **Expense management** — list with search and type filter, detail view with original image, inline edit and delete
- **Multi-user** — JWT authentication (register / login), all data scoped per user
- **46 tests** — unit and component tests for the React frontend (Vitest + Testing Library)

## Tech Stack

**Backend**

| | |
|---|---|
| Python 3.14+ | Runtime |
| FastAPI | Web framework |
| SQLAlchemy + Alembic | ORM and migrations |
| PostgreSQL | Database |
| Groq API | Vision OCR (Llama 4 Scout) and document classification (Llama 3.1 8B) |
| instructor | Structured output parsing from LLM responses |
| Pillow | Image processing |
| Docker Compose | Local database |

**Frontend**

| | |
|---|---|
| React 19 + TypeScript | UI framework |
| Vite | Build tool |
| Tailwind CSS v4 | Styling |
| TanStack Query v5 | Server state management |
| React Router v7 | Client-side routing |
| Recharts | Charts and data visualisation |
| React Hook Form | Form handling |
| Vitest + Testing Library | Unit and component tests |

## Getting Started

### Prerequisites

- Python 3.14+
- Node.js 20+
- Docker (for PostgreSQL)
- Groq API key

### Backend

```bash
# Clone the repo
git clone <repo-url>
cd SmartExpense

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and fill in GROQ_API_KEY and SECRET_KEY

# Start PostgreSQL
docker compose up -d

# Apply migrations
alembic upgrade head

# Start the API server
python main.py
```

API runs at `http://localhost:8000` — interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

### Sample Dataset

To populate the database with SROIE receipt images for testing:

```bash
python setup_dataset.py
```

Requires a Kaggle API token set in `.env`.

## API Endpoints

**Auth**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Login and receive JWT tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |

**Expenses**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/expenses/` | List expenses (filterable by vendor, type, amount) |
| GET | `/api/v1/expenses/summary` | Totals and breakdown by document type |
| GET | `/api/v1/expenses/{id}` | Get a single expense |
| GET | `/api/v1/expenses/{id}/image` | Retrieve the original receipt image |
| POST | `/api/v1/expenses/upload` | Upload receipt → OCR → classify → save |
| POST | `/api/v1/expenses/` | Create expense manually |
| PUT | `/api/v1/expenses/{id}` | Update expense |
| DELETE | `/api/v1/expenses/{id}` | Delete expense |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_DB` | Database name |
| `GROQ_API_KEY` | Groq API key |
| `SECRET_KEY` | JWT signing secret (use a long random string in production) |
| `APP_ENV` | `development` or `production` |
| `KAGGLE_API_TOKEN` | Kaggle token for sample dataset download |

## Running Tests

```bash
cd frontend
npm test
```
