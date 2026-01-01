# Kassa - Viral Charity Fundraising Pyramid

A full-stack web application that simulates a viral charity fundraising mechanism based on referrals. Users can sign up, donate to charity, and share referral links to grow their network. The app tracks donations across multiple referral levels (generations).

## Features

- **Simple Authentication**: Username-only login/signup (new users are automatically registered)
- **Referral System**: Secure referral links with UUID-based codes
- **Donation Tracking**: Users can donate multiple times with full validation
- **Referral Network Visualization**: See donations broken down by referral level (generation)
- **Dashboard Summary**: View your total impact including personal donations and network contributions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite (with better-sqlite3) |
| Validation | Zod (shared between frontend/backend) |
| Auth | JWT tokens |
| Structure | Monorepo with npm workspaces |

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd kassa
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build the shared package

```bash
npm run build -w packages/shared
```

### 4. Start the development servers

```bash
npm run dev
```

This starts both:
- **Backend API** at http://localhost:3000
- **Frontend** at http://localhost:5173

### 5. Open the app

Navigate to http://localhost:5173 in your browser.

## Project Structure

```
kassa/
├── package.json                 # Root package with workspaces
├── tsconfig.base.json           # Shared TypeScript config
├── apps/
│   ├── api/                     # Express backend
│   │   └── src/
│   │       ├── db/              # SQLite schema and connection
│   │       ├── routes/          # API endpoints
│   │       ├── repositories/    # Database queries
│   │       ├── middleware/      # Auth, validation, error handling
│   │       └── utils/           # JWT helpers
│   └── web/                     # React frontend
│       └── src/
│           ├── components/      # UI components
│           ├── context/         # Auth context
│           ├── hooks/           # Custom hooks
│           ├── pages/           # Page components
│           ├── services/        # API client
│           └── styles/          # CSS styles
└── packages/
    └── shared/                  # Shared types and validation
        └── src/
            ├── types/           # TypeScript interfaces
            └── validation/      # Zod schemas
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login or register (username-only) |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/donations` | Create a donation |
| GET | `/api/v1/donations` | Get user's donations (paginated) |
| GET | `/api/v1/donations/summary` | Get donation statistics |
| GET | `/api/v1/referrals/link` | Get referral link |
| GET | `/api/v1/referrals/stats` | Get referral network stats by level |

## Key Design Decisions

### 1. Username-Only Authentication
- Simplified onboarding to reduce friction
- New users are created automatically on first login
- JWT tokens for stateless session management

### 2. Secure Referral Codes
- UUID v4-based codes (32 hex characters)
- Cryptographically random, not guessable
- Passed via URL query parameter (`?ref=code`)

### 3. SQLite with Recursive CTEs
- Efficient hierarchical queries for referral tree traversal
- No external database server required
- Data persisted in `data/kassa.db`

### 4. Referral Tree Query Pattern
```sql
WITH RECURSIVE descendants AS (
    SELECT id, 1 as level FROM users WHERE referrer_id = ?
    UNION ALL
    SELECT u.id, d.level + 1
    FROM users u
    INNER JOIN descendants d ON u.referrer_id = d.id
    WHERE d.level < 100
)
SELECT level, COUNT(DISTINCT id), SUM(donations)
FROM descendants
GROUP BY level;
```

### 5. Shared Validation
- Zod schemas defined once in `packages/shared`
- Used by both frontend and backend
- Consistent validation rules across the stack

### 6. Monorepo Structure
- npm workspaces for dependency management
- Shared code between frontend and backend
- Single `npm install` for all packages

## Security Features

- **JWT Authentication**: Secure token-based auth with expiration
- **Rate Limiting**: Prevents brute-force attacks
- **Input Validation**: Zod schemas on all inputs
- **SQL Injection Prevention**: Parameterized queries only
- **CORS Protection**: Restricted to frontend origin
- **Helmet.js**: Security headers enabled

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# JWT (IMPORTANT: Change in production!)
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRY=24h

# Frontend URL (for CORS and referral links)
FRONTEND_URL=http://localhost:5173

# Database (optional, defaults to ./data/kassa.db)
DATABASE_PATH=./data/kassa.db
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in dev mode |
| `npm run dev:api` | Start only the backend |
| `npm run dev:web` | Start only the frontend |
| `npm run build` | Build all packages for production |
| `npm run start` | Run the production backend |
| `npm run clean` | Remove all node_modules and build artifacts |

## Future Enhancements

### High Priority
1. **Unit Tests**: Add Jest/Vitest tests for services and components
2. **Integration Tests**: API endpoint testing with supertest
3. **E2E Tests**: Playwright/Cypress for user flow testing

### Medium Priority
4. **Email Notifications**: Notify users when referrals sign up
5. **Leaderboard**: Show top fundraisers
6. **Donation Goals**: Set and track fundraising targets
7. **Social Sharing**: One-click share to social media

### Nice to Have
8. **Real-time Updates**: WebSocket for live donation notifications
9. **Export Reports**: Download donation history as CSV/PDF
10. **Admin Dashboard**: Manage users and view global stats
11. **Multi-currency Support**: Accept donations in different currencies
12. **Payment Integration**: Connect to Stripe/PayPal for real payments
13. **PWA Support**: Installable mobile experience
14. **Dark Mode**: Theme toggle for user preference

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    referrer_id INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
);
```

### Donations Table
```sql
CREATE TABLE donations (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount REAL NOT NULL CHECK (amount >= 1.00),
    created_at TEXT DEFAULT (datetime('now'))
);
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for learning or as a starting point for your own applications.

---

Built with TypeScript, React, Express, and SQLite.
