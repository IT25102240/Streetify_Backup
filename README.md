# 🚗 Streetify — Smart Urban Ride-Hailing Platform

A modern, web-based urban transportation platform designed for Sri Lanka, featuring real-time trip matching, dynamic fares, driver governance, interactive maps, digital wallet payments, and administrative oversight.

---

## 📁 Project Architecture & Monorepo Structure

```
Streetify/
├── 🌐 streetify-frontend/        # React + TypeScript + Vite UI (Passengers, Drivers, Admins)
│   ├── src/screens/              # Booking, Driver, Admin, History, Login, Payment, Review
│   └── src/api/                  # Axios HTTP client connecting to backend API
│
├── ⚙️ streetify-backend/         # Spring Boot 3.2 + Java 24 Enterprise Backend
│   ├── src/main/java/com/streetify/
│   │   ├── controller/           # RESTful API controllers
│   │   ├── entity/               # JPA Hibernate entity models
│   │   ├── service/              # Core business & dispatch logic
│   │   ├── security/             # JWT token authentication & Spring Security
│   │   └── config/               # WebSocket STOMP & CORS configuration
│   └── src/main/resources/       # application.properties (MSSQL database configuration)
│
├── 🗄️ database/                  # SQL Server DDL schemas, test seeds & stored queries
│   ├── 01_schema_ddl.sql         # Complete DDL tables, foreign keys & indexes
│   ├── 02_seed_data.sql          # Master seed script with valid BCrypt passwords
│   ├── 03_team_member_queries.sql# Individual queries per team member for viva demo
│   └── 04_utility_test_scripts.sql# Testing shortcuts, state modifiers & table counts
│
└── 📚 docs/                      # University coursework deliverables & system models
    ├── EER Diagrams & Schemas    # Database relational design
    ├── Activity & Sequence       # Architectural behavior workflows
    ├── Use Case Specifications   # Functional requirements
    └── Proposal Report           # Project scope & specification documents
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Java JDK 24**
- **Node.js** (v18+ or v20+) & **npm**
- **Microsoft SQL Server** (local instance or SQLEXPRESS on port 1433)

---

### 1. Database Setup
1. Ensure the **SQL Server** service is running (`MSSQL$SQLEXPRESS`).
2. Create the database in SQL Server Management Studio (SSMS):
   ```sql
   CREATE DATABASE streetify_db;
   ```
3. Run `database/02_seed_data.sql` to populate sample test data.

---

### Method A: Separate Terminals (Recommended for Evaluations & Debugging)

- **Backend Terminal:**
  ```powershell
  cd streetify-backend
  $env:JAVA_HOME="C:\Program Files\Java\jdk-24"; .\mvnw.cmd spring-boot:run
  ```
- **Frontend Terminal:**
  ```powershell
  cd streetify-frontend
  npm run dev
  ```

---

### Method B: Root Shortcuts (Run Directly from Project Root)

You can run any of these commands from the root folder without `cd`-ing into subdirectories:

| Command | Action |
|---|---|
| `npm run dev` | **Starts BOTH backend and frontend simultaneously** in a single terminal |
| `npm run frontend` | Starts the React / Vite frontend server (`http://localhost:5173`) |
| `npm run backend` | Starts the Spring Boot backend server (`http://localhost:8080`) |
| `npm run build:frontend` | Builds production React bundle to `streetify-frontend/dist` |
| `npm run build:backend` | Packages Spring Boot JAR to `streetify-backend/target` |

---

### Endpoints:
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** `http://localhost:8080`
- **Swagger Interactive API Documentation:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON Endpoint:** [http://localhost:8080/api-docs](http://localhost:8080/api-docs)

---

## 👥 Default Test Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@streetify.com` | `1111` |
| **Driver** | `driver1@streetify.com` | `1111` |
| **Passenger 1** | `passenger1@streetify.com` (Lahiru Peris) | `1111` |
| **Passenger 2** | `passenger2@streetify.com` (Gihan Devis) | `1111` |
