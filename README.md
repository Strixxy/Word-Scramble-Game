<div align="center">
  <img src="https://img.icons8.com/color/96/000000/word-scramble.png" alt="Logo" width="80" height="80">
  <h1>🔤 Word Scramble Game</h1>
  <p>
    <b>A modernized, full-stack word puzzle game built with Spring Boot and React.</b><br/>
    Race against the clock, manage your lives, use power-ups, and climb the leaderboards!
  </p>

  <!-- Badges -->
  <p>
    <a href="https://word-scramble-game.up.railway.app/"><img src="https://img.shields.io/badge/Live-Demo-brightgreen.svg" alt="Live Demo" /></a>
    <img src="https://img.shields.io/badge/Java-17-orange.svg" alt="Java 17" />
    <img src="https://img.shields.io/badge/Spring_Boot-3.2-6DB33F.svg?logo=spring" alt="Spring Boot" />
    <img src="https://img.shields.io/badge/React-Vite-61DAFB.svg?logo=react" alt="React Vite" />
    <img src="https://img.shields.io/badge/Database-MySQL-4479A1.svg?logo=mysql" alt="MySQL" />
  </p>
</div>

---

## 📑 Table of Contents
- [✨ Features](#-features)
- [📁 Project Structure](#-project-structure)
- [🚀 Setup & Installation](#-setup--installation)
- [🎮 How to Play](#-how-to-play)
- [📡 API Endpoints](#-api-endpoints)
- [🛠️ Tech Stack](#️-tech-stack)

---

## ✨ Features

- **Dual Game Modes:** 
  - **Standard:** Fast-paced 5-word sprint with a 1.5x score multiplier for streaks.
  - **Survival:** Infinite wave mode. You get 3 lives—every wrong guess or skip costs a life!
- **Dynamic Scoring & Leaderboards:** mode-specific Top 10 leaderboards.
- **Powerups:** 🧲 *Magnet* (reveals the first letter) and ❄️ *Freeze* (stops the timer).
- **Anti-Repetition Engine:** The backend actively filters out words you've already seen in a session.
- **Premium UI:** Glassmorphism design, floating particles, and juicy animations powered by Framer Motion.

---

## 📁 Project Structure

```text
word-scramble/
├── src/                ← Spring Boot Backend (Java Controllers, Models, Repos)
├── pom.xml             ← Backend dependencies (Maven)
└── frontend/           ← React Frontend (Vite)
    ├── src/            ← React Components & CSS (Tailwind)
    └── package.json    ← Frontend dependencies (npm)
```

---

## 🚀 Setup & Installation

> [!IMPORTANT]  
> Make sure you have **Java 17+**, **Node.js**, **Maven**, and **MySQL** installed on your system before proceeding.

### 1️⃣ Database Setup (MySQL)
Open your MySQL terminal or GUI and create the database:
```sql
CREATE DATABASE word_scramble_db;
```

Update your database credentials in `src/main/resources/application.properties`:
```properties
spring.datasource.username=root
spring.datasource.password=root123
```

### 2️⃣ Run the Backend (Spring Boot)
Open a terminal in the root project folder and run:
```bash
mvn spring-boot:run
```
> [!NOTE]  
> The backend automatically creates the database tables and seeds them with hundreds of categorized words on startup! The API will be available at `http://localhost:8080`.

### 3️⃣ Run the Frontend (React)
Open a **second terminal** and navigate to the `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```
> [!TIP]  
> The React app will launch locally. Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

---

## 🎮 How to Play

1. **Enter Your Name** on the home screen.
2. Choose a specific category and difficulty, or go random.
3. Select your Game Mode and click **Play Now**.
4. **Use Powerups:**
   - **💡 Hint (`Ctrl+Space`):** Get a clue (costs points).
   - **🧲 Magnet:** Reveals the first letter of the word (costs 50 points).
   - **❄️ Freeze:** Pauses the timer for 5 seconds (costs 50 points).

<details>
<summary><b>🤫 Secret Easter Egg</b></summary>
There's a secret hidden in the game mode UI. Click the Game Mode pill (top left corner) 5 times to activate an auto-typing cheat!
</details>

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/game/categories` | List all available categories |
| `GET` | `/api/game/word?category=X&difficulty=Y&excludeIds=1,2` | Get a scrambled word (avoiding repeats) |
| `POST` | `/api/game/check` | Check if the guessed word is correct |
| `POST` | `/api/game/powerup` | Use Magnet or Freeze powerups |
| `POST` | `/api/game/score` | Submit the final score (with gameMode) |
| `GET` | `/api/game/scores?mode=SURVIVAL` | Get top 10 leaderboard by mode |

---

## 🛠️ Tech Stack

**Backend:**
- Java 17
- Spring Boot 3.2
- Spring Data JPA (Hibernate)
- MySQL

**Frontend:**
- React (Vite)
- Tailwind CSS v4
- Framer Motion (Animations)
- Lucide React (Icons)

---
<div align="center">
  <i>Built with ❤️ By Paul J Kottackal</i>
</div>
