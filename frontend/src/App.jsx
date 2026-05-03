import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, Lightbulb, Magnet, SearchX, Home, SkipForward, XCircle, Heart, Star } from 'lucide-react';

const API = 'http://localhost:8080/api/game';
const TIME_PER_WORD = 30;
const BASE_POINTS = 200;
const HINT_PENALTY = 50;

// Simple Web Audio SFX generator
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'wrong' || type === 'timeup') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Ignore if audio not supported or blocked
  }
};

function App() {
  const [screen, setScreen] = useState('home');
  const [categories, setCategories] = useState([]);
  
  // Game Configuration
  const [playerName, setPlayerName] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [gameMode, setGameMode] = useState('STANDARD'); // STANDARD or SURVIVAL
  
  // Tracking unique words
  const [playedWordIds, setPlayedWordIds] = useState([]);
  
  // Game State
  const [score, setScore] = useState(0);
  const [wordsCorrect, setWordsCorrect] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [isRevealing, setIsRevealing] = useState(false);
  
  // Animation Triggers
  const [shakeInput, setShakeInput] = useState(false);
  const [floatingScore, setFloatingScore] = useState(null); // { amount: 200, id: 1 }

  // Current Word State
  const [currentWord, setCurrentWord] = useState(null);
  const [timerSecs, setTimerSecs] = useState(TIME_PER_WORD);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState(null); // { text, type }
  const [hintsUsed, setHintsUsed] = useState(0);
  const [revealedLetters, setRevealedLetters] = useState({}); // { index: letter }
  const [isWordFrozen, setIsWordFrozen] = useState(false);
  
  // Powerups Inventory
  const [powerups, setPowerups] = useState({ magnet: 1, freeze: 1 });
  
  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardMode, setLeaderboardMode] = useState('STANDARD');

  // Easter Egg State
  const [easterEggClicks, setEasterEggClicks] = useState(0);
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [cheatWord, setCheatWord] = useState('');

  useEffect(() => {
    fetch(`${API}/categories`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("API error", err));
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (screen !== 'game' || isRevealing) return;
      if (e.key === 'Escape') endGameEarly();
      else if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        useHint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, isRevealing, hintsUsed]);

  // Timer Effect
  useEffect(() => {
    if (screen !== 'game' || currentWord === null || isRevealing || isWordFrozen) return;
    
    if (timerSecs <= 0) {
      handleTimeUp();
      return;
    }
    const timer = setInterval(() => setTimerSecs(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [timerSecs, screen, currentWord, isWordFrozen, isRevealing]);

  const startGame = async () => {
    setScore(0);
    setWordsCorrect(0);
    setWordIndex(0);
    setTotalTimeTaken(0);
    setStreak(0);
    setLives(3);
    setPlayedWordIds([]); // Reset seen words
    setPowerups({ magnet: 1, freeze: 1 });
    setEasterEggClicks(0);
    setEasterEggActive(false);
    setCheatWord('');
    setScreen('game');
    await loadNextWord(0, []);
  };

  const loadNextWord = async (index, excludeList) => {
    if (gameMode === 'STANDARD' && index >= 5) {
      finishGame();
      return;
    }
    if (gameMode === 'SURVIVAL' && lives <= 0) {
      finishGame();
      return;
    }
    
    setGuess('');
    setFeedback(null);
    setHintsUsed(0);
    setRevealedLetters({});
    setIsWordFrozen(false);
    setIsRevealing(false);
    setCurrentWord(null);
    setTimerSecs(TIME_PER_WORD);
    
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (difficulty) params.append('difficulty', difficulty);
      if (excludeList && excludeList.length > 0) params.append('excludeIds', excludeList.join(','));
      
      const res = await fetch(`${API}/word?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 404 && excludeList.length > 0) {
          // Ran out of words for this filter! Just finish game.
          finishGame();
          return;
        }
        throw new Error("Not found");
      }
      const data = await res.json();
      setCurrentWord(data);
      setPlayedWordIds(prev => [...prev, data.wordId]); // Add to played list
      if (easterEggActive) {
        fetchCheatWord(data.wordId);
      }
    } catch (e) {
      setFeedback({ text: '⚠️ Could not load word', type: 'wrong' });
    }
  };

  const fetchCheatWord = async (id) => {
    try {
      const res = await fetch(`${API}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: id })
      });
      const data = await res.json();
      setCheatWord(data.actualWord.toUpperCase());
    } catch (e) {}
  };

  const handleEasterEggClick = () => {
    if (easterEggActive) return;
    const newClicks = easterEggClicks + 1;
    setEasterEggClicks(newClicks);
    if (newClicks >= 5) {
      setEasterEggActive(true);
      if (currentWord) fetchCheatWord(currentWord.wordId);
      setFeedback({ text: '🤫 Easter Egg Activated!', type: 'hint' });
    }
  };

  const revealAnswerAndNext = async (reason, isTimeUp = false, skipLifeDeduction = false) => {
    if (isRevealing) return;
    setIsRevealing(true);
    playSound(isTimeUp ? 'timeup' : 'wrong');
    triggerShake();
    
    setTotalTimeTaken(prev => prev + (TIME_PER_WORD - timerSecs));
    setStreak(0);

    let newLives = lives;
    if (gameMode === 'SURVIVAL' && !skipLifeDeduction) {
      newLives -= 1;
      setLives(newLives);
    }
    
    try {
      const res = await fetch(`${API}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: currentWord.wordId })
      });
      const data = await res.json();
      setFeedback({ text: `${reason} It was: ${data.actualWord}`, type: 'wrong' });
      
      const fullReveal = {};
      for (let i=0; i<data.actualWord.length; i++) fullReveal[i] = data.actualWord[i].toUpperCase();
      setRevealedLetters(fullReveal);
    } catch(e) {
      setFeedback({ text: `${reason} (No answer loaded)`, type: 'wrong' });
    }

    setTimeout(() => {
      if (gameMode === 'SURVIVAL' && newLives <= 0) {
        finishGame();
      } else {
        setWordIndex(i => i + 1);
        loadNextWord(wordIndex + 1, playedWordIds);
      }
    }, 2500);
  };

  const handleTimeUp = () => revealAnswerAndNext("⏰ Time's up!", true);
  const skipWord = () => revealAnswerAndNext("⏭️ Skipped!");

  const endGameEarly = () => {
    if (window.confirm("Are you sure you want to end the game early?")) {
      finishGame();
    }
  };

  const triggerShake = () => {
    setShakeInput(true);
    setTimeout(() => setShakeInput(false), 500);
  };

  const submitAnswer = async (e) => {
    e?.preventDefault();
    if (!guess.trim() || !currentWord || isRevealing) return;
    
    try {
      const res = await fetch(`${API}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: currentWord.wordId, guess: guess.trim() })
      });
      const data = await res.json();
      
      if (data.correct) {
        playSound('correct');
        const timeTaken = TIME_PER_WORD - timerSecs;
        setTotalTimeTaken(prev => prev + timeTaken);
        setWordsCorrect(prev => prev + 1);
        
        const newStreak = streak + 1;
        setStreak(newStreak);
        
        const timePenalty = timeTaken * 3;
        const hintPenalty = hintsUsed * HINT_PENALTY;
        let points = Math.max(10, BASE_POINTS - hintPenalty - timePenalty);
        
        let streakBonus = false;
        if (gameMode === 'STANDARD' && newStreak >= 3) {
          points = Math.floor(points * 1.5);
          streakBonus = true;
        }
        
        setScore(prev => prev + points);
        setFeedback({ 
          text: `✅ Correct! ${streakBonus ? '🔥 (1.5x Bonus)' : ''}`, 
          type: 'correct' 
        });
        
        // Floating point animation
        setFloatingScore({ amount: points, id: Date.now() });

        setIsRevealing(true);
        const fullReveal = {};
        for (let i=0; i<data.actualWord.length; i++) fullReveal[i] = data.actualWord[i].toUpperCase();
        setRevealedLetters(fullReveal);
        
        setTimeout(() => {
          setWordIndex(i => i + 1);
          loadNextWord(wordIndex + 1, playedWordIds);
        }, 1500);
      } else {
        playSound('wrong');
        triggerShake();
        setGuess('');
        
        if (gameMode === 'SURVIVAL') {
          const newLives = lives - 1;
          setLives(newLives);
          if (newLives <= 0) {
            revealAnswerAndNext("💀 Out of lives!", false, true);
          } else {
            setFeedback({ text: '❌ Wrong! (-1 Life)', type: 'wrong' });
          }
        } else {
          setFeedback({ text: '❌ Wrong! Try again.', type: 'wrong' });
        }
      }
    } catch (err) {
      setFeedback({ text: '⚠️ Network error', type: 'wrong' });
    }
  };

  const useHint = () => {
    if (hintsUsed >= 2 || isRevealing) return;
    setHintsUsed(prev => prev + 1);
    setFeedback({ text: `Hint revealed! (-${HINT_PENALTY} pts)`, type: 'hint' });
  };

  const useMagnet = async () => {
    if (powerups.magnet <= 0 || !currentWord || isRevealing) return;
    setPowerups(prev => ({ ...prev, magnet: 0 }));
    setScore(prev => Math.max(0, prev - 50));
    try {
      const res = await fetch(`${API}/powerup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: currentWord.wordId, type: 'MAGNET' })
      });
      const data = await res.json();
      setRevealedLetters(prev => ({ ...prev, [data.index]: data.letter }));
      setFeedback({ text: `🧲 Magnet used! (-50 pts)`, type: 'hint' });
    } catch (err) {
      console.error(err);
    }
  };

  const useFreeze = () => {
    if (powerups.freeze <= 0 || isRevealing) return;
    setPowerups(prev => ({ ...prev, freeze: 0 }));
    setScore(prev => Math.max(0, prev - 50));
    setIsWordFrozen(true);
    setFeedback({ text: `❄️ Timer Frozen! (-50 pts)`, type: 'hint' });
    setTimeout(() => setIsWordFrozen(false), 5000);
  };

  const finishGame = async () => {
    setScreen('results');
    if (playerName && score > 0) {
      await fetch(`${API}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerName || 'Player',
          score,
          wordsCorrect,
          totalWords: Math.max(1, wordIndex),
          gameMode
        })
      });
    }
  };

  const fetchLeaderboard = async (mode = leaderboardMode) => {
    setLeaderboardMode(mode);
    try {
      const res = await fetch(`${API}/scores?mode=${mode}`);
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
      className="flex flex-col items-center justify-center min-h-screen p-6 relative"
    >
      <div className="font-boogaloo text-6xl md:text-8xl mb-2 tracking-wide drop-shadow-[0_0_15px_rgba(255,107,53,0.5)]">
        Word<span className="text-[var(--color-accent)]">Scramble</span>
      </div>
      <p className="text-[var(--color-muted)] text-lg mb-10 text-center font-bold">
        Unscramble letters, race the clock, top the board 🔥
      </p>

      <div className="glass-panel p-8 rounded-3xl w-full max-w-md relative">
        <label className="block text-sm font-bold text-[var(--color-muted)] uppercase mb-2">Your Name</label>
        <input 
          type="text" 
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          placeholder="e.g. Arjun" 
          className="w-full glass-surface border border-white/10 rounded-2xl p-4 mb-4 focus:border-[var(--color-accent)] outline-none text-white font-bold transition-colors shadow-inner"
        />

        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-bold text-[var(--color-muted)] uppercase mb-2">Category</label>
            <select 
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full glass-surface border border-white/10 rounded-2xl p-4 outline-none text-white font-bold text-sm shadow-inner"
            >
              <option value="">🎲 Random</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold text-[var(--color-muted)] uppercase mb-2">Difficulty</label>
            <select 
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="w-full glass-surface border border-white/10 rounded-2xl p-4 outline-none text-white font-bold text-sm shadow-inner"
            >
              <option value="">⚖️ Any</option>
              <option value="EASY">🟢 Easy</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="HARD">🔴 Hard</option>
            </select>
          </div>
        </div>

        <label className="block text-sm font-bold text-[var(--color-muted)] uppercase mb-2">Game Mode</label>
        <div className="flex gap-3 mb-8">
          <button 
            onClick={() => setGameMode('STANDARD')}
            className={`flex-1 p-4 rounded-2xl font-bold border-2 transition-all ${gameMode === 'STANDARD' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/20 text-[var(--color-accent)] scale-[1.02]' : 'border-white/5 bg-black/20 text-[var(--color-muted)]'}`}
          >
            🏁 Standard<br/><span className="text-xs font-normal opacity-75">5 Words + Streaks</span>
          </button>
          <button 
            onClick={() => setGameMode('SURVIVAL')}
            className={`flex-1 p-4 rounded-2xl font-bold border-2 transition-all ${gameMode === 'SURVIVAL' ? 'border-[var(--color-pink)] bg-[var(--color-pink)]/20 text-[var(--color-pink)] scale-[1.02]' : 'border-white/5 bg-black/20 text-[var(--color-muted)]'}`}
          >
            ❤️ Survival<br/><span className="text-xs font-normal opacity-75">Infinite + 3 Lives</span>
          </button>
        </div>

        <button 
          onClick={startGame}
          className="w-full bg-[var(--color-accent)] hover:bg-[#ff8050] text-white font-bold py-4 rounded-2xl shadow-[0_6px_24px_rgba(255,107,53,0.4)] transition-transform hover:-translate-y-1 active:translate-y-0 text-lg"
        >
          Play Now →
        </button>
        <button 
          onClick={() => fetchLeaderboard(gameMode)}
          className="w-full glass-surface hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-2xl mt-4 transition-transform hover:-translate-y-1 active:translate-y-0"
        >
          🏆 Leaderboard
        </button>
      </div>
    </motion.div>
  );

  const renderGame = () => {
    if (!currentWord) return <div className="min-h-screen flex items-center justify-center font-boogaloo text-3xl animate-pulse">Loading...</div>;

    const circumference = 2 * Math.PI * 30;
    const strokeOffset = circumference * (1 - timerSecs / TIME_PER_WORD);
    const strokeColor = timerSecs > 15 ? 'var(--color-green)' : timerSecs > 8 ? 'var(--color-yellow)' : 'var(--color-pink)';

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center min-h-screen p-6 max-w-2xl mx-auto">
        
        <div className="w-full flex justify-between items-center mb-6">
          <div 
            onClick={handleEasterEggClick}
            className="glass-surface px-4 py-1.5 rounded-full border border-white/10 font-bold text-[10px] uppercase tracking-wider text-[var(--color-muted)] cursor-pointer hover:bg-white/5 transition-colors select-none"
          >
            {gameMode} MODE
          </div>
          <button onClick={endGameEarly} className="text-[var(--color-muted)] hover:text-[var(--color-pink)] flex items-center gap-2 text-sm font-bold glass-surface px-4 py-2 rounded-xl transition-all">
            <XCircle size={16} /> End Game <span className="opacity-50 text-[10px]">(Esc)</span>
          </button>
        </div>

        {/* Header Stats */}
        <div className="flex justify-between items-center w-full mb-6">
          <div className="flex flex-col gap-2">
            <div className="glass-panel px-6 py-3 rounded-2xl font-bold text-lg">
              Score: <span className="text-[var(--color-accent)] font-boogaloo text-2xl">{score}</span>
            </div>
            <AnimatePresence>
              {gameMode === 'STANDARD' && streak >= 3 && (
                <motion.div initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }} className="text-[var(--color-accent)] text-sm font-bold text-center flex items-center justify-center gap-1">
                  <Star size={14} fill="currentColor" /> Streak x1.5
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="relative w-[80px] h-[80px]">
            <svg className="transform -rotate-90 w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" viewBox="0 0 70 70">
              <circle cx="35" cy="35" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
              <circle 
                cx="35" cy="35" r="30" fill="none" 
                stroke={isWordFrozen ? 'var(--color-blue)' : strokeColor} 
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-boogaloo text-3xl text-white">
              {timerSecs}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="glass-panel px-6 py-3 rounded-2xl font-bold text-lg">
              Hints: <span className="text-[var(--color-yellow)] font-boogaloo text-2xl">{2 - hintsUsed}</span>
            </div>
            {gameMode === 'SURVIVAL' && (
              <motion.div key={lives} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="flex justify-center gap-1.5 text-[var(--color-pink)]">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart key={i} size={20} fill={i < lives ? "currentColor" : "none"} className={i < lives ? "drop-shadow-[0_0_5px_rgba(239,71,111,0.5)]" : "text-white/10"} />
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Progress Tracker */}
        {gameMode === 'STANDARD' ? (
          <>
            <div className="w-full glass-surface h-2 rounded-full mb-2 overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(wordIndex / 5) * 100}%` }}
                className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-yellow)] shadow-[0_0_10px_var(--color-accent)]"
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="w-full text-right text-sm font-bold text-[var(--color-muted)] mb-6">
              Word {wordIndex + 1} of 5
            </div>
          </>
        ) : (
          <div className="w-full text-center text-sm font-bold text-[var(--color-pink)] mb-6 tracking-[0.3em] uppercase bg-white/5 py-2 rounded-xl">
            Wave {wordIndex + 1}
          </div>
        )}

        {/* Word Box */}
        <motion.div 
          key={currentWord.wordId}
          initial={{ scale: 0.8, opacity: 0, rotateX: -20 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className={`glass-panel w-full p-10 rounded-[2rem] text-center mb-8 relative ${isRevealing && feedback?.type === 'correct' ? 'ring-4 ring-[var(--color-green)] bg-[var(--color-green)]/10' : ''}`}
        >
          <div className="absolute top-5 left-5 bg-[var(--color-accent)]/20 text-[var(--color-accent)] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            {currentWord.category}
          </div>
          <div className="absolute top-5 right-5 bg-black/30 text-white/70 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            {currentWord.difficulty || 'ANY'}
          </div>
          
          <div className="font-boogaloo text-5xl md:text-7xl text-[var(--color-yellow)] tracking-[0.25em] drop-shadow-[0_0_30px_rgba(255,209,102,0.4)] mt-10 mb-12 break-all uppercase">
            {currentWord.scrambled}
          </div>
          
          <div className="flex justify-center gap-3 flex-wrap">
            {Array.from({ length: currentWord.length }).map((_, i) => (
              <motion.div 
                key={i} 
                initial={{ y: 10, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: i * 0.05 }}
                className={`w-10 h-12 border-b-4 flex items-end justify-center font-boogaloo text-4xl ${revealedLetters[i] ? 'border-[var(--color-green)] text-[var(--color-green)] drop-shadow-[0_0_10px_rgba(6,214,160,0.5)]' : 'border-white/20'}`}
              >
                {revealedLetters[i] || ''}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Feedback & Hints */}
        <div className="min-h-[90px] w-full flex flex-col items-center relative">
          
          <AnimatePresence>
            {floatingScore && (
              <motion.div 
                key={floatingScore.id}
                initial={{ opacity: 1, y: 0, scale: 0.5 }} 
                animate={{ opacity: 0, y: -100, scale: 1.5 }} 
                transition={{ duration: 1 }}
                className="absolute top-0 font-boogaloo text-4xl text-[var(--color-green)] drop-shadow-[0_0_10px_currentColor] z-50 pointer-events-none"
              >
                +{floatingScore.amount}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {feedback && (
              <motion.div 
                key={feedback.text}
                initial={{ opacity: 0, y: 10, scale: 0.9 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                className={`font-bold text-xl mb-3 text-center px-6 py-2 rounded-xl glass-surface ${
                  feedback.type === 'correct' ? 'text-[var(--color-green)] border-[var(--color-green)]/30 border' : 
                  feedback.type === 'wrong' ? 'text-[var(--color-pink)] border-[var(--color-pink)]/30 border' : 
                  'text-[var(--color-yellow)] border-[var(--color-yellow)]/30 border'
                }`}
              >
                {feedback.text}
              </motion.div>
            )}
          </AnimatePresence>
          
          {hintsUsed > 0 && (
            <div className="text-[var(--color-yellow)] text-sm font-bold mb-1">
              💡 {currentWord.hint1}
            </div>
          )}
          {hintsUsed > 1 && (
            <div className="text-[var(--color-yellow)] text-sm font-bold">
              💡 {currentWord.hint2}
            </div>
          )}
        </div>

        {/* Input */}
        <motion.form 
          animate={shakeInput ? { x: [-15, 15, -15, 15, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          onSubmit={submitAnswer} 
          className="flex gap-3 w-full mb-8 relative z-20"
        >
          <input 
            type="text" 
            value={guess}
            onChange={e => {
              const val = e.target.value.toUpperCase();
              if (easterEggActive && cheatWord) {
                setGuess(cheatWord.substring(0, val.length));
              } else {
                setGuess(val);
              }
            }}
            placeholder="TYPE ANSWER..."
            disabled={isRevealing}
            className="flex-1 glass-surface border-2 border-white/20 rounded-2xl p-5 text-center text-2xl tracking-[0.2em] uppercase font-boogaloo outline-none focus:border-[var(--color-accent)] disabled:opacity-50 shadow-inner"
            autoFocus
          />
          <button type="submit" disabled={isRevealing} className="bg-[var(--color-accent)] text-white px-10 rounded-2xl font-boogaloo text-2xl tracking-wide hover:bg-[#ff8050] transition-transform active:scale-95 disabled:opacity-50 shadow-[0_4px_20px_rgba(255,107,53,0.4)]">
            GO
          </button>
        </motion.form>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-3 w-full">
          <button onClick={useHint} disabled={isRevealing} className="flex-1 min-w-[120px] glass-surface hover:bg-white/10 border border-white/10 disabled:opacity-30 rounded-2xl py-3 font-bold flex flex-col items-center justify-center gap-1 transition-all">
            <div className="flex items-center gap-2"><Lightbulb size={18} /> Hint</div>
            <span className="text-[10px] text-white/40 font-normal">Ctrl+Space</span>
          </button>
          <button onClick={useMagnet} disabled={powerups.magnet === 0 || isRevealing} className="flex-1 min-w-[120px] bg-[var(--color-blue)]/20 hover:bg-[var(--color-blue)]/30 border border-[var(--color-blue)]/50 text-[var(--color-blue)] disabled:opacity-30 disabled:hover:bg-[var(--color-blue)]/20 rounded-2xl py-3 font-bold flex flex-col items-center justify-center gap-1 transition-all">
            <div className="flex items-center gap-2"><Magnet size={18} /> {powerups.magnet > 0 ? 'Magnet' : 'Used'}</div>
            <span className="text-[10px] font-normal opacity-60">1 per game</span>
          </button>
          <button onClick={useFreeze} disabled={powerups.freeze === 0 || isRevealing} className="flex-1 min-w-[120px] bg-[var(--color-green)]/20 hover:bg-[var(--color-green)]/30 border border-[var(--color-green)]/50 text-[var(--color-green)] disabled:opacity-30 disabled:hover:bg-[var(--color-green)]/20 rounded-2xl py-3 font-bold flex flex-col items-center justify-center gap-1 transition-all">
            <div className="flex items-center gap-2"><SearchX size={18} /> {powerups.freeze > 0 ? 'Freeze' : 'Used'}</div>
            <span className="text-[10px] font-normal opacity-60">1 per game</span>
          </button>
          <button onClick={skipWord} disabled={isRevealing} className="flex-1 min-w-[120px] glass-surface hover:bg-white/10 border border-white/10 disabled:opacity-30 rounded-2xl py-3 font-bold flex flex-col items-center justify-center gap-1 transition-all">
            <div className="flex items-center gap-2"><SkipForward size={18} /> Skip</div>
            <span className="text-[10px] text-white/40 font-normal">Reveal Answer</span>
          </button>
        </div>

      </motion.div>
    );
  };

  const renderResults = () => {
    const divisor = Math.max(1, wordIndex);
    const accuracy = Math.round((wordsCorrect / divisor) * 100);
    const avgTime = Math.round(totalTimeTaken / divisor);

    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center min-h-screen p-6 relative">
        <div className="glass-panel p-10 rounded-[2.5rem] w-full max-w-md text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--color-pink)] via-[var(--color-accent)] to-[var(--color-yellow)]"></div>
          
          <div className="absolute top-6 right-6 glass-surface text-white/70 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            {gameMode}
          </div>
          
          <Trophy className="w-24 h-24 text-[var(--color-yellow)] mx-auto mb-6 mt-6 drop-shadow-[0_0_15px_rgba(255,209,102,0.5)]" />
          <h2 className="font-boogaloo text-5xl mb-2">Game Over!</h2>
          <p className="text-[var(--color-muted)] font-bold mb-8 text-lg">You got {wordsCorrect} correct</p>
          
          <div className="text-[var(--color-muted)] font-bold uppercase text-sm tracking-widest">Final Score</div>
          <div className="font-boogaloo text-8xl text-[var(--color-accent)] drop-shadow-[0_0_30px_rgba(255,107,53,0.5)] mb-10">
            {score}
          </div>

          <div className="flex gap-4 mb-10">
            <div className="flex-1 glass-surface border border-white/5 p-4 rounded-2xl">
              <div className="font-boogaloo text-4xl text-[var(--color-green)]">{wordsCorrect}</div>
              <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mt-2">Correct</div>
            </div>
            <div className="flex-1 glass-surface border border-white/5 p-4 rounded-2xl">
              <div className="font-boogaloo text-4xl text-[var(--color-blue)]">{avgTime}s</div>
              <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mt-2">Avg Time</div>
            </div>
            <div className="flex-1 glass-surface border border-white/5 p-4 rounded-2xl">
              <div className="font-boogaloo text-4xl text-[var(--color-yellow)]">{accuracy}%</div>
              <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mt-2">Accuracy</div>
            </div>
          </div>

          <button onClick={startGame} className="w-full flex justify-center items-center gap-3 bg-[var(--color-accent)] text-white font-bold py-5 rounded-2xl mb-4 hover:bg-[#ff8050] transition-transform active:scale-95 text-lg shadow-[0_4px_20px_rgba(255,107,53,0.3)]">
            <RefreshCw size={20} /> Play Again
          </button>
          <div className="flex gap-4">
            <button onClick={() => fetchLeaderboard(gameMode)} className="flex-1 flex justify-center items-center gap-2 glass-surface text-white font-bold py-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-transform active:scale-95">
              <Trophy size={18} /> Leaders
            </button>
            <button onClick={() => setScreen('home')} className="flex-1 flex justify-center items-center gap-2 glass-surface text-white font-bold py-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-transform active:scale-95">
              <Home size={18} /> Home
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderLeaderboard = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center min-h-screen p-6 relative">
      <h2 className="font-boogaloo text-6xl mb-10 mt-10 drop-shadow-[0_0_15px_rgba(255,209,102,0.4)]">🏆 Leaderboard</h2>
      
      <div className="flex gap-2 mb-8 bg-black/20 p-2 rounded-2xl border border-white/10">
        <button 
          onClick={() => fetchLeaderboard('STANDARD')}
          className={`px-8 py-3 rounded-xl font-bold transition-colors ${leaderboardMode === 'STANDARD' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-muted)] hover:text-white'}`}
        >
          🏁 Standard
        </button>
        <button 
          onClick={() => fetchLeaderboard('SURVIVAL')}
          className={`px-8 py-3 rounded-xl font-bold transition-colors ${leaderboardMode === 'SURVIVAL' ? 'bg-[var(--color-pink)] text-white' : 'text-[var(--color-muted)] hover:text-white'}`}
        >
          ❤️ Survival
        </button>
      </div>

      <div className="w-full max-w-2xl glass-panel rounded-3xl overflow-hidden mb-10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/30 text-[var(--color-muted)] text-sm uppercase tracking-widest">
              <th className="p-5 font-bold border-b border-white/5 text-center">Rank</th>
              <th className="p-5 font-bold border-b border-white/5">Player</th>
              <th className="p-5 font-bold border-b border-white/5 text-center">Words</th>
              <th className="p-5 font-bold border-b border-white/5 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr><td colSpan="4" className="p-10 text-center text-[var(--color-muted)] font-bold">No scores yet for this mode!</td></tr>
            ) : leaderboard.map((s, i) => (
              <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <td className="p-5 text-center">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-boogaloo text-2xl ${i===0?'bg-[var(--color-yellow)] text-black':i===1?'bg-[#e2e8f0] text-black':i===2?'bg-[#cd7f32] text-white':'text-[var(--color-muted)]'}`}>
                    #{i+1}
                  </div>
                </td>
                <td className="p-5 font-bold text-lg">{s.playerName}</td>
                <td className="p-5 text-center text-[var(--color-muted)] font-bold">{s.wordsCorrect} / {s.totalWords}</td>
                <td className="p-5 text-right font-boogaloo text-3xl text-[var(--color-accent)]">{s.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <button onClick={() => setScreen('home')} className="glass-surface px-10 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-white/10 transition-colors border border-white/10">
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
