# 🔤 Word Scramble Game

A full-stack word scramble game built with Spring Boot + HTML/CSS/JS.

---

## 📁 Project Structure

```
word-scramble/
├── backend/        ← Spring Boot (Java)
└── frontend/
    └── index.html  ← Open this in browser
```

---

## ⚙️ Setup — Backend (Spring Boot)

### Step 1: Setup MySQL
Open MySQL and run:
```sql
CREATE DATABASE word_scramble_db;
```

### Step 2: Update DB credentials
Edit `backend/src/main/resources/application.properties`:
```properties
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

### Step 3: Run the backend
```bash
cd backend
mvn spring-boot:run
```
The API will start at: http://localhost:8080

The database tables and sample words are created automatically on first run.

---

## 🌐 Setup — Frontend

Just open `frontend/index.html` in your browser. That's it!

Make sure the backend is running first.

---

## 🎮 How to Play

1. Enter your name
2. Pick a category (or go random)
3. Unscramble the jumbled word before the timer runs out
4. Use hints if you're stuck (costs points)
5. Score is based on speed + accuracy
6. Top scores saved to the leaderboard

---

## 📡 API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/game/categories        | List all categories      |
| GET    | /api/game/word?category=X   | Get a scrambled word     |
| POST   | /api/game/check             | Check if answer is right |
| POST   | /api/game/reveal            | Reveal word (give up)    |
| POST   | /api/game/score             | Save final score         |
| GET    | /api/game/scores            | Top 10 leaderboard       |

---

## 🛠️ Tech Stack

- **Backend:** Java 17, Spring Boot 3.2, Spring Data JPA, Hibernate
- **Database:** MySQL
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Fonts:** Boogaloo + Nunito (Google Fonts)
