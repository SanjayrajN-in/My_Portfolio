/**
 * Instant High Score System - Immediate, reliable high score display
 * Fixes the "0 high score" issue by ensuring cached scores are ALWAYS shown immediately
 * 
 * RESET FIX: Added smooth loading animation when resetDisplay is called
 * - Prevents glitching between different score values
 * - Shows loading state with shimmer effect for 800ms
 * - Smoothly transitions to final score
 * - Prevents multiple simultaneous operations causing conflicts
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
        
        // Fallback to local high score (this is important for proper sync!)
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
            // Clear any pending reset timeouts to prevent conflicts
            if (this._refreshTimeouts && this._refreshTimeouts[gameName]) {
                clearTimeout(this._refreshTimeouts[gameName]);
                delete this._refreshTimeouts[gameName];
            }
            
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
        // Prevent multiple simultaneous initializations
        if (this._initializing) {
            return;
        }
        this._initializing = true;
        
        Object.keys(this.games).forEach(gameName => {
            const score = this.getScore(gameName);
            this.displayScore(gameName, score);
        });
        
        // Clear the initialization lock after a short delay
        setTimeout(() => {
            this._initializing = false;
        }, 100);
    },

    // Reset display to cached score (called on game reset)
    resetDisplay: function(gameName) {
        const elementId = this.games[gameName];
        const element = document.getElementById(elementId);
        
        if (!element) return;
        
        // Show loading state immediately to prevent glitching
        element.textContent = '...';
        element.style.opacity = '0.6';
        
        // Add loading animation
        element.classList.add('score-loading');
        
        // Disable any pending server refreshes to prevent conflicts
        if (this._refreshTimeouts && this._refreshTimeouts[gameName]) {
            clearTimeout(this._refreshTimeouts[gameName]);
            delete this._refreshTimeouts[gameName];
        }
        
        // Initialize refresh timeouts object if needed
        if (!this._refreshTimeouts) {
            this._refreshTimeouts = {};
        }
        
        // Get the actual score after a brief loading delay
        this._refreshTimeouts[gameName] = setTimeout(() => {
            const score = this.getScore(gameName);
            
            // Smoothly transition to the final score
            element.style.transition = 'opacity 0.3s ease';
            element.textContent = score;
            element.style.opacity = '1';
            element.classList.remove('score-loading');
            
            // If score is 0 and user is logged in, trigger background refresh
            if (score === 0 && localStorage.getItem('token')) {
                this._refreshTimeouts[gameName] = setTimeout(() => {
                    this.refreshFromServer(gameName);
                }, 1000);
            }
            
            // Clean up timeout reference
            delete this._refreshTimeouts[gameName];
        }, 800); // 800ms loading delay for smooth UX
    },

    // Refresh from server (asynchronous background task)
    refreshFromServer: async function(gameName) {
        try {
            if (!window.gameScores || !localStorage.getItem('token')) {
                return;
            }

            // Prevent multiple simultaneous refreshes for the same game
            const refreshKey = `refreshing_${gameName}`;
            if (this[refreshKey]) {
                return;
            }
            this[refreshKey] = true;

            const userRank = await window.gameScores.getUserRank(gameName, true);
            const serverScore = userRank.score || 0;
            
            if (serverScore > 0) {
                // Only update if server score is higher than current display (original logic restored)
                const currentDisplayScore = this.getScore(gameName);
                if (serverScore > currentDisplayScore) {
                    localStorage.setItem(`${gameName}ServerHighScore`, serverScore.toString());
                    localStorage.setItem(`${gameName}ServerHighScoreTimestamp`, Date.now().toString());
                    
                    // Smooth update with animation
                    const elementId = this.games[gameName];
                    const element = document.getElementById(elementId);
                    if (element) {
                        element.style.transition = 'opacity 0.3s ease';
                        element.style.opacity = '0.7';
                        setTimeout(() => {
                            element.textContent = serverScore;
                            element.style.opacity = '1';
                        }, 150);
                    }
                }
            }
        } catch (error) {
            // Silent error handling - don't log to avoid console spam
        } finally {
            // Clean up the refresh lock
            const refreshKey = `refreshing_${gameName}`;
            this[refreshKey] = false;
        }
    },

    // Force sync with server (useful for debugging sync issues)
    forceSyncWithServer: async function(gameName) {
        if (!localStorage.getItem('token')) {
            return false;
        }
        
        try {
            // Clear any cached server scores to force fresh fetch
            localStorage.removeItem(`${gameName}ServerHighScore`);
            localStorage.removeItem(`${gameName}ServerHighScoreTimestamp`);
            
            // Force refresh from server
            await this.refreshFromServer(gameName);
            return true;
        } catch (error) {
            return false;
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

// Re-initialize periodically to catch any missed elements (reduced frequency)
setInterval(() => {
    // Only reinitialize if there are elements that need it
    let needsReinit = false;
    Object.keys(HighScoreCache.games).forEach(gameName => {
        const elementId = HighScoreCache.games[gameName];
        const element = document.getElementById(elementId);
        if (element && (element.textContent === '' || element.textContent === '0')) {
            needsReinit = true;
        }
    });
    
    if (needsReinit) {
        HighScoreCache.initializeAll();
    }
}, 15000); // Reduced from 5 seconds to 15 seconds

// Clean up timeouts on page unload
window.addEventListener('beforeunload', () => {
    if (HighScoreCache._refreshTimeouts) {
        Object.values(HighScoreCache._refreshTimeouts).forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        HighScoreCache._refreshTimeouts = {};
    }
});

// Global access
window.HighScoreCache = HighScoreCache;