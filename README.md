# IRTTAA Walk-In Registration System

A professional Streamlit application for Alumni Association event volunteers to manage walk-in registrations, check-ins, and attendee analytics.

## Features

- Dashboard with registration metrics and charts
- Walk-in registration form with duplicate prevention
- Search, payment visibility, and check-in workflow
- QR code generation for attendee badges
- Admin attendee management with edit/delete controls
- Excel and CSV exports
- Batch, department, payment, and check-in filters
- Lightweight SQLite database with automatic migration
- Supports environment variables for deployment

## Getting Started

1. Install dependencies

```bash
pip install -r requirements.txt
```

2. Copy the example environment file

```bash
cp .env.example .env
```

3. Run the Streamlit app

```bash
streamlit run streamlit_app.py
```

4. Login with default credentials

- Username: `admin`
- Password: `admin123`

> For production, update `.env` with secure credentials and database path.

## Deployment

This app is ready for Streamlit Cloud or any container-based deployment.
Set environment variables in your deployment environment or `.env` file:

- `DB_PATH`
- `ADMIN_USER`
- `ADMIN_PASSWORD`

## Project Structure

- `app.py` — main Streamlit application logic
- `streamlit_app.py` — Streamlit entrypoint
- `database.py` — SQLite database access and schema management
- `auth.py` — login and session handling
- `utils.py` — shared helpers and export utilities
- `pages/` — modular page definitions
- `assets/` — optional style and static assets
