# 🏆 Sports Federation Platform

A full-stack national sports federation management system built with **Spring Boot 3** and **Angular 19**. Manages athletes, clubs, competitions, results, and news through a role-based web interface.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Default Accounts](#default-accounts)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Role-Based Access Control](#role-based-access-control)
- [Screenshots](#screenshots)

---

## Overview

The Sports Federation Platform is a production-grade web application designed for national sports federations to manage their entire ecosystem — from athlete registration and club management to competition scheduling and official results publishing.

### Key capabilities

- **Athlete registry** — license management, categories, club affiliations, medical records
- **Club management** — registration, status tracking, roster management
- **Competition lifecycle** — from draft creation through registration, scheduling, and results
- **Official results** — performance recording, rankings, medals, national records
- **News publishing** — articles, press releases, announcements with tagging
- **Role-based portal** — different dashboards for admins, staff, club managers, and athletes
- **JWT authentication** — stateless auth with access/refresh token rotation

---

## 🚀 QUICK START — 3 SIMPLE STEPS

> **Everything is bundled in the project** (Java 21, Maven, Node.js). You only need PostgreSQL installed locally.

---

## ⚡ STEP 1: Create Database (First Time Only)

```powershell
$env:PGPASSWORD = "azerty990"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE federation_db;"
```

If you see `CREATE DATABASE` → done! If you see "already exists" → that's fine, skip to Step 2.

---

## ⚡ STEP 2: Start Backend (PowerShell Window 1)

**Copy-paste this entire block:**

```powershell
$env:JAVA_HOME = "C:\Users\ichock\Desktop\pi\federation-platform\sports-federation\.tools\jdk-21.0.11+10"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
cd C:\Users\ichock\Desktop\pi\federation-platform\sports-federation
& ".\.tools\apache-maven-3.9.9\bin\mvn.cmd" "-Dmaven.test.skip=true" spring-boot:run
```

Wait until you see: `Tomcat started on port(s): 8081`

✅ Backend ready! Leave this window open.

---

## ⚡ STEP 3: Start Frontend (PowerShell Window 2)

**Open a NEW PowerShell window** and copy-paste:

```powershell
$env:Path = "C:\Users\ichock\Desktop\pi\federation-platform\federation-frontend\.tools\node-v22.16.0-win-x64;" + $env:Path
cd C:\Users\ichock\Desktop\pi\federation-platform\federation-frontend
npm start
```

Wait until you see: `Local: http://localhost:4200/`

✅ Frontend ready! Leave this window open.

---

## 🎉 DONE! Open the App

**Go to:** http://localhost:4200

**Login:**
| Email | Password | Role |
|---|---|---|
| `admin@federation.local` | `Admin@1234` | Admin (full access) |
| `staff@federation.local` | `Test@1234` | Staff |
| `athlete.ferjani@federation.local` | `Test@1234` | Athlete |

---

## ⏹️ To Stop

Press `Ctrl + C` in each PowerShell window.

---

## ❓ Troubleshooting

| Problem | Fix |
|---|---|
| Port 8081 already in use | `netstat -ano \| findstr :8081` then `taskkill /PID XXXX /F` |
| Database connection failed | Check PostgreSQL is running: `net start postgresql-x64-17` |
| Frontend blank page | Stop with Ctrl+C, then `npm start` again |
| `npm install` needed (first time) | Run `npm install` before `npm start` in the frontend folder |

---

---

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Language |
| Spring Boot | 3.2.5 | Application framework |
| Spring Security 6 | 6.2.4 | Authentication & authorization |
| Spring Data JPA | 3.2.5 | Data access layer |
| Hibernate | 6.4.4 | ORM |
| PostgreSQL | 16 | Primary database |
| Flyway | 9.22.3 | Database migrations |
| JJWT | 0.12.5 | JWT token library |
| MapStruct | 1.5.5 | DTO mapping |
| Lombok | 1.18.32 | Boilerplate reduction |
| SpringDoc OpenAPI | 2.5.0 | Swagger UI / API docs |
| Maven | 3.9+ | Build tool |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Angular | 19 | SPA framework |
| TypeScript | 5.5 | Language |
| Angular Material | 19 | UI component library |
| Tailwind CSS | 3.4 | Utility-first styling |
| RxJS | 7.8 | Reactive state management |
| Angular Signals | 19 | Fine-grained reactivity |

### Infrastructure
| Technology | Purpose |
|---|---|
| PostgreSQL 16 | Production-grade relational database |
| Flyway | Database schema versioning & migrations |
| Windows PowerShell | Terminal for running commands |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Angular 19 SPA                          │
│        (http://localhost:4200 → proxy to :8081/api)     │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │   Login    │  │   Admin    │  │   Portal   │         │
│  │            │  │ Dashboard  │  │  (Athlete) │         │
│  └────────────┘  └────────────┘  └────────────┘         │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTP + JWT Token
┌────────────────────▼─────────────────────────────────────┐
│            Spring Boot 3 REST API (Port 8081)            │
│            (http://localhost:8081/api)                   │
│                                                          │
│  ┌────────┐  ┌─────────┐  ┌──────────┐  ┌─────────┐    │
│  │  Auth  │  │ Athlete │  │   Club   │  │Competi- │    │
│  │        │  │         │  │          │  │ tion    │    │
│  └────────┘  └─────────┘  └──────────┘  └─────────┘    │
│                                                          │
│  Spring Security → JWT → DB (PostgreSQL)                │
└──────────────────────────────────────────────────────────┘
└────────────────────────┬────────────────────────────────┘
                         │ JDBC
┌────────────────────────▼────────────────────────────────┐
│           PostgreSQL 16 (Docker container)               │
│              federation_db  port:5432                    │
│                                                          │
│  users  clubs  athletes  competitions  results  news     │
└─────────────────────────────────────────────────────────┘
```

---

## Features

### Authentication
- JWT access + refresh token pair
- Automatic token refresh on expiry
- Secure logout with server-side token revocation
- BCrypt password hashing

### Modules
| Module | Endpoints | Description |
|---|---|---|
| Auth | `/api/auth/**` | Login, register, refresh, logout, profile |
| Athletes | `/api/athletes/**` | CRUD, filtering by status/gender/category/club |
| Clubs | `/api/clubs/**` | CRUD, search, slug-based lookup |
| Competitions | `/api/competitions/**` | Full lifecycle from draft to completed |
| Results | `/api/results/**` | Performance recording, rankings, medals |
| News | `/api/news/**` | Articles with tags, publishing workflow |
| Users | `/api/users/**` | Admin user management |

---

## Prerequisites & Dependencies

### What you must download and install (one-time)

Only **PostgreSQL 17** requires a manual download:

| Software | What to Do |
|---|---|
| **PostgreSQL 17** | 1. Download from https://www.postgresql.org/download/windows/ <br/> 2. Install to `C:\Program Files\PostgreSQL\17` <br/> 3. Set superuser password to **`azerty990`** <br/> 4. Ensure PostgreSQL service auto-starts |

Verify PostgreSQL installation:
```powershell
$env:PGPASSWORD = "azerty990"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "SELECT version();"
```

### What's already included (nothing to download)

These are **bundled in the repo** — just use them:

| Tool | Location | Version | Purpose |
|---|---|---|---|
| Java 21 (Temurin) | `sports-federation/.tools/jdk-21.0.11+10/` | 21.0.11 | Compile & run backend |
| Apache Maven | `sports-federation/.tools/apache-maven-3.9.9/` | 3.9.9 | Build backend |
| Node.js + npm | `federation-frontend/.tools/node-v22.16.0-win-x64/` | 22.16.0 | Dev server + build frontend |

No global `PATH` setup needed — the commands below reference them directly.

---

## Project Structure

```
federation-platform/
│
├── sports-federation/              ← Spring Boot backend
│   ├── src/main/java/com/federation/
│   │   ├── auth/                   ← JWT auth, login, register, refresh
│   │   ├── athletes/               ← Athlete entity, CRUD, filtering
│   │   ├── clubs/                  ← Club entity, CRUD, slug management
│   │   ├── competitions/           ← Competition + events lifecycle
│   │   ├── results/                ← Result recording + rankings
│   │   ├── news/                   ← News articles + tags
│   │   ├── users/                  ← User management (admin)
│   │   └── common/                 ← Config, exceptions, response wrappers
│   ├── src/main/resources/
│   │   ├── application.yml         ← Main configuration
│   │   └── db/migration/           ← 12 Flyway SQL migrations
│   ├── docker-compose.yml          ← PostgreSQL + pgAdmin services
│   └── pom.xml
│
└── federation-frontend/            ← Angular 19 frontend
    ├── src/app/
    │   ├── core/                   ← Services, guards, interceptors, models
    │   ├── shared/                 ← Reusable components, pipes, directives
    │   ├── layouts/                ← Public and admin layout shells
    │   └── features/               ← Lazy-loaded feature pages
    │       ├── auth/               ← Login, register, forgot password
    │       ├── dashboard/          ← Admin dashboard
    │       ├── athletes/           ← Athlete list, detail, form
    │       ├── clubs/              ← Club list, detail, form
    │       ├── competitions/       ← Competition management
    │       ├── results/            ← Results and rankings
    │       ├── news/               ← News management
    │       ├── users/              ← User management
    │       └── portal/             ← Athlete self-service portal
    ├── proxy.conf.json             ← Dev proxy → :8080
    ├── tailwind.config.js
    └── package.json
```

---

## Local Setup

All commands below are for **Windows**. You can use either **PowerShell** or **Command Prompt (cmd)** — pick whichever you prefer.

### CMD Step-by-Step (First Time)

Use this if you are on **Command Prompt (cmd)** and running the project for the first time.

1. Open `cmd` and go to the repo root:

```cmd
cd C:\Users\ichock\Desktop\pi\federation-platform
```

2. Create the database once:

```cmd
set PGPASSWORD=azerty990
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE federation_db;"
```

3. Install frontend dependencies once:

```cmd
cd federation-frontend
path=%CD%\.tools\node-v22.16.0-win-x64;%CD%\.tools\node-v22.16.0-win-x64\node_modules\.bin;%PATH%
npm install
cd ..
```

4. Apply the Windows line-ending fix once (or after every new `npm install`):

```cmd
powershell -Command ^
  "$f = 'federation-frontend\node_modules\@angular\build\node_modules\vite\dist\client\client.mjs'; " ^
  "$c = [System.IO.File]::ReadAllText($f); " ^
  "$c = $c -replace '`r`n', '`n'; " ^
  "[System.IO.File]::WriteAllText($f, $c)"
```

5. Start backend in a **new CMD window**:

```cmd
set JAVA_HOME=C:\Users\ichock\Desktop\pi\federation-platform\sports-federation\.tools\jdk-21.0.11+10
set PATH=%JAVA_HOME%\bin;%PATH%
"C:\Users\ichock\Desktop\pi\federation-platform\sports-federation\.tools\apache-maven-3.9.9\bin\mvn.cmd" -f "C:\Users\ichock\Desktop\pi\federation-platform\sports-federation\pom.xml" "-Dmaven.test.skip=true" spring-boot:run "-Dspring-boot.run.jvmArguments=-Dserver.port=8081"
```

6. Start frontend in another **new CMD window**:

```cmd
cd C:\Users\ichock\Desktop\pi\federation-platform
set PATH=%CD%\federation-frontend\.tools\node-v22.16.0-win-x64;%CD%\federation-frontend\.tools\node-v22.16.0-win-x64\node_modules\.bin;%PATH%
cd federation-frontend
npm start
```

7. Open the app:

- Frontend: `http://localhost:4200`
- Backend API base: `http://localhost:8081/api`
- Swagger: `http://localhost:8081/api/swagger-ui.html`

### CMD Step-by-Step (Every Next Time)

After first-time setup, only run the two startup terminals:

1. Backend terminal (CMD):

```cmd
set JAVA_HOME=C:\Users\ichock\Desktop\pi\federation-platform\sports-federation\.tools\jdk-21.0.11+10
set PATH=%JAVA_HOME%\bin;%PATH%
"C:\Users\ichock\Desktop\pi\federation-platform\sports-federation\.tools\apache-maven-3.9.9\bin\mvn.cmd" -f "C:\Users\ichock\Desktop\pi\federation-platform\sports-federation\pom.xml" "-Dmaven.test.skip=true" spring-boot:run "-Dserver.port=8081"
```

2. Frontend terminal (CMD):

```cmd
cd C:\Users\ichock\Desktop\pi\federation-platform
set PATH=%CD%\federation-frontend\.tools\node-v22.16.0-win-x64;%CD%\federation-frontend\.tools\node-v22.16.0-win-x64\node_modules\.bin;%PATH%
cd federation-frontend
npm start
```

If frontend is blank after reinstalling node modules, run the Vite line-ending fix again.

---

### 🎯 First-time setup (do this once after cloning)

**Complete these three one-time steps.** After that, use only the "Running the project" section.

#### Step 1: Create the application database

**Using PowerShell:**
```powershell
$env:PGPASSWORD = "azerty990"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE federation_db;"
```

**Using Command Prompt (cmd):**
```cmd
set PGPASSWORD=azerty990
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE federation_db;"
```

**Verify it worked:**

**PowerShell:**
```powershell
$env:PGPASSWORD = "azerty990"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -l | grep federation_db
```

**Command Prompt (cmd):**
```cmd
set PGPASSWORD=azerty990
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -l | find "federation_db"
```

**What happens:** Flyway will automatically create all tables, indexes, enums, and seed test data (admin accounts, clubs, athletes, competitions) when the backend starts for the first time. No manual SQL needed.

---

#### Step 2: Install frontend npm packages

**Using PowerShell:**
```powershell
$node     = "$PWD\federation-frontend\.tools\node-v22.16.0-win-x64"
$env:Path = "$node;$node\node_modules\.bin;$env:Path"
Set-Location federation-frontend
npm install
Set-Location ..
```

**Using Command Prompt (cmd):**
```cmd
cd federation-frontend
path=%CD%\.tools\node-v22.16.0-win-x64;%CD%\.tools\node-v22.16.0-win-x64\node_modules\.bin;%PATH%
npm install
cd ..
```

**Expected time:** 2–3 minutes. Downloads ~300 MB.

---

#### Step 3: Fix Vite client line endings (Windows-only)

This is a Windows-specific bug: npm installs the Vite client file with CRLF line endings, but Angular's dev server expects LF. **Without this fix, the app shows a blank white page.**

**Using PowerShell:**
```powershell
$f = "federation-frontend\node_modules\@angular\build\node_modules\vite\dist\client\client.mjs"
$c = [System.IO.File]::ReadAllText($f)
$c = $c -replace "`r`n", "`n"
[System.IO.File]::WriteAllText($f, $c)
```

**Using Command Prompt (cmd):**
```cmd
powershell -Command ^
  "$f = 'federation-frontend\node_modules\@angular\build\node_modules\vite\dist\client\client.mjs'; " ^
  "$c = [System.IO.File]::ReadAllText($f); " ^
  "$c = $c -replace '`r`n', '`n'; " ^
  "[System.IO.File]::WriteAllText($f, $c)"
```

> Or use any text editor (VS Code, Notepad++) to open the file and "Convert EOL to LF" from the editor's menu.

**Note:** If you run `npm install` again in the future (e.g., after pulling new packages), re-run this step.

---

### 🚀 Running the project (every time you work)

Once first-time setup is complete, run these two commands in **separate terminal windows**:

#### Terminal 1: Start the backend (Spring Boot)

> **Important:** Always run these commands from the **repo root** (`federation-platform/`). Do not `cd` into `sports-federation` first.

**Using PowerShell (recommended):**
```powershell
$env:JAVA_HOME = "C:\Users\ichock\Desktop\pi\federation-platform\sports-federation\.tools\jdk-21.0.11+10"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
& "C:\Users\ichock\Desktop\pi\federation-platform\sports-federation\.tools\apache-maven-3.9.9\bin\mvn.cmd" `
    -f "C:\Users\ichock\Desktop\pi\federation-platform\sports-federation\pom.xml" `
    "-Dmaven.test.skip=true" spring-boot:run `
    "-Dspring-boot.run.jvmArguments=-Dserver.port=8081"
```

**Using Command Prompt (cmd):**
```cmd
set JAVA_HOME=C:\Users\ichock\Desktop\pi\federation-platform\sports-federation\.tools\jdk-21.0.11+10
set PATH=%JAVA_HOME%\bin;%PATH%
"C:\Users\ichock\Desktop\pi\federation-platform\sports-federation\.tools\apache-maven-3.9.9\bin\mvn.cmd" -f "C:\Users\ichock\Desktop\pi\federation-platform\sports-federation\pom.xml" "-Dmaven.test.skip=true" spring-boot:run "-Dspring-boot.run.jvmArguments=-Dserver.port=8081"
```

**Wait for this message:**

```
Tomcat started on port(s): 8081 (http) with context path '/api'
Started SportsFederationApplication in X.XXX seconds
```

✅ **Backend ready:** http://localhost:8081/api

---

#### Terminal 2: Start the frontend (Angular + Vite)

**Using PowerShell:**
```powershell
$node     = "$PWD\federation-frontend\.tools\node-v22.16.0-win-x64"
$env:Path = "$node;$node\node_modules\.bin;$env:Path"
Set-Location federation-frontend
npx ng serve --proxy-config proxy.conf.json
```

**Using Command Prompt (cmd):**
```cmd
set PATH=%CD%\federation-frontend\.tools\node-v22.16.0-win-x64;%CD%\federation-frontend\.tools\node-v22.16.0-win-x64\node_modules\.bin;%PATH%
cd federation-frontend
npx ng serve --proxy-config proxy.conf.json
```

**Wait for this message:**

```
Application bundle generation complete.
  ➜  Local:   http://localhost:4200/
```

✅ **Frontend ready:** http://localhost:4200

---

### 🔐 Default Login Credentials

These accounts are **seeded automatically** on the first backend startup. Use them to log in at http://localhost:4200:

| Email | Password | Role |
|---|---|---|
| `admin@federation.local` | `Admin@1234` | **Admin** — full platform access |
| `staff@federation.local` | `Test@1234` | **Federation Staff** — all except user management |
| `manager.esperance@federation.local` | `Test@1234` | **Club Manager** — own club + athletes |
| `athlete.ferjani@federation.local` | `Test@1234` | **Athlete** — self-service portal |

---

## API Documentation

Once the backend is running, Swagger UI is available at:

```
http://localhost:8081/api/swagger-ui.html
```

### Quick test with curl

```bash
# Login
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin@federation.local","password":"Admin@1234"}'

# Use the returned accessToken for protected endpoints
curl http://localhost:8081/api/auth/me \
  -H "Authorization: Bearer <your_access_token>"

# Get athletes
curl http://localhost:8081/api/athletes?page=0&size=10 \
  -H "Authorization: Bearer <your_access_token>"
```

### API Response format

All endpoints return a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful.",
  "timestamp": "2026-06-07T12:00:00Z"
}
```

Paginated list responses:

```json
{
  "success": true,
  "data": {
    "content": [ ... ],
    "page": 0,
    "size": 25,
    "totalElements": 120,
    "totalPages": 5,
    "first": true,
    "last": false
  }
}
```

---

## Environment Variables

All configuration is in `sports-federation/src/main/resources/application.yml`.

| Property | Default | Description |
|---|---|---|
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/federation_db` | Database URL |
| `spring.datasource.username` | `federation_user` | DB username |
| `spring.datasource.password` | `federation_pass` | DB password |
| `app.jwt.secret` | *(see yml)* | JWT signing secret — **change in production** |
| `app.jwt.access-token-expiry` | `86400000` (24h) | Access token TTL in ms |
| `app.jwt.refresh-token-expiry` | `604800000` (7d) | Refresh token TTL in ms |
| `server.port` | `8080` | Backend port |

For production, override these via environment variables or a separate `application-prod.yml`.

---

## Database Migrations

Managed by Flyway. Files are in `src/main/resources/db/migration/` and run automatically on startup.

| Migration | Description |
|---|---|
| V1 | Core schema — `users`, `refresh_tokens`, PostgreSQL extensions |
| V2 | Seed admin user (`admin@federation.local`) |
| V3 | Drop placeholder stub tables |
| V4 | All custom PostgreSQL enum types (17 enums) |
| V5 | `clubs` table + indexes |
| V6 | `athletes` table + indexes |
| V7 | `competitions` + `competition_events` tables |
| V8 | `competition_registrations` table |
| V9 | `results` + `rankings` tables |
| V10 | `news` + `tags` + `news_tags` tables |
| V11 | 6 optimised read views |
| V12 | Full seed dataset — clubs, athletes, competitions, results, news |

### Reset the database

If you need to start fresh:

**Using PowerShell:**
```powershell
# 1. Drop the database
$env:PGPASSWORD = "azerty990"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "DROP DATABASE federation_db;"

# 2. Recreate it
$env:PGPASSWORD = "azerty990"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE federation_db;"

# 3. Restart the backend — Flyway will re-run all migrations and re-seed the data
```

**Using Command Prompt (cmd):**
```cmd
REM 1. Drop the database
set PGPASSWORD=azerty990
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "DROP DATABASE federation_db;"

REM 2. Recreate it
set PGPASSWORD=azerty990
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE federation_db;"

REM 3. Restart the backend — Flyway will re-run all migrations and re-seed the data
```

---

## Role-Based Access Control

| Role | Dashboard | Users | Clubs | Athletes | Competitions | Results | News | Portal |
|---|---|---|---|---|---|---|---|---|
| `ROLE_ADMIN` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| `ROLE_FEDERATION_STAFF` | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| `ROLE_CLUB_MANAGER` | ✅ | ❌ | Own club | Own athletes | View only | View only | ❌ | — |
| `ROLE_ATHLETE` | — | — | — | — | — | — | — | ✅ |
| Public | — | — | View | View | View | View | View | — |

---

## Service URLs

| Service | URL | Notes |
|---|---|---|
| Angular App | http://localhost:4200 | Main frontend |
| Spring Boot API | http://localhost:8081/api | REST backend (8081 — avoids conflict with Apache httpd) |
| Swagger UI | http://localhost:8081/api/swagger-ui.html | Interactive API docs |
| Health Check | http://localhost:8081/api/actuator/health | Returns `{"status":"UP"}` |
| pgAdmin | http://localhost:5050 | DB browser — requires Docker Compose |

---

## Stopping Everything

**PowerShell or Command Prompt:**
```
Press Ctrl+C in the backend terminal
Press Ctrl+C in the frontend terminal
PostgreSQL keeps running as a Windows service — stop it from Services (services.msc) if needed
```

---

## Common Issues

| Problem | Solution |
|---|---|
| `Port 5432 already in use` | Stop local PostgreSQL or change the port in `docker-compose.yml` |
| `Port 8080 already in use` | Backend is intentionally started on **8081** to avoid this. If 8081 is also taken, add `"-Dspring-boot.run.jvmArguments=-Dserver.port=XXXX"` and update `proxy.conf.json` target accordingly |
| Login returns `401` | Drop and re-create `federation_db`, then restart the backend so Flyway re-seeds the data |
| `npm install` fails with `ERESOLVE` | Run `npm install --legacy-peer-deps` |
| Frontend shows blank page | Almost always the Vite CRLF issue on Windows. Run the Step 5 line-ending fix, then restart `ng serve` |
| `mvnw: Permission denied` (Linux/Mac) | Run `chmod +x ./mvnw` |
| `Failed to update Vite client error overlay text` in ng serve log | Run the Step 5 line-ending fix — see above |

---

## License

This project is licensed under the MIT License.
