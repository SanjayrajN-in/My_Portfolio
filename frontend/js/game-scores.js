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
         * Initialize high score displays immediately on page load
         */
        initializeHighScores: function() {
            const games = ['snake', 'brickBreaker', 'memoryMatch'];
            const isLoggedIn = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
            
            games.forEach(gameName => {
                const elementId = `${gameName}-high-score`;
                const element = document.getElementById(elementId);
                
                if (element) {
                    if (isLoggedIn) {
                        // Show cached server score immediately if available
                        const cachedScore = localStorage.getItem(`${gameName}ServerHighScore`);
                        if (cachedScore && !isNaN(cachedScore) && parseInt(cachedScore) > 0) {
                            element.textContent = cachedScore;
                        } else {
                            // Show 0 while loading
                            element.textContent = '0';
                        }
                    } else {
                        // Show local high score for non-logged-in users
                        const localScore = localStorage.getItem(`${gameName}HighScore`) || '0';
                        element.textContent = localScore;
                    }
                }
            });
        },
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
                    return { success: false, message: 'User not logged in' };
                }

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

                // If response is not ok, handle error
                if (!response.ok) {
                    const errorText = await response.text();
                    
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
                
                // Clear cached data to force refresh
                localStorage.removeItem(`${gameName}_user_rank_cache`);
                localStorage.removeItem(`${gameName}_rankings_cache`);
                
                // Clear rate limiting to allow immediate rank refresh after score submission
                const rateLimitKey = `getUserRank_${gameName}_lastCall`;
                localStorage.removeItem(rateLimitKey);
                
                // If it's a new high score, immediately cache it
                if (data.isNewHighScore && data.score && data.score.score) {
                    localStorage.setItem(`${gameName}ServerHighScore`, data.score.score.toString());
                    localStorage.setItem(`${gameName}ServerHighScoreTimestamp`, Date.now().toString());
                }
                
                // Mark that we need to refresh ranking after score submission
                localStorage.setItem(`${gameName}_processing_rank`, 'true');
                
                // Auto-refresh rankings UI if container exists
                const containerId = `${gameName}-rankings-container`;
                const container = document.getElementById(containerId);
                if (container) {
                    // Immediately update UI to show processing state
                    this.updateRankingsUI(gameName, containerId, false, false);
                    
                    // Then retry with fresh data after server processes
                    setTimeout(() => {
                        this.updateRankingsUI(gameName, containerId, false, true);
                    }, 2000); // Give server time to process
                    
                    // Another retry after more time if still processing
                    setTimeout(() => {
                        const stillProcessing = localStorage.getItem(`${gameName}_processing_rank`) === 'true';
                        if (stillProcessing) {
                            this.updateRankingsUI(gameName, containerId, false, true);
                        }
                    }, 5000);
                }
                
                return data;
            } catch (error) {
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
                    // Try to get cached rankings
                    const cachedRankings = localStorage.getItem(`${gameName}_rankings_cache`);
                    if (cachedRankings) {
                        try {
                            const parsed = JSON.parse(cachedRankings);
                            return parsed.data || [];
                        } catch (parseError) {
                            // Silent fallback
                        }
                    }
                    return [];
                }
                
                const data = await response.json();
                
                // Ensure the data is an array
                if (!Array.isArray(data)) {
                    return [];
                }
                
                // Validate the data structure
                const validRankings = data.filter(item => {
                    return item && 
                           typeof item.username === 'string' && 
                           typeof item.score === 'number' && 
                           item.username.trim() !== '';
                });
                
                // Cache the rankings for offline use
                localStorage.setItem(`${gameName}_rankings_cache`, JSON.stringify({
                    data: validRankings,
                    timestamp: Date.now()
                }));
                
                return validRankings;
            } catch (error) {
                // Try to get cached rankings
                const cachedRankings = localStorage.getItem(`${gameName}_rankings_cache`);
                if (cachedRankings) {
                    try {
                        const parsed = JSON.parse(cachedRankings);
                        return parsed.data || [];
                    } catch (parseError) {
                        // Silent fallback
                    }
                }
                return [];
            }
        },

        /**
         * Get user's rank for a game with rate limiting
         * @param {string} gameName - Name of the game
         * @param {boolean} forceRefresh - If true, bypasses rate limiting
         * @returns {Promise} - Promise that resolves with the user's rank
         */
        getUserRank: async function(gameName, forceRefresh = false) {
            // Check if we're processing a rank after score submission
            const isProcessingRank = localStorage.getItem(`${gameName}_processing_rank`) === 'true';
            
            // Rate limiting: Don't call more than once every 30 seconds per game (unless forced or processing)
            const rateLimitKey = `getUserRank_${gameName}_lastCall`;
            const lastCall = parseInt(localStorage.getItem(rateLimitKey) || '0');
            const now = Date.now();
            
            if (!forceRefresh && !isProcessingRank && now - lastCall < 30000) { // 30 seconds cooldown to prevent spam
                // Return cached data if available
                const cachedRank = localStorage.getItem(`${gameName}_user_rank_cache`);
                if (cachedRank) {
                    try {
                        const parsed = JSON.parse(cachedRank);
                        const cacheAge = now - (parsed.timestamp || 0);
                        if (cacheAge < 300000) { // Use cache if less than 5 minutes old
                            return parsed.data || { rank: null, score: null };
                        }
                    } catch (e) {
                        // Silent fallback
                    }
                }
                return { rank: null, score: null };
            }
            
            localStorage.setItem(rateLimitKey, now.toString());
            
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
                    // Try to get cached user rank
                    const cachedRank = localStorage.getItem(`${gameName}_user_rank_cache`);
                    if (cachedRank) {
                        try {
                            const parsed = JSON.parse(cachedRank);
                            return parsed.data || { rank: null, score: null };
                        } catch (e) {
                            // Silent fallback
                        }
                    }
                    return { rank: null, score: null };
                }
                
                const data = await response.json();
                
                // Validate the data structure
                if (!data || (data.rank === undefined && data.score === undefined)) {
                    return { rank: null, score: null };
                }
                
                // Clear processing flag if we got valid rank data
                if (data.rank && data.score !== undefined && data.score !== null) {
                    localStorage.removeItem(`${gameName}_processing_rank`);
                }
                
                // Cache the user rank
                localStorage.setItem(`${gameName}_user_rank_cache`, JSON.stringify({
                    data: data,
                    timestamp: Date.now()
                }));
                
                return data;
            } catch (error) {
                // Try to get cached user rank
                const cachedRank = localStorage.getItem(`${gameName}_user_rank_cache`);
                if (cachedRank) {
                    try {
                        const parsed = JSON.parse(cachedRank);
                        return parsed.data || { rank: null, score: null };
                    } catch (parseError) {
                        // Silent fallback
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
                    <div class="rankings-header">
                        <h3>Top Players</h3>
                        <button class="refresh-rankings-btn" id="${gameName}-refresh-btn" title="Refresh Rankings">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    <div class="rankings-list" id="${gameName}-rankings-list">
                        <div class="loading-rankings">Loading rankings...</div>
                    </div>
                    <div class="user-rank" id="${gameName}-user-rank"></div>
                </div>
            `;

            // Add event listener for refresh button
            const refreshBtn = document.getElementById(`${gameName}-refresh-btn`);
            if (refreshBtn) {
                refreshBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.refreshRankings(gameName, containerId);
                });
            }

            // Update the rankings
            this.updateRankingsUI(gameName, containerId);
        },

        /**
         * Update the rankings UI for a game
         * @param {string} gameName - Name of the game
         * @param {string} containerId - ID of the container element
         * @param {boolean} startPeriodicRefresh - Whether to start periodic refresh
         * @param {boolean} forceRefresh - Whether to force refresh user rank bypassing rate limiting
         */
        updateRankingsUI: async function(gameName, containerId, startPeriodicRefresh = false, forceRefresh = false) {
            // Wait for DOM elements to exist with retry mechanism
            let retryCount = 0;
            const maxRetries = 10;
            let rankingsList, userRankElement;
            
            while (retryCount < maxRetries) {
                rankingsList = document.getElementById(`${gameName}-rankings-list`);
                userRankElement = document.getElementById(`${gameName}-user-rank`);
                
                if (rankingsList && userRankElement) {
                    break;
                }
                
                await new Promise(resolve => setTimeout(resolve, 200));
                retryCount++;
            }
            
            if (!rankingsList || !userRankElement) {
                return;
            }

            // Show loading indicator
            rankingsList.innerHTML = '<div class="loading-rankings">Loading rankings...</div>';
            userRankElement.innerHTML = '<div class="loading-rankings">Loading your rank...</div>';

            try {
                // Fetch rankings and user rank in parallel with timeout
                let rankings = [];
                let userRank = { rank: null, score: null };
                
                // Create fetch promises with timeout
                const createTimeoutPromise = (promise, timeout = 10000) => {
                    return Promise.race([
                        promise,
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Request timeout')), timeout)
                        )
                    ]);
                };
                
                try {
                    // Use Promise.allSettled with timeout handling
                    const results = await Promise.allSettled([
                        createTimeoutPromise(this.getRankings(gameName)),
                        createTimeoutPromise(this.getUserRank(gameName, forceRefresh))
                    ]);
                    
                    // Process rankings result
                    if (results[0].status === 'fulfilled') {
                        const rankingsData = results[0].value;
                        if (Array.isArray(rankingsData)) {
                            rankings = rankingsData;
                        }
                    }
                    
                    // Process user rank result
                    if (results[1].status === 'fulfilled') {
                        const userRankData = results[1].value;
                        if (userRankData && (userRankData.rank !== undefined || userRankData.score !== undefined)) {
                            userRank = userRankData;
                        }
                    }
                } catch (fetchError) {
                    // Silent error handling
                }

                // Handle rankings display with improved fallback logic
                let finalRankings = rankings;
                
                if (!Array.isArray(finalRankings) || finalRankings.length === 0) {
                    // Try to get cached rankings as fallback
                    const cachedRankings = localStorage.getItem(`${gameName}_rankings_cache`);
                    if (cachedRankings) {
                        try {
                            const parsed = JSON.parse(cachedRankings);
                            const cacheAge = Date.now() - (parsed.timestamp || 0);
                            
                            // Use cache if it's less than 10 minutes old and has data
                            if (cacheAge < 600000 && parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
                                finalRankings = parsed.data;
                            }
                        } catch (e) {
                            // Silent fallback
                        }
                    }
                }
                
                // Update rankings list with better error handling
                this.renderRankingsList(rankingsList, finalRankings, gameName);
                
                // Update user rank with better error handling
                this.renderUserRank(userRankElement, userRank, finalRankings, gameName);
                
            } catch (error) {
                rankingsList.innerHTML = '<div class="rankings-error">Error loading rankings. Please try refreshing.</div>';
                userRankElement.innerHTML = '<div class="rankings-error">Error loading rank</div>';
            }
            
            // Start periodic refresh if requested and not already running
            if (startPeriodicRefresh && !this._refreshIntervals) {
                this._refreshIntervals = {};
            }
            
            if (startPeriodicRefresh && !this._refreshIntervals[gameName]) {
                this._refreshIntervals[gameName] = setInterval(() => {
                    // Only refresh if the game container is visible
                    const container = document.getElementById(containerId);
                    const gameContainer = container?.closest('.game-container');
                    if (gameContainer?.classList.contains('active')) {
                        this.updateRankingsUI(gameName, containerId, false); // Don't restart the interval
                    }
                }, 60000); // Refresh every 60 seconds (reduced frequency)
            }
        },

        /**
         * Render the rankings list HTML
         */
        renderRankingsList: function(rankingsList, rankings, gameName) {
            if (!Array.isArray(rankings) || rankings.length === 0) {
                rankingsList.innerHTML = '<div class="no-rankings">No rankings yet. Be the first!</div>';
                return;
            }

            let rankingsHTML = '';
            // Only show top 3 players
            const topRankings = rankings.slice(0, 3);
            topRankings.forEach((rank, index) => {
                if (rank && rank.username && rank.score !== undefined) {
                    rankingsHTML += `
                        <div class="ranking-item ${index === 0 ? 'first-place' : ''}">
                            <div class="ranking-position">${index + 1}</div>
                            <div class="ranking-username">${rank.username || 'Anonymous'}</div>
                            <div class="ranking-score">${rank.score || 0}</div>
                        </div>
                    `;
                }
            });
            
            if (rankingsHTML) {
                rankingsList.innerHTML = rankingsHTML;
            } else {
                rankingsList.innerHTML = '<div class="no-rankings">No valid rankings found</div>';
            }
        },

        /**
         * Render the user rank HTML
         */
        renderUserRank: function(userRankElement, userRank, rankings, gameName) {
            const isProcessingRank = localStorage.getItem(`${gameName}_processing_rank`) === 'true';
            
            if (userRank && userRank.rank && userRank.score !== undefined && userRank.score !== null) {
                // Clear processing flag if we have valid rank data
                localStorage.removeItem(`${gameName}_processing_rank`);
                
                userRankElement.innerHTML = `
                    <div class="user-rank-title">Your Rank</div>
                    <div class="user-rank-info">
                        <span class="user-rank-position">#${userRank.rank}</span>
                        <span class="user-rank-score">Score: ${userRank.score}</span>
                    </div>
                `;
            } else if (isProcessingRank) {
                // Show processing state after score submission
                userRankElement.innerHTML = `
                    <div class="user-rank-title">Your Rank</div>
                    <div class="user-rank-info">
                        <span class="user-processing-rank">Processing rank...</span>
                    </div>
                `;
                
                // Clear processing flag after 30 seconds as fallback
                setTimeout(() => {
                    localStorage.removeItem(`${gameName}_processing_rank`);
                }, 30000);
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
        },

        /**
         * Refresh rankings manually (triggered by refresh button)
         * @param {string} gameName - Name of the game
         * @param {string} containerId - ID of the container element
         */
        refreshRankings: async function(gameName, containerId) {
            const refreshBtn = document.getElementById(`${gameName}-refresh-btn`);
            
            // Add loading state to refresh button
            if (refreshBtn) {
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
            }
            
            // Clear cached data to force fresh fetch
            localStorage.removeItem(`${gameName}_user_rank_cache`);
            localStorage.removeItem(`${gameName}_rankings_cache`);
            
            // Clear rate limiting to allow immediate refresh
            const rateLimitKey = `getUserRank_${gameName}_lastCall`;
            localStorage.removeItem(rateLimitKey);
            
            try {
                // Update rankings with fresh data
                await this.updateRankingsUI(gameName, containerId);
            } catch (error) {
                // Silent error handling
            } finally {
                // Reset refresh button
                if (refreshBtn) {
                    refreshBtn.disabled = false;
                    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                }
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
            const games = [
                { name: 'snake', localKey: 'snakeHighScore' },
                { name: 'memoryMatch', localKey: 'memoryMatchHighScore' },
                { name: 'brickBreaker', localKey: 'brickBreakerHighScore' }
            ];
            
            // Clear all cached data first including local scores when logged in
            games.forEach(game => {
                localStorage.removeItem(`${game.name}_user_rank_cache`);
                localStorage.removeItem(`${game.name}_rankings_cache`);
                localStorage.removeItem(`${game.name}ServerHighScore`);
                localStorage.removeItem(`${game.name}ServerHighScoreTimestamp`);
                
                // Clear local high scores when user logs in to prevent conflicts
                const isLoggedIn = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
                if (isLoggedIn) {
                    localStorage.removeItem(game.localKey);
                }
            });

            // Update all visible game containers
            for (const game of games) {
                const containerId = `${game.name}-rankings-container`;
                const container = document.getElementById(containerId);
                
                if (container) {
                    try {
                        await this.updateRankingsUI(game.name, containerId, false, true); // Force refresh
                    } catch (error) {
                        // Silent error handling
                    }
                }
            }
        },

        /**
         * Initialize game scores when page loads
         */
        initializeGameScores: async function() {
            // Always initialize high score displays, whether logged in or not
            this.initializeHighScoreDisplays();
            
            // Check if user is logged in for server data
            const token = localStorage.getItem('token');
            if (token) {
                // Wait for DOM to be fully ready with longer delay
                await this.waitForDOM();
                
                // Initialize rankings containers first
                await this.initializeRankingsContainers();
                
                // Then refresh all games data
                setTimeout(() => {
                    this.forceRefreshAllGames();
                }, 1000);
            } else {
                this.initializeLocalHighScores();
                
                // Still initialize ranking containers for logged-out display
                await this.waitForDOM();
                await this.initializeRankingsContainers();
            }
        },

        /**
         * Wait for DOM elements to be ready
         */
        waitForDOM: function() {
            return new Promise((resolve) => {
                if (document.readyState === 'complete') {
                    resolve();
                    return;
                }
                
                let attempts = 0;
                const maxAttempts = 20;
                
                const checkDOM = () => {
                    attempts++;
                    
                    if (document.readyState === 'complete' || attempts >= maxAttempts) {
                        resolve();
                    } else {
                        setTimeout(checkDOM, 250);
                    }
                };
                
                checkDOM();
            });
        },

        /**
         * Initialize all ranking containers proactively
         */
        initializeRankingsContainers: async function() {
            const games = [
                { name: 'snake', containerId: 'snake-rankings-container' },
                { name: 'memoryMatch', containerId: 'memoryMatch-rankings-container' },
                { name: 'brickBreaker', containerId: 'brickBreaker-rankings-container' }
            ];
            
            for (const game of games) {
                const container = document.getElementById(game.containerId);
                if (container && !container.querySelector('.game-rankings')) {
                    // Create the basic structure immediately
                    container.innerHTML = `
                        <div class="game-rankings">
                            <h3>Top Players</h3>
                            <div class="rankings-list" id="${game.name}-rankings-list">
                                <div class="loading-rankings">Loading rankings...</div>
                            </div>
                            <div class="user-rank" id="${game.name}-user-rank">
                                <div class="loading-rankings">Loading your rank...</div>
                            </div>
                        </div>
                    `;
                    
                    // Small delay to let the DOM settle
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
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
                    const isLoggedIn = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
                    let initialScore = 0;
                    
                    if (isLoggedIn) {
                        // Only try cached server score when logged in
                        const cachedScore = localStorage.getItem(`${game.name}ServerHighScore`);
                        const timestamp = localStorage.getItem(`${game.name}ServerHighScoreTimestamp`);
                        
                        if (cachedScore && timestamp) {
                            const age = Date.now() - parseInt(timestamp);
                            if (age < 5 * 60 * 1000) { // 5 minutes
                                initialScore = parseInt(cachedScore);
                            }
                        }
                        
                        // DON'T fallback to local scores for logged-in users
                        // Show placeholder until server data arrives
                        if (initialScore === 0) {
                            element.textContent = '--';
                        } else {
                            element.textContent = initialScore;
                        }
                    } else {
                        // Use local score when not logged in
                        initialScore = parseInt(localStorage.getItem(game.localKey) || '0');
                        element.textContent = initialScore;
                    }
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
        if (gameScores && typeof gameScores.forceRefreshAllGames === 'function') {
            // Clear local scores immediately when user logs in
            const isLoggedIn = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
            if (isLoggedIn) {
                // Clear local high scores immediately
                localStorage.removeItem('snakeHighScore');
                localStorage.removeItem('brickBreakerHighScore');
                localStorage.removeItem('memoryMatchHighScore');
                
                // Update display to show server scores
                setTimeout(() => {
                    if (typeof updateAllHighScores === 'function') {
                        updateAllHighScores(true); // Force refresh on login
                    }
                }, 500);
            }
            
            gameScores.forceRefreshAllGames();
        }
    });

    // Also listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', function(event) {
        if (event.key === 'token') {
            if (gameScores && typeof gameScores.forceRefreshAllGames === 'function') {
                // Clear local scores when user logs in (detected via storage change)
                if (event.newValue) { // Token was added (user logged in)
                    localStorage.removeItem('snakeHighScore');
                    localStorage.removeItem('brickBreakerHighScore');
                    localStorage.removeItem('memoryMatchHighScore');
                    
                    // Update display with server scores
                    setTimeout(() => {
                        if (typeof updateAllHighScores === 'function') {
                            updateAllHighScores(true); // Force refresh on login
                        }
                    }, 500);
                }
                
                setTimeout(() => {
                    gameScores.forceRefreshAllGames();
                }, 100);
            }
        }
    });

    // Make the service available globally
    window.gameScores = gameScores;
    
    // Helper function for manual refresh if needed
    window.refreshRankings = async function(gameName = 'snake') {
        const containerId = `${gameName}-rankings-container`;
        await gameScores.updateRankingsUI(gameName, containerId, false);
    };
})();