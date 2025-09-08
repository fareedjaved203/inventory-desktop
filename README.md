# Hisab Ghar

A complete Hisab Ghar with SQLite database, containerized in a single Docker image.

## Features

- Product management
- Sales tracking
- Vendor management
- Bulk purchasing
- Dashboard with analytics
- Single container deployment

## Running the Application

### Desktop Installation

The desktop installer automatically:
- Installs Node.js if not present
- Downloads and configures PostgreSQL
- Creates the database and user
- Migrates existing SQLite data if found

### Manual Setup

Use Docker Compose:
```bash
docker-compose up --build
```

The application will be available at http://localhost:3000

## Technical Details

- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Frontend**: React with Vite
- **Containerization**: Multi-stage Docker build
- **Data Persistence**: PostgreSQL database with automatic setup

## Development

To run in development mode:

1. Start the backend:
```bash
cd backend
npm install
npm run dev
```

2. Start the frontend:
```bash
cd frontend
npm install
npm run dev
```

## Database

- Uses PostgreSQL database
- The installer automatically sets up the database
- Database credentials: `postgresql://hisabghar:hisabghar123@localhost:5432/hisabghar`