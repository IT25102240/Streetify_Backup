# 🚀 Streetify Backend Server Commands
This file contains all the necessary PowerShell commands to manage, build, test, and run the Streetify Spring Boot Backend.

> **IMPORTANT:** Ensure your terminal or PowerShell window is inside the `streetify-backend` folder before running any of these commands!

---

### 1. Start the Server (Development Mode)
*Use this command for daily development. It sets the Java version to JDK 24 and starts the Spring Boot application on port 8080.*
```powershell
$env:JAVA_HOME="C:\Program Files\Java\jdk-24"; .\mvnw.cmd spring-boot:run
```

### 2. Clean and Rebuild the Project
*Use this command if you are facing weird compilation errors or if the server refuses to apply your latest code changes. It deletes the old `/target` build folder and downloads/recompiles everything fresh.*
```powershell
$env:JAVA_HOME="C:\Program Files\Java\jdk-24"; .\mvnw.cmd clean install -DskipTests
```

### 3. Run Backend Unit Tests
*If you or your team write any JUnit tests for your Java backend, run this command to execute all of them and verify that everything passes.*
```powershell
$env:JAVA_HOME="C:\Program Files\Java\jdk-24"; .\mvnw.cmd test
```

### 4. Build a Production JAR File
*Use this when preparing for your final evaluation. It packages the entire Spring Boot application into a single, deployable `.jar` file inside the `/target` folder without running tests.*
```powershell
$env:JAVA_HOME="C:\Program Files\Java\jdk-24"; .\mvnw.cmd clean package -DskipTests
```

### 5. Run the Production JAR File
*Once you have generated the `.jar` file using the command above, use this command to run the compiled production application. (Note: Ensure the filename matches what is in your `/target` folder).*
```powershell
$env:JAVA_HOME="C:\Program Files\Java\jdk-24"; & "$env:JAVA_HOME\bin\java.exe" -jar target\streetify-backend-0.0.1-SNAPSHOT.jar
```

---

# 🎨 Streetify Frontend Server Commands (React / Vite)
This section covers how to manage the React frontend built with Vite.

> **IMPORTANT:** Ensure your terminal or PowerShell window is inside the `Streetify MVP Prototype Design` frontend folder before running any of these commands!

### 1. Start the Frontend Server (Development Mode)
*Use this command to start the Vite development server. It runs extremely fast and instantly updates the UI in your browser whenever you save a file. Make sure your Spring Boot backend is ALSO running in a separate terminal so they can talk to each other!*
```powershell
npm run dev
```

### 2. Install New Dependencies
*If someone else on your team adds a new library (like an icon pack or chart library) and you pull their code, run this command to install all the missing packages.*
```powershell
npm install
```

### 3. Build a Production Version
*When you are ready for your final evaluation and want to deploy the frontend, this command compiles your React code into highly optimized, static HTML/JS/CSS files inside the `/dist` folder.*
```powershell
npm run build
```

### 4. Preview the Production Build
*After running `npm run build`, use this command to test the final production build locally before uploading it to a real web server.*
```powershell
npm run preview
```
