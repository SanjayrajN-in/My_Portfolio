/**
 * Instant High Score System - Immediate, reliable high score display
 * Fixes the "0 high score" issue by ensuring cached scores are ALWAYS shown immediately
 */

// Immediate high score cache - loads synchronously
const HighScoreCache = {
    // Game mappings
    games: {
        'snake': 'snake-high-score',
        'brickBreaker': 'brick-high-score', 
        'memoryMatch': 'memory-high-score'
    },

    // Get best available high score immediately (synchronous)
    getScore: function(gameName) {
        const isLoggedIn = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
        
        if (isLoggedIn) {
            // Try server cache first
            const serverScore = localStorage.getItem(`${gameName}ServerHighScore`);
            if (serverScore && !isNaN(serverScore) && parseInt(serverScore) > 0) {
                return parseInt(serverScore);
            }
        }
        
        // Fallback to local high score
        const localScore = localStorage.getItem(`${gameName}HighScore`);
        if (localScore && !isNaN(localScore)) {
            return parseInt(localScore);
        }
        
        return 0;
    },

    // Update high score in cache and display (synchronous)
    updateScore: function(gameName, newScore) {
        const currentScore = this.getScore(gameName);
        
        if (newScore > currentScore) {
            const isLoggedIn = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
            
            if (isLoggedIn) {
                localStorage.setItem(`${gameName}ServerHighScore`, newScore.toString());
                localStorage.setItem(`${gameName}ServerHighScoreTimestamp`, Date.now().toString());
            } else {
                localStorage.setItem(`${gameName}HighScore`, newScore.toString());
            }
            
            this.displayScore(gameName, newScore);
            return true; // New high score
        }
        
        return false; // Not a new high score
    },

    // Display score immediately (synchronous)
    displayScore: function(gameName, score) {
        const elementId = this.games[gameName];
        const element = document.getElementById(elementId);
        
        if (element) {
            element.textContent = score;
        }
    },

    // Get display score for game UI (never less than cached)
    getDisplayScore: function(gameName, currentScore = 0) {
        const cachedScore = this.getScore(gameName);
        return Math.max(cachedScore, currentScore);
    },

    // Initialize all high scores immediately
    initializeAll: function() {
        Object.keys(this.games).forEach(gameName => {
            const score = this.getScore(gameName);
            this.displayScore(gameName, score);
        });
    },

    // Reset display to cached score (called on game reset)
    resetDisplay: function(gameName) {
        const score = this.getScore(gameName);
        this.displayScore(gameName, score);
        
        // If score is 0 and user is logged in, trigger background refresh
        if (score === 0 && localStorage.getItem('token')) {
            setTimeout(() => {
                this.refreshFromServer(gameName);
            }, 500);
        }
    },

    // Refresh from server (asynchronous background task)
    refreshFromServer: async function(gameName) {
        try {
            if (!window.gameScores || !localStorage.getItem('token')) {
                return;
            }

            const userRank = await window.gameScores.getUserRank(gameName, true);
            const serverScore = userRank.score || 0;
            
            if (serverScore > 0) {
                // Only update if server score is higher than current display
                const currentDisplayScore = this.getScore(gameName);
                if (serverScore > currentDisplayScore) {
                    localStorage.setItem(`${gameName}ServerHighScore`, serverScore.toString());
                    localStorage.setItem(`${gameName}ServerHighScoreTimestamp`, Date.now().toString());
                    this.displayScore(gameName, serverScore);
                }
            }
        } catch (error) {
            console.warn(`Failed to refresh ${gameName} high score from server:`, error);
        }
    }
};

// Initialize immediately when script loads
HighScoreCache.initializeAll();

// Re-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        HighScoreCache.initializeAll();
    });
} else {
    HighScoreCache.initializeAll();
}

// Also initialize when window loads (ensures all elements are ready)
window.addEventListener('load', () => {
    HighScoreCache.initializeAll();
});

// Re-initialize periodically to catch any missed elements
setInterval(() => {
    HighScoreCache.initializeAll();
}, 5000);

// Global access
window.HighScoreCache = HighScoreCache;