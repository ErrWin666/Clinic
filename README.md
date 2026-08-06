# Clinic Eye — Eye Clinic Management System

A desktop application for managing eye clinics — patients, appointments, invoices, inventory, messaging, and reports. Built with Electron, Express, and React.

## Screenshots

<!-- Add screenshots here -->
<!-- ![Dashboard](docs/screenshots/dashboard.png) -->
<!-- ![Patients](docs/screenshots/patients.png) -->
<!-- ![Appointments](docs/screenshots/appointments.png) -->
<!-- ![Inventory](docs/screenshots/inventory.png) -->

> _Add screenshots to `docs/screenshots/` and uncomment the lines above._

---

## Features

### Core
- **Patient Management** — Full patient records, medical history, eye examinations, prescriptions, file attachments
- **Appointments** — Calendar view, scheduling, reminders, status tracking
- **Invoices & Payments** — Invoice generation, payment tracking, PDF export, revenue reports
- **Inventory** — Products, variants, batches, stock movements, barcode generation, stocktaking, low-stock alerts
- **Suppliers & Purchase Orders** — Supplier management, PO lifecycle (draft → ordered → received), account statements

### Messaging
- **WhatsApp Cloud API** — Free up to 1,000 conversations/month (Layer 1)
- **Telegram Bot** — 100% free, unlimited messages (Layer 2)
- **SMSMobileAPI** — Local Android phone as SMS gateway (Layer 3)
- **Twilio SMS** — Fallback layer (Layer 4)
- **Message Templates** — Shared templates with `{{variables}}` support across all channels
- **Automatic Reminders** — Appointment, invoice, and follow-up reminders via scheduler

### Reports & Analytics
- Financial reports (revenue, paid, outstanding)
- Patient statistics (new patients, growth)
- Appointment analytics (completion rate, no-show rate)
- Inventory valuation, low stock, expiry, dead stock, stock aging
- PDF report generation for all report types
- CSV export for patients, invoices, appointments

### System
- **Backup & Restore** — Automatic scheduled backups, manual backups, one-click restore
- **Audit Log** — Full action tracking (create, update, delete, login, logout)
- **User Management** — Role-based access (admin, doctor, receptionist, viewer)
- **Security** — JWT auth, password recovery (code or server file), rate limiting, helmet
- **Bilingual** — Full Arabic (RTL) and English (LTR) support
- **Dark Mode** — Theme toggle with system preference detection
- **Custom Data Directory** (v1.1) — Store data on an external drive while the app stays on the system drive
- **Auto-Update** — Built-in electron-updater for seamless updates

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 31 |
| Backend | Express 4, Sequelize 6, SQLite (dev) / PostgreSQL (prod) |
| Frontend | React 19, TypeScript 6, Vite 8 |
| Styling | TailwindCSS 4, shadcn/ui |
| State | TanStack Query 5, React Hook Form 7 |
| Charts | Recharts 3 |
| Calendar | react-big-calendar |
| Editor | TipTap (markdown + rich text) |
| i18n | react-i18next |
| Testing | Jest (backend), Vitest (frontend), Playwright (e2e) |
| PDF | jsPDF, jsPDF-AutoTable |
| Barcode | JsBarcode |

---

## Prerequisites

- **Node.js** 22+ (recommended 24+)
- **npm** 10 or higher
- **Git**

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/ErrWin666/Clinic.git
cd Clinic
```

### 2. Install dependencies

```bash
# Root (Electron)
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

cd ..
```

### 3. Environment setup

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your settings
```

---

## Development

Run all three processes (backend, frontend, Electron) concurrently:

```bash
npm run dev
```

Or run individually:

```bash
npm run dev:backend    # Express server on auto port
npm run dev:frontend   # Vite dev server on http://localhost:5173
npm run dev:electron   # Electron app (waits for frontend)
```

---

## Building

### Windows installer

```bash
npm run build:win
```

Output: `release/` folder with NSIS installer `.exe`.

### macOS

```bash
npm run build:mac
```

### Release (with auto-publish to GitHub)

```bash
npm run release
```

---

## Project Structure

```
Clinic/
├── main.js                  # Electron main process
├── preload.js               # IPC bridge
├── backend-manager.js       # Backend process manager
├── backup.js                # Backup/restore logic
├── data-path-utils.js       # Custom data path validation
├── data-migrator.js         # Data migration between paths
├── updater.js               # Auto-update logic
├── system-info.js           # System diagnostics
├── splash.html              # Splash screen
├── error-screen.html        # Error screen
├── electron-builder.yml     # Build configuration
├── package.json             # Root package (Electron)
│
├── backend/
│   ├── src/
│   │   ├── config/          # App configuration
│   │   ├── constants/       # Enums, messages
│   │   ├── controllers/     # Request handlers
│   │   ├── database/        # Sequelize setup + migrations
│   │   ├── middlewares/     # Auth, RBAC, validation, audit
│   │   ├── models/          # Sequelize models
│   │   ├── repositories/    # Data access layer
│   │   ├── routes/          # Express routes
│   │   ├── schemas/         # Joi validation schemas
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities (money, PDF, file upload, etc.)
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server entry point
│   ├── tests/               # Jest tests (unit, integration, e2e, performance)
│   ├── scripts/             # Migration & seed scripts
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # TanStack Query hooks
│   │   ├── lib/             # API client, config, i18n, utils
│   │   ├── locales/         # i18n translations (ar, en)
│   │   ├── pages/           # Full-screen views
│   │   ├── providers/       # Context providers
│   │   ├── routes/          # Route guards
│   │   ├── schemas/         # Zod validation schemas
│   │   ├── services/        # API service classes
│   │   ├── types/           # TypeScript types
│   │   └── test/            # Test setup & mocks
│   ├── e2e/                 # Playwright e2e tests
│   └── package.json
│
└── .github/workflows/       # CI/CD (build-windows.yml)
```

---

## Testing

### Backend (Jest)

```bash
cd backend
npm test                # Run all tests
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests
npm run test:coverage   # With coverage report
```

### Frontend (Vitest)

```bash
cd frontend
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### End-to-End (Playwright)

```bash
cd frontend
npm run test:e2e        # Run e2e tests
npm run test:e2e:ui     # Interactive UI mode
```

---

## Database Migrations

```bash
cd backend
npm run db:migrate          # Run pending migrations
npm run db:migrate:status   # Check migration status
npm run db:migrate:down     # Rollback last migration
```

---

## Seed Data

```bash
cd backend
npm run seed:inventory       # Seed inventory demo data
npm run seed:inventory:clean # Remove seeded data
```

---

## Custom Data Directory (v1.1)

The app supports storing data (database, uploads, backups, logs) on an external drive:

1. Go to **Settings → Data Location**
2. Click **Change Path** and select a folder on the external drive
3. Choose **Move existing data** to transfer all data
4. The app restarts with the new data location

If the external drive is disconnected, the app shows an error screen with a **Reset to Default** button.

---

## Auto-Updates

The app automatically checks for updates from GitHub Releases every 30 minutes. When an update is found:

1. A notification appears in the bottom-right corner
2. The update downloads in the background with a progress bar
3. When ready, the user can click **Install Now** or it installs on next app quit

No authentication token is needed — the repo is public. Update configuration is in `electron-builder.yml` under the `publish` section.

To publish a new release:

```bash
# Bump version in package.json
npm version 1.3.0

# Build and publish to GitHub Releases
npm run release
```

Or push a tag to trigger the GitHub Actions workflow:

```bash
git tag v1.3.0
git push origin v1.3.0
```

---

## License

Copyright 2026 Clinic Eye. All Rights Reserved.

This software and its source code are proprietary. No part of this software may be reproduced, distributed, or transmitted in any form or by any means without prior written permission from the author.
