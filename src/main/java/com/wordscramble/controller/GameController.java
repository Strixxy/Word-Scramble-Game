package com.wordscramble.controller;

import com.wordscramble.model.Score;
import com.wordscramble.model.Word;
import com.wordscramble.repository.ScoreRepository;
import com.wordscramble.repository.WordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")   // allows the HTML frontend to call this API
public class GameController {

    @Autowired
    private WordRepository wordRepository;

    @Autowired
    private ScoreRepository scoreRepository;

    // ─────────────────────────────────────────────
    // GET /api/game/categories
    // Returns list of all available categories
    // ─────────────────────────────────────────────
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(wordRepository.findAllCategories());
    }

    // ─────────────────────────────────────────────
    // GET /api/game/word?category=Animals
    // Returns a scrambled word (never reveals original)
    // ─────────────────────────────────────────────
    @GetMapping("/word")
    public ResponseEntity<Map<String, Object>> getWord(
            @RequestParam(required = false) String category) {

        Word word = (category == null || category.isBlank())
                ? wordRepository.findRandomWord()
                : wordRepository.findRandomWordByCategory(category);

        if (word == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("wordId",    word.getId());
        response.put("scrambled", scramble(word.getOriginal()));
        response.put("category",  word.getCategory());
        response.put("hint1",     word.getHint1());
        response.put("hint2",     word.getHint2());
        response.put("length",    word.getOriginal().length());

        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────
    // POST /api/game/check
    // Body: { "wordId": 3, "guess": "elephant" }
    // Returns whether guess is correct
    // ─────────────────────────────────────────────
    @PostMapping("/check")
    public ResponseEntity<Map<String, Object>> checkAnswer(
            @RequestBody Map<String, Object> body) {

        Long wordId = Long.valueOf(body.get("wordId").toString());
        String guess = body.get("guess").toString().trim().toLowerCase();

        Optional<Word> optWord = wordRepository.findById(wordId);
        if (optWord.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Word word = optWord.get();
        boolean correct = word.getOriginal().equalsIgnoreCase(guess);

        Map<String, Object> response = new HashMap<>();
        response.put("correct", correct);
        // Only reveal the actual word if the answer is correct or they gave up
        if (correct) {
            response.put("actualWord", word.getOriginal());
        }

        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────
    // POST /api/game/reveal
    // Body: { "wordId": 3 }
    // Reveals the actual word (when player gives up)
    // ─────────────────────────────────────────────
    @PostMapping("/reveal")
    public ResponseEntity<Map<String, Object>> revealWord(
            @RequestBody Map<String, Object> body) {

        Long wordId = Long.valueOf(body.get("wordId").toString());
        Optional<Word> optWord = wordRepository.findById(wordId);

        if (optWord.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("actualWord", optWord.get().getOriginal());
        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────
    // POST /api/game/score
    // Body: { "playerName": "Arjun", "score": 850,
    //         "wordsCorrect": 4, "totalWords": 5 }
    // Saves the final score
    // ─────────────────────────────────────────────
    @PostMapping("/score")
    public ResponseEntity<Score> saveScore(@RequestBody Score score) {
        Score saved = scoreRepository.save(score);
        return ResponseEntity.ok(saved);
    }

    // ─────────────────────────────────────────────
    // GET /api/game/scores
    // Returns top 10 leaderboard
    // ─────────────────────────────────────────────
    @GetMapping("/scores")
    public ResponseEntity<List<Score>> getLeaderboard() {
        return ResponseEntity.ok(scoreRepository.findTop10ByOrderByScoreDesc());
    }

    // ─────────────────────────────────────────────
    // Helper: scramble a word (shuffle characters)
    // Ensures the scrambled version is never the same
    // as the original
    // ─────────────────────────────────────────────
    private String scramble(String word) {
        List<Character> chars = new ArrayList<>();
        for (char c : word.toCharArray()) chars.add(c);

        String scrambled;
        int attempts = 0;
        do {
            Collections.shuffle(chars);
            StringBuilder sb = new StringBuilder();
            for (char c : chars) sb.append(c);
            scrambled = sb.toString();
            attempts++;
        } while (scrambled.equals(word) && attempts < 10);

        return scrambled.toUpperCase();
    }
}
