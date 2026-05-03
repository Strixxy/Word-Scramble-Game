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
    @Query(value = "SELECT * FROM word WHERE id NOT IN :excludeIds ORDER BY RAND() LIMIT 1", nativeQuery = true)
    Word findRandomWord(@Param("excludeIds") List<Long> excludeIds);

    // Get a random word by category
    @Query(value = "SELECT * FROM word WHERE category = :category AND id NOT IN :excludeIds ORDER BY RAND() LIMIT 1", nativeQuery = true)
    Word findRandomWordByCategory(@Param("category") String category, @Param("excludeIds") List<Long> excludeIds);

    // Get a random word by difficulty
    @Query(value = "SELECT * FROM word WHERE difficulty = :difficulty AND id NOT IN :excludeIds ORDER BY RAND() LIMIT 1", nativeQuery = true)
    Word findRandomWordByDifficulty(@Param("difficulty") String difficulty, @Param("excludeIds") List<Long> excludeIds);

    // Get a random word by category and difficulty
    @Query(value = "SELECT * FROM word WHERE category = :category AND difficulty = :difficulty AND id NOT IN :excludeIds ORDER BY RAND() LIMIT 1", nativeQuery = true)
    Word findRandomWordByCategoryAndDifficulty(@Param("category") String category, @Param("difficulty") String difficulty, @Param("excludeIds") List<Long> excludeIds);

    // Get distinct categories
    @Query("SELECT DISTINCT w.category FROM Word w")
    List<String> findAllCategories();
}
