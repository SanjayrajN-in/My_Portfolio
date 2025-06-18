// Games.js - JavaScript for the games page

// Game tracking utility
class GameTracker {
    constructor() {
        this.currentSession = null;
    }
    
    startGame(gameName) {
        // Check if auth system is available and user is logged in
        if (typeof authSystem !== 'undefined' && authSystem.currentUser) {
            this.currentSession = authSystem.startGameSession(gameName);
            console.log(`Started tracking game: ${gameName}`);
        }
    }
    
    endGame(score = null) {
        if (typeof authSystem !== 'undefined' && authSystem.currentUser && this.currentSession) {
            authSystem.endGameSession(score);
            console.log(`Ended game session with score: ${score}`);
            this.currentSession = null;
        }
    }
    
    isTracking() {
        return this.currentSession !== null;
    }
}

// Global game tracker instance
const gameTracker = new GameTracker();

document.addEventListener('DOMContentLoaded', function() {
    console.log('Games page loaded');
    
    // Prevent space bar from scrolling the page
    window.addEventListener('keydown', function(e) {
        // Prevent space bar scrolling
        if (e.keyCode === 32 && e.target === document.body) {
            e.preventDefault();
        }
    });
    
    // Game Selection Tabs
    initGameTabs();
    
    // Memory Game - will be initialized when Mind Training tab is clicked
    
    // Snake Game - initialize since it's the default active tab
    setTimeout(() => {
        console.log('Initializing default Snake Game...');
        initSnakeGame();
    }, 300);
    
    // Tic Tac Toe Game - initialize but don't start game
    initTicTacToe();
    
    // Other games will be initialized when their tabs are clicked
    // This prevents unnecessary console logs and resource usage
    
    // Other mind training games can be added here later
    // initNumberPuzzle();
    // initWordScramble();
    // initPatternMemory();
});

// Game Tabs Functionality
function initGameTabs() {
    const tabButtons = document.querySelectorAll('.game-tab');
    const gameContainers = document.querySelectorAll('.game-container');
    
    // Show the first game by default
    if (gameContainers.length > 0) {
        gameContainers[0].classList.add('active');
    }
    
    if (tabButtons.length > 0) {
        tabButtons[0].classList.add('active');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons and containers
                tabButtons.forEach(btn => btn.classList.remove('active'));
                gameContainers.forEach(container => container.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Show the corresponding game container
                const gameId = this.getAttribute('data-game');
                const gameContainer = document.getElementById(gameId);
                gameContainer.classList.add('active');
                
                // Smooth scroll to the selected game with offset for header
                setTimeout(() => {
                    const headerHeight = 80; // Approximate header height
                    const elementPosition = gameContainer.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }, 100);
                
                // Initialize games when their sections are activated
                if (gameId === 'memory-match-game-container') {
                    setTimeout(() => {
                        initMemoryGame();
                    }, 200);
                } else if (gameId === 'snake-game-container') {
                    setTimeout(() => {
                        initSnakeGame();
                    }, 200);
                } else if (gameId === 'tetris-game-container') {
                    setTimeout(() => {
                        initTetris();
                    }, 200);
                }
            });
        });
    }
}

// Enhanced Memory Match Game with Level Progression
let memoryGameInstance = null;

function initMemoryGame() {
    console.log('Initializing Memory Game...');
    
    // Prevent multiple initializations
    if (memoryGameInstance) {
        console.log('Memory game already initialized');
        return memoryGameInstance;
    }
    
    const gameBoard = document.getElementById('memory-game-board');
    const difficultySelect = document.getElementById('memory-difficulty');
    const newGameBtn = document.getElementById('memory-new-game');
    const hintBtn = document.getElementById('memory-hint');
    const statusDiv = document.getElementById('memory-status');
    
    // Stats elements
    const levelSpan = document.getElementById('memory-level');
    const scoreSpan = document.getElementById('memory-score');
    const timeSpan = document.getElementById('memory-time');
    const movesSpan = document.getElementById('memory-moves');
    const progressFill = document.getElementById('memory-progress-fill');
    const progressText = document.getElementById('memory-progress-text');
    
    console.log('Game board found:', !!gameBoard);
    console.log('New game button found:', !!newGameBtn);
    
    if (!gameBoard) {
        console.error('Memory game board not found!');
        return;
    }
    
    // Game state
    let gameState = {
        level: 1,
        score: 0,
        moves: 0,
        matches: 0,
        totalPairs: 0,
        startTime: null,
        gameTime: 0,
        timerInterval: null,
        isGameActive: false,
        difficulty: 'medium',
        hintsUsed: 0,
        maxHints: 3,
        firstCard: null,
        secondCard: null,
        hasFlippedCard: false,
        lockBoard: false,
        cards: []
    };
    
    // Difficulty configurations
    const difficulties = {
        easy: { 
            rows: 2, cols: 3, pairs: 3, 
            timeBonus: 100, moveBonus: 50,
            cardTypes: ['colors', 'shapes']
        },
        medium: { 
            rows: 3, cols: 4, pairs: 6, 
            timeBonus: 150, moveBonus: 75,
            cardTypes: ['colors', 'shapes', 'numbers']
        },
        hard: { 
            rows: 4, cols: 4, pairs: 8, 
            timeBonus: 200, moveBonus: 100,
            cardTypes: ['colors', 'shapes', 'numbers', 'symbols']
        },
        expert: { 
            rows: 4, cols: 6, pairs: 12, 
            timeBonus: 300, moveBonus: 150,
            cardTypes: ['colors', 'shapes', 'numbers', 'symbols', 'letters']
        },
        master: { 
            rows: 6, cols: 6, pairs: 18, 
            timeBonus: 500, moveBonus: 250,
            cardTypes: ['colors', 'shapes', 'numbers', 'symbols', 'letters', 'emojis']
        }
    };
    
    // Enhanced card content generators
    const cardContent = {
        colors: [
            { color: '#FF6B6B', name: 'CORAL' },
            { color: '#4ECDC4', name: 'TEAL' },
            { color: '#45B7D1', name: 'BLUE' },
            { color: '#96CEB4', name: 'MINT' },
            { color: '#FFEAA7', name: 'YELLOW' },
            { color: '#DDA0DD', name: 'PLUM' },
            { color: '#98D8C8', name: 'AQUA' },
            { color: '#F7DC6F', name: 'GOLD' },
            { color: '#BB8FCE', name: 'PURPLE' },
            { color: '#85C1E9', name: 'SKY' },
            { color: '#F1948A', name: 'ROSE' },
            { color: '#82E0AA', name: 'GREEN' },
            { color: '#F8C471', name: 'ORANGE' },
            { color: '#AED6F1', name: 'CYAN' },
            { color: '#D7BDE2', name: 'LAVENDER' },
            { color: '#A3E4D7', name: 'SEAFOAM' },
            { color: '#F9E79F', name: 'CREAM' },
            { color: '#FADBD8', name: 'PEACH' }
        ],
        shapes: ['●', '■', '▲', '♦', '★', '♠', '♣', '♥', '◆', '▼', '◀', '▶', '▲', '▼', '◊', '○', '□', '△'],
        numbers: ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⓪', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱'],
        symbols: ['⚡', '⭐', '❤️', '🔥', '💎', '🌟', '⚽', '🎵', '🔔', '⚖️', '🎯', '🏆', '🎪', '🎨', '🎭', '🎸', '🎺', '🎻'],
        letters: ['Ⓐ', 'Ⓑ', 'Ⓒ', 'Ⓓ', 'Ⓔ', 'Ⓕ', 'Ⓖ', 'Ⓗ', 'Ⓘ', 'Ⓙ', 'Ⓚ', 'Ⓛ', 'Ⓜ', 'Ⓝ', 'Ⓞ', 'Ⓟ', 'Ⓠ', 'Ⓡ'],
        emojis: ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎸', '🎺', '🎻', '🎹', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎊', '🎉']
    };
    
    // Initialize game
    function initGame() {
        updateDisplay();
        setupEventListeners();
        updateStatus('Select difficulty and click "New Game" to start!');
    }
    
    function setupEventListeners() {
        if (newGameBtn) newGameBtn.addEventListener('click', startNewGame);
        if (hintBtn) hintBtn.addEventListener('click', useHint);
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                gameState.difficulty = e.target.value;
                if (gameState.isGameActive) {
                    updateStatus('Difficulty changed! Click "New Game" to apply.');
                }
            });
        }
    }
    
    function startNewGame() {
        resetGameState();
        generateCards();
        startTimer();
        updateStatus('Game started! Find all matching pairs!');
        gameState.isGameActive = true;
        
        // Scroll to game board to show the card reveal
        setTimeout(() => {
            gameBoard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
            });
        }, 200);
        
        // Brief preview of all cards
        showAllCards();
        setTimeout(() => {
            hideAllCards();
        }, 2000);
    }
    
    function resetGameState() {
        gameState.moves = 0;
        gameState.matches = 0;
        gameState.startTime = Date.now();
        gameState.gameTime = 0;
        gameState.hintsUsed = 0;
        gameState.firstCard = null;
        gameState.secondCard = null;
        gameState.hasFlippedCard = false;
        gameState.lockBoard = false;
        gameState.isGameActive = false;
        
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
        }
        
        const config = difficulties[gameState.difficulty];
        gameState.totalPairs = config.pairs;
        
        updateDisplay();
    }
    
    function generateCards() {
        const config = difficulties[gameState.difficulty];
        const cardData = generateCardData(config);
        
        // Clear existing cards
        gameBoard.innerHTML = '';
        gameBoard.className = `memory-game-board ${gameState.difficulty}`;
        
        // Create and shuffle cards
        const shuffledCards = shuffleArray([...cardData, ...cardData]);
        gameState.cards = [];
        
        shuffledCards.forEach((data, index) => {
            const card = createCard(data, index);
            // Add staggered animation delay (reduced for performance)
            card.style.animationDelay = `${index * 0.02}s`;
            gameBoard.appendChild(card);
            gameState.cards.push(card);
        });
    }
    
    function generateCardData(config) {
        const cardData = [];
        const availableTypes = config.cardTypes;
        let contentIndex = 0;
        
        for (let i = 0; i < config.pairs; i++) {
            const typeIndex = i % availableTypes.length;
            const type = availableTypes[typeIndex];
            const contentArray = cardContent[type];
            const contentItem = contentArray[contentIndex % contentArray.length];
            
            // Handle different content types
            let content, displayText, backgroundColor;
            if (type === 'colors') {
                content = contentItem.color;
                displayText = contentItem.name;
                backgroundColor = contentItem.color;
            } else {
                content = contentItem;
                displayText = contentItem;
                backgroundColor = null;
            }
            
            cardData.push({
                id: i,
                type: type,
                content: content,
                displayText: displayText,
                backgroundColor: backgroundColor
            });
            
            if ((i + 1) % availableTypes.length === 0) {
                contentIndex++;
            }
        }
        
        return cardData;
    }
    
    function createCard(data, index) {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.cardId = data.id;
        card.dataset.index = index;
        
        const cardBack = document.createElement('div');
        cardBack.className = 'card-face card-back';
        cardBack.innerHTML = '<i class="fas fa-question"></i>';
        
        const cardFront = document.createElement('div');
        cardFront.className = `card-face card-front ${data.type}-card`;
        
        if (data.type === 'colors') {
            cardFront.style.backgroundColor = data.backgroundColor;
            cardFront.textContent = data.displayText;
        } else {
            cardFront.textContent = data.displayText;
            // Apply type-specific styling
            switch(data.type) {
                case 'shapes':
                    cardFront.style.color = getRandomColor();
                    break;
                case 'numbers':
                    cardFront.style.color = '#2E86AB';
                    break;
                case 'symbols':
                    cardFront.style.color = '#F24236';
                    break;
                case 'letters':
                    cardFront.style.color = '#F18F01';
                    break;
                case 'emojis':
                    // Emojis don't need color styling
                    break;
                default:
                    cardFront.style.color = getRandomColor();
            }
        }
        
        card.appendChild(cardBack);
        card.appendChild(cardFront);
        
        card.addEventListener('click', () => flipCard(card));
        
        return card;
    }
    
    function flipCard(card) {
        if (gameState.lockBoard || card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }
        
        // Immediately add flipped class to prevent double clicks
        card.classList.add('flipped');
        gameState.moves++;
        updateDisplay();
        
        // Play flip sound
        playSound('flip');
        
        if (!gameState.hasFlippedCard) {
            // First card flipped
            gameState.hasFlippedCard = true;
            gameState.firstCard = card;
        } else {
            // Second card flipped
            gameState.secondCard = card;
            checkForMatch();
        }
    }
    
    function checkForMatch() {
        const isMatch = gameState.firstCard.dataset.cardId === gameState.secondCard.dataset.cardId;
        
        // Lock board to prevent more clicks during animation
        gameState.lockBoard = true;
        
        if (isMatch) {
            // Wait for flip animation to complete before showing match animation
            setTimeout(() => {
                handleMatch();
            }, 300);
        } else {
            handleMismatch();
        }
    }
    
    function handleMatch() {
        // Add match animation
        if (!gameState.firstCard || !gameState.secondCard) {
            console.warn('Card reference is null in handleMatch');
            return;
        }
        
        gameState.firstCard.classList.add('matching');
        gameState.secondCard.classList.add('matching');
        
        setTimeout(() => {
            if (gameState.firstCard && gameState.secondCard) {
                gameState.firstCard.classList.add('matched');
                gameState.secondCard.classList.add('matched');
                gameState.firstCard.classList.remove('matching');
                gameState.secondCard.classList.remove('matching');
            }
        }, 400);
        
        gameState.matches++;
        
        // Calculate score bonus
        const config = difficulties[gameState.difficulty];
        const timeBonus = Math.max(0, config.timeBonus - gameState.gameTime);
        const moveBonus = Math.max(0, config.moveBonus - gameState.moves);
        const matchBonus = 100;
        const bonus = matchBonus + timeBonus + moveBonus;
        
        gameState.score += bonus;
        
        // Show score bonus animation
        showScoreBonus(bonus, gameState.firstCard);
        
        // Play match sound
        playSound('match');
        
        updateDisplay();
        updateProgress();
        
        if (gameState.matches === gameState.totalPairs) {
            setTimeout(() => {
                handleGameCompleteEnhanced(); // Use enhanced version
            }, 800);
        } else {
            resetBoard();
        }
    }
    
    function handleMismatch() {
        // Play mismatch sound
        playSound('mismatch');
        
        setTimeout(() => {
            if (gameState.firstCard && gameState.secondCard) {
                gameState.firstCard.classList.remove('flipped');
                gameState.secondCard.classList.remove('flipped');
            }
            resetBoard();
        }, 1000);
    }
    
    function resetBoard() {
        gameState.hasFlippedCard = false;
        gameState.lockBoard = false;
        gameState.firstCard = null;
        gameState.secondCard = null;
    }
    
    function handleGameComplete() {
        gameState.isGameActive = false;
        clearInterval(gameState.timerInterval);
        
        // Calculate final score
        const timeBonus = Math.max(0, 1000 - gameState.gameTime * 10);
        const efficiencyBonus = Math.max(0, 500 - gameState.moves * 10);
        const hintPenalty = gameState.hintsUsed * 50;
        const finalBonus = timeBonus + efficiencyBonus - hintPenalty;
        
        gameState.score += finalBonus;
        gameState.level++;
        
        updateDisplay();
        
        const message = `
            🎉 Level Complete! 🎉<br>
            Time: ${formatTime(gameState.gameTime)}<br>
            Moves: ${gameState.moves}<br>
            Score: ${gameState.score}<br>
            ${gameState.hintsUsed > 0 ? `Hints used: ${gameState.hintsUsed}` : 'Perfect! No hints used!'}
        `;
        
        updateStatus(message, 'success');
        
        // Auto-advance to next difficulty if available
        setTimeout(() => {
            advanceToNextLevel();
        }, 3000);
    }
    
    function advanceToNextLevel() {
        const difficulties_order = ['easy', 'medium', 'hard', 'expert', 'master'];
        const currentIndex = difficulties_order.indexOf(gameState.difficulty);
        
        if (currentIndex < difficulties_order.length - 1) {
            gameState.difficulty = difficulties_order[currentIndex + 1];
            difficultySelect.value = gameState.difficulty;
            updateStatus(`Ready for ${gameState.difficulty.toUpperCase()} level? Click "New Game" to continue!`);
        } else {
            updateStatus(`🏆 MASTER LEVEL COMPLETED! 🏆<br>You've conquered all difficulty levels!<br>Final Score: ${gameState.score}`, 'success');
        }
    }
    
    function useHint() {
        if (!gameState.isGameActive || gameState.hintsUsed >= gameState.maxHints) {
            updateStatus('No hints available!');
            return;
        }
        
        const unmatched = gameState.cards.filter(card => 
            !card.classList.contains('matched') && !card.classList.contains('flipped')
        );
        
        if (unmatched.length < 2) return;
        
        // Find a matching pair
        const pairs = {};
        unmatched.forEach(card => {
            const id = card.dataset.cardId;
            if (!pairs[id]) pairs[id] = [];
            pairs[id].push(card);
        });
        
        // Find first available pair
        for (let id in pairs) {
            if (pairs[id].length === 2) {
                pairs[id].forEach(card => {
                    card.classList.add('hint');
                    setTimeout(() => card.classList.remove('hint'), 1500);
                });
                break;
            }
        }
        
        gameState.hintsUsed++;
        updateStatus(`Hint used! ${gameState.maxHints - gameState.hintsUsed} hints remaining.`);
    }
    
    function showAllCards() {
        gameState.cards.forEach(card => card.classList.add('flipped'));
    }
    
    function hideAllCards() {
        gameState.cards.forEach(card => {
            if (!card.classList.contains('matched')) {
                card.classList.remove('flipped');
            }
        });
    }
    
    function startTimer() {
        gameState.timerInterval = setInterval(() => {
            gameState.gameTime = Math.floor((Date.now() - gameState.startTime) / 1000);
            updateDisplay();
        }, 1000);
    }
    
    function updateDisplay() {
        if (levelSpan) levelSpan.textContent = gameState.level;
        if (scoreSpan) scoreSpan.textContent = gameState.score.toLocaleString();
        if (timeSpan) timeSpan.textContent = formatTime(gameState.gameTime);
        if (movesSpan) movesSpan.textContent = gameState.moves;
        
        updateProgress();
    }
    
    function updateProgress() {
        const percentage = gameState.totalPairs > 0 ? (gameState.matches / gameState.totalPairs) * 100 : 0;
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = `${gameState.matches} / ${gameState.totalPairs} pairs found`;
    }
    
    function updateStatus(message, type = '') {
        if (statusDiv) {
            statusDiv.innerHTML = `<p>${message}</p>`;
            statusDiv.className = `memory-status ${type}`;
        }
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    function getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Dummy playSound function (does nothing)
    window.playSound = function(type) {
        // All sounds are disabled
        return;
    }
    
    // Show score bonus animation
    function showScoreBonus(bonus, card) {
        const bonusElement = document.createElement('div');
        bonusElement.className = 'score-bonus';
        bonusElement.textContent = `+${bonus}`;
        
        const rect = card.getBoundingClientRect();
        bonusElement.style.position = 'fixed';
        bonusElement.style.left = `${rect.left + rect.width / 2}px`;
        bonusElement.style.top = `${rect.top}px`;
        bonusElement.style.transform = 'translateX(-50%)';
        
        document.body.appendChild(bonusElement);
        
        setTimeout(() => {
            if (bonusElement.parentNode) {
                bonusElement.parentNode.removeChild(bonusElement);
            }
        }, 1000);
    }
    
    // Achievement system
    function checkAchievements() {
        const achievements = [];
        
        if (gameState.moves <= gameState.totalPairs * 2) {
            achievements.push('🎯 Perfect Memory - Completed with minimal moves!');
        }
        
        if (gameState.gameTime <= 30) {
            achievements.push('⚡ Speed Demon - Completed in under 30 seconds!');
        }
        
        if (gameState.hintsUsed === 0) {
            achievements.push('🧠 Pure Genius - No hints needed!');
        }
        
        if (gameState.difficulty === 'master') {
            achievements.push('👑 Master Mind - Conquered the ultimate challenge!');
        }
        
        return achievements;
    }
    
    // Save/Load progress
    function saveProgress() {
        const progress = {
            level: gameState.level,
            totalScore: gameState.score,
            completedDifficulties: getCompletedDifficulties(),
            bestTimes: getBestTimes(),
            achievements: getAllAchievements()
        };
        localStorage.setItem('memoryGameProgress', JSON.stringify(progress));
    }
    
    function loadProgress() {
        const saved = localStorage.getItem('memoryGameProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            gameState.level = progress.level || 1;
            // Don't restore score as it's per-session
            return progress;
        }
        return null;
    }
    
    function getCompletedDifficulties() {
        // This would track which difficulties have been completed
        return [];
    }
    
    function getBestTimes() {
        // This would track best completion times for each difficulty
        return {};
    }
    
    function getAllAchievements() {
        // This would track all earned achievements
        return [];
    }
    
    // Enhanced game complete handler
    function handleGameCompleteEnhanced() {
        handleGameComplete();
        
        const achievements = checkAchievements();
        if (achievements.length > 0) {
            setTimeout(() => {
                const achievementText = achievements.join('<br>');
                updateStatus(`🏆 ACHIEVEMENTS UNLOCKED! 🏆<br>${achievementText}`, 'success');
            }, 4000);
        }
        
        saveProgress();
    }
    

    
    // Initialize the game
    initGame();
    
    // Load any saved progress
    const savedProgress = loadProgress();
    if (savedProgress) {
        updateStatus(`Welcome back! You're on level ${savedProgress.level}. Ready to continue your memory training?`);
    }
    
    // Store the instance
    memoryGameInstance = {
        gameState,
        startNewGame,
        useHint,
        updateDisplay
    };
    
    return memoryGameInstance;
}

// Snake Game - Clean and Bug-Free Implementation
function initSnakeGame() {
    console.log('Initializing Snake Game...');
    const canvas = document.querySelector('.snake-game canvas');
    if (!canvas) {
        console.error('Snake game canvas not found!');
        return;
    }
    
    // Set fixed dimensions for consistent rendering
    canvas.width = 400;
    canvas.height = 400;
    
    // Ensure canvas is properly positioned
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    const box = 20;
    const canvasSize = canvas.width;
    const gridSize = canvasSize / box;
    
    // Get start screen elements
    const startScreen = document.getElementById('snake-start-screen');
    const startBtn = document.getElementById('snake-start-btn');
    
    // Game variables
    let snake = [];
    let food = {};
    let score = 0;
    let direction = null;
    let nextDirection = null;
    let gameInterval = null;
    let isPaused = false;
    let gameOver = false;
    let gameStarted = false;
    let level = 1;
    let baseSpeed = 150;
    let minSpeed = 50;
    let speedDecrement = 8;
    let specialFood = null;
    let powerUp = null;
    let powerUpActive = false;
    let powerUpStartTime = 0;
    let powerUpTimeLeft = 0;
    let speedBoostMultiplier = 1;
    let lastMoveTime = 0;
    
    // Time tracking
    let gameStartTime = 0;
    let gameTime = 0;
    let pauseStartTime = 0;
    let totalPausedTime = 0;
    let lastLevelUpTime = 0;
    let timeForNextLevel = 30;
    
    // Food types
    const FOOD_TYPES = {
        NORMAL: { color: '#ff6b6b', points: 10 },
        BONUS: { color: '#4ecdc4', points: 25 },
        SUPER: { color: '#ffe66d', points: 50 }
    };
    
    // Power-up types
    const POWER_UPS = {
        SPEED: { color: '#00ffff', effect: 'Speed Boost', duration: 10 },
        INVINCIBLE: { color: '#ffff00', effect: 'Invincibility', duration: 8 },
        DOUBLE_POINTS: { color: '#ff00ff', effect: 'Double Points', duration: 15 }
    };
    
    // Get control buttons
    const upBtn = document.querySelector('.control-up');
    const downBtn = document.querySelector('.control-down');
    const leftBtn = document.querySelector('.control-left');
    const rightBtn = document.querySelector('.control-right');
    const pauseBtn = document.querySelector('.control-pause');
    
    // Add event listeners for control buttons
    if (upBtn) {
        upBtn.addEventListener('click', () => setDirection('UP'));
        upBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection('UP'); });
    }
    if (leftBtn) {
        leftBtn.addEventListener('click', () => setDirection('LEFT'));
        leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection('LEFT'); });
    }
    if (rightBtn) {
        rightBtn.addEventListener('click', () => setDirection('RIGHT'));
        rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection('RIGHT'); });
    }
    if (downBtn) {
        downBtn.addEventListener('click', () => setDirection('DOWN'));
        downBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection('DOWN'); });
    }
    if (pauseBtn) {
        pauseBtn.addEventListener('click', handlePausePlayButton);
        pauseBtn.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            // Add small delay to prevent accidental touches
            setTimeout(() => handlePausePlayButton(), 50);
        });
    }
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);
    
    function handleKeyPress(e) {
        const activeGameContainer = document.querySelector('.game-container.active');
        const isSnakeGameActive = activeGameContainer && activeGameContainer.id === 'snake-game-container';
        
        if (!isSnakeGameActive) return;
        
        // Prevent default behavior for space bar and arrow keys
        if (e.keyCode === 32 || e.keyCode === 13 || (e.keyCode >= 37 && e.keyCode <= 40)) {
            e.preventDefault();
        }
        
        // Start game with Enter or Space if not started
        if (!gameStarted && (e.keyCode === 32 || e.keyCode === 13)) {
            startGame();
            return;
        }
        
        // Arrow key controls
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            if (!gameStarted) {
                startGame();
            }
            
            if (e.keyCode === 37) setDirection('LEFT');
            else if (e.keyCode === 38) setDirection('UP');
            else if (e.keyCode === 39) setDirection('RIGHT');
            else if (e.keyCode === 40) setDirection('DOWN');
        }
        
        // Game over restart
        if (gameOver && (e.keyCode === 32 || e.keyCode === 13)) {
            resetGame();
            return;
        }
        
        // Space bar to pause (only if game is started)
        if (gameStarted && !gameOver && e.keyCode === 32) togglePause();
    }
    
    function setDirection(newDirection) {
        if (isPaused || gameOver) return;
        
        // Prevent 180-degree turns
        if (
            (direction === 'UP' && newDirection === 'DOWN') ||
            (direction === 'DOWN' && newDirection === 'UP') ||
            (direction === 'LEFT' && newDirection === 'RIGHT') ||
            (direction === 'RIGHT' && newDirection === 'LEFT')
        ) {
            return;
        }
        
        nextDirection = newDirection;
    }
    
    function createFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * gridSize) * box,
                y: Math.floor(Math.random() * gridSize) * box,
                type: Math.random() < 0.8 ? FOOD_TYPES.NORMAL : 
                      Math.random() < 0.7 ? FOOD_TYPES.BONUS : FOOD_TYPES.SUPER
            };
        } while (collision(newFood, snake));
        
        return newFood;
    }
    
    function createSpecialFood() {
        if (specialFood !== null) return;
        
        let newSpecialFood;
        do {
            newSpecialFood = {
                x: Math.floor(Math.random() * gridSize) * box,
                y: Math.floor(Math.random() * gridSize) * box,
                powerUp: Object.values(POWER_UPS)[Math.floor(Math.random() * Object.values(POWER_UPS).length)]
            };
        } while (collision(newSpecialFood, snake) || (newSpecialFood.x === food.x && newSpecialFood.y === food.y));
        
        specialFood = newSpecialFood;
    }
    
    function collision(head, array) {
        for (let i = 0; i < array.length; i++) {
            if (head.x === array[i].x && head.y === array[i].y) {
                return true;
            }
        }
        return false;
    }
    
    function drawSnake() {
        for (let i = 0; i < snake.length; i++) {
            let snakeColor;
            if (powerUpActive) {
                if (powerUp === POWER_UPS.SPEED) snakeColor = i === 0 ? '#00ffff' : '#00cccc';
                else if (powerUp === POWER_UPS.INVINCIBLE) snakeColor = i === 0 ? '#ffff00' : '#cccc00';
                else if (powerUp === POWER_UPS.DOUBLE_POINTS) snakeColor = i === 0 ? '#ff00ff' : '#cc00cc';
            } else {
                snakeColor = i === 0 ? '#00a8ff' : '#0097e6';
            }
            
            ctx.fillStyle = snakeColor;
            ctx.fillRect(snake[i].x, snake[i].y, box, box);
            
            // Add border for better visibility
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(snake[i].x, snake[i].y, box, box);
            
            // Draw face on snake head
            if (i === 0) {
                const centerX = snake[i].x + box / 2;
                const centerY = snake[i].y + box / 2;
                
                // Draw eyes
                ctx.fillStyle = '#ffffff';
                let eyeOffsetX = 4;
                let eyeOffsetY = 4;
                
                // Adjust eye position based on direction
                if (direction === 'UP') {
                    ctx.fillRect(centerX - 4, centerY - 6, 3, 3);
                    ctx.fillRect(centerX + 1, centerY - 6, 3, 3);
                } else if (direction === 'DOWN') {
                    ctx.fillRect(centerX - 4, centerY + 3, 3, 3);
                    ctx.fillRect(centerX + 1, centerY + 3, 3, 3);
                } else if (direction === 'LEFT') {
                    ctx.fillRect(centerX - 6, centerY - 4, 3, 3);
                    ctx.fillRect(centerX - 6, centerY + 1, 3, 3);
                } else if (direction === 'RIGHT') {
                    ctx.fillRect(centerX + 3, centerY - 4, 3, 3);
                    ctx.fillRect(centerX + 3, centerY + 1, 3, 3);
                } else {
                    // Default eyes (facing right)
                    ctx.fillRect(centerX + 3, centerY - 4, 3, 3);
                    ctx.fillRect(centerX + 3, centerY + 1, 3, 3);
                }
            }
        }
    }
    
    function drawFood() {
        ctx.fillStyle = food.type.color;
        ctx.fillRect(food.x, food.y, box, box);
        
        // Add glow effect
        ctx.shadowColor = food.type.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(food.x + 2, food.y + 2, box - 4, box - 4);
        ctx.shadowBlur = 0;
    }
    
    function drawSpecialFood() {
        if (!specialFood) return;
        
        ctx.fillStyle = specialFood.powerUp.color;
        ctx.fillRect(specialFood.x, specialFood.y, box, box);
        
        // Add pulsing effect
        const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(specialFood.x + 4, specialFood.y + 4, box - 8, box - 8);
        ctx.globalAlpha = 1;
    }
    
    function drawPauseScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvasSize / 2, canvasSize / 2 - 20);
        
        ctx.font = '16px Orbitron';
        ctx.fillText('Press SPACE to continue', canvasSize / 2, canvasSize / 2 + 20);
    }
    
    function drawGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        
        ctx.fillStyle = '#ff4757';
        ctx.font = '32px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvasSize / 2, canvasSize / 2 - 40);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px Orbitron';
        ctx.fillText('Score: ' + score, canvasSize / 2, canvasSize / 2);
        ctx.fillText('Level: ' + level, canvasSize / 2, canvasSize / 2 + 25);
        
        ctx.font = '14px Orbitron';
        ctx.fillText('Press SPACE or ENTER to restart', canvasSize / 2, canvasSize / 2 + 60);
    }
    
    function updateScoreboard() {
        // Update the existing scoreboard elements at the top of the page
        const scoreElement = document.getElementById('snake-score');
        const levelElement = document.getElementById('snake-level');
        const timeElement = document.getElementById('snake-time');
        const highScoreElement = document.getElementById('snake-high-score');
        
        if (scoreElement) scoreElement.textContent = score;
        if (levelElement) levelElement.textContent = level;
        if (timeElement) {
            // Only show time if game has started
            if (gameStarted && direction !== null) {
                const minutes = Math.floor(gameTime / 60);
                const seconds = Math.floor(gameTime % 60);
                timeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                timeElement.textContent = '00:00';
            }
        }
        if (highScoreElement) {
            const highScore = localStorage.getItem('snakeHighScore') || 0;
            highScoreElement.textContent = Math.max(highScore, score);
        }
    }
    
    function render() {
        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        
        // Draw grid (optional)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= gridSize; i++) {
            const pos = i * box;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, canvasSize);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(canvasSize, pos);
            ctx.stroke();
        }
        
        // Draw game elements
        drawFood();
        drawSpecialFood();
        drawSnake();
        updateScoreboard();
        
        // Draw power-up indicator
        if (powerUpActive && powerUp) {
            ctx.textAlign = 'center';
            ctx.fillStyle = powerUp.color;
            ctx.font = 'bold 14px Orbitron';
            const remainingTime = Math.max(0, powerUpTimeLeft).toFixed(1);
            
            // Add background for better visibility
            const text = powerUp.effect + ': ' + remainingTime + 's';
            const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(canvasSize / 2 - textWidth / 2 - 5, 10, textWidth + 10, 20);
            
            ctx.fillStyle = powerUp.color;
            ctx.fillText(text, canvasSize / 2, 25);
        }
        
        // Draw overlays
        if (isPaused) {
            drawPauseScreen();
        } else if (gameOver) {
            drawGameOver();
        }
    }
    
    function togglePause() {
        if (gameOver) return;
        
        if (!isPaused) {
            pauseStartTime = Date.now();
        } else {
            totalPausedTime += Date.now() - pauseStartTime;
            // Reset lastMoveTime to prevent immediate movement after unpause
            lastMoveTime = Date.now();
        }
        
        isPaused = !isPaused;
        updatePauseButtonIcon();
    }
    
    function handlePausePlayButton() {
        if (gameOver) {
            resetGame();
            return;
        }
        
        if (!gameStarted) {
            startGame();
            return;
        }
        
        togglePause();
    }
    
    function updatePauseButtonIcon() {
        if (pauseBtn) {
            // Remove all state classes first
            pauseBtn.classList.remove('start-state', 'pause-state', 'play-state', 'restart-state');
            
            if (!gameStarted) {
                pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                pauseBtn.title = 'Start Game';
                pauseBtn.classList.add('start-state');
            } else if (gameOver) {
                pauseBtn.innerHTML = '<i class="fas fa-redo"></i>';
                pauseBtn.title = 'Restart Game';
                pauseBtn.classList.add('restart-state');
            } else if (isPaused) {
                pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                pauseBtn.title = 'Resume Game';
                pauseBtn.classList.add('play-state');
            } else {
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                pauseBtn.title = 'Pause Game';
                pauseBtn.classList.add('pause-state');
            }
        }
    }
    
    function levelUp() {
        level++;
        lastLevelUpTime = gameTime;
        timeForNextLevel = Math.min(60, 30 + (level - 1) * 5);
        baseSpeed = Math.max(minSpeed, 150 - (level - 1) * speedDecrement);
        
        // Log speed change for debugging (can be removed later)
        console.log(`Level ${level}: Speed = ${baseSpeed}ms (${Math.round(1000/baseSpeed)} moves/sec)`);
        
        // Show level up message
        const levelUpMsg = document.createElement('div');
        levelUpMsg.className = 'level-up-msg';
        levelUpMsg.textContent = 'LEVEL ' + level + '!';
        levelUpMsg.style.position = 'absolute';
        levelUpMsg.style.top = '30%';
        levelUpMsg.style.left = '50%';
        levelUpMsg.style.transform = 'translate(-50%, -50%)';
        levelUpMsg.style.color = '#00a8ff';
        levelUpMsg.style.fontFamily = 'Orbitron, sans-serif';
        levelUpMsg.style.fontSize = '24px';
        levelUpMsg.style.fontWeight = 'bold';
        levelUpMsg.style.textShadow = '0 0 10px rgba(0, 168, 255, 0.7)';
        levelUpMsg.style.zIndex = '100';
        levelUpMsg.style.pointerEvents = 'none';
        levelUpMsg.style.opacity = '0.8';
        levelUpMsg.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        levelUpMsg.style.padding = '10px 20px';
        levelUpMsg.style.borderRadius = '10px';
        
        const gameContainer = document.querySelector('.snake-game');
        if (gameContainer) {
            gameContainer.appendChild(levelUpMsg);
            setTimeout(() => {
                if (levelUpMsg.parentNode) {
                    levelUpMsg.parentNode.removeChild(levelUpMsg);
                }
            }, 1500);
        }
    }
    
    function gameLoop() {
        const currentTime = Date.now();
        
        if (!isPaused && !gameOver) {
            // Only start the timer if the game has started and player has made a move
            if (gameStarted && direction !== null) {
                if (gameStartTime === 0) {
                    gameStartTime = currentTime;
                    lastLevelUpTime = 0;
                    lastMoveTime = currentTime;
                }
                
                gameTime = (currentTime - gameStartTime - totalPausedTime) / 1000;
                
                // Check for level up
                if (gameTime - lastLevelUpTime >= timeForNextLevel) {
                    levelUp();
                }
            }
            
            // Calculate current speed with power-up multiplier
            const currentSpeed = baseSpeed / speedBoostMultiplier;
            
            // Only move snake if game has started, player has made a move, and enough time has passed
            if (gameStarted && direction !== null && currentTime - lastMoveTime >= currentSpeed) {
                lastMoveTime = currentTime;
                
                // Update direction
                if (nextDirection) {
                    direction = nextDirection;
                    nextDirection = null;
                }
                
                if (direction) {
                    // Move snake
                    let snakeX = snake[0].x;
                    let snakeY = snake[0].y;
                    
                    if (direction === 'LEFT') snakeX -= box;
                    else if (direction === 'UP') snakeY -= box;
                        else if (direction === 'RIGHT') snakeX += box;
                else if (direction === 'DOWN') snakeY += box;
                
                    // Check wall collision
                    if (snakeX < 0 || snakeX >= canvasSize || snakeY < 0 || snakeY >= canvasSize) {
                        if (!(powerUpActive && powerUp === POWER_UPS.INVINCIBLE)) {
                            gameOver = true;
                            
                            // Save high score
                            const highScore = localStorage.getItem('snakeHighScore') || 0;
                            if (score > highScore) {
                                localStorage.setItem('snakeHighScore', score);
                            }
                            
                            // Update pause button to show restart icon
                            updatePauseButtonIcon();
                            
                            render();
                            return;
                        } else {
                            // Wrap around if invincible
                            if (snakeX < 0) snakeX = canvasSize - box;
                            else if (snakeX >= canvasSize) snakeX = 0;
                            if (snakeY < 0) snakeY = canvasSize - box;
                            else if (snakeY >= canvasSize) snakeY = 0;
                     }
                    }
                   
                    const newHead = { x: snakeX, y: snakeY };
                    
                    // Check self collision
                    if (collision(newHead, snake) && !(powerUpActive && powerUp === POWER_UPS.INVINCIBLE)) {
                        gameOver = true;
                        
                        // Save high score
                        const highScore = localStorage.getItem('snakeHighScore') || 0;
                        if (score > highScore) {
                            localStorage.setItem('snakeHighScore', score);
                        }
                        
                        // Update pause button to show restart icon
                        updatePauseButtonIcon();
                        
                        render();
                        return;
                    }
                    
                    // Check food collision
                    if (snakeX === food.x && snakeY === food.y) {
                        let points = food.type.points;
                        if (powerUpActive && powerUp === POWER_UPS.DOUBLE_POINTS) {
                            points *= 2;
                        }
                        score += points;
                        food = createFood();
                    } else {
                        snake.pop();
                    }
                
                    // Check special food collision
                    if (specialFood && snakeX === specialFood.x && snakeY === specialFood.y) {
                        // Deactivate previous power-up
                        if (powerUpActive) {
                            speedBoostMultiplier = 1;
                        }
                        
                        // Activate new power-up
                        powerUp = specialFood.powerUp;
                        powerUpActive = true;
                        powerUpStartTime = gameTime;
                        powerUpTimeLeft = powerUp.duration;
                        
                        if (powerUp === POWER_UPS.SPEED) {
                            speedBoostMultiplier = 2.5;
                        }
                        
                        specialFood = null;
                        
                        // Show power-up message
                        const powerUpMsg = document.createElement('div');
                        powerUpMsg.className = 'power-up-msg';
                        powerUpMsg.textContent = powerUp.effect + ' ACTIVATED!';
                        powerUpMsg.style.position = 'absolute';
                        powerUpMsg.style.bottom = '20%';
                        powerUpMsg.style.left = '50%';
                        powerUpMsg.style.transform = 'translateX(-50%)';
                        powerUpMsg.style.color = powerUp.color;
                        powerUpMsg.style.fontFamily = 'Orbitron, sans-serif';
                        powerUpMsg.style.fontSize = '18px';
                        powerUpMsg.style.fontWeight = 'bold';
                        powerUpMsg.style.textShadow = '0 0 10px rgba(0, 0, 0, 0.7)';
                        powerUpMsg.style.zIndex = '100';
                        powerUpMsg.style.opacity = '0.8';
                        powerUpMsg.style.pointerEvents = 'none';
                        
                        const gameContainer = document.querySelector('.snake-game');
                        if (gameContainer) {
                            gameContainer.appendChild(powerUpMsg);
                            setTimeout(() => {
                                if (powerUpMsg.parentNode) {
                                    powerUpMsg.parentNode.removeChild(powerUpMsg);
                                }
                            }, 1500);
                            }
                    }
                
                // Create special food occasionally (less frequent, more balanced)
                    if (!specialFood && Math.random() < 0.002 && score > 50) {
                        createSpecialFood();
                    }
                    
                    // Update power-up timer
                    if (powerUpActive && powerUp) {
                        powerUpTimeLeft = Math.max(0, powerUp.duration - (gameTime - powerUpStartTime));
                        
                        if (powerUpTimeLeft <= 0) {
                            if (powerUp === POWER_UPS.SPEED) {
                                speedBoostMultiplier = 1;
                            }
                            
                            powerUpActive = false;
                            powerUp = null;
                        }
                    }
                    
                    snake.unshift(newHead);
                }
            }
        }
        
        render();
        
        // Continue the game loop
        if (!gameOver) {
            requestAnimationFrame(gameLoop);
        }
    }
    
    // Function to start the game
    function startGame() {
        if (gameStarted) return;
        
        gameStarted = true;
        
        // Hide the start screen
        if (startScreen) {
            startScreen.classList.add('hidden');
        }
        
        // Set initial direction if not set
        if (!direction) {
            direction = 'RIGHT'; // Default direction
        }
        
        // Update pause button to show pause icon
        updatePauseButtonIcon();
        
        // Start the game loop if it's not already running
        if (!gameLoop.isRunning) {
            gameLoop.isRunning = true;
            requestAnimationFrame(gameLoop);
        }
    }
    
    function resetGame() {
        // Reset game variables
        snake = [{ x: Math.floor(gridSize / 2) * box, y: Math.floor(gridSize / 2) * box }];
        food = createFood();
        specialFood = null;
        score = 0;
        level = 1;
        direction = null;
        nextDirection = null;
        gameOver = false;
        gameStarted = false;
        isPaused = false;
        powerUpActive = false;
        powerUp = null;
        baseSpeed = 150;
        speedBoostMultiplier = 1;
        minSpeed = 50;
        speedDecrement = 8;
        
        // Reset time tracking
        gameStartTime = 0;
        gameTime = 0;
        pauseStartTime = 0;
        totalPausedTime = 0;
        lastLevelUpTime = 0;
        lastMoveTime = 0;
        timeForNextLevel = 30;
        powerUpStartTime = 0;
        powerUpTimeLeft = 0;
        
        // Clean up messages
        const existingMsgs = document.querySelectorAll('.level-up-msg, .power-up-msg');
        existingMsgs.forEach(msg => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
        
        // Show the start screen
        if (startScreen) {
            startScreen.classList.remove('hidden');
        }
        
        // Update pause button to show start state
        updatePauseButtonIcon();
        
        // Start game loop with requestAnimationFrame
        gameLoop.isRunning = true;
        requestAnimationFrame(gameLoop);
        
        // Update scoreboard to reset values
        updateScoreboard();
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (!gameOver && !isPaused) {
            render();
        }
    });
    
    // Add event listener for the start button
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }
    
    // Initialize the game
    resetGame();
    
    // Initialize pause button icon
    updatePauseButtonIcon();
    
    // Log successful initialization
    console.log('Snake game initialized successfully!');
}

// Tic Tac Toe Game - Complete Implementation with AI
function initTicTacToe() {
    const gameContainer = document.querySelector('.tictactoe-game');
    if (!gameContainer) return;
    
    // Game elements
    const cells = gameContainer.querySelectorAll('.cell');
    const statusText = gameContainer.querySelector('.game-status');
    const restartBtn = gameContainer.querySelector('.restart-game');
    const resetScoresBtn = gameContainer.querySelector('.reset-scores');
    const modeButtons = gameContainer.querySelectorAll('.mode-btn');
    const playerIndicator = gameContainer.querySelector('.player-indicator');
    const xWinsElement = gameContainer.querySelector('#x-wins');
    const oWinsElement = gameContainer.querySelector('#o-wins');
    const drawsElement = gameContainer.querySelector('#draws');
    
    // Game state
    let currentPlayer = 'X';
    let gameActive = true;
    let gameState = ['', '', '', '', '', '', '', '', ''];
    let gameMode = 'vs-player'; // 'vs-player' or 'vs-pc'
    let isPlayerTurn = true;
    let isProcessingMove = false; // Prevent rapid clicks
    let scores = {
        xWins: 0,
        oWins: 0,
        draws: 0
    };
    
    // Winning conditions
    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];
    
    // Initialize game
    function initGame() {
        updateScoreDisplay();
        updateStatus();
        
        // Mode selection event listeners
        modeButtons.forEach(button => {
            button.addEventListener('click', function() {
                modeButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                gameMode = this.getAttribute('data-mode');
                resetGame();
            });
        });
        
        // Add click event listeners to cells
        cells.forEach((cell, index) => {
            cell.addEventListener('click', () => handleCellClick(index));
        });
        
        // Add restart button listener
        if (restartBtn) {
            restartBtn.addEventListener('click', resetGame);
        }
        
        // Add reset scores button listener
        if (resetScoresBtn) {
            resetScoresBtn.addEventListener('click', resetScores);
        }
    }
    
    function handleCellClick(index) {
        if (!gameActive || gameState[index] !== '' || (gameMode === 'vs-pc' && !isPlayerTurn) || isProcessingMove) {
            return;
        }
        
        isProcessingMove = true;
        
        // In vs-pc mode, player is always X
        const playerSymbol = gameMode === 'vs-pc' ? 'X' : currentPlayer;
        makeMove(index, playerSymbol);
        
        if (gameActive && gameMode === 'vs-pc') {
            isPlayerTurn = false;
            statusText.textContent = "Computer is thinking";
            statusText.classList.add('thinking');
            
            // Add a small delay for computer move
            setTimeout(() => {
                if (gameActive) {
                    statusText.classList.remove('thinking');
                    makeComputerMove();
                    isPlayerTurn = true;
                }
                isProcessingMove = false;
            }, 500);
        } else {
            // Reset processing flag after a short delay for player vs player mode
            setTimeout(() => {
                isProcessingMove = false;
            }, 100);
        }
    }
    
    function makeMove(index, player) {
        gameState[index] = player;
        cells[index].textContent = player;
        cells[index].classList.add(player.toLowerCase());
        cells[index].classList.add('taken');
        
        if (checkWinner()) {
            gameActive = false;
            highlightWinningCells();
            updateScores(player);
            updateStatus(`Player ${player} wins!`);
        } else if (gameState.every(cell => cell !== '')) {
            gameActive = false;
            updateScores('draw');
            updateStatus("It's a draw!");
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updateStatus();
        }
    }
    
    function makeComputerMove() {
        if (!gameActive || currentPlayer !== 'O') return;
        
        const move = getBestMove();
        if (move !== -1 && gameState[move] === '') {
            makeMove(move, 'O');
        }
    }
    
    function getBestMove() {
        // Try to win
        for (let i = 0; i < 9; i++) {
            if (gameState[i] === '') {
                gameState[i] = 'O';
                if (checkWinner()) {
                    gameState[i] = '';
                    return i;
                }
                gameState[i] = '';
            }
        }
        
        // Try to block player from winning
        for (let i = 0; i < 9; i++) {
            if (gameState[i] === '') {
                gameState[i] = 'X';
                if (checkWinner()) {
                    gameState[i] = '';
                    return i;
                }
                gameState[i] = '';
            }
        }
        
        // Take center if available
        if (gameState[4] === '') {
            return 4;
        }
        
        // Take corners
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(corner => gameState[corner] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        // Take any available move
        const availableMoves = gameState
            .map((cell, index) => cell === '' ? index : null)
            .filter(val => val !== null);
        
        return availableMoves.length > 0 
            ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
            : -1;
    }
    
    function checkWinner() {
        return winningConditions.some(condition => {
            const [a, b, c] = condition;
            return gameState[a] !== '' && 
                   gameState[a] === gameState[b] && 
                   gameState[a] === gameState[c];
        });
    }
    
    function highlightWinningCells() {
        winningConditions.forEach(condition => {
            const [a, b, c] = condition;
            if (gameState[a] !== '' && 
                gameState[a] === gameState[b] && 
                gameState[a] === gameState[c]) {
                cells[a].classList.add('winning');
                cells[b].classList.add('winning');
                cells[c].classList.add('winning');
            }
        });
    }
    
    function updateStatus(message = null) {
        if (message) {
            statusText.textContent = message;
        } else if (gameMode === 'vs-pc') {
            if (isPlayerTurn) {
                statusText.textContent = "Your turn (X)";
            } else {
                statusText.textContent = "Computer's turn (O)";
            }
        } else {
            statusText.textContent = `Player ${currentPlayer}'s turn`;
        }
        
        // Update player indicator
        if (playerIndicator) {
            if (gameMode === 'vs-pc') {
                playerIndicator.textContent = isPlayerTurn ? 'X' : 'O';
                playerIndicator.style.background = isPlayerTurn ? '#ff6b6b' : '#00a8ff';
            } else {
                playerIndicator.textContent = currentPlayer;
                playerIndicator.style.background = currentPlayer === 'X' ? '#ff6b6b' : '#00a8ff';
            }
        }
    }
    
    function updateScores(winner) {
        if (winner === 'X') {
            scores.xWins++;
        } else if (winner === 'O') {
            scores.oWins++;
        } else {
            scores.draws++;
        }
        updateScoreDisplay();
        saveScores();
    }
    
    function updateScoreDisplay() {
        if (xWinsElement) xWinsElement.textContent = scores.xWins;
        if (oWinsElement) oWinsElement.textContent = scores.oWins;
        if (drawsElement) drawsElement.textContent = scores.draws;
    }
    
    function saveScores() {
        localStorage.setItem('tictactoe-scores', JSON.stringify(scores));
    }
    
    function loadScores() {
        const savedScores = localStorage.getItem('tictactoe-scores');
        if (savedScores) {
            scores = JSON.parse(savedScores);
        }
    }
    
    function resetGame() {
        currentPlayer = 'X';
        gameActive = true;
        gameState = ['', '', '', '', '', '', '', '', ''];
        isPlayerTurn = true;
        isProcessingMove = false; // Reset processing flag
        
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'taken', 'winning');
        });
        
        updateStatus();
    }
    
    function resetScores() {
        if (confirm('Are you sure you want to reset all scores?')) {
            scores = { xWins: 0, oWins: 0, draws: 0 };
            updateScoreDisplay();
            saveScores();
        }
    }
    
    // Keyboard navigation support
    function handleKeyboardNavigation(e) {
        const activeGameContainer = document.querySelector('.game-container.active');
        const isTicTacToeActive = activeGameContainer && activeGameContainer.id === 'tictactoe-game-container';
        
        if (!isTicTacToeActive || !gameActive || (gameMode === 'vs-pc' && !isPlayerTurn)) return;
        
        // Number keys 1-9 for cell selection
        if (e.keyCode >= 49 && e.keyCode <= 57) {
            const cellIndex = e.keyCode - 49; // Convert to 0-8 index
            if (gameState[cellIndex] === '') {
                handleCellClick(cellIndex);
            }
        }
        
        // R key for restart
        if (e.keyCode === 82) {
            resetGame();
        }
    }
    
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Initialize the game
    loadScores();
    initGame();
    resetGame();
}



// Brick Breaker Game - Advanced Physics and Smooth Animations
function initTetris() {
    const canvas = document.querySelector('#tetris-game-container canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Local sound function for Brick Breaker (disabled)
    function playSound(type) {
        // Sound system is disabled
        return;
    }
    
    // Mobile detection and responsive sizing
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    }
    

    
    function getResponsiveCanvasSize() {
        const isMobileDevice = isMobile();
        const maxWidth = isMobileDevice ? Math.min(window.innerWidth - 20, 380) : 640;
        const maxHeight = isMobileDevice ? Math.min(window.innerHeight - 250, 480) : 480;
        
        // Maintain aspect ratio
        const aspectRatio = 4/3;
        let width = maxWidth;
        let height = width / aspectRatio;
        
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }
        
        return { width: Math.floor(width), height: Math.floor(height) };
    }
    
    // Get responsive canvas size
    const canvasSize = getResponsiveCanvasSize();
    const CANVAS_WIDTH = canvasSize.width;
    const CANVAS_HEIGHT = canvasSize.height;
    
    // Scale other elements based on canvas size
    const scale = CANVAS_WIDTH / 640; // Base scale factor
    const PADDLE_WIDTH = Math.floor(100 * scale);
    const PADDLE_HEIGHT = Math.floor(15 * scale);
    const BALL_RADIUS = Math.max(6, Math.floor(8 * scale));
    // Increase number of columns and make bricks smaller
    const BRICK_COLS = isMobile() ? 10 : 14;
    const BRICK_ROWS = isMobile() ? 8 : 10; // More rows for more bricks
    const BRICK_WIDTH = Math.floor((CANVAS_WIDTH - 40) / BRICK_COLS - 2);
    const BRICK_HEIGHT = Math.floor(15 * scale); // Smaller height
    const BRICK_PADDING = Math.floor(1 * scale); // Smaller padding
    const BRICK_OFFSET_TOP = 60;
    const BRICK_OFFSET_LEFT = 5;
    
    // Villain configuration
    const VILLAIN_WIDTH = Math.floor(30 * scale);
    const VILLAIN_HEIGHT = Math.floor(30 * scale);
    const VILLAIN_SPEED = 2;
    const PROJECTILE_RADIUS = Math.floor(5 * scale);
    
    // Level-based configuration with different patterns and increasing difficulty
    // Generate configurations for 100 levels
    const LEVEL_CONFIG = {};
    
    // Base patterns that will repeat with increasing difficulty
    const basePatterns = ['simple', 'pyramid', 'diamond', 'cross', 'spiral'];
    
    // Generate 100 levels with increasing difficulty
    for (let i = 1; i <= 100; i++) {
        // Calculate pattern index (cycle through patterns)
        const patternIndex = (i - 1) % basePatterns.length;
        const pattern = basePatterns[patternIndex];
        
        // Increase ball speed gradually (capped at 12)
        const baseSpeed = 4.0;
        const speedIncrease = Math.min(i * 0.08, 8.0);
        const ballSpeed = baseSpeed + speedIncrease;
        
        // Add villains starting from level 3
        const hasVillains = i >= 3;
        const villainCount = Math.min(Math.floor(i / 3), 5); // Max 5 villains
        
        // Increase villain shooting frequency as levels progress
        const villainShootFrequency = Math.min(1000 + (i * 100), 5000); // ms between shots
        
        // Brick health increases every 5 levels
        const brickHealthMultiplier = 1 + Math.floor(i / 5);
        
        LEVEL_CONFIG[i] = { 
            pattern, 
            ballSpeed, 
            hasVillains, 
            villainCount,
            villainShootFrequency,
            brickHealthMultiplier
        };
    }
    
    // Set canvas dimensions
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // Ensure canvas style matches its internal dimensions
    canvas.style.width = CANVAS_WIDTH + 'px';
    canvas.style.height = CANVAS_HEIGHT + 'px';
    
    // Game state
    let gameState = 'waiting'; // waiting, playing, paused, gameOver, won
    let score = 0;
    let lives = 3;
    let level = 1;
    let animationId = null;
    let lastTime = 0;
    let particles = [];
    let powerUps = [];
    let activePowerUps = [];
    let balls = []; // Support multiple balls
    let obstacles = []; // Random obstacles
    let villains = []; // Enemy villains that shoot at paddle
    let projectiles = []; // Projectiles shot by villains
    let lastVillainShot = 0; // Time tracking for villain shots
    
    // Paddle object with website theme styling
    const paddle = {
        x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
        y: CANVAS_HEIGHT - PADDLE_HEIGHT - 20,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        speed: 12, // Faster keyboard movement
        baseSpeed: 12,
        dx: 0,
        color: '#00a8ff',
        glowColor: '#0097e6',
        hasShield: false,
        shieldTime: 0,
        health: 100, // Health percentage
        maxHealth: 100,
        damageFlash: 0 // Visual indicator when damaged
    };
    
    // Ball creation function
    function createBall(x, y, dx, dy) {
        return {
            x: x || CANVAS_WIDTH / 2,
            y: y || CANVAS_HEIGHT / 2,
            radius: BALL_RADIUS,
            dx: dx || 0,
            dy: dy || 0,
            speed: 4.0,
            maxSpeed: 12,
            minSpeed: 2.5,
            baseSpeed: 4.0,
            color: '#00e4ff', // Website theme color
            trail: [],
            trailLength: 6,
            spinning: 0,
            spinSpeed: 0.15,
            power: 1 // Ball power level (increases with level)
        };
    }
    
    // Villain creation function
    function createVillain(x, y) {
        return {
            x: x,
            y: y,
            width: VILLAIN_WIDTH,
            height: VILLAIN_HEIGHT,
            dx: VILLAIN_SPEED * (Math.random() > 0.5 ? 1 : -1),
            health: 4,
            color: BRICK_TYPES.VILLAIN.color,
            lastShot: 0,
            shootDelay: 2000 + Math.random() * 2000, // Random delay between shots
            active: true
        };
    }
    
    // Projectile creation function
    function createProjectile(x, y, targetX, targetY, isPlayerProjectile = false) {
        const angle = Math.atan2(targetY - y, targetX - x);
        const speed = isPlayerProjectile ? 8 : 4;
        
        return {
            x: x,
            y: y,
            radius: PROJECTILE_RADIUS,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            color: isPlayerProjectile ? '#00e4ff' : '#ff3838',
            isPlayerProjectile: isPlayerProjectile,
            active: true
        };
    }
    
    // Initialize with one ball
    function initBalls() {
        balls = [createBall()];
    }
    
    // Bricks array
    let bricks = [];
    
    // Brick types with website theme colors
    const BRICK_TYPES = {
        NORMAL: { color: '#00a8ff', hits: 1, points: 10, powerUpChance: 0.15 },
        STRONG: { color: '#0097e6', hits: 2, points: 20, powerUpChance: 0.2 },
        SUPER: { color: '#00e4ff', hits: 3, points: 30, powerUpChance: 0.25 },
        SPECIAL: { color: '#7d5fff', hits: 1, points: 50, powerUpChance: 0.8 },
        VILLAIN: { color: '#ff3838', hits: 4, points: 100, powerUpChance: 1.0 }
    };
    
    // Power-up types with website theme colors
    const POWER_UP_TYPES = {
        EXPAND_PADDLE: { color: '#00a8ff', effect: 'expandPaddle', duration: 12000 },
        MULTI_BALL: { color: '#7d5fff', effect: 'multiBall', duration: 0 },
        SLOW_BALL: { color: '#00e4ff', effect: 'slowBall', duration: 10000 },
        EXTRA_LIFE: { color: '#0097e6', effect: 'extraLife', duration: 0 },
        FAST_PADDLE: { color: '#00a8ff', effect: 'fastPaddle', duration: 8000 },
        SHIELD: { color: '#e1b12c', effect: 'shield', duration: 15000 }
    };
    
    // Input handling
    const keys = {};
    let mouseX = CANVAS_WIDTH / 2;
    let mousePressed = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouching = false;
    let lastTouchTime = 0;
    
    // Event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Also listen on the canvas parent for better tracking
    const canvasParent = canvas.parentElement;
    if (canvasParent) {
        canvasParent.addEventListener('mousemove', handleMouseMove);
        canvasParent.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvasParent.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvasParent.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        // Prevent context menu on long press
        canvasParent.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    // Mobile control buttons
    const startBtn = document.getElementById('brick-start-btn');
    const pauseBtn = document.querySelector('.brick-control-pause');
    const playBtn = document.querySelector('.brick-control-play');
    const restartBtn = document.querySelector('.brick-control-restart');
    const startScreen = document.getElementById('brick-start-screen');
    
    // Start button event listener
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (gameState === 'waiting') {
                startGame();
            }
        });
    }
    
    // Pause button event listener
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (gameState === 'playing') {
                pauseGame();
                updateControlButtons();
            }
        });
    }
    
    // Play button event listener
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (gameState === 'paused') {
                resumeGame();
                updateControlButtons();
            }
        });
    }
    
    // Restart button event listener
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            resetGame();
            updateControlButtons();
        });
    }
    
    // Function to update control button visibility
    function updateControlButtons() {
        if (!pauseBtn || !playBtn) return;
        
        if (gameState === 'playing') {
            pauseBtn.style.display = 'flex';
            playBtn.style.display = 'none';
        } else if (gameState === 'paused') {
            pauseBtn.style.display = 'none';
            playBtn.style.display = 'flex';
        } else {
            pauseBtn.style.display = 'flex';
            playBtn.style.display = 'none';
        }
    }
    
    // Function to update start screen visibility
    function updateStartScreen() {
        if (!startScreen) return;
        
        if (gameState === 'waiting') {
            startScreen.style.display = 'flex';
        } else {
            startScreen.style.display = 'none';
        }
    }
    
    function handleMouseMove(e) {
        e.preventDefault();
        
        const rect = canvas.getBoundingClientRect();
        
        // Get the actual client coordinates
        let clientX = e.clientX;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        }
        
        // Calculate relative position (0 to 1)
        const relativeX = (clientX - rect.left) / rect.width;
        // Convert to canvas coordinates and ensure full range
        mouseX = Math.max(0, Math.min(CANVAS_WIDTH, relativeX * CANVAS_WIDTH));
        
        // Track mouse activity
        lastMouseTime = Date.now();
    }
    
    function handleClick(e) {
        if (gameState === 'waiting') {
            startGame();
        } else if (gameState === 'gameOver' || gameState === 'won') {
            resetGame();
        }
        mousePressed = true;
        setTimeout(() => mousePressed = false, 100);
    }
    
    function handleTouchStart(e) {
        e.preventDefault();
        isTouching = true;
        lastTouchTime = Date.now();
        
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        touchStartX = touch.clientX - rect.left;
        touchStartY = touch.clientY - rect.top;
        
        // Convert to canvas coordinates
        const relativeX = touchStartX / rect.width;
        mouseX = Math.max(0, Math.min(CANVAS_WIDTH, relativeX * CANVAS_WIDTH));
        
        // Handle game state changes
        if (gameState === 'waiting') {
            startGame();
        } else if (gameState === 'paused') {
            resumeGame();
        } else if (gameState === 'gameOver' || gameState === 'won') {
            resetGame();
        }
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        if (!isTouching) return;
        
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const touchX = touch.clientX - rect.left;
        
        // Convert to canvas coordinates
        const relativeX = touchX / rect.width;
        mouseX = Math.max(0, Math.min(CANVAS_WIDTH, relativeX * CANVAS_WIDTH));
        
        // Track touch activity for control mode
        lastTouchTime = Date.now();
    }
    
    function handleTouchEnd(e) {
        e.preventDefault();
        isTouching = false;
    }
    
    function handleKeyDown(e) {
        // Only handle keys when brick breaker is active
        const activeGameContainer = document.querySelector('.game-container.active');
        const isBrickBreakerActive = activeGameContainer && activeGameContainer.id === 'tetris-game-container';
        
        if (!isBrickBreakerActive) return;
        
        keys[e.code] = true;
        
        if (e.code === 'Space') {
            e.preventDefault();
            if (gameState === 'waiting') {
                startGame();
            } else if (gameState === 'playing') {
                pauseGame();
            } else if (gameState === 'paused') {
                resumeGame();
            } else if (gameState === 'gameOver' || gameState === 'won') {
                resetGame();
            }
        }
    }
    
    function handleKeyUp(e) {
        keys[e.code] = false;
    }
    
    // Initialize bricks with different patterns
    function initBricks() {
        bricks = [];
        
        // Get level configuration
        const levelConfig = LEVEL_CONFIG[level] || LEVEL_CONFIG[5];
        
        // Randomly select a pattern for this level instead of using the predefined one
        const patterns = ['simple', 'pyramid', 'diamond', 'cross', 'spiral'];
        const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        // Calculate brick density based on level (more bricks as level increases)
        // Start with fewer rows in level 1 and increase
        const baseRows = 3;
        const maxRows = BRICK_ROWS;
        const rowsForLevel = Math.min(baseRows + Math.floor((level - 1) / 2), maxRows);
        
        // Calculate brick health multiplier based on level
        const brickHealthMultiplier = levelConfig.brickHealthMultiplier || 1;
        
        // Only log when game is actually being played
        if (gameState === 'playing' || gameState === 'waiting') {
            console.log(`Level ${level}: Using ${randomPattern} pattern with ${rowsForLevel} rows`);
        }
        
        // Create bricks based on pattern
        switch (randomPattern) {
            case 'simple':
                createSimplePattern(rowsForLevel, brickHealthMultiplier);
                break;
            case 'pyramid':
                createPyramidPattern(rowsForLevel, brickHealthMultiplier);
                break;
            case 'diamond':
                createDiamondPattern(rowsForLevel, brickHealthMultiplier);
                break;
            case 'cross':
                createCrossPattern(rowsForLevel, brickHealthMultiplier);
                break;
            case 'spiral':
                createSpiralPattern(rowsForLevel, brickHealthMultiplier);
                break;
            default:
                createSimplePattern(rowsForLevel, brickHealthMultiplier);
        }
        
        // Center-align the bricks
        centerAlignBricks();
    }
    
    // Center-align bricks horizontally
    function centerAlignBricks() {
        if (bricks.length === 0) return;
        
        // Find leftmost and rightmost brick positions
        let minX = Infinity;
        let maxX = -Infinity;
        
        bricks.forEach(brick => {
            if (brick.x < minX) minX = brick.x;
            if (brick.x + brick.width > maxX) maxX = brick.x + brick.width;
        });
        
        // Calculate total width of brick formation
        const totalWidth = maxX - minX;
        
        // Calculate offset to center
        const offset = (CANVAS_WIDTH - totalWidth) / 2 - minX + BRICK_OFFSET_LEFT;
        
        // Apply offset to all bricks
        bricks.forEach(brick => {
            brick.x += offset;
        });
    }
    
    function createBrick(row, col, type) {
        return {
            x: col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
            y: row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
            width: BRICK_WIDTH,
            height: BRICK_HEIGHT,
            type: type,
            hits: type.hits,
            visible: true,
            alpha: 1,
            scale: 1,
            glowIntensity: 0
        };
    }
    
    function createSimplePattern(rows = 4, healthMultiplier = 1) {
        // Ensure we have at least 2 rows
        rows = Math.max(2, rows);
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < BRICK_COLS; c++) {
                // Determine brick type based on row
                let type = r === 0 ? BRICK_TYPES.SUPER : 
                          r === 1 ? BRICK_TYPES.STRONG : BRICK_TYPES.NORMAL;
                
                // Add special bricks in center columns
                const centerCol1 = Math.floor(BRICK_COLS / 2) - 1;
                const centerCol2 = Math.floor(BRICK_COLS / 2);
                if (c === centerCol1 || c === centerCol2) {
                    type = BRICK_TYPES.SPECIAL;
                }
                
                // Create brick with adjusted health based on level
                const brick = createBrick(r, c, type);
                brick.hits = type.hits * healthMultiplier;
                bricks.push(brick);
            }
        }
    }
    
    function createPyramidPattern(rows = 6, healthMultiplier = 1) {
        // Ensure we have at least 3 rows for a proper pyramid
        rows = Math.max(3, rows);
        
        for (let r = 0; r < rows; r++) {
            // Calculate start and end columns to create pyramid shape
            const startCol = Math.floor(r * BRICK_COLS / (rows * 2));
            const endCol = BRICK_COLS - startCol - 1;
            
            for (let c = startCol; c <= endCol; c++) {
                // Determine brick type based on row position in pyramid
                let type = r < rows/3 ? BRICK_TYPES.SUPER : 
                          r < rows*2/3 ? BRICK_TYPES.STRONG : BRICK_TYPES.NORMAL;
                
                // Add special bricks in middle section
                const centerRow = Math.floor(rows / 3);
                const centerCol1 = Math.floor(BRICK_COLS / 2) - 1;
                const centerCol2 = Math.floor(BRICK_COLS / 2);
                
                if (r === centerRow && (c === centerCol1 || c === centerCol2)) {
                    type = BRICK_TYPES.SPECIAL;
                }
                
                // Create brick with adjusted health based on level
                const brick = createBrick(r, c, type);
                brick.hits = type.hits * healthMultiplier;
                bricks.push(brick);
            }
        }
    }
    
    function createDiamondPattern(rows = 7, healthMultiplier = 1) {
        // Ensure we have at least 5 rows for a proper diamond
        rows = Math.max(5, Math.min(rows, BRICK_ROWS));
        
        // Make sure rows is odd for a symmetrical diamond
        if (rows % 2 === 0) rows++;
        
        const centerRow = Math.floor(rows / 2);
        const centerCol = Math.floor(BRICK_COLS / 2);
        
        // Calculate the maximum distance for the diamond size
        // Scale based on the number of rows
        const maxDistance = Math.floor(rows * 0.6);
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < BRICK_COLS; c++) {
                // Manhattan distance from center
                const distanceFromCenter = Math.abs(r - centerRow) + Math.abs(c - centerCol);
                
                if (distanceFromCenter <= maxDistance) {
                    // Determine brick type based on distance from center
                    let type = distanceFromCenter <= 1 ? BRICK_TYPES.SPECIAL :
                              distanceFromCenter <= Math.floor(maxDistance * 0.4) ? BRICK_TYPES.SUPER :
                              distanceFromCenter <= Math.floor(maxDistance * 0.7) ? BRICK_TYPES.STRONG : 
                              BRICK_TYPES.NORMAL;
                    
                    // Create brick with adjusted health based on level
                    const brick = createBrick(r, c, type);
                    brick.hits = type.hits * healthMultiplier;
                    bricks.push(brick);
                }
            }
        }
    }
    
    function createCrossPattern(rows = 6, healthMultiplier = 1) {
        // Ensure we have at least 4 rows for a proper cross
        rows = Math.max(4, Math.min(rows, BRICK_ROWS));
        
        // Make sure rows is even for a symmetrical cross
        if (rows % 2 !== 0) rows++;
        
        // Calculate center rows and columns
        const centerRow1 = Math.floor(rows / 2) - 1;
        const centerRow2 = Math.floor(rows / 2);
        const centerCol1 = Math.floor(BRICK_COLS / 2) - 1;
        const centerCol2 = Math.floor(BRICK_COLS / 2);
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < BRICK_COLS; c++) {
                // Create cross pattern - horizontal or vertical center lines
                if (c === centerCol1 || c === centerCol2 || r === centerRow1 || r === centerRow2) {
                    // Determine brick type based on position
                    let type = (c === centerCol1 || c === centerCol2) && 
                              (r === centerRow1 || r === centerRow2) ? BRICK_TYPES.SPECIAL :
                              (c === centerCol1 || c === centerCol2) ? BRICK_TYPES.SUPER :
                              (r === centerRow1 || r === centerRow2) ? BRICK_TYPES.STRONG : BRICK_TYPES.NORMAL;
                    
                    // Create brick with adjusted health based on level
                    const brick = createBrick(r, c, type);
                    brick.hits = type.hits * healthMultiplier;
                    bricks.push(brick);
                }
            }
        }
    }
    
    function createSpiralPattern(rows = 9, healthMultiplier = 1) {
        // Ensure we have at least 5 rows for a proper spiral
        rows = Math.max(5, Math.min(rows, BRICK_ROWS));
        
        // Make sure rows is odd for a symmetrical spiral
        if (rows % 2 === 0) rows++;
        
        // Create a dynamic spiral pattern based on the number of rows
        const spiral = [];
        
        // Generate a spiral pattern that fits the number of rows
        for (let r = 0; r < rows; r++) {
            const row = [];
            for (let c = 0; c < BRICK_COLS; c++) {
                // Fill outer edge
                if (r === 0 || r === rows - 1 || c === 0 || c === BRICK_COLS - 1) {
                    row.push(1);
                } 
                // Fill inner spiral
                else if (r >= 2 && r < rows - 2 && c >= 2 && c < BRICK_COLS - 2 && 
                        (r === 2 || r === rows - 3 || c === 2 || c === BRICK_COLS - 3)) {
                    row.push(1);
                }
                // Fill center if enough rows
                else if (rows >= 7 && r === Math.floor(rows/2) && c === Math.floor(BRICK_COLS/2)) {
                    row.push(1);
                }
                // Empty spaces
                else {
                    row.push(0);
                }
            }
            spiral.push(row);
        }
        
        // Create bricks based on the spiral pattern
        for (let r = 0; r < spiral.length; r++) {
            for (let c = 0; c < spiral[r].length; c++) {
                if (spiral[r][c] === 1) {
                    // Determine brick type based on position in spiral
                    // Center bricks are special, outer bricks vary by position
                    let type;
                    
                    if (r === Math.floor(rows/2) && c === Math.floor(BRICK_COLS/2)) {
                        type = BRICK_TYPES.SPECIAL; // Center is special
                    } else if ((r + c) % 4 === 0) {
                        type = BRICK_TYPES.SPECIAL;
                    } else if ((r + c) % 3 === 0) {
                        type = BRICK_TYPES.SUPER;
                    } else if ((r + c) % 2 === 0) {
                        type = BRICK_TYPES.STRONG;
                    } else {
                        type = BRICK_TYPES.NORMAL;
                    }
                    
                    // Create brick with adjusted health based on level
                    const brick = createBrick(r, c, type);
                    brick.hits = type.hits * healthMultiplier;
                    bricks.push(brick);
                }
            }
        }
    }
    
    // Start game
    function startGame() {
        gameState = 'playing';
        
        // Set ball speed based on current level
        const levelConfig = LEVEL_CONFIG[level] || LEVEL_CONFIG[5];
        
        if (balls.length === 0) {
            initBalls();
        }
        
        balls.forEach(ball => {
            ball.speed = levelConfig.ballSpeed;
            ball.baseSpeed = levelConfig.ballSpeed;
            
            // Reset ball position and velocity
            ball.x = paddle.x + paddle.width / 2;
            ball.y = paddle.y - ball.radius - 5;
            
            // Set initial ball velocity with slight randomness
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
            ball.dx = Math.cos(angle) * ball.speed;
            ball.dy = Math.sin(angle) * ball.speed;
            
            ball.trail = [];
        });
        
        // Update UI
        updateStartScreen();
        updateControlButtons();
        
        if (!animationId) {
            gameLoop();
        }
    }
    
    function pauseGame() {
        gameState = 'paused';
        updateControlButtons();
    }
    
    function resumeGame() {
        gameState = 'playing';
        updateControlButtons();
    }
    
    function resetGame() {
        gameState = 'waiting';
        score = 0;
        lives = 3;
        level = 1;
        particles = [];
        powerUps = [];
        activePowerUps = [];
        obstacles = [];
        villains = [];
        projectiles = [];
        
        // Reset paddle
        paddle.x = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2;
        paddle.width = PADDLE_WIDTH;
        paddle.speed = paddle.baseSpeed;
        paddle.health = paddle.maxHealth;
        paddle.hasShield = false;
        paddle.hasLaser = false;
        
        // Reset balls
        initBalls();
        
        initBricks();
        initVillains();
        
        // Update UI
        updateStartScreen();
        updateControlButtons();
    }
    
    // Initialize villains based on level
    function initVillains() {
        villains = [];
        
        // Only add villains from level 3 onwards
        if (level < 3) return;
        
        const levelConfig = LEVEL_CONFIG[level] || LEVEL_CONFIG[5];
        const villainCount = levelConfig.villainCount;
        
        // Create villains at the top of the screen
        for (let i = 0; i < villainCount; i++) {
            const x = BRICK_OFFSET_LEFT + (CANVAS_WIDTH - BRICK_OFFSET_LEFT * 2) * (i + 1) / (villainCount + 1);
            const y = BRICK_OFFSET_TOP / 2;
            villains.push(createVillain(x - VILLAIN_WIDTH / 2, y));
        }
    }
    
    // Update game logic
    function update(deltaTime) {
        if (gameState !== 'playing') return;
        
        updatePaddle(deltaTime);
        updateBalls(deltaTime);
        updateVillains(deltaTime);
        updateProjectiles(deltaTime);
        updatePowerUps(deltaTime);
        updateParticles(deltaTime);
        updateActivePowerUps(deltaTime);
        

        
        // Update paddle damage flash effect
        if (paddle.damageFlash > 0) {
            paddle.damageFlash -= deltaTime / 300;
        }
        
        checkCollisions();
        checkWinCondition();
    }
    
    // Update villains
    function updateVillains(deltaTime) {
        const currentTime = Date.now();
        const levelConfig = LEVEL_CONFIG[level] || LEVEL_CONFIG[5];
        
        villains.forEach(villain => {
            if (!villain.active) return;
            
            // Move villain with fixed timestep
            villain.x += villain.dx;
            
            // Bounce off walls
            if (villain.x <= 0 || villain.x + villain.width >= CANVAS_WIDTH) {
                villain.dx = -villain.dx;
                villain.x = Math.max(0, Math.min(CANVAS_WIDTH - villain.width, villain.x));
            }
            
            // Shoot at paddle
            if (currentTime - villain.lastShot > villain.shootDelay) {
                // Aim at paddle
                const projectile = createProjectile(
                    villain.x + villain.width / 2,
                    villain.y + villain.height,
                    paddle.x + paddle.width / 2,
                    paddle.y,
                    false
                );
                
                projectiles.push(projectile);
                villain.lastShot = currentTime;
                villain.shootDelay = Math.max(1000, levelConfig.villainShootFrequency - (level * 50));
                
                // Create muzzle flash effect
                createVillainShootParticles(villain.x + villain.width / 2, villain.y + villain.height);
            }
        });
        
        // Remove defeated villains
        villains = villains.filter(villain => villain.active);
    }
    
    // Update projectiles
    function updateProjectiles(deltaTime) {
        projectiles.forEach(projectile => {
            if (!projectile.active) return;
            
            // Move projectile with fixed timestep
            projectile.x += projectile.dx;
            projectile.y += projectile.dy;
            
            // Remove if off screen
            if (projectile.y < 0 || projectile.y > CANVAS_HEIGHT || 
                projectile.x < 0 || projectile.x > CANVAS_WIDTH) {
                projectile.active = false;
                return;
            }
            
            // Check collision with paddle (only enemy projectiles)
            if (!projectile.isPlayerProjectile) {
                if (projectile.y + projectile.radius > paddle.y &&
                    projectile.y - projectile.radius < paddle.y + paddle.height &&
                    projectile.x + projectile.radius > paddle.x &&
                    projectile.x - projectile.radius < paddle.x + paddle.width) {
                    
                    projectile.active = false;
                    
                    // If paddle has shield, don't take damage
                    if (paddle.hasShield) {
                        createImpactParticles(projectile.x, projectile.y, '#e1b12c');
                        return;
                    }
                    
                    // Damage paddle
                    paddle.health -= 20;
                    paddle.damageFlash = 1.0;
                    paddle.width = Math.max(PADDLE_WIDTH * 0.5, paddle.width * 0.9);
                    
                    createImpactParticles(projectile.x, projectile.y, '#ff3838');
                    
                    // Check if paddle is destroyed
                    if (paddle.health <= 0) {
                        lives--;
                        paddle.health = paddle.maxHealth;
                        paddle.width = PADDLE_WIDTH;
                        
                        if (lives <= 0) {
                            gameState = 'gameOver';
                            // Play game over sound
                            playSound('gameOver');
                        } else {
                            resetBallPosition();
                        }
                    }
                }
            } else {
                // Player projectiles hit villains
                villains.forEach(villain => {
                    if (!villain.active) return;
                    
                    if (projectile.y + projectile.radius > villain.y &&
                        projectile.y - projectile.radius < villain.y + villain.height &&
                        projectile.x + projectile.radius > villain.x &&
                        projectile.x - projectile.radius < villain.x + villain.width) {
                        
                        projectile.active = false;
                        villain.health--;
                        
                        createImpactParticles(projectile.x, projectile.y, '#00e4ff');
                        
                        if (villain.health <= 0) {
                            villain.active = false;
                            score += BRICK_TYPES.VILLAIN.points;
                            createVillainDestroyParticles(villain);
                            
                            // Chance to drop power-up
                            if (Math.random() < BRICK_TYPES.VILLAIN.powerUpChance) {
                                createPowerUp(villain.x + villain.width / 2, villain.y + villain.height / 2);
                            }
                        }
                    }
                });
            }
        });
        
        // Remove inactive projectiles
        projectiles = projectiles.filter(projectile => projectile.active);
    }
    

    
    // Track control mode
    let controlMode = 'none'; // 'keyboard', 'mouse', 'none'
    let lastMouseTime = 0;
    let lastKeyboardTime = 0;
    
    function updatePaddle(deltaTime) {
        const currentTime = Date.now();
        let keyboardActive = keys['ArrowLeft'] || keys['KeyA'] || keys['ArrowRight'] || keys['KeyD'];
        
        // Update control mode based on recent input
        if (keyboardActive) {
            controlMode = 'keyboard';
            lastKeyboardTime = currentTime;
        } else if (currentTime - lastMouseTime < 100 || currentTime - lastTouchTime < 100) { // Mouse/touch was active recently
            controlMode = 'mouse';
        } else if (currentTime - lastKeyboardTime > 500) { // No keyboard input for 500ms
            controlMode = 'none';
        }
        
        // Keyboard control - direct and responsive
        if (keys['ArrowLeft'] || keys['KeyA']) {
            paddle.x -= paddle.speed;
            controlMode = 'keyboard';
        } else if (keys['ArrowRight'] || keys['KeyD']) {
            paddle.x += paddle.speed;
            controlMode = 'keyboard';
        }
        
        // Mouse control - only when mouse is the active control method
        if (controlMode === 'mouse' && mouseX >= 0 && mouseX <= CANVAS_WIDTH) {
            paddle.x = mouseX - paddle.width / 2;
        }
        
        // Keep paddle within bounds - ensure it can reach the edges
        paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - paddle.width, paddle.x));
    }
    
    function updateBalls(deltaTime) {
        for (let i = balls.length - 1; i >= 0; i--) {
            const ball = balls[i];
            
            // Update ball trail
            ball.trail.unshift({ x: ball.x, y: ball.y });
            if (ball.trail.length > ball.trailLength) {
                ball.trail.pop();
            }
            
            // Update spinning
            ball.spinning += ball.spinSpeed;
            
            // Move ball with fixed timestep (deltaTime is now always 16.67ms)
            ball.x += ball.dx;
            ball.y += ball.dy;
            
            // Wall collisions
            if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= CANVAS_WIDTH) {
                ball.dx = -ball.dx;
                ball.x = Math.max(ball.radius, Math.min(CANVAS_WIDTH - ball.radius, ball.x));
                createImpactParticles(ball.x, ball.y, '#4ecdc4');
            }
            
            if (ball.y - ball.radius <= 0) {
                ball.dy = -ball.dy;
                ball.y = ball.radius;
                createImpactParticles(ball.x, ball.y, '#4ecdc4');
            }
            
            // Bottom boundary (lose ball)
            if (ball.y - ball.radius > CANVAS_HEIGHT) {
                balls.splice(i, 1);
                
                // If no balls left, lose life
                if (balls.length === 0) {
                    lives--;
                    if (lives <= 0) {
                        gameState = 'gameOver';
                        // Play game over sound
                        playSound('gameOver');
                    } else {
                        resetBallPosition();
                    }
                }
            }
        }
    }
    
    function updatePowerUps(deltaTime) {
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const powerUp = powerUps[i];
            powerUp.y += powerUp.speed;
            powerUp.rotation += powerUp.rotationSpeed;
            
            // Remove if off screen
            if (powerUp.y > CANVAS_HEIGHT) {
                powerUps.splice(i, 1);
                continue;
            }
            
            // Check collision with paddle
            if (powerUp.y + powerUp.size > paddle.y &&
                powerUp.y < paddle.y + paddle.height &&
                powerUp.x + powerUp.size > paddle.x &&
                powerUp.x < paddle.x + paddle.width) {
                
                activatePowerUp(powerUp.type);
                powerUps.splice(i, 1);
                createPowerUpParticles(powerUp.x, powerUp.y, powerUp.type.color);
            }
        }
    }
    
    function updateParticles(deltaTime) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.dy += particle.gravity;
            particle.life -= deltaTime;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }
    
    function updateActivePowerUps(deltaTime) {
        for (let i = activePowerUps.length - 1; i >= 0; i--) {
            const powerUp = activePowerUps[i];
            powerUp.timeLeft -= deltaTime;
            
            if (powerUp.timeLeft <= 0) {
                deactivatePowerUp(powerUp);
                activePowerUps.splice(i, 1);
            }
        }
    }
    
    function checkCollisions() {
        balls.forEach(ball => {
            // Ball-paddle collision with advanced physics
            if (ball.y + ball.radius > paddle.y &&
                ball.y - ball.radius < paddle.y + paddle.height &&
                ball.x + ball.radius > paddle.x &&
                ball.x - ball.radius < paddle.x + paddle.width) {
                
                // Calculate hit position on paddle (-1 to 1)
                const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
                
                // Adjust angle based on hit position
                const angle = hitPos * Math.PI / 3; // Max 60 degrees
                const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                
                ball.dx = Math.sin(angle) * speed;
                ball.dy = -Math.abs(Math.cos(angle) * speed);
                
                // Add paddle velocity to ball
                ball.dx += paddle.dx * 0.2;
                
                // Ensure ball is above paddle
                ball.y = paddle.y - ball.radius;
                
                // Play paddle hit sound
                playSound('paddle');
                
                // Create visual effect
                createImpactParticles(ball.x, ball.y, paddle.color);
            }
            
            // Ball-brick collisions
            for (let i = 0; i < bricks.length; i++) {
                const brick = bricks[i];
                if (!brick.visible) continue;
                
                if (ball.x + ball.radius > brick.x &&
                    ball.x - ball.radius < brick.x + brick.width &&
                    ball.y + ball.radius > brick.y &&
                    ball.y - ball.radius < brick.y + brick.height) {
                    
                    // Determine collision side
                    const overlapLeft = (ball.x + ball.radius) - brick.x;
                    const overlapRight = (brick.x + brick.width) - (ball.x - ball.radius);
                    const overlapTop = (ball.y + ball.radius) - brick.y;
                    const overlapBottom = (brick.y + brick.height) - (ball.y - ball.radius);
                    
                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                    
                    if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                        ball.dx = -ball.dx;
                    } else {
                        ball.dy = -ball.dy;
                    }
                    
                    // Hit brick
                    if (brick.hits > 0) {
                        brick.hits--;
                        if (brick.hits === 0) {
                            brick.visible = false;
                            score += brick.type.points;
                            
                            // Play brick destroy sound
                            playSound('brick');
                            
                            // Create power-up chance
                            if (Math.random() < brick.type.powerUpChance) {
                                createPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
                            }
                            
                            createBrickDestroyParticles(brick);
                        } else {
                            // Brick damaged but not destroyed
                            brick.glowIntensity = 1;
                            createImpactParticles(ball.x, ball.y, brick.type.color);
                            
                            // Play brick hit sound (different pitch)
                            playSound('brick');
                        }
                    }
                    
                    break;
                }
            }
            
            // Ball-obstacle collisions
            obstacles.forEach(obstacle => {
                if (ball.x + ball.radius > obstacle.x &&
                    ball.x - ball.radius < obstacle.x + obstacle.width &&
                    ball.y + ball.radius > obstacle.y &&
                    ball.y - ball.radius < obstacle.y + obstacle.height) {
                    
                    // Determine collision side
                    const overlapLeft = (ball.x + ball.radius) - obstacle.x;
                    const overlapRight = (obstacle.x + obstacle.width) - (ball.x - ball.radius);
                    const overlapTop = (ball.y + ball.radius) - obstacle.y;
                    const overlapBottom = (obstacle.y + obstacle.height) - (ball.y - ball.radius);
                    
                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                    
                    if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                        ball.dx = -ball.dx;
                    } else {
                        ball.dy = -ball.dy;
                    }
                    
                    obstacle.glow = 1;
                    createImpactParticles(ball.x, ball.y, obstacle.color);
                }
            });
        });
    }
    
    function checkWinCondition() {
        const breakableBricks = bricks.filter(brick => brick.visible && brick.hits > 0);
        if (breakableBricks.length === 0) {
            level++;
            // Play level up sound
            playSound('levelUp');
            
            if (level > 5) {
                gameState = 'won';
                // Play victory sound
                playSound('complete');
            } else {
                // Next level - gradual speed increase
                const levelConfig = LEVEL_CONFIG[level] || LEVEL_CONFIG[5];
                
                // Update all balls with new speed
                balls.forEach(ball => {
                    ball.speed = levelConfig.ballSpeed;
                    ball.baseSpeed = levelConfig.ballSpeed;
                    
                    // Add small bonus speed based on current game progress
                    const progressBonus = (level - 1) * 0.1;
                    ball.speed = Math.min(ball.maxSpeed, ball.speed + progressBonus);
                });
                
                initBricks();
                createRandomObstacles();
                resetBallPosition();
                
                // Show level up message
                createLevelUpParticles();
                
                // Remove brick colors effect
                animateBrickColorRemoval();
            }
        }
    }
    
    function resetBallPosition() {
        gameState = 'waiting';
        initBalls();
    }
    
    // Power-up system
    function createPowerUp(x, y) {
        const types = Object.values(POWER_UP_TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        
        powerUps.push({
            x: x - 10,
            y: y,
            size: 20,
            type: type,
            speed: 2,
            rotation: 0,
            rotationSpeed: 0.1
        });
    }
    
    function activatePowerUp(type) {
        // Play power-up sound
        playSound('powerup');
        
        switch (type.effect) {
            case 'expandPaddle':
                // Store original width if not already stored
                if (!paddle.originalWidth) {
                    paddle.originalWidth = PADDLE_WIDTH;
                }
                
                // Expand paddle by 75% of original width, with a maximum cap
                const expandedWidth = Math.min(paddle.originalWidth * 1.75, CANVAS_WIDTH * 0.4);
                paddle.width = expandedWidth;
                
                // Visual feedback
                createPowerUpParticles(paddle.x + paddle.width/2, paddle.y, paddle.color);
                
                // Add to active power-ups
                activePowerUps.push({ type: type, timeLeft: type.duration });
                console.log('Paddle expanded to width:', paddle.width);
                break;
                
            case 'multiBall':
                // Create 2 additional balls
                if (balls.length > 0) {
                    const mainBall = balls[0];
                    for (let i = 0; i < 2; i++) {
                        const angle = (Math.PI / 4) * (i === 0 ? -1 : 1);
                        const newBall = createBall(
                            mainBall.x,
                            mainBall.y,
                            Math.cos(angle) * mainBall.speed,
                            Math.sin(angle) * mainBall.speed
                        );
                        newBall.speed = mainBall.speed;
                        newBall.baseSpeed = mainBall.baseSpeed;
                        newBall.power = mainBall.power; // Copy power level
                        balls.push(newBall);
                    }
                }
                break;
                
            case 'slowBall':
                balls.forEach(ball => {
                    ball.speed *= 0.7;
                    const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                    const ratio = ball.speed / currentSpeed;
                    ball.dx *= ratio;
                    ball.dy *= ratio;
                });
                activePowerUps.push({ type: type, timeLeft: type.duration });
                break;
                
            case 'extraLife':
                // Limit maximum lives to 3
                if (lives < 3) {
                    lives++;
                    // Play extra life sound
                    playSound('powerup');
                    // Visual feedback
                    createPowerUpParticles(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, type.color);
                } else {
                    // Give points instead if already at max lives
                    score += 500;
                    // Play score bonus sound
                    playSound('levelUp');
                    // Show score bonus
                    const bonusText = document.createElement('div');
                    bonusText.className = 'bonus-text';
                    bonusText.textContent = '+500 POINTS (MAX LIVES: 3)';
                    bonusText.style.position = 'absolute';
                    bonusText.style.left = '50%';
                    bonusText.style.top = '50%';
                    bonusText.style.transform = 'translate(-50%, -50%)';
                    bonusText.style.color = type.color;
                    bonusText.style.fontSize = '24px';
                    bonusText.style.fontWeight = 'bold';
                    bonusText.style.textShadow = '0 0 10px rgba(255,255,255,0.8)';
                    bonusText.style.zIndex = '100';
                    document.querySelector('#tetris-game-container').appendChild(bonusText);
                    
                    // Remove after animation
                    setTimeout(() => {
                        if (bonusText.parentNode) {
                            bonusText.parentNode.removeChild(bonusText);
                        }
                    }, 2000);
                }
                break;
                
            case 'fastPaddle':
                paddle.speed = paddle.baseSpeed * 2;
                activePowerUps.push({ type: type, timeLeft: type.duration });
                break;
                
            case 'shield':
                paddle.hasShield = true;
                paddle.health = paddle.maxHealth; // Restore health
                activePowerUps.push({ type: type, timeLeft: type.duration });
                // Create shield activation effect
                createShieldActivationParticles();
                break;
                

        }
    }
    
    function deactivatePowerUp(powerUp) {
        switch (powerUp.type.effect) {
            case 'expandPaddle':
                // Restore original paddle width
                paddle.width = paddle.originalWidth || PADDLE_WIDTH;
                console.log('Paddle width restored to:', paddle.width);
                break;
                
            case 'slowBall':
                balls.forEach(ball => {
                    ball.speed = ball.baseSpeed;
                    const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                    const ratio = ball.speed / currentSpeed;
                    ball.dx *= ratio;
                    ball.dy *= ratio;
                });
                break;
                
            case 'fastPaddle':
                paddle.speed = paddle.baseSpeed;
                break;
                
            case 'shield':
                paddle.hasShield = false;
                // Create shield deactivation effect
                createShieldDeactivationParticles();
                break;
                

        }
        
        // Play sound when power-up expires
        playSound('mismatch');
    }
    
    // Particle system
    function createImpactParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 8,
                dy: (Math.random() - 0.5) * 8,
                gravity: 0.2,
                life: 500,
                maxLife: 500,
                alpha: 1,
                color: color,
                size: Math.random() * 3 + 1
            });
        }
    }
    
    function createBrickDestroyParticles(brick) {
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: brick.x + Math.random() * brick.width,
                y: brick.y + Math.random() * brick.height,
                dx: (Math.random() - 0.5) * 10,
                dy: (Math.random() - 0.5) * 10,
                gravity: 0.3,
                life: 1000,
                maxLife: 1000,
                alpha: 1,
                color: brick.type.color,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    function createPowerUpParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 6,
                dy: (Math.random() - 0.5) * 6,
                gravity: 0.1,
                life: 800,
                maxLife: 800,
                alpha: 1,
                color: color,
                size: Math.random() * 3 + 2
            });
        }
    }
    
    function createLevelUpParticles() {
        // Create celebratory particles across the screen
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT * 0.5,
                dx: (Math.random() - 0.5) * 8,
                dy: (Math.random() - 0.5) * 8,
                gravity: 0.2,
                life: 1500,
                maxLife: 1500,
                alpha: 1,
                color: ['#00a8ff', '#0097e6', '#00e4ff', '#7d5fff'][Math.floor(Math.random() * 4)],
                size: Math.random() * 5 + 3
            });
        }
    }
    
    function createVillainShootParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 3,
                dy: (Math.random() * 2) + 1,
                gravity: 0.1,
                life: 400,
                maxLife: 400,
                alpha: 1,
                color: '#ff3838',
                size: Math.random() * 3 + 1
            });
        }
    }
    
    function createVillainDestroyParticles(villain) {
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: villain.x + Math.random() * villain.width,
                y: villain.y + Math.random() * villain.height,
                dx: (Math.random() - 0.5) * 12,
                dy: (Math.random() - 0.5) * 12,
                gravity: 0.3,
                life: 1200,
                maxLife: 1200,
                alpha: 1,
                color: villain.color,
                size: Math.random() * 5 + 3
            });
        }
    }
    

    
    function createShieldActivationParticles() {
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const distance = paddle.width / 2 + 10;
            
            particles.push({
                x: paddle.x + paddle.width / 2 + Math.cos(angle) * distance,
                y: paddle.y + paddle.height / 2 + Math.sin(angle) * distance,
                dx: Math.cos(angle) * 2,
                dy: Math.sin(angle) * 2,
                gravity: 0,
                life: 800,
                maxLife: 800,
                alpha: 1,
                color: '#e1b12c',
                size: Math.random() * 3 + 2
            });
        }
    }
    
    function createShieldDeactivationParticles() {
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            const distance = paddle.width / 2;
            
            particles.push({
                x: paddle.x + paddle.width / 2 + Math.cos(angle) * distance,
                y: paddle.y + paddle.height / 2 + Math.sin(angle) * distance,
                dx: Math.cos(angle) * 4,
                dy: Math.sin(angle) * 4,
                gravity: 0.1,
                life: 600,
                maxLife: 600,
                alpha: 1,
                color: '#e1b12c',
                size: Math.random() * 2 + 1
            });
        }
    }
    

    

    
    function createRandomObstacles() {
        obstacles = [];
        if (level >= 3) { // Start adding obstacles from level 3
            const numObstacles = Math.min(level - 2, 3); // Max 3 obstacles
            
            for (let i = 0; i < numObstacles; i++) {
                let obstacle;
                do {
                    obstacle = {
                        x: Math.random() * (CANVAS_WIDTH - 60) + 30,
                        y: Math.random() * (CANVAS_HEIGHT * 0.4) + CANVAS_HEIGHT * 0.3,
                        width: 40,
                        height: 20,
                        color: '#ffe66d',
                        alpha: 1,
                        glow: 0
                    };
                } while (isObstacleOverlapping(obstacle));
                
                obstacles.push(obstacle);
            }
        }
    }
    
    function isObstacleOverlapping(newObstacle) {
        // Check overlap with bricks
        for (let brick of bricks) {
            if (brick.visible &&
                newObstacle.x < brick.x + brick.width &&
                newObstacle.x + newObstacle.width > brick.x &&
                newObstacle.y < brick.y + brick.height &&
                newObstacle.y + newObstacle.height > brick.y) {
                return true;
            }
        }
        
        // Check overlap with other obstacles
        for (let obstacle of obstacles) {
            if (newObstacle.x < obstacle.x + obstacle.width &&
                newObstacle.x + newObstacle.width > obstacle.x &&
                newObstacle.y < obstacle.y + obstacle.height &&
                newObstacle.y + newObstacle.height > obstacle.y) {
                return true;
            }
        }
        
        return false;
    }
    
    function animateBrickColorRemoval() {
        // Animate all bricks losing their color temporarily
        bricks.forEach(brick => {
            if (brick.visible) {
                brick.colorFade = 1;
                brick.originalColor = brick.type.color;
            }
        });
    }
    
    // Render game
    function render() {
        // Clear canvas with website theme background
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#0c0c14'); // Website bg-color
        gradient.addColorStop(0.5, '#131326'); // Website bg-color-light
        gradient.addColorStop(1, '#0c0c14'); // Website bg-color
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Add subtle grid pattern
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        const gridSize = 20;
        for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }
        ctx.restore();
        
        // Draw bricks
        drawBricks();
        
        // Draw obstacles
        drawObstacles();
        
        // Draw villains
        drawVillains();
        
        // Draw projectiles
        drawProjectiles();
        
        // Draw paddle
        drawPaddle();
        
        // Draw paddle shield if active
        if (paddle.hasShield) {
            drawPaddleShield();
        }
        
        // Draw balls
        drawBalls();
        
        // Draw power-ups
        drawPowerUps();
        
        // Draw particles
        drawParticles();
        
        // Draw UI
        drawUI();
        
        // Draw game state messages
        drawGameStateMessages();
    }
    
    // Draw villains
    function drawVillains() {
        villains.forEach(villain => {
            if (!villain.active) return;
            
            ctx.save();
            
            // Villain glow effect
            ctx.shadowColor = villain.color;
            ctx.shadowBlur = 15;
            
            // Villain gradient
            const gradient = ctx.createLinearGradient(villain.x, villain.y, villain.x, villain.y + villain.height);
            gradient.addColorStop(0, adjustBrightness(villain.color, 30));
            gradient.addColorStop(0.5, villain.color);
            gradient.addColorStop(1, adjustBrightness(villain.color, -30));
            
            ctx.fillStyle = gradient;
            ctx.fillRect(villain.x, villain.y, villain.width, villain.height);
            
            // Villain border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(villain.x, villain.y, villain.width, villain.height);
            
            // Draw villain face
            ctx.fillStyle = '#ffffff';
            
            // Eyes
            const eyeSize = villain.width / 6;
            const eyeY = villain.y + villain.height * 0.3;
            
            ctx.beginPath();
            ctx.arc(villain.x + villain.width * 0.3, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(villain.x + villain.width * 0.7, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Evil pupils
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(villain.x + villain.width * 0.3, eyeY, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(villain.x + villain.width * 0.7, eyeY, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Evil mouth
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(villain.x + villain.width * 0.3, villain.y + villain.height * 0.7);
            ctx.lineTo(villain.x + villain.width * 0.5, villain.y + villain.height * 0.8);
            ctx.lineTo(villain.x + villain.width * 0.7, villain.y + villain.height * 0.7);
            ctx.stroke();
            
            ctx.restore();
        });
    }
    
    // Draw projectiles
    function drawProjectiles() {
        projectiles.forEach(projectile => {
            if (!projectile.active) return;
            
            ctx.save();
            
            // Projectile glow
            ctx.shadowColor = projectile.color;
            ctx.shadowBlur = 15;
            
            // Draw projectile
            ctx.fillStyle = projectile.color;
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add trail effect
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(projectile.x - projectile.dx * 0.5, projectile.y - projectile.dy * 0.5, 
                    projectile.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(projectile.x - projectile.dx, projectile.y - projectile.dy, 
                    projectile.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    // Draw paddle shield
    function drawPaddleShield() {
        ctx.save();
        
        // Shield glow
        ctx.shadowColor = '#e1b12c';
        ctx.shadowBlur = 15;
        
        // Draw shield arc
        ctx.strokeStyle = '#e1b12c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(paddle.x + paddle.width / 2, paddle.y + paddle.height / 2, 
                paddle.width / 2 + 10, 0, Math.PI * 2);
        ctx.stroke();
        
        // Add shield particles
        if (Math.random() < 0.2) {
            const angle = Math.random() * Math.PI * 2;
            const distance = paddle.width / 2 + 10;
            
            particles.push({
                x: paddle.x + paddle.width / 2 + Math.cos(angle) * distance,
                y: paddle.y + paddle.height / 2 + Math.sin(angle) * distance,
                dx: Math.cos(angle) * 1,
                dy: Math.sin(angle) * 1,
                gravity: 0,
                life: 400,
                maxLife: 400,
                alpha: 0.7,
                color: '#e1b12c',
                size: Math.random() * 2 + 1
            });
        }
        
        ctx.restore();
    }
    
    function drawBricks() {
        bricks.forEach(brick => {
            if (!brick.visible) return;
            
            // Animate damaged bricks
            if (brick.glowIntensity > 0) {
                brick.glowIntensity -= 0.05;
            }
            
            // Animate color fade effect
            if (brick.colorFade !== undefined) {
                brick.colorFade -= 0.02;
                if (brick.colorFade <= 0) {
                    delete brick.colorFade;
                    delete brick.originalColor;
                }
            }
            
            ctx.save();
            
            // Determine current color (with fade effect)
            let currentColor = brick.type.color;
            if (brick.colorFade !== undefined) {
                const fadeAmount = Math.max(0, brick.colorFade);
                currentColor = interpolateColor('#ffffff', brick.originalColor, 1 - fadeAmount);
            }
            
            // Snake game style glow effect
            ctx.shadowColor = currentColor;
            ctx.shadowBlur = 10 + (brick.glowIntensity * 15);
            
            // Snake game style gradient
            const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
            gradient.addColorStop(0, adjustBrightness(currentColor, 30));
            gradient.addColorStop(0.5, currentColor);
            gradient.addColorStop(1, adjustBrightness(currentColor, -30));
            
            ctx.fillStyle = gradient;
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            
            // Neon border - double border effect
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
            
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(brick.x + 1, brick.y + 1, brick.width - 2, brick.height - 2);
            
            // Hit indicator with neon effect
            if (brick.hits > 1) {
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(brick.hits.toString(), brick.x + brick.width / 2, brick.y + brick.height / 2 + 4);
            }
            
            ctx.restore();
        });
    }
    
    function drawPaddle() {
        ctx.save();
        
        // Website theme style glow effect
        ctx.shadowColor = paddle.color;
        ctx.shadowBlur = 15;
        
        // Draw paddle with website theme gradient
        let paddleColor = paddle.color;
        
        // Flash red when damaged
        if (paddle.damageFlash > 0) {
            paddleColor = interpolateColor('#ff3838', paddle.color, 1 - paddle.damageFlash);
        }
        
        const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
        gradient.addColorStop(0, adjustBrightness(paddleColor, 20));
        gradient.addColorStop(0.5, paddleColor);
        gradient.addColorStop(1, adjustBrightness(paddleColor, -30));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        
        // Draw neon border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
        
        // Inner glow
        ctx.strokeStyle = paddleColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(paddle.x + 1, paddle.y + 1, paddle.width - 2, paddle.height - 2);
        
        // Draw health bar
        const healthBarWidth = paddle.width * 0.8;
        const healthBarHeight = 4;
        const healthBarX = paddle.x + (paddle.width - healthBarWidth) / 2;
        const healthBarY = paddle.y + paddle.height + 5;
        
        // Health bar background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // Health bar fill
        const healthPercent = paddle.health / paddle.maxHealth;
        let healthColor = '#00a8ff'; // Default blue
        
        if (healthPercent < 0.3) {
            healthColor = '#ff3838'; // Red when low health
        } else if (healthPercent < 0.6) {
            healthColor = '#e1b12c'; // Yellow when medium health
        }
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
        

        
        ctx.restore();
    }
    
    function drawBalls() {
        balls.forEach(ball => {
            ctx.save();
            
            // Draw ball trail
            ball.trail.forEach((point, index) => {
                const alpha = (ball.trail.length - index) / ball.trail.length * 0.6;
                const radius = ball.radius * alpha;
                
                ctx.globalAlpha = alpha;
                ctx.shadowColor = ball.color;
                ctx.shadowBlur = 10;
                ctx.fillStyle = ball.color;
                ctx.beginPath();
                ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.globalAlpha = 1;
            
            // Draw main ball with snake game style glow
            ctx.shadowColor = ball.color;
            ctx.shadowBlur = 20;
            
            const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius);
            gradient.addColorStop(0, adjustBrightness(ball.color, 40));
            gradient.addColorStop(0.4, ball.color);
            gradient.addColorStop(1, adjustBrightness(ball.color, -40));
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw spinning effect
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius * 0.6, ball.spinning, ball.spinning + Math.PI);
            ctx.stroke();
            
            ctx.restore();
        });
    }
    
    function drawPowerUps() {
        powerUps.forEach(powerUp => {
            ctx.save();
            
            ctx.translate(powerUp.x + powerUp.size / 2, powerUp.y + powerUp.size / 2);
            ctx.rotate(powerUp.rotation);
            
            // Glow effect
            ctx.shadowColor = powerUp.type.color;
            ctx.shadowBlur = 15;
            
            ctx.fillStyle = powerUp.type.color;
            ctx.fillRect(-powerUp.size / 2, -powerUp.size / 2, powerUp.size, powerUp.size);
            
            // Draw icon or letter
            ctx.fillStyle = '#000000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(powerUp.type.effect[0].toUpperCase(), 0, 4);
            
            ctx.restore();
        });
    }
    
    function drawParticles() {
        particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
    
    function drawObstacles() {
        obstacles.forEach(obstacle => {
            // Animate glow
            if (obstacle.glow > 0) {
                obstacle.glow -= 0.05;
            }
            
            ctx.save();
            
            // Neon glow effect
            ctx.shadowColor = obstacle.color;
            ctx.shadowBlur = 20 + (obstacle.glow * 30);
            
            // Neon gradient
            const gradient = ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x, obstacle.y + obstacle.height);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.3, obstacle.color);
            gradient.addColorStop(1, adjustBrightness(obstacle.color, -50));
            
            ctx.fillStyle = gradient;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Neon border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            ctx.strokeStyle = obstacle.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(obstacle.x + 1, obstacle.y + 1, obstacle.width - 2, obstacle.height - 2);
            
            ctx.restore();
        });
    }
    
    function adjustBrightness(color, amount) {
        const usePound = color[0] === '#';
        const col = usePound ? color.slice(1) : color;
        const num = parseInt(col, 16);
        let r = (num >> 16) + amount;
        let g = (num >> 8 & 0x00FF) + amount;
        let b = (num & 0x0000FF) + amount;
        r = r > 255 ? 255 : r < 0 ? 0 : r;
        g = g > 255 ? 255 : g < 0 ? 0 : g;
        b = b > 255 ? 255 : b < 0 ? 0 : b;
        return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
    }
    
    function interpolateColor(color1, color2, factor) {
        const c1 = parseInt(color1.slice(1), 16);
        const c2 = parseInt(color2.slice(1), 16);
        
        const r1 = (c1 >> 16) & 255;
        const g1 = (c1 >> 8) & 255;
        const b1 = c1 & 255;
        
        const r2 = (c2 >> 16) & 255;
        const g2 = (c2 >> 8) & 255;
        const b2 = c2 & 255;
        
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);
        
        return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    }
    
    function drawUI() {
        // Update HTML scoreboard elements
        const scoreElement = document.getElementById('brick-score');
        const levelElement = document.getElementById('brick-level');
        const livesElement = document.getElementById('brick-lives');
        const highScoreElement = document.getElementById('brick-high-score');
        
        if (scoreElement) scoreElement.textContent = score;
        if (levelElement) levelElement.textContent = level;
        if (livesElement) livesElement.textContent = lives;
        if (highScoreElement) {
            const currentHighScore = parseInt(localStorage.getItem('brickBreakerHighScore') || '0');
            if (score > currentHighScore) {
                localStorage.setItem('brickBreakerHighScore', score.toString());
                highScoreElement.textContent = score;
            } else {
                highScoreElement.textContent = currentHighScore;
            }
        }
        
        // Draw active power-ups on canvas
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        
        let powerUpY = 20;
        activePowerUps.forEach(powerUp => {
            ctx.fillStyle = powerUp.type.color;
            ctx.fillText(`${powerUp.type.effect}: ${Math.ceil(powerUp.timeLeft / 1000)}s`, CANVAS_WIDTH - 150, powerUpY);
            powerUpY += 20;
        });
        
        // Ball count indicator
        if (balls.length > 1) {
            ctx.fillStyle = '#ffe66d';
            ctx.font = '16px Arial';
            ctx.textAlign = 'right';
            ctx.shadowColor = '#ffe66d';
            ctx.shadowBlur = 10;
            ctx.fillText(`Balls: ${balls.length}`, CANVAS_WIDTH - 20, 30);
        }
        
        ctx.restore();
    }
    
    function drawGameStateMessages() {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        
        if (gameState === 'waiting') {
            ctx.font = '24px Arial';
            if (level === 1 && score === 0) {
                ctx.fillText('Click or Press SPACE to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
                ctx.font = '16px Arial';
                ctx.fillText('Use mouse or arrow keys to move paddle', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
            } else {
                ctx.fillText(`Level ${level} - Ready?`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
                ctx.font = '16px Arial';
                ctx.fillText('Click or Press SPACE to Continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
            }
        } else if (gameState === 'paused') {
            ctx.font = '32px Arial';
            ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            ctx.font = '16px Arial';
            ctx.fillText('Press SPACE or ▶️ button to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        } else if (gameState === 'gameOver') {
            ctx.font = '32px Arial';
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            ctx.fillStyle = '#ffffff';
            ctx.font = '20px Arial';
            ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
            ctx.font = '16px Arial';
            ctx.fillText('Click or Press SPACE to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
        } else if (gameState === 'won') {
            ctx.font = '32px Arial';
            ctx.fillStyle = '#4ecdc4';
            ctx.fillText('YOU WON!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            ctx.fillStyle = '#ffffff';
            ctx.font = '20px Arial';
            ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
            ctx.font = '16px Arial';
            ctx.fillText('Click or Press SPACE to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
        }
        
        ctx.restore();
    }
    
    // Utility functions
    function adjustBrightness(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // Game loop with consistent frame rate
    const TARGET_FPS = 60;
    const FRAME_TIME = 1000 / TARGET_FPS; // 16.67ms per frame
    let accumulator = 0;
    
    function gameLoop(currentTime = 0) {
        // Initialize lastTime on first frame
        if (lastTime === 0) {
            lastTime = currentTime;
        }
        
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        // Cap deltaTime to prevent spiral of death
        const cappedDeltaTime = Math.min(deltaTime, 250); // Cap at 250ms (4fps minimum)
        
        accumulator += cappedDeltaTime;
        
        // Fixed timestep updates
        while (accumulator >= FRAME_TIME) {
            update(FRAME_TIME);
            accumulator -= FRAME_TIME;
        }
        
        render();
        animationId = requestAnimationFrame(gameLoop);
    }
    
    // Initialize game
    initBalls();
    initBricks();
    initVillains();
    
    // Initialize UI state
    setTimeout(() => {
        updateStartScreen();
        updateControlButtons();
    }, 100);
    
    // Initialize high score display
    const highScoreElement = document.getElementById('brick-high-score');
    if (highScoreElement) {
        const savedHighScore = localStorage.getItem('brickBreakerHighScore') || '0';
        highScoreElement.textContent = savedHighScore;
    }
    
    render();
    
    // Cleanup function
    return function cleanup() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('click', handleClick);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
    };
}

function initNumberPuzzle() {
    // Number puzzle implementation would go here
    console.log('Number Puzzle initialized');
}

function initWordScramble() {
    // Word scramble implementation would go here
    console.log('Word Scramble initialized');
}

function initPatternMemory() {
    // Pattern memory implementation would go here
    console.log('Pattern Memory initialized');
}

function initMinesweeper() {
    // Chess game was removed - function kept as stub to prevent errors
    console.log('Chess game has been removed from the portfolio');
}
