# Sports Federation Platform

Sports Federation Platform is a full-stack web application for managing a national sports federation.
It includes:
- Spring Boot backend API
- Angular frontend
- PostgreSQL database

## What the project does

Main capabilities:
- JWT authentication and role-based access
- User and profile management
- Athletes and clubs management
- Competitions, event registrations, and statuses
- Results publishing and athlete portal views
- News module

## Tech Stack

Backend:
- Java 21
- Spring Boot 3.2.x
- Spring Security
- Spring Data JPA + Hibernate
- Flyway
- PostgreSQL

Frontend:
- Angular 19
- TypeScript
- Angular Material
- Tailwind CSS

## Local URLs

- Frontend: http://localhost:4200
- Backend API base: http://localhost:8081/api
- Swagger UI: http://localhost:8081/api/swagger-ui.html
- Health: http://localhost:8081/api/actuator/health

## Verified local tool paths on your machine

These are the paths available in your environment:
- Java: C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot\bin\java.exe
- Maven: C:\Users\ichock\Downloads\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin\mvn.cmd
- Node/npm: C:\Users\ichock\Downloads\node-v24.15.0-win-x64\node-v24.15.0-win-x64\npm.cmd
- PostgreSQL psql: C:\Program Files\PostgreSQL\17\bin\psql.exe

## First-time setup

Run from project root.

### 1) Create database

Command Prompt (cmd):

```cmd
set PGPASSWORD=azerty990
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE federation_db;"
```

### 2) Install frontend dependencies

Command Prompt (cmd):

```cmd
cd federation-frontend
"C:\Users\ichock\Downloads\node-v24.15.0-win-x64\node-v24.15.0-win-x64\npm.cmd" install
cd ..
```

## Run the project

Use two terminals.

### Terminal 1 - Backend

Command Prompt (cmd):

```cmd
cd sports-federation
"C:\Users\ichock\Downloads\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin\mvn.cmd" -DskipTests spring-boot:run "-Dspring-boot.run.jvmArguments=-Dserver.port=8081"
```

Wait for backend ready logs:
- Tomcat started on port(s): 8081
- context path '/api'

### Terminal 2 - Frontend

Command Prompt (cmd):

```cmd
cd federation-frontend
"C:\Users\ichock\Downloads\node-v24.15.0-win-x64\node-v24.15.0-win-x64\npm.cmd" start
```

Wait for:
- Local: http://localhost:4200/

## Default login accounts

- admin@federation.local / Admin@1234 (Admin)
- staff@federation.local / Test@1234 (Federation Staff)
- manager.esperance@federation.local / Test@1234 (Club Manager)
- athlete.ferjani@federation.local / Test@1234 (Athlete)

## Useful checks

Command Prompt (cmd):

```cmd
"C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot\bin\java.exe" -version
"C:\Users\ichock\Downloads\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin\mvn.cmd" -version
"C:\Users\ichock\Downloads\node-v24.15.0-win-x64\node-v24.15.0-win-x64\npm.cmd" --version
```

## Troubleshooting

### Backend cannot connect to database

- Confirm PostgreSQL service is running.
- Confirm federation_db exists.
- Confirm backend datasource points to localhost:5432, user postgres, password azerty990.

### Frontend cannot call backend

- Confirm backend is running on 8081.
- Confirm federation-frontend/proxy.conf.json points /api to http://localhost:8081.
- Restart frontend terminal after changes.

### Port conflict (8081 or 4200)

PowerShell:

```powershell
netstat -ano | findstr :8081
netstat -ano | findstr :4200
Stop-Process -Id <PID> -Force
```

## Stop services

Press Ctrl+C in both backend and frontend terminals.

## License

MIT
