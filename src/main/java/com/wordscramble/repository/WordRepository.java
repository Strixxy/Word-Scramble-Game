package com.wordscramble.repository;

import com.wordscramble.model.Word;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface WordRepository extends JpaRepository<Word, Long> {

    // Get all words by category
    List<Word> findByCategory(String category);

    // Get a random word (any category)
    @Query(value = "SELECT * FROM word ORDER BY RAND() LIMIT 1", nativeQuery = true)
    Word findRandomWord();

    // Get a random word by category
    @Query(value = "SELECT * FROM word WHERE category = :category ORDER BY RAND() LIMIT 1", nativeQuery = true)
    Word findRandomWordByCategory(@Param("category") String category);

    // Get distinct categories
    @Query("SELECT DISTINCT w.category FROM Word w")
    List<String> findAllCategories();
}
