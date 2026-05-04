# Project Report: Word Scramble Web Application

## 1. Executive Summary
The Word Scramble Web Application is a modern, full-stack gaming platform designed to provide an engaging vocabulary-based puzzle experience. The project transitioned from a local Java application to a cloud-ready, scalable web application featuring real-time state management, persistent leaderboards, and interactive gameplay mechanics.

---

## 2. Technical Stack
The application utilizes a distributed architecture to separate concerns and ensure performance:

### **Backend (Core Engine)**
- **Language/Framework:** Java 21 / Spring Boot 3.2
- **Persistence:** Spring Data JPA with Hibernate
- **Database:** MySQL 8.0 (Managed via Railway)
- **Security:** Integrated CORS configuration for cross-origin frontend requests.

### **Frontend (User Interface)**
- **Framework:** React 18 (Vite build tool)
- **Styling:** Modern Vanilla CSS with glassmorphism and responsive design.
- **State Management:** React Hooks (useState, useEffect) for real-time game loops.

### **Infrastructure & DevOps**
- **Hosting:** Railway.app (PaaS)
- **CI/CD:** Automated GitHub deployment pipeline.
- **Environment Management:** Dynamic configuration via Environment Variables (VITE_API_URL, MYSQLHOST, etc.).

---

## 3. Key Features
### **A. Advanced Game Modes**
- **Standard Mode:** Classic category-based play.
- **Survival Mode:** High-stakes "Three Lives" system where incorrect answers deduct lives, challenging users to achieve maximum streaks.

### **B. Power-up System**
- **Magnet:** Automatically reveals the first letter of the scrambled word.
- **Freeze:** Pauses the game timer for 5 seconds to allow for deeper analysis.
- *Balance Mechanism:* Use of power-ups incurs a -50 point penalty to maintain leaderboard integrity.

### **C. Interactive Leaderboard**
- Persistent global scoring system that records Usernames, Scores, and Timestamps.

### **D. Hidden "Cheat Mode"**
- A specialized developer easter egg triggered by clicking the Game Mode badge 5 times, allowing for rapid testing and "automated" wins.

---

## 4. Architectural Challenges & Solutions
### **Challenge 1: Cloud Database Connectivity**
- **Issue:** Initial "Communications link failure" errors when moving to Railway.
- **Solution:** Refactored `application.properties` to utilize a tiered fallback system for environment variables, ensuring compatibility with both local and cloud database clusters.

### **Challenge 2: JPA Entity Mapping**
- **Issue:** 500 errors during leaderboard fetching due to a mismatch in column names (`word_id` vs `id`).
- **Solution:** Synchronized the Java Entity model with the underlying MySQL schema and updated `WordRepository` native SQL queries.

### **Challenge 3: CORS Policy Blocks**
- **Issue:** Browser-level security blocking frontend requests to the Railway backend.
- **Solution:** Implemented a global `@CrossOrigin` policy on the Spring Controller and configured the frontend to use dynamic Vite environment variables.

---

## 5. Deployment Overview
The project is currently live at:
- **Live URL:** [https://word-scramble-game.up.railway.app/](https://word-scramble-game.up.railway.app/)

The deployment follows a **Microservices-Lite** pattern:
1. **GitHub Repository** acts as the source of truth.
2. **Railway** triggers a build on every push.
3. **Maven** packages the Spring Boot JAR.
4. **Vite** builds the optimized static frontend.

---

## 6. Conclusion
The Word Scramble project successfully demonstrates the integration of a robust Java backend with a dynamic React frontend. It highlights modern development practices such as environment-driven configuration, cloud-native deployment, and responsive UI design. The application is now fully prepared for public use and future feature expansions.
