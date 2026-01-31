# LabFlow LIMS API

Backend API for the Laboratory Information Management System.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth + Custom Portal Auth
- **Validation**: Zod

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run database migrations
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

## API Documentation

Once running, visit `http://localhost:3001/docs` for Swagger UI.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Project Structure

```
src/
├── config/        # Environment & client configuration
├── db/
│   ├── schema/    # Drizzle schema definitions
│   └── migrations/
├── modules/       # Feature modules (auth, quotations, etc.)
├── shared/        # Common utilities, types, validation
└── plugins/       # Fastify plugins
```

## License

Proprietary - PT LabFlow Indonesia
