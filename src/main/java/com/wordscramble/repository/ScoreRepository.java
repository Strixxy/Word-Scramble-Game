package com.wordscramble.repository;

import com.wordscramble.model.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScoreRepository extends JpaRepository<Score, Long> {

    // Top 10 scores, highest first (all modes, legacy)
    List<Score> findTop10ByOrderByScoreDesc();

    // Top 10 scores by game mode
    List<Score> findTop10ByGameModeOrderByScoreDesc(String gameMode);
}
