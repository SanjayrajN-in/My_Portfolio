/**
 * Game Scores Service
 * Handles score submission and rankings display for games
 */

(function() {
    // Define API_URL for use in this module
    const API_URL = window.API ? window.API.baseURL : 'https://sanjayraj-n.onrender.com';
    
    // Initialize the service when the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize game scores and rankings
        if (gameScores && typeof gameScores.initializeGameScores === 'function') {
            gameScores.initializeGameScores();
        }
    });

    // Main service object
    const gameScores = {
        /**
         * Submit a score to the server
         * @param {string} gameName - Name of the game (snake, brickBreaker, memoryMatch)
         * @param {number} score - The score achieved
         * @param {number} level - The level reached (optional)
         * @param {number} timeElapsed - Time elapsed in seconds (optional)
         * @returns {Promise} - Promise that resolves with the response
         */
        submitScore: async function(gameName, score, level = 1, timeElapsed = 0) {
            try {
                // Check if user is logged in
                const token = localStorage.getItem('token');
                if (!token) {
                    console.warn('Score submission failed: User not logged in');
                    return { success: false, message: 'User not logged in' };
                }

                console.log(`Submitting score for ${gameName}: ${score} points`);

                const response = await fetch(`${API_URL}/api/scores/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        gameName,
                        score: Number(score),
                        level: Number(level),
                        timeElapsed: Number(timeElapsed)
                    })
                });

                // If response is not ok, log more details
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Score submission failed with status ${response.status}:`, errorText);
                    
                    try {
                        // Try to parse as JSON if possible
                        const errorJson = JSON.parse(errorText);
                        return { success: false, message: errorJson.message || 'Server error' };
                    } catch (e) {
                        // If not JSON, return the text
                        return { success: false, message: `Server error: ${errorText}` };
                    }
                }

                const data = await response.json();
                console.log(`Score submission result for ${gameName}:`, data);
                
                // Clear cached data to force refresh
                localStorage.removeItem(`${gameName}_user_rank_cache`);
                localStorage.removeItem(`${gameName}_rankings_cache`);
                
                return data;
            } catch (error) {
                console.error('Error submitting score:', error);
                return { success: false, message: `Error submitting score: ${error.message}` };
            }
        },

        /**
         * Get rankings for a game
         * @param {string} gameName - Name of the game
         * @returns {Promise} - Promise that resolves with the rankings
         */
        getRankings: async function(gameName) {
            try {
                const response = await fetch(`${API_URL}/api/scores/rankings/${gameName}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                // Check if the response is ok (status in the range 200-299)
                if (!response.ok) {
                    console.warn(`Rankings request failed with status: ${response.status}`);
                    // Try to get cached rankings
                    const cachedRankings = localStorage.getItem(`${gameName}_rankings_cache`);
                    if (cachedRankings) {
                        const parsed = JSON.parse(cachedRankings);
                        return parsed.data || [];
                    }
                    return [];
                }
                
                const data = await response.json();
                
                // Ensure the data is an array
                if (!Array.isArray(data)) {
                    console.warn('Rankings data is not an array:', data);
                    return [];
                }
                
                // Cache the rankings for offline use
                localStorage.setItem(`${gameName}_rankings_cache`, JSON.stringify({
                    data: data,
                    timestamp: Date.now()
                }));
                
                return data;
            } catch (error) {
                console.warn('Error fetching rankings:', error);
                // Try to get cached rankings
                const cachedRankings = localStorage.getItem(`${gameName}_rankings_cache`);
                if (cachedRankings) {
                    try {
                        const parsed = JSON.parse(cachedRankings);
                        return parsed.data || [];
                    } catch (parseError) {
                        console.warn('Error parsing cached rankings:', parseError);
                    }
                }
                return [];
            }
        },

        /**
         * Get user's rank for a game
         * @param {string} gameName - Name of the game
         * @returns {Promise} - Promise that resolves with the user's rank
         */
        getUserRank: async function(gameName) {
            try {
                // Check if user is logged in
                const token = localStorage.getItem('token');
                if (!token) {
                    return { rank: null, score: null };
                }

                const response = await fetch(`${API_URL}/api/scores/user-rank/${gameName}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                // Check if the response is ok (status in the range 200-299)
                if (!response.ok) {
                    console.warn(`User rank request failed with status: ${response.status}`);
                    // Try to get cached user rank
                    const cachedRank = localStorage.getItem(`${gameName}_user_rank_cache`);
                    if (cachedRank) {
                        const parsed = JSON.parse(cachedRank);
                        return parsed.data || { rank: null, score: null };
                    }
                    return { rank: null, score: null };
                }
                
                const data = await response.json();
                
                // Validate the data structure
                if (!data || (data.rank === undefined && data.score === undefined)) {
                    console.warn('Invalid user rank data:', data);
                    return { rank: null, score: null };
                }
                
                // Cache the user rank
                localStorage.setItem(`${gameName}_user_rank_cache`, JSON.stringify({
                    data: data,
                    timestamp: Date.now()
                }));
                
                return data;
            } catch (error) {
                console.warn('Error fetching user rank:', error);
                // Try to get cached user rank
                const cachedRank = localStorage.getItem(`${gameName}_user_rank_cache`);
                if (cachedRank) {
                    try {
                        const parsed = JSON.parse(cachedRank);
                        return parsed.data || { rank: null, score: null };
                    } catch (parseError) {
                        console.warn('Error parsing cached user rank:', parseError);
                    }
                }
                return { rank: null, score: null };
            }
        },

        /**
         * Create the rankings UI for a game
         * @param {string} gameName - Name of the game
         * @param {string} containerId - ID of the container element
         */
        createRankingsUI: async function(gameName, containerId) {
            const container = document.getElementById(containerId);
            if (!container) {
                return;
            }

            // Create the rankings container
            container.innerHTML = `
                <div class="game-rankings">
                    <h3>Top Players</h3>
                    <div class="rankings-list" id="${gameName}-rankings-list">
                        <div class="loading-rankings">Loading rankings...</div>
                    </div>
                    <div class="user-rank" id="${gameName}-user-rank"></div>
                </div>
            `;

            // Update the rankings
            this.updateRankingsUI(gameName, containerId);
        },

        /**
         * Update the rankings UI for a game
         * @param {string} gameName - Name of the game
         * @param {string} containerId - ID of the container element
         * @param {boolean} startPeriodicRefresh - Whether to start periodic refresh
         */
        updateRankingsUI: async function(gameName, containerId, startPeriodicRefresh = false) {
            const rankingsList = document.getElementById(`${gameName}-rankings-list`);
            const userRankElement = document.getElementById(`${gameName}-user-rank`);
            
            if (!rankingsList || !userRankElement) {
                return;
            }

            try {
                // Fetch rankings and user rank in parallel
                let rankings = [];
                let userRank = { rank: null, score: null };
                
                try {
                    console.log(`Updating rankings UI for ${gameName}...`);
                    
                    // Use Promise.allSettled to handle potential failures gracefully
                    const results = await Promise.allSettled([
                        this.getRankings(gameName),
                        this.getUserRank(gameName)
                    ]);
                    
                    // Check if rankings request succeeded
                    if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) {
                        rankings = results[0].value;
                        console.log(`Successfully fetched ${rankings.length} rankings for ${gameName}`);
                    } else {
                        console.warn(`Failed to fetch rankings for ${gameName}:`, results[0].reason);
                    }
                    
                    // Check if user rank request succeeded
                    if (results[1].status === 'fulfilled' && results[1].value) {
                        userRank = results[1].value;
                        console.log(`Successfully fetched user rank for ${gameName}:`, userRank);
                    } else {
                        console.warn(`Failed to fetch user rank for ${gameName}:`, results[1].reason);
                    }
                } catch (fetchError) {
                    console.error(`Error fetching data for ${gameName}:`, fetchError);
                }

                // Update rankings list
                if (!Array.isArray(rankings) || rankings.length === 0) {
                    console.log(`No rankings found for ${gameName}, checking cache...`);
                    
                    // Try to get cached rankings as fallback
                    const cachedRankings = localStorage.getItem(`${gameName}_rankings_cache`);
                    if (cachedRankings) {
                        try {
                            const parsed = JSON.parse(cachedRankings);
                            if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
                                console.log(`Using cached rankings for ${gameName}`);
                                rankings = parsed.data;
                            }
                        } catch (e) {
                            console.warn('Error parsing cached rankings:', e);
                        }
                    }
                    
                    if (!Array.isArray(rankings) || rankings.length === 0) {
                        rankingsList.innerHTML = '<div class="no-rankings">No rankings yet. Be the first!</div>';
                    } else {
                        let rankingsHTML = '';
                        rankings.forEach((rank, index) => {
                            rankingsHTML += `
                                <div class="ranking-item ${index === 0 ? 'first-place' : ''}">
                                    <div class="ranking-position">${index + 1}</div>
                                    <div class="ranking-username">${rank.username}</div>
                                    <div class="ranking-score">${rank.score}</div>
                                </div>
                            `;
                        });
                        rankingsList.innerHTML = rankingsHTML;
                    }
                } else {
                    let rankingsHTML = '';
                    rankings.forEach((rank, index) => {
                        rankingsHTML += `
                            <div class="ranking-item ${index === 0 ? 'first-place' : ''}">
                                <div class="ranking-position">${index + 1}</div>
                                <div class="ranking-username">${rank.username}</div>
                                <div class="ranking-score">${rank.score}</div>
                            </div>
                        `;
                    });
                    rankingsList.innerHTML = rankingsHTML;
                }

                // Update user rank
                if (userRank && userRank.rank && userRank.score) {
                    userRankElement.innerHTML = `
                        <div class="user-rank-title">Your Rank</div>
                        <div class="user-rank-info">
                            <span class="user-rank-position">#${userRank.rank}</span>
                            <span class="user-rank-score">Score: ${userRank.score}</span>
                        </div>
                    `;
                } else {
                    // Show appropriate message based on whether there are rankings or not
                    const hasRankings = Array.isArray(rankings) && rankings.length > 0;
                    const message = hasRankings ? "Not ranked yet - play to get ranked!" : "No rankings yet - be the first!";
                    
                    userRankElement.innerHTML = `
                        <div class="user-rank-title">Your Rank</div>
                        <div class="user-rank-info">
                            <span class="user-not-ranked">${message}</span>
                        </div>
                    `;
                }
            } catch (error) {
                rankingsList.innerHTML = '<div class="rankings-error">Error loading rankings</div>';
            }
            
            // Start periodic refresh if requested and not already running
            if (startPeriodicRefresh && !this._refreshIntervals) {
                this._refreshIntervals = {};
            }
            
            if (startPeriodicRefresh && !this._refreshIntervals[gameName]) {
                this._refreshIntervals[gameName] = setInterval(() => {
                    // Only refresh if the game container is visible
                    const container = document.getElementById(containerId);
                    if (container && container.closest('.game-container')?.classList.contains('active')) {
                        this.updateRankingsUI(gameName, containerId, false); // Don't restart the interval
                    }
                }, 30000); // Refresh every 30 seconds
            }
        },

        /**
         * Stop periodic refresh for a game
         * @param {string} gameName - Name of the game
         */
        stopPeriodicRefresh: function(gameName) {
            if (this._refreshIntervals && this._refreshIntervals[gameName]) {
                clearInterval(this._refreshIntervals[gameName]);
                delete this._refreshIntervals[gameName];
            }
        },

        /**
         * Stop all periodic refreshes
         */
        stopAllPeriodicRefresh: function() {
            if (this._refreshIntervals) {
                Object.keys(this._refreshIntervals).forEach(gameName => {
                    clearInterval(this._refreshIntervals[gameName]);
                });
                this._refreshIntervals = {};
            }
        },

        /**
         * Force refresh all game data (high scores and rankings)
         * Called when user logs in or page loads
         */
        forceRefreshAllGames: async function() {
            const games = ['snake', 'memoryMatch', 'brickBreaker'];
            
            console.log('Force refreshing all game data...');
            
            // Clear all cached data first
            games.forEach(gameName => {
                localStorage.removeItem(`${gameName}_user_rank_cache`);
                localStorage.removeItem(`${gameName}_rankings_cache`);
                localStorage.removeItem(`${gameName}ServerHighScore`);
                localStorage.removeItem(`${gameName}ServerHighScoreTimestamp`);
            });

            // Update all visible game containers
            for (const gameName of games) {
                const containerId = `${gameName}-rankings-container`;
                const container = document.getElementById(containerId);
                
                if (container) {
                    try {
                        await this.updateRankingsUI(gameName, containerId, false);
                        console.log(`Updated rankings for ${gameName}`);
                    } catch (error) {
                        console.warn(`Failed to update rankings for ${gameName}:`, error);
                    }
                }
            }
        },

        /**
         * Initialize game scores when page loads
         */
        initializeGameScores: function() {
            console.log('Initializing game scores...');
            
            // Always initialize high score displays, whether logged in or not
            this.initializeHighScoreDisplays();
            
            // Check if user is logged in for server data
            const token = localStorage.getItem('token');
            if (token) {
                console.log('User is logged in, fetching server data...');
                // Delay to ensure DOM is ready
                setTimeout(() => {
                    this.forceRefreshAllGames();
                }, 500);
            } else {
                console.log('User not logged in, using local high scores');
                this.initializeLocalHighScores();
            }
        },

        /**
         * Initialize high score displays with immediate values
         */
        initializeHighScoreDisplays: function() {
            const games = [
                { name: 'snake', elementId: 'snake-high-score', localKey: 'snakeHighScore' },
                { name: 'brickBreaker', elementId: 'brick-high-score', localKey: 'brickBreakerHighScore' },
                { name: 'memoryMatch', elementId: 'memory-high-score', localKey: 'memoryMatchHighScore' }
            ];

            games.forEach(game => {
                const element = document.getElementById(game.elementId);
                if (element) {
                    // Set initial value to prevent showing 0
                    const isLoggedIn = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
                    let initialScore = 0;
                    
                    if (isLoggedIn) {
                        // Try cached server score first
                        const cachedScore = localStorage.getItem(`${game.name}ServerHighScore`);
                        const timestamp = localStorage.getItem(`${game.name}ServerHighScoreTimestamp`);
                        
                        if (cachedScore && timestamp) {
                            const age = Date.now() - parseInt(timestamp);
                            if (age < 5 * 60 * 1000) { // 5 minutes
                                initialScore = parseInt(cachedScore);
                            }
                        }
                        
                        // Fallback to local if no cached server score
                        if (initialScore === 0) {
                            initialScore = parseInt(localStorage.getItem(game.localKey) || '0');
                        }
                    } else {
                        // Use local score when not logged in
                        initialScore = parseInt(localStorage.getItem(game.localKey) || '0');
                    }
                    
                    element.textContent = initialScore;
                    console.log(`Initialized ${game.name} high score display: ${initialScore}`);
                }
            });
        },

        /**
         * Initialize local high scores for non-logged-in users
         */
        initializeLocalHighScores: function() {
            const games = [
                { elementId: 'snake-high-score', localKey: 'snakeHighScore' },
                { elementId: 'brick-high-score', localKey: 'brickBreakerHighScore' },
                { elementId: 'memory-high-score', localKey: 'memoryMatchHighScore' }
            ];

            games.forEach(game => {
                const element = document.getElementById(game.elementId);
                if (element) {
                    const localScore = localStorage.getItem(game.localKey) || '0';
                    element.textContent = localScore;
                }
            });
        }
    };

    // Listen for auth state changes
    window.addEventListener('authStateChanged', function(event) {
        console.log('Auth state changed, refreshing game scores...');
        if (gameScores && typeof gameScores.forceRefreshAllGames === 'function') {
            gameScores.forceRefreshAllGames();
        }
    });

    // Also listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', function(event) {
        if (event.key === 'token') {
            console.log('Token changed in storage, refreshing game scores...');
            if (gameScores && typeof gameScores.forceRefreshAllGames === 'function') {
                setTimeout(() => {
                    gameScores.forceRefreshAllGames();
                }, 100);
            }
        }
    });

    // Make the service available globally
    window.gameScores = gameScores;
})();
