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
    // GET /api/game/word?category=Animals&excludeIds=1,2,3
    // Returns a scrambled word (never reveals original)
    // ─────────────────────────────────────────────
    @GetMapping("/word")
    public ResponseEntity<Map<String, Object>> getWord(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String excludeIds) {

        List<Long> excludedList = new ArrayList<>();
        if (excludeIds != null && !excludeIds.isBlank()) {
            for (String id : excludeIds.split(",")) {
                try {
                    excludedList.add(Long.parseLong(id.trim()));
                } catch (NumberFormatException ignored) {}
            }
        }
        if (excludedList.isEmpty()) {
            excludedList.add(-1L); // Prevent empty IN clause syntax errors
        }

        Word word;
        boolean hasCat = (category != null && !category.isBlank());
        boolean hasDiff = (difficulty != null && !difficulty.isBlank());

        if (hasCat && hasDiff) {
            word = wordRepository.findRandomWordByCategoryAndDifficulty(category, difficulty, excludedList);
        } else if (hasCat) {
            word = wordRepository.findRandomWordByCategory(category, excludedList);
        } else if (hasDiff) {
            word = wordRepository.findRandomWordByDifficulty(difficulty, excludedList);
        } else {
            word = wordRepository.findRandomWord(excludedList);
        }

        if (word == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("wordId",    word.getId());
        response.put("scrambled", scramble(word.getOriginal()));
        response.put("category",  word.getCategory());
        response.put("difficulty", word.getDifficulty());
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
    // POST /api/game/powerup
    // Body: { "wordId": 3, "type": "MAGNET" }
    // Returns powerup payload
    // ─────────────────────────────────────────────
    @PostMapping("/powerup")
    public ResponseEntity<Map<String, Object>> usePowerup(
            @RequestBody Map<String, Object> body) {

        Long wordId = Long.valueOf(body.get("wordId").toString());
        String type = body.get("type").toString().toUpperCase();

        Optional<Word> optWord = wordRepository.findById(wordId);
        if (optWord.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Word word = optWord.get();
        Map<String, Object> response = new HashMap<>();

        if ("MAGNET".equals(type)) {
            // Reveal the first letter of the original word
            String original = word.getOriginal();
            response.put("index", 0);
            response.put("letter", String.valueOf(original.charAt(0)).toUpperCase());
        }

        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────
    // POST /api/game/score
    // Body: { "playerName": "Arjun", "score": 850,
    //         "wordsCorrect": 4, "totalWords": 5, "gameMode": "STANDARD" }
    // Saves the final score
    // ─────────────────────────────────────────────
    @PostMapping("/score")
    public ResponseEntity<Score> saveScore(@RequestBody Score score) {
        if (score.getGameMode() == null || score.getGameMode().isBlank()) {
            score.setGameMode("STANDARD");
        }
        Score saved = scoreRepository.save(score);
        return ResponseEntity.ok(saved);
    }

    // ─────────────────────────────────────────────
    // GET /api/game/scores?mode=STANDARD
    // Returns top 10 leaderboard by mode
    // ─────────────────────────────────────────────
    @GetMapping("/scores")
    public ResponseEntity<List<Score>> getLeaderboard(@RequestParam(required = false) String mode) {
        if (mode != null && !mode.isBlank()) {
            return ResponseEntity.ok(scoreRepository.findTop10ByGameModeOrderByScoreDesc(mode));
        }
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
