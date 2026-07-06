# 🏆 Sports Federation Platform

A full-stack national sports federation management system built with **Spring Boot 3** and **Angular 19**. Manages athletes, clubs, competitions, results, and news through a role-based web interface.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites & Downloads](#prerequisites--downloads)
- [Complete Setup Guide](#complete-setup-guide)
- [Running the Project](#running-the-project)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Default Accounts](#default-accounts)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

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

## Prerequisites & Downloads

Before starting, ensure you have downloaded or installed these tools:

| Tool | Version | Download Link | Alternative |
|------|---------|---------------|-------------|
| **Java JDK** | 21+ | [oracle.com/java](https://www.oracle.com/java/technologies/downloads/) | Install globally or in project folder |
| **Maven** | 3.9+ | [maven.apache.org](https://maven.apache.org/download.cgi) | Place in Downloads, use full path in commands |
| **Node.js** | 22+ (LTS) | [nodejs.org](https://nodejs.org/) | Place in Downloads, use full path in commands |
| **PostgreSQL** | 16+ | [postgresql.org/download](https://www.postgresql.org/download/windows/) | Install globally |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) | Required for version control |

### ✅ Typical Setup Paths

```
C:\Program Files\PostgreSQL\17\           # PostgreSQL (installed globally)
C:\Program Files\Java\jdk-21\             # Java (installed globally)
C:\Users\YourUser\Downloads\apache-maven-3.9.16-bin\apache-maven-3.9.16\  # Maven
C:\Users\YourUser\Downloads\node-v22.16.0-win-x64\node-v22.16.0-win-x64\  # Node
```

---

## Complete Setup Guide

### Step 1: PostgreSQL Database Setup

Open PowerShell **as Administrator** and create the database:

```powershell
$env:PGPASSWORD = "azerty990"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE federation_db;"
```

You should see: `CREATE DATABASE` (or "already exists" if run before)

### Step 2: Clone & Navigate to Project

```powershell
# Clone the repository
git clone https://github.com/chocksma3iil/federation_platform_.git
cd federation_platform_
```

### Step 3: Backend Build & Run

#### Build Backend JAR

Navigate to the backend folder and build:

```powershell
cd sports-federation
$mavenPath = "C:\Users\ichock\Downloads\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin"
& "$mavenPath\mvn.cmd" -f "pom.xml" clean package -DskipTests
```

Expected output: `BUILD SUCCESS` after ~40 seconds

#### Run Backend Server

```powershell
java -jar "target\sports-federation-1.0.0-SNAPSHOT.jar"
```

Wait for: `Tomcat started on port(s): 8081`

✅ Backend ready at: **http://localhost:8081/api**

### Step 4: Frontend Setup & Run (New PowerShell Window)

#### Navigate to Frontend

```powershell
cd C:\Users\ichock\Desktop\pi\federation-platform\federation-frontend
```

#### Set Node Path & Install Dependencies

```powershell
$env:Path = "C:\Users\ichock\Downloads\node-v24.15.0-win-x64\node-v24.15.0-win-x64;" + $env:Path
& "C:\Users\ichock\Downloads\node-v24.15.0-win-x64\node-v24.15.0-win-x64\npm.cmd" install
```

Note: this downloaded Node archive contains `node.exe` and `npm.cmd` directly inside
`node-v24.15.0-win-x64\node-v24.15.0-win-x64`, not inside a `bin` folder.

Expected: `up to date, audited 988 packages`

#### Start Angular Dev Server

```powershell
& "C:\Users\ichock\Downloads\node-v24.15.0-win-x64\node-v24.15.0-win-x64\npm.cmd" start
```

Wait for: `Local: http://localhost:4200/`

✅ Frontend ready at: **http://localhost:4200**

### Step 5: Login

1. Open browser → **http://localhost:4200**
2. Enter credentials:
   - Email: `admin@federation.local`
   - Password: `Admin@1234`
3. You're in! 🎉

---

## Running the Project (Quick Reference)

### Terminal 1: Backend

```powershell
cd C:\Users\ichock\Desktop\pi\federation-platform\sports-federation
java -jar "target\sports-federation-1.0.0-SNAPSHOT.jar"
```

### Terminal 2: Frontend

```powershell
$env:Path = "C:\Users\ichock\Downloads\node-v24.15.0-win-x64\node-v24.15.0-win-x64;" + $env:Path
cd C:\Users\ichock\Desktop\pi\federation-platform\federation-frontend
& "C:\Users\ichock\Downloads\node-v24.15.0-win-x64\node-v24.15.0-win-x64\npm.cmd" start
```

### Terminal 3: Git Updates (Optional)

```powershell
cd C:\Users\ichock\Desktop\pi\federation-platform
git add .
git commit -m "Your message"
git push
```

---

## Tech Stack

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
| Docker & Docker Compose | PostgreSQL container |
| pgAdmin 4 | Database browser (optional) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Angular 19 SPA                        │
│         (localhost:4200 → proxy → :8081/api)            │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  Auth    │  │  Admin   │  │  Portal  │  │ Public │  │
│  │  Module  │  │ Dashboard│  │ (Athlete)│  │ Pages  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP + JWT
┌────────────────────────▼────────────────────────────────┐
│               Spring Boot 3 REST API                     │
│                  (localhost:8081/api)                    │
│                                                          │
│  ┌──────┐ ┌───────┐ ┌──────────┐ ┌────────┐ ┌───────┐  │
│  │ Auth │ │Athlete│ │   Club   │ │Competi-│ │ News  │  │
│  │      │ │       │ │          │ │  tion  │ │       │  │
│  └──────┘ └───────┘ └──────────┘ └────────┘ └───────┘  │
│                                                          │
│  Spring Security Filter Chain → JWT Validation          │
│  Flyway Migrations → JPA/Hibernate → HikariCP           │
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

**Using PowerShell:**
```powershell
$env:JAVA_HOME = "$PWD\sports-federation\.tools\jdk-21.0.11+10"
$env:Path      = "$env:JAVA_HOME\bin;$env:Path"
Set-Location sports-federation
..\.tools\apache-maven-3.9.9\bin\mvn.cmd -DskipTests spring-boot:run `
    "-Dspring-boot.run.jvmArguments=-Dserver.port=8081"
```

**Using Command Prompt (cmd):**
```cmd
set JAVA_HOME=%CD%\sports-federation\.tools\jdk-21.0.11+10
set PATH=%JAVA_HOME%\bin;%PATH%
cd sports-federation
..\tools\apache-maven-3.9.9\bin\mvn.cmd -DskipTests spring-boot:run "-Dspring-boot.run.jvmArguments=-Dserver.port=8081"
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

## Default Accounts

These accounts are seeded automatically on the first backend startup:

| Email | Password | Role |
|---|---|---|
| `admin@federation.local` | `Admin@1234` | **Admin** |
| `staff@federation.local` | `Test@1234` | **Federation Staff** |
| `manager.esperance@federation.local` | `Test@1234` | **Club Manager** |
| `athlete.ferjani@federation.local` | `Test@1234` | **Athlete** |

---

## Environment Variables

### Backend (application.yml)

The backend is configured in [sports-federation/src/main/resources/application.yml](sports-federation/src/main/resources/application.yml):

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/federation_db
    username: postgres
    password: azerty990
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    database-platform: org.hibernate.dialect.PostgreSQLDialect
  flyway:
    enabled: true
    locations: classpath:db/migration

server:
  port: 8081
  servlet:
    context-path: /api

jwt:
  secret: your-secret-key-change-in-production
  expiration: 900000        # 15 minutes
  refresh-expiration: 604800000  # 7 days
```

### Frontend (environment.ts)

The frontend is configured in [federation-frontend/src/environments/environment.ts](federation-frontend/src/environments/environment.ts):

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081/api'
};
```

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

### Response format

All endpoints return:

```json
{
  "success": true,
  "data": { },
  "message": "Success",
  "timestamp": "2024-06-07T12:00:00Z"
}
```

---

## Troubleshooting

### ❌ "npm: command not found" or npm install fails

**Problem:** npm is not in your PATH.

**Solution — PowerShell:**

```powershell
# Check if node exists
Get-Item C:\Users\ichock\Downloads\node-v24.15.0-win-x64\node-v24.15.0-win-x64\npm.cmd

# If found, set PATH before running npm
$node = "C:\Users\ichock\Downloads\node-v24.15.0-win-x64\node-v24.15.0-win-x64"
$env:Path = "$node;$env:Path"
npm --version
```

**Solution — Command Prompt (cmd):**

```cmd
path C:\Users\ichock\Downloads\node-v24.15.0-win-x64\node-v24.15.0-win-x64;%PATH%
npm --version
```

---

### ❌ "Cannot find module @angular/build" or blank white page on http://localhost:4200

**Problem:** Vite client file has wrong line endings (CRLF instead of LF on Windows).

**Solution:**

```powershell
$f = "federation-frontend\node_modules\@angular\build\node_modules\vite\dist\client\client.mjs"
$c = [System.IO.File]::ReadAllText($f)
$c = $c -replace "`r`n", "`n"
[System.IO.File]::WriteAllText($f, $c)
```

Or use VS Code: Open the file, click "CRLF" in bottom-right, select "LF", and save.

Then restart the Angular dev server (press Ctrl+C in Terminal 2, then run again).

---

### ❌ "Database federation_db does not exist"

**Problem:** Database wasn't created before starting the backend.

**Solution:**

```powershell
$env:PGPASSWORD = "azerty990"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE federation_db;"
```

Restart the backend. Flyway will auto-create all tables.

---

### ❌ "Connection refused on localhost:8081"

**Problem:** Backend didn't start or is listening on wrong port.

**Solution:**

1. Check if Maven command is running (look for "Tomcat started" message)
2. If using `.tools` folder:
   ```powershell
   # Restart backend with explicit port
   $env:JAVA_HOME = "$PWD\sports-federation\.tools\jdk-21.0.11+10"
   $env:Path      = "$env:JAVA_HOME\bin;$env:Path"
   cd sports-federation
   ..\.tools\apache-maven-3.9.9\bin\mvn.cmd -DskipTests spring-boot:run
   ```
3. Wait for: `Tomcat started on port(s): 8081`

---

### ❌ "Connection refused on localhost:4200"

**Problem:** Angular dev server didn't start or crashed.

**Solution:**

1. Check Terminal 2 for errors (look for "Local: http://localhost:4200")
2. Verify Node PATH:
   ```powershell
   $node = "$PWD\federation-frontend\.tools\node-v22.16.0-win-x64"
   $env:Path = "$node;$env:Path"
   node --version   # Should show v22.16.0
   npm --version
   ```
3. Re-run:
   ```powershell
   cd federation-frontend
   npx ng serve --proxy-config proxy.conf.json
   ```

---

### ❌ "psql: command not found"

**Problem:** PostgreSQL is not installed or not in PATH.

**Solution:**

1. Verify PostgreSQL installed to `C:\Program Files\PostgreSQL\17`:
   ```powershell
   Get-Item "C:\Program Files\PostgreSQL\17\bin\psql.exe"
   ```
2. If not found, download from: https://www.postgresql.org/download/windows/
3. Set PATH before running psql:
   ```powershell
   $env:Path = "C:\Program Files\PostgreSQL\17\bin;$env:Path"
   psql --version
   ```

---

### ❌ Login fails with "Invalid credentials"

**Problem:** Wrong email/password or admin account not seeded.

**Solution:**

1. Verify backend is running and Flyway migrations completed
2. Check backend logs for migration success:
   ```
   Migrating schema...
   V1__init_schema.sql
   V2__seed_admin_user.sql
   ```
3. Try these credentials (case-sensitive):
   - Email: `admin@federation.local`
   - Password: `Admin@1234`
4. If still failing, restart backend (Flyway runs on startup)

---

### ❌ "maven: command not found"

**Problem:** Maven is not in PATH.

**Solution — PowerShell:**

```powershell
# Using .tools folder
$mvn = "$PWD\sports-federation\.tools\apache-maven-3.9.9\bin"
& "$mvn\mvn.cmd" --version

# Or using Downloads folder
& "C:\Users\ichock\Downloads\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin\mvn.cmd" --version
```

**Solution — Command Prompt (cmd):**

```cmd
# Using .tools folder
set PATH=%CD%\sports-federation\.tools\apache-maven-3.9.9\bin;%PATH%
mvn --version

# Or using Downloads folder
set PATH=C:\Users\ichock\Downloads\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin;%PATH%
mvn --version
```

---

### ❌ "JAVA_HOME is not set"

**Problem:** Java location not configured.

**Solution — PowerShell:**

```powershell
# Using .tools folder
$env:JAVA_HOME = "$PWD\sports-federation\.tools\jdk-21.0.11+10"
$env:Path       = "$env:JAVA_HOME\bin;$env:Path"
java -version

# Or using global Java 21
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:Path       = "$env:JAVA_HOME\bin;$env:Path"
java -version
```

**Solution — Command Prompt (cmd):**

```cmd
# Using .tools folder
set JAVA_HOME=%CD%\sports-federation\.tools\jdk-21.0.11+10
set PATH=%JAVA_HOME%\bin;%PATH%
java -version

# Or using global Java 21
set JAVA_HOME=C:\Program Files\Java\jdk-21
set PATH=%JAVA_HOME%\bin;%PATH%
java -version
```

---

### ❌ Port 8081 or 4200 already in use

**Problem:** Another process is using the port (previous backend/frontend instance).

**Solution:**

```powershell
# Find process on port 8081 (backend)
netstat -ano | findstr :8081

# Find process on port 4200 (frontend)
netstat -ano | findstr :4200

# Kill process by PID (replace XXXX with PID from above)
Stop-Process -Id XXXX -Force
```

**Or restart both terminals and try again.**

---

### ❌ Git push fails: "fatal: 'origin' does not appear to be a 'git' repository"

**Problem:** Git remote not configured.

**Solution:**

```powershell
git remote -v   # Should show 'origin' → GitHub URL

# If empty, add the remote
git remote add origin https://github.com/chocksma3iil/federation_platform_.git

# Verify
git remote -v

# Push
git push -u origin main
```

---

### ✅ Still stuck?

Check the terminal output for these keywords:

| Message | Meaning | Action |
|---|---|---|
| `BUILD SUCCESS` | Backend compiled | Run `java -jar` |
| `BUILD FAILURE` | Compilation error | Check Maven output for Java errors |
| `Application bundle generation complete` | Frontend ready | Open http://localhost:4200 |
| `ERROR` in Angular | Frontend error | Check browser DevTools (F12) Console tab |
| `Tomcat started on port(s): 8081` | Backend listening | Good to go |
| `Connection refused` | Backend not running | Restart it in Terminal 1 |
| `403 Forbidden` | Wrong JWT token | Log in again |
| `404 Not Found` | Endpoint typo or backend not running | Check URL and port 8081 |

---

## Development Tips

### File watching & hot reload

**Backend:** Changes to Java files require recompile — not automatic in `spring-boot:run` mode. Use your IDE or run `mvn clean package` + restart the JAR.

**Frontend:** Changes to `.ts`, `.html`, `.scss` files auto-reload the browser. Just save and check http://localhost:4200.

### Debugging the backend

Add breakpoints in VS Code:
1. Install Extension: "Debugger for Java" (Microsoft)
2. In [sports-federation/pom.xml](sports-federation/pom.xml), add:
   ```xml
   -Drun.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"
   ```
3. Attach VS Code debugger to localhost:5005

### Debugging the frontend

Press **F12** in the browser to open DevTools:
- **Sources** tab: Set breakpoints in `.ts` files
- **Console** tab: View logs and errors
- **Network** tab: Inspect API calls

### Database browser

Access pgAdmin 4 (optional):

```bash
docker-compose -f sports-federation/docker-compose.yml up pgadmin
```

Then open: http://localhost:5050 (login: `admin@admin.com` / `admin`)

---

## Production Build

### Build backend JAR for deployment

```powershell
$mvn = "C:\Users\ichock\Downloads\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin"
& "$mvn\mvn.cmd" -f "sports-federation\pom.xml" clean package -DskipTests
# Output: sports-federation/target/sports-federation-1.0.0-SNAPSHOT.jar
```

### Build frontend for deployment

```powershell
$node = "C:\Users\ichock\Downloads\node-v24.15.0-win-x64\node-v24.15.0-win-x64"
$env:Path = "$node;$env:Path"
cd federation-frontend
npm run build   # Output: dist/
```

---

## Contributors

| Role | GitHub |
|---|---|
| Project Lead | [@chocksma3iil](https://github.com/chocksma3iil) |

---

## License

This project is licensed under the **MIT License** — see LICENSE file for details.

---

**Last updated:** 2024-06-07  
**Repository:** https://github.com/chocksma3iil/federation_platform_

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
