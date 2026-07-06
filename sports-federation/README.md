# Sports Federation Platform Backend

Spring Boot backend for the Sports Federation Platform.

## What this backend provides

- JWT authentication and refresh token flow
- Role-based authorization
- Users, athletes, clubs, competitions, registrations, results, and news APIs
- Flyway migrations for schema and seed data
- OpenAPI/Swagger documentation

## Runtime URLs

- API base: http://localhost:8081/api
- Swagger UI: http://localhost:8081/api/swagger-ui.html
- OpenAPI JSON: http://localhost:8081/api/v3/api-docs
- Health check: http://localhost:8081/api/actuator/health

## Current local setup (your machine)

These are the paths currently used in your local runs:

- Java: C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot\bin\java.exe
- Maven: C:\Users\ichock\Downloads\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin\mvn.cmd
- Node/npm (frontend): C:\Users\ichock\Downloads\node-v24.15.0-win-x64\node-v24.15.0-win-x64\npm.cmd
- PostgreSQL psql: C:\Program Files\PostgreSQL\17\bin\psql.exe

## Prerequisites

- Java 21+
- Maven 3.9+
- PostgreSQL 16+ or 17+

## Quick Start

### 1) Create database (first time only)

PowerShell:

```powershell
$env:PGPASSWORD = "azerty990"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE federation_db;"
```

Command Prompt (cmd):

```cmd
set PGPASSWORD=azerty990
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE federation_db;"
```

### 2) Run backend

From the repository root:

PowerShell:

```powershell
Set-Location sports-federation
& "C:\Users\ichock\Downloads\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin\mvn.cmd" -DskipTests spring-boot:run "-Dspring-boot.run.jvmArguments=-Dserver.port=8081"
```

Command Prompt (cmd):

```cmd
cd sports-federation
"C:\Users\ichock\Downloads\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin\mvn.cmd" -DskipTests spring-boot:run "-Dspring-boot.run.jvmArguments=-Dserver.port=8081"
```

Wait for log lines:

- Tomcat started on port(s): 8081
- context path '/api'

## Frontend run (reference)

Run in another terminal from repository root.

PowerShell:

```powershell
$nodeHome = "C:\Users\ichock\Downloads\node-v24.15.0-win-x64\node-v24.15.0-win-x64"
$env:Path = "$nodeHome;$env:Path"
Set-Location federation-frontend
& "$nodeHome\npm.cmd" install
& "$nodeHome\npm.cmd" start
```

Important:

- In PowerShell, when calling a quoted path, use `&` before it.
- Without `&`, you get: `Unexpected token 'start'`.
- If `npm start` says `"node" is not recognized`, node is missing from PATH in that terminal session. Set `$env:Path` as shown above and retry.

## Default seeded accounts

- admin@federation.local / Admin@1234 (Admin)
- staff@federation.local / Test@1234
- manager.esperance@federation.local / Test@1234
- athlete.ferjani@federation.local / Test@1234

## Common troubleshooting

### Backend cannot connect to database

- Ensure PostgreSQL service is running.
- Ensure `federation_db` exists.
- Check datasource values in `src/main/resources/application.yml`.

### Port conflict (8081)

PowerShell:

```powershell
netstat -ano | findstr :8081
Stop-Process -Id <PID> -Force
```

### Maven not found

Use full Maven path command shown in Quick Start.

### npm audit vulnerabilities in frontend

This does not block backend startup. For frontend:

```powershell
$nodeHome = "C:\Users\ichock\Downloads\node-v24.15.0-win-x64\node-v24.15.0-win-x64"
& "$nodeHome\npm.cmd" audit
& "$nodeHome\npm.cmd" audit fix
```

Use `audit fix --force` only if you accept potentially breaking dependency upgrades.

## Development notes

- Backend config: `src/main/resources/application.yml`
- API context path is `/api`
- Flyway migrations run automatically at startup

## License

MIT
