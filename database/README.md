# 🗄️ Streetify Database Documentation & Scripts

This folder contains all the official Microsoft SQL Server scripts for the Streetify platform.

---

## 📂 File Structure & Execution Order

| File | Purpose | When to Run |
|---|---|---|
| **[`01_schema_ddl.sql`](file:///e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/database/01_schema_ddl.sql)** | Complete SQL Server DDL schema definition (Tables, Foreign Keys, Indexes, Constraints). | **First (once)**: When setting up a new database in SSMS from scratch. |
| **[`02_seed_data.sql`](file:///e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/database/02_seed_data.sql)** | Master test data: 6 team Admins (with BCrypt passwords), Passengers, Drivers, Vehicles, Trips, Payments, and Reviews. | **Second**: To populate your tables with rich data for testing the UI. |
| **[`03_team_member_queries.sql`](file:///e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/database/03_team_member_queries.sql)** | Categorized queries grouped by team member responsibilities (Lahiru, Chanuka, Tharindu, Daham, Mithun, Vidura). | **During evaluations/viva**: To show individual module queries and reports to examiners. |
| **[`04_utility_test_scripts.sql`](file:///e:/2Y1S/2Y1S_Projects/SE_project/Streetify/Streetify_Backup/database/04_utility_test_scripts.sql)** | Useful developer shortcuts: complete all trips, set drivers online, top-up wallets, and inspect table row counts. | **During development/testing**: Whenever you want to manipulate state quickly. |

---

## 🔑 Default Seed Account Credentials

| Role | Name | Email | Password | Admin Role |
|---|---|---|---|---|
| **Super Admin** | System Admin | `admin@streetify.com` | `1111` | `SUPER_ADMIN` |
| **Super Admin** | Vidura | `vidura@streetify.lk` | `admin123` | `SUPER_ADMIN` |
| **User Management** | Lahiru | `lahiru@streetify.lk` | `admin123` | `USER_MGMT` |
| **Booking Management** | Chanuka | `chanuka@streetify.lk` | `admin123` | `BOOKING_MGMT` |
| **Driver Management** | Tharindu | `tharindu@streetify.lk` | `admin123` | `DRIVER_MGMT` |
| **Payment Management** | Daham | `daham@streetify.lk` | `admin123` | `PAYMENT_MGMT` |
| **Review Management** | Mithun | `mithun@streetify.lk` | `admin123` | `REVIEW_MGMT` |
| **Passenger 1** | Lahiru Peris | `passenger1@streetify.com` | `1111` | — |
| **Passenger 2** | Gihan Devis | `passenger2@streetify.com` | `1111` | — |
| **Driver 1** | Kamal Perera | `driver1@streetify.com` | `1111` | — |
