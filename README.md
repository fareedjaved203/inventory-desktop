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

1. Run the migration script:
```bash
migrate-to-postgres.bat
```

2. Or use Docker Compose:
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

1. Setup PostgreSQL (first time only):
```bash
migrate-to-postgres.bat
```

2. Start the backend:
```bash
cd backend
npm install
npm run dev
```

3. Start the frontend:
```bash
cd frontend
npm install
npm run dev
```

## Database Migration

If you're upgrading from SQLite to PostgreSQL:
- The installer automatically handles migration
- Your existing data will be preserved
- Database credentials: `postgresql://hisabghar:hisabghar123@localhost:5432/hisabghar`