package com.wordscramble.model;

import jakarta.persistence.*;

@Entity
public class Word {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String original;   // actual word e.g. "elephant"
    private String category;   // e.g. "Animals"
    private String difficulty; // "EASY", "MEDIUM", "HARD"
    private String hint1;      // first hint
    private String hint2;      // second hint (shown after hint1 is used)

    // ── Getters ──────────────────────────────────
    public Long getId()         { return id; }
    public String getOriginal() { return original; }
    public String getCategory() { return category; }
    public String getDifficulty() { return difficulty; }
    public String getHint1()    { return hint1; }
    public String getHint2()    { return hint2; }

    // ── Setters ──────────────────────────────────
    public void setId(Long id)             { this.id = id; }
    public void setOriginal(String original) { this.original = original; }
    public void setCategory(String category) { this.category = category; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public void setHint1(String hint1)     { this.hint1 = hint1; }
    public void setHint2(String hint2)     { this.hint2 = hint2; }
}
