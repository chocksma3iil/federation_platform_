# Sports Federation Platform

Full-stack sports federation management platform with a Spring Boot backend and an Angular frontend.

## Overview

This project manages the federation workflow end to end:
- Authentication and role-based access
- Athletes and clubs management
- Competitions, registrations, and event lifecycle
- Results publishing and athlete portal
- News publishing

## Tech Stack

- Backend: Java 21, Spring Boot 3.2, Spring Security, Spring Data JPA, Flyway, PostgreSQL
- Frontend: Angular 19, TypeScript, Angular Material, Tailwind
- Build tools: Maven, npm

## Architecture

- Frontend: http://localhost:4200
- Backend API: http://localhost:8081/api
- Frontend calls /api and is proxied to backend through federation-frontend/proxy.conf.json

## Prerequisites

Install these once on Windows:
- Java 21+
- Maven 3.9+
- Node.js 22+
- PostgreSQL 16+ or 17+
- Git

## Project Structure

- sports-federation: Spring Boot backend
- federation-frontend: Angular frontend

## First-Time Setup

### 1) Create database

Command Prompt (cmd):

```cmd
set PGPASSWORD=azerty990
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE federation_db;"
```

PowerShell:

```powershell
$env:PGPASSWORD = "azerty990"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE federation_db;"
```

### 2) Install frontend dependencies

Command Prompt (cmd):

```cmd
cd federation-frontend
npm install
cd ..
```

PowerShell:

```powershell
Set-Location federation-frontend
npm install
Set-Location ..
```

## Run the Project

Run backend and frontend in separate terminals.

### Terminal 1: Start backend

Command Prompt (cmd):

```cmd
cd sports-federation
mvn -DskipTests spring-boot:run "-Dspring-boot.run.jvmArguments=-Dserver.port=8081"
```

PowerShell:

```powershell
Set-Location sports-federation
mvn -DskipTests spring-boot:run "-Dspring-boot.run.jvmArguments=-Dserver.port=8081"
```

Expected log contains:
- Tomcat started on port(s): 8081
- context path '/api'

### Terminal 2: Start frontend

Command Prompt (cmd):

```cmd
cd federation-frontend
npm start
```

PowerShell:

```powershell
Set-Location federation-frontend
npm start
```

Expected log contains:
- Local: http://localhost:4200/

## Login

Open http://localhost:4200 and use:

- Email: admin@federation.local
- Password: Admin@1234

Other seeded users:
- staff@federation.local / Test@1234
- manager.esperance@federation.local / Test@1234
- athlete.ferjani@federation.local / Test@1234

## API and Health URLs

- Swagger UI: http://localhost:8081/api/swagger-ui.html
- OpenAPI docs: http://localhost:8081/api/v3/api-docs
- Health check: http://localhost:8081/api/actuator/health

## Environment Configuration

Backend config file:
- sports-federation/src/main/resources/application.yml

Key defaults:
- Database URL: jdbc:postgresql://localhost:5432/federation_db
- Database user: postgres
- Database password: azerty990
- Server port: 8081
- Context path: /api

Frontend config files:
- federation-frontend/proxy.conf.json
- federation-frontend/src/environments/environment.ts

Notes:
- Frontend API base URL is /api and is proxied to backend localhost:8081 in development.

## Common Troubleshooting

### Backend cannot connect to DB

- Confirm PostgreSQL service is running.
- Confirm federation_db exists.
- Confirm credentials in application.yml match your PostgreSQL setup.

### Frontend cannot reach backend

- Confirm backend is running on 8081.
- Confirm proxy target in federation-frontend/proxy.conf.json is http://localhost:8081.
- Restart npm start after proxy changes.

### Port already in use

PowerShell:

```powershell
netstat -ano | findstr :8081
netstat -ano | findstr :4200
Stop-Process -Id <PID> -Force
```

### Maven or npm not found

- Ensure Java, Maven, and Node.js are installed and available in PATH.
- Open a new terminal and verify:

```cmd
java -version
mvn -version
node -v
npm -v
```

## Development Notes

- Backend hot reload is not guaranteed for all changes; restart backend if needed.
- Frontend supports live reload during npm start.
- Flyway migrations run automatically at backend startup.

## License

MIT
