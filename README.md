# Eventflow — Event Registration Management

A responsive event discovery and registration application built with React, TypeScript, Vite, and Express. It includes real server-side accounts and permissions, durable local data storage, event administration, participant registration, attendance tracking, and CSV export.

## Run locally

Requirements: Node.js 20 or newer and npm.

```sh
npm install
Copy-Item .env.example .env
npm run dev
```

In PowerShell, open the Vite URL printed in the terminal (usually `http://localhost:5173`). The Express API runs locally on port 3000. No MongoDB, Supabase, AI, or other credentials are needed. The first account created on an empty database becomes the administrator; create this account yourself on the trusted local machine before inviting others. Every later public sign-up receives the participant role.

To make a production frontend bundle, run:

```sh
npm run build
npm start
```

The Express server then serves the built application and API on port 3000. Stop the development server with `Ctrl+C`.

## Features

- Browse, search, and filter upcoming workshop, seminar, cultural, sports, and conference events.
- Register, receive a unique confirmation ID, view registrations, and cancel before an event starts.
- Sign up and sign in with password hashes (`scrypt`) and `HttpOnly`, `SameSite=Lax` session cookies.
- Manage event details and capacity as an administrator or organizer.
- Manage user roles as an administrator; participants cannot assign themselves privileged roles.
- Review event rosters, mark attendees present or absent, and export registration and attendance data to CSV.
- Enforce event ownership, registration deadlines, cancellation, duplicate registration, and capacity limits in the API.
- Open six fictional upcoming sample events on a fresh install.

## Local database and environment

The local development database is a JSON file at `data/events.json`. Its directory is ignored by Git and is created when the first API request arrives. Writes are serialized and saved atomically; registrations sharing a capacity limit are checked inside the same serialized update.

Copy `.env.example` to `.env` to configure the server:

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | Express listening port | `3000` |
| `HOST` | Server bind address; keep the local default private | `127.0.0.1` in development |
| `EVENTS_DB_PATH` | Absolute path for the JSON database | `data/events.json` |
| `ALLOWED_ORIGINS` | Comma-separated browser origins permitted to call the API | localhost and `127.0.0.1` on ports 5173 and 3000 |

Use the **exact** scheme, hostname, and port when adding a frontend origin. For example, `ALLOWED_ORIGINS=http://localhost:5173,https://events.example.edu`. The server reads `.env` automatically; operating-system environment variables take precedence.

## Project structure

```text
api/
  analyze.js                 Existing analysis endpoint
  events.js                  Auth, event, registration, and attendance API
  events.test.js             End-to-end API tests
src/
  EventApp.tsx               Responsive application interface
  event.css                  Application styling and responsive layouts
  main.tsx                   React application entry point
data/
  events.json                Automatically created local database (ignored by Git)
server.js                    Express server, API routing, and production static files
index.html                   Application document and page metadata
package.json                 Development, build, and test commands
.env.example                 Local configuration template
```

## Validation

```sh
npm test
npm run build
```

The API tests cover role enforcement, account setup, password-safe responses, duplicate and full-capacity registrations, attendance, cancellation, input validation, and rejected browser origins.

## Production and privacy

This credential-free file database is for a trusted, single-process local installation, not a multi-instance production deployment. For a shared or public service, replace it with a managed database such as MongoDB or PostgreSQL, use a shared session store, set `NODE_ENV=production` and a production `HOST`, configure HTTPS and the exact trusted origins, and review backups, retention, monitoring, rate limits, and account-recovery procedures. Do not expose the first-account setup on a public network. Participant email addresses are shown only to authorized event organizers and administrators. Event photography and typography are loaded from Unsplash and Google Fonts when an internet connection is available; core API functionality does not require either service.
