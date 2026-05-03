package com.wordscramble.repository;

import com.wordscramble.model.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScoreRepository extends JpaRepository<Score, Long> {

    // Top 10 scores, highest first
    List<Score> findTop10ByOrderByScoreDesc();
}
