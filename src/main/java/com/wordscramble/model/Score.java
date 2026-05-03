package com.wordscramble.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String playerName;
    private int score;          // total points
    private int wordsCorrect;   // how many words guessed right
    private int totalWords;     // total words attempted
    private String gameMode;    // e.g., "STANDARD" or "SURVIVAL"

    private LocalDateTime playedAt;

    @PrePersist
    public void prePersist() {
        this.playedAt = LocalDateTime.now();
    }

    // ── Getters ──────────────────────────────────
    public Long getId()             { return id; }
    public String getPlayerName()   { return playerName; }
    public int getScore()           { return score; }
    public int getWordsCorrect()    { return wordsCorrect; }
    public int getTotalWords()      { return totalWords; }
    public String getGameMode()     { return gameMode; }
    public LocalDateTime getPlayedAt() { return playedAt; }

    // ── Setters ──────────────────────────────────
    public void setId(Long id)                   { this.id = id; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }
    public void setScore(int score)              { this.score = score; }
    public void setWordsCorrect(int wordsCorrect){ this.wordsCorrect = wordsCorrect; }
    public void setTotalWords(int totalWords)    { this.totalWords = totalWords; }
    public void setGameMode(String gameMode)     { this.gameMode = gameMode; }
    public void setPlayedAt(LocalDateTime playedAt) { this.playedAt = playedAt; }
}
