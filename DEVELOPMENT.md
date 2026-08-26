# SportX: Developer & Deployment Guide

## 1. Local Development Setup

### Backend
```bash
# In project root:
cd backend

# Create virtual environment (optional)
python -m venv venv
# Windows:
venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend
```bash
# In project root:
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```

---

## 2. Running Automated Tests

```bash
# Run all backend unit & pipeline tests:
pytest backend/tests/ -v

# Run frontend build type-check and bundle verification:
cd frontend
npm run build
```

---

## 3. Production Deployment (Docker / Cloud)

### Production Dockerfile Example
```dockerfile
# Multi-stage container for backend + static frontend
FROM python:3.12-slim
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/backend/
COPY frontend/dist/ /app/frontend_dist/

ENV PORT=8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
