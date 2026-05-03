import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, Lightbulb, Magnet, SearchX, Home, SkipForward, Flag } from 'lucide-react';

const API = 'http://localhost:8080/api/game';
const TIME_PER_WORD = 30;
const BASE_POINTS = 200;
const HINT_PENALTY = 50;

function App() {
  const [screen, setScreen] = useState('home');
  const [categories, setCategories] = useState([]);
  
  // Game Configuration
  const [playerName, setPlayerName] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  
  // Game State
  const [score, setScore] = useState(0);
  const [wordsCorrect, setWordsCorrect] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [totalWords] = useState(5);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  
  // Current Word State
  const [currentWord, setCurrentWord] = useState(null);
  const [timerSecs, setTimerSecs] = useState(TIME_PER_WORD);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState(null); // { text, type }
  const [hintsUsed, setHintsUsed] = useState(0);
  const [revealedLetters, setRevealedLetters] = useState({}); // { index: letter }
  const [isWordFrozen, setIsWordFrozen] = useState(false);
  
  // Powerups Inventory (1 per game)
  const [powerups, setPowerups] = useState({ magnet: 1, freeze: 1 });
  
  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetch(`${API}/categories`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("API error", err));
  }, []);

  // Timer Effect
  useEffect(() => {
    if (screen !== 'game' || currentWord === null) return;
    if (isWordFrozen) return; // Frozen!
    
    if (timerSecs <= 0) {
      handleTimeUp();
      return;
    }
    const timer = setInterval(() => setTimerSecs(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [timerSecs, screen, currentWord, isWordFrozen]);

  const startGame = async () => {
    setScore(0);
    setWordsCorrect(0);
    setWordIndex(0);
    setTotalTimeTaken(0);
    setPowerups({ magnet: 1, freeze: 1 });
    setScreen('game');
    await loadNextWord(0);
  };

  const loadNextWord = async (index) => {
    if (index >= totalWords) {
      finishGame();
      return;
    }
    
    setGuess('');
    setFeedback(null);
    setHintsUsed(0);
    setRevealedLetters({});
    setIsWordFrozen(false);
    setCurrentWord(null);
    setTimerSecs(TIME_PER_WORD);
    
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (difficulty) params.append('difficulty', difficulty);
      
      const res = await fetch(`${API}/word?${params.toString()}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setCurrentWord(data);
    } catch (e) {
      setFeedback({ text: '⚠️ Could not load word', type: 'wrong' });
    }
  };

  const handleTimeUp = () => {
    setFeedback({ text: "⏰ Time's up!", type: 'wrong' });
    setTotalTimeTaken(prev => prev + TIME_PER_WORD);
    setTimeout(() => {
      setWordIndex(i => i + 1);
      loadNextWord(wordIndex + 1);
    }, 1500);
  };

  const submitAnswer = async (e) => {
    e?.preventDefault();
    if (!guess.trim() || !currentWord) return;
    
    try {
      const res = await fetch(`${API}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: currentWord.wordId, guess: guess.trim() })
      });
      const data = await res.json();
      
      if (data.correct) {
        const timeTaken = TIME_PER_WORD - timerSecs;
        setTotalTimeTaken(prev => prev + timeTaken);
        setWordsCorrect(prev => prev + 1);
        
        const timePenalty = timeTaken * 3;
        const hintPenalty = hintsUsed * HINT_PENALTY;
        const points = Math.max(10, BASE_POINTS - hintPenalty - timePenalty);
        
        setScore(prev => prev + points);
        setFeedback({ text: `✅ Correct! +${points} pts`, type: 'correct' });
        
        setTimeout(() => {
          setWordIndex(i => i + 1);
          loadNextWord(wordIndex + 1);
        }, 1500);
      } else {
        setFeedback({ text: '❌ Wrong! Try again.', type: 'wrong' });
        setGuess('');
      }
    } catch (err) {
      setFeedback({ text: '⚠️ Network error', type: 'wrong' });
    }
  };

  const useHint = () => {
    if (hintsUsed >= 2) return;
    setHintsUsed(prev => prev + 1);
    setFeedback({ text: `Hint revealed! (-${HINT_PENALTY} pts)`, type: 'hint' });
  };

  const useMagnet = async () => {
    if (powerups.magnet <= 0 || !currentWord) return;
    setPowerups(prev => ({ ...prev, magnet: 0 }));
    
    try {
      const res = await fetch(`${API}/powerup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: currentWord.wordId, type: 'MAGNET' })
      });
      const data = await res.json();
      setRevealedLetters(prev => ({ ...prev, [data.index]: data.letter }));
      setFeedback({ text: `🧲 Magnet used!`, type: 'hint' });
    } catch (err) {
      console.error(err);
    }
  };

  const useFreeze = () => {
    if (powerups.freeze <= 0) return;
    setPowerups(prev => ({ ...prev, freeze: 0 }));
    setIsWordFrozen(true);
    setFeedback({ text: `❄️ Timer Frozen!`, type: 'hint' });
    setTimeout(() => {
      setIsWordFrozen(false);
    }, 5000);
  };

  const skipWord = () => {
    setTotalTimeTaken(prev => prev + TIME_PER_WORD);
    setWordIndex(i => i + 1);
    loadNextWord(wordIndex + 1);
  };

  const finishGame = async () => {
    setScreen('results');
    // Save Score
    if (playerName && score > 0) {
      await fetch(`${API}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerName || 'Player',
          score,
          wordsCorrect,
          totalWords
        })
      });
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API}/scores`);
      const data = await res.json();
      setLeaderboard(data);
      setScreen('leaderboard');
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Render Helpers
  // -------------------------------------------------------------

  const renderHome = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
      className="flex flex-col items-center justify-center min-h-screen p-6"
    >
      <div className="font-boogaloo text-5xl md:text-7xl mb-2 tracking-wide">
        Word<span className="text-[var(--color-accent)]">Scramble</span>
      </div>
      <p className="text-[var(--color-muted)] text-lg mb-10 text-center">
        Unscramble letters, race the clock, top the board 🔥
      </p>

      <div className="bg-[var(--color-card)] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
        <label className="block text-sm font-bold text-[var(--color-muted)] uppercase mb-2">Your Name</label>
        <input 
          type="text" 
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          placeholder="e.g. Arjun" 
          className="w-full bg-[var(--color-surface)] border-2 border-white/10 rounded-xl p-3 mb-6 focus:border-[var(--color-accent)] outline-none text-white font-semibold transition"
        />

        <label className="block text-sm font-bold text-[var(--color-muted)] uppercase mb-2">Category</label>
        <select 
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full bg-[var(--color-surface)] border-2 border-white/10 rounded-xl p-3 mb-6 outline-none text-white font-semibold"
        >
          <option value="">🎲 Random (All Categories)</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label className="block text-sm font-bold text-[var(--color-muted)] uppercase mb-2">Difficulty</label>
        <select 
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
          className="w-full bg-[var(--color-surface)] border-2 border-white/10 rounded-xl p-3 mb-8 outline-none text-white font-semibold"
        >
          <option value="">⚖️ Any Difficulty</option>
          <option value="EASY">🟢 Easy</option>
          <option value="MEDIUM">🟡 Medium</option>
          <option value="HARD">🔴 Hard</option>
        </select>

        <button 
          onClick={startGame}
          className="w-full bg-[var(--color-accent)] hover:bg-[#ff8050] text-white font-bold py-4 rounded-xl shadow-[0_6px_24px_rgba(255,107,53,0.35)] transition-transform hover:-translate-y-1 active:translate-y-0"
        >
          Play Now →
        </button>
        <button 
          onClick={fetchLeaderboard}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-xl mt-4 transition-transform hover:-translate-y-1 active:translate-y-0"
        >
          🏆 Leaderboard
        </button>
      </div>
    </motion.div>
  );

  const renderGame = () => {
    if (!currentWord) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    const circumference = 2 * Math.PI * 30;
    const strokeOffset = circumference * (1 - timerSecs / TIME_PER_WORD);
    const strokeColor = timerSecs > 15 ? 'var(--color-green)' : timerSecs > 8 ? 'var(--color-yellow)' : 'var(--color-pink)';

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center min-h-screen p-6 max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center w-full mb-6">
          <div className="bg-[var(--color-card)] px-5 py-2 rounded-full border border-white/10 font-bold">
            Score: <span className="text-[var(--color-accent)]">{score}</span>
          </div>
          
          <div className="relative w-[70px] h-[70px]">
            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 70 70">
              <circle cx="35" cy="35" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
              <circle 
                cx="35" cy="35" r="30" fill="none" 
                stroke={isWordFrozen ? 'var(--color-blue)' : strokeColor} 
                strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-boogaloo text-2xl text-white">
              {timerSecs}
            </div>
          </div>
          
          <div className="bg-[var(--color-card)] px-5 py-2 rounded-full border border-white/10 font-bold">
            Hints: <span className="text-[var(--color-accent)]">{2 - hintsUsed}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full bg-white/10 h-1.5 rounded-full mb-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-yellow)] transition-all duration-500"
            style={{ width: `${(wordIndex / totalWords) * 100}%` }}
          />
        </div>
        <div className="w-full text-right text-sm font-bold text-[var(--color-muted)] mb-6">
          Word {wordIndex + 1} of {totalWords}
        </div>

        {/* Word Box */}
        <motion.div 
          key={currentWord.wordId}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[var(--color-card)] w-full p-8 rounded-2xl border border-white/10 text-center mb-6 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-4 left-4 bg-[var(--color-accent)]/20 text-[var(--color-accent)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {currentWord.category}
          </div>
          <div className="absolute top-4 right-4 bg-white/10 text-white/70 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {currentWord.difficulty || 'ANY'}
          </div>
          
          <div className="font-boogaloo text-5xl md:text-6xl text-[var(--color-yellow)] tracking-[0.2em] drop-shadow-[0_0_20px_rgba(255,209,102,0.3)] my-8 break-all">
            {currentWord.scrambled}
          </div>
          
          <div className="flex justify-center gap-2">
            {Array.from({ length: currentWord.length }).map((_, i) => (
              <div key={i} className={`w-8 h-10 border-b-4 flex items-end justify-center font-bold text-2xl ${revealedLetters[i] ? 'border-[var(--color-green)] text-[var(--color-green)]' : 'border-white/20'}`}>
                {revealedLetters[i] || ''}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Feedback & Hints */}
        <div className="min-h-[80px] w-full flex flex-col items-center">
          <AnimatePresence>
            {feedback && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`font-bold text-lg mb-2 text-center ${
                  feedback.type === 'correct' ? 'text-[var(--color-green)]' : 
                  feedback.type === 'wrong' ? 'text-[var(--color-pink)]' : 'text-[var(--color-yellow)]'
                }`}
              >
                {feedback.text}
              </motion.div>
            )}
          </AnimatePresence>
          
          {hintsUsed > 0 && (
            <div className="bg-[var(--color-yellow)]/10 text-[var(--color-yellow)] px-4 py-2 rounded-xl text-sm font-bold border border-[var(--color-yellow)]/20 mb-2">
              💡 {currentWord.hint1}
            </div>
          )}
          {hintsUsed > 1 && (
            <div className="bg-[var(--color-yellow)]/10 text-[var(--color-yellow)] px-4 py-2 rounded-xl text-sm font-bold border border-[var(--color-yellow)]/20">
              💡 {currentWord.hint2}
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={submitAnswer} className="flex gap-3 w-full mb-6">
          <input 
            type="text" 
            value={guess}
            onChange={e => setGuess(e.target.value.toUpperCase())}
            placeholder="TYPE ANSWER..."
            className="flex-1 bg-[var(--color-surface)] border-2 border-white/10 rounded-xl p-4 text-center text-xl tracking-[0.2em] uppercase font-bold outline-none focus:border-[var(--color-accent)]"
            autoFocus
          />
          <button type="submit" className="bg-[var(--color-accent)] text-white px-8 rounded-xl font-bold hover:bg-[#ff8050] transition-transform active:scale-95">
            GO
          </button>
        </form>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-3 w-full">
          <button onClick={useHint} className="flex-1 min-w-[120px] bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 font-bold flex items-center justify-center gap-2">
            <Lightbulb size={18} /> Hint
          </button>
          <button onClick={useMagnet} disabled={powerups.magnet === 0} className="flex-1 min-w-[120px] bg-[var(--color-blue)]/20 hover:bg-[var(--color-blue)]/30 border border-[var(--color-blue)]/50 text-[var(--color-blue)] disabled:opacity-30 disabled:hover:bg-[var(--color-blue)]/20 rounded-xl py-3 font-bold flex items-center justify-center gap-2">
            <Magnet size={18} /> {powerups.magnet > 0 ? 'Magnet' : 'Used'}
          </button>
          <button onClick={useFreeze} disabled={powerups.freeze === 0} className="flex-1 min-w-[120px] bg-[var(--color-green)]/20 hover:bg-[var(--color-green)]/30 border border-[var(--color-green)]/50 text-[var(--color-green)] disabled:opacity-30 disabled:hover:bg-[var(--color-green)]/20 rounded-xl py-3 font-bold flex items-center justify-center gap-2">
            <SearchX size={18} /> {powerups.freeze > 0 ? 'Freeze' : 'Used'}
          </button>
          <button onClick={skipWord} className="flex-1 min-w-[120px] bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 font-bold flex items-center justify-center gap-2">
            <SkipForward size={18} /> Skip
          </button>
        </div>

      </motion.div>
    );
  };

  const renderResults = () => {
    const accuracy = totalWords === 0 ? 0 : Math.round((wordsCorrect / totalWords) * 100);
    const avgTime = wordsCorrect === 0 ? 0 : Math.round(totalTimeTaken / totalWords);

    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="bg-[var(--color-card)] p-10 rounded-2xl w-full max-w-md text-center border border-white/10 shadow-2xl">
          <Trophy className="w-20 h-20 text-[var(--color-yellow)] mx-auto mb-4" />
          <h2 className="font-boogaloo text-4xl mb-2">Game Over!</h2>
          <p className="text-[var(--color-muted)] font-bold mb-6">You got {wordsCorrect} out of {totalWords} correct</p>
          
          <div className="text-[var(--color-muted)] font-bold uppercase text-sm">Final Score</div>
          <div className="font-boogaloo text-7xl text-[var(--color-accent)] drop-shadow-[0_0_20px_rgba(255,107,53,0.3)] mb-8">
            {score}
          </div>

          <div className="flex gap-4 mb-8">
            <div className="flex-1 bg-[var(--color-surface)] p-4 rounded-xl">
              <div className="font-boogaloo text-3xl text-[var(--color-green)]">{wordsCorrect}</div>
              <div className="text-xs font-bold text-[var(--color-muted)] uppercase mt-1">Correct</div>
            </div>
            <div className="flex-1 bg-[var(--color-surface)] p-4 rounded-xl">
              <div className="font-boogaloo text-3xl text-[var(--color-blue)]">{avgTime}s</div>
              <div className="text-xs font-bold text-[var(--color-muted)] uppercase mt-1">Avg Time</div>
            </div>
            <div className="flex-1 bg-[var(--color-surface)] p-4 rounded-xl">
              <div className="font-boogaloo text-3xl text-[var(--color-yellow)]">{accuracy}%</div>
              <div className="text-xs font-bold text-[var(--color-muted)] uppercase mt-1">Accuracy</div>
            </div>
          </div>

          <button onClick={startGame} className="w-full flex justify-center items-center gap-2 bg-[var(--color-accent)] text-white font-bold py-4 rounded-xl mb-4 hover:bg-[#ff8050] transition-transform active:scale-95">
            <RefreshCw size={20} /> Play Again
          </button>
          <div className="flex gap-4">
            <button onClick={fetchLeaderboard} className="flex-1 flex justify-center items-center gap-2 bg-white/5 text-white font-bold py-4 rounded-xl border border-white/10 hover:bg-white/10 transition-transform active:scale-95">
              <Trophy size={18} /> Leaders
            </button>
            <button onClick={() => setScreen('home')} className="flex-1 flex justify-center items-center gap-2 bg-white/5 text-white font-bold py-4 rounded-xl border border-white/10 hover:bg-white/10 transition-transform active:scale-95">
              <Home size={18} /> Home
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderLeaderboard = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center min-h-screen p-6">
      <h2 className="font-boogaloo text-5xl mb-8 mt-10">🏆 Leaderboard</h2>
      
      <div className="w-full max-w-lg bg-[var(--color-card)] rounded-2xl border border-white/10 overflow-hidden shadow-2xl mb-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-[var(--color-muted)] text-sm uppercase tracking-wider">
              <th className="p-4 font-bold border-b border-white/10">Rank</th>
              <th className="p-4 font-bold border-b border-white/10">Player</th>
              <th className="p-4 font-bold border-b border-white/10 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr><td colSpan="3" className="p-8 text-center text-[var(--color-muted)]">No scores yet!</td></tr>
            ) : leaderboard.map((s, i) => (
              <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <td className="p-4 font-boogaloo text-2xl text-[var(--color-muted)]">#{i+1}</td>
                <td className="p-4 font-bold">{s.playerName}</td>
                <td className="p-4 text-right font-boogaloo text-2xl text-[var(--color-accent)]">{s.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <button onClick={() => setScreen('home')} className="bg-white/10 px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/20 transition-colors">
        <Home size={20} /> Back to Home
      </button>
    </motion.div>
  );

  return (
    <div className="min-h-screen relative z-10">
      {screen === 'home' && renderHome()}
      {screen === 'game' && renderGame()}
      {screen === 'results' && renderResults()}
      {screen === 'leaderboard' && renderLeaderboard()}
    </div>
  );
}

export default App;
