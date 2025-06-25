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
                
                // If it's a new high score, immediately cache it
                if (data.isNewHighScore && data.score && data.score.score) {
                    localStorage.setItem(`${gameName}ServerHighScore`, data.score.score.toString());
                    localStorage.setItem(`${gameName}ServerHighScoreTimestamp`, Date.now().toString());
                }
                
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
            console.log(`[RANKINGS API] Fetching rankings for ${gameName}...`);
            
            try {
                const url = `${API_URL}/api/scores/rankings/${gameName}`;
                console.log(`[RANKINGS API] Making request to: ${url}`);
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`[RANKINGS API] Response status: ${response.status} ${response.statusText}`);
                
                // Check if the response is ok (status in the range 200-299)
                if (!response.ok) {
                    const errorText = await response.text();
                    console.warn(`[RANKINGS API] Rankings request failed with status: ${response.status}`, errorText);
                    
                    // Try to get cached rankings
                    const cachedRankings = localStorage.getItem(`${gameName}_rankings_cache`);
                    if (cachedRankings) {
                        try {
                            const parsed = JSON.parse(cachedRankings);
                            console.log(`[RANKINGS API] Using cached rankings for ${gameName}:`, parsed.data?.length || 0, 'items');
                            return parsed.data || [];
                        } catch (parseError) {
                            console.warn('[RANKINGS API] Error parsing cached rankings:', parseError);
                        }
                    }
                    return [];
                }
                
                const data = await response.json();
                console.log(`[RANKINGS API] Received data for ${gameName}:`, {
                    isArray: Array.isArray(data),
                    length: data?.length,
                    firstItem: data?.[0],
                    dataType: typeof data
                });
                
                // Ensure the data is an array
                if (!Array.isArray(data)) {
                    console.warn('[RANKINGS API] Rankings data is not an array:', data);
                    return [];
                }
                
                // Validate the data structure
                const validRankings = data.filter(item => {
                    const isValid = item && 
                                   typeof item.username === 'string' && 
                                   typeof item.score === 'number' && 
                                   item.username.trim() !== '';
                    
                    if (!isValid) {
                        console.warn('[RANKINGS API] Invalid ranking item:', item);
                    }
                    return isValid;
                });
                
                console.log(`[RANKINGS API] Valid rankings for ${gameName}: ${validRankings.length}/${data.length}`);
                
                // Cache the rankings for offline use
                localStorage.setItem(`${gameName}_rankings_cache`, JSON.stringify({
                    data: validRankings,
                    timestamp: Date.now()
                }));
                
                return validRankings;
            } catch (error) {
                console.error(`[RANKINGS API] Error fetching rankings for ${gameName}:`, error);
                
                // Try to get cached rankings
                const cachedRankings = localStorage.getItem(`${gameName}_rankings_cache`);
                if (cachedRankings) {
                    try {
                        const parsed = JSON.parse(cachedRankings);
                        const cacheAge = Date.now() - (parsed.timestamp || 0);
                        console.log(`[RANKINGS API] Using cached rankings for ${gameName} (age: ${Math.round(cacheAge/1000)}s):`, parsed.data?.length || 0, 'items');
                        return parsed.data || [];
                    } catch (parseError) {
                        console.warn('[RANKINGS API] Error parsing cached rankings:', parseError);
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
            console.log(`[RANKINGS DEBUG] Starting updateRankingsUI for ${gameName}`);
            
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
                
                console.log(`[RANKINGS DEBUG] Waiting for DOM elements... retry ${retryCount + 1}/${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, 200));
                retryCount++;
            }
            
            if (!rankingsList || !userRankElement) {
                console.error(`[RANKINGS DEBUG] Failed to find DOM elements for ${gameName} after ${maxRetries} retries`);
                console.error(`[RANKINGS DEBUG] rankingsList:`, rankingsList);
                console.error(`[RANKINGS DEBUG] userRankElement:`, userRankElement);
                return;
            }

            // Show loading indicator
            rankingsList.innerHTML = '<div class="loading-rankings">Loading rankings...</div>';
            userRankElement.innerHTML = '<div class="loading-rankings">Loading your rank...</div>';

            try {
                // Clear any stale cache first if this is a fresh request
                if (!startPeriodicRefresh) {
                    localStorage.removeItem(`${gameName}_rankings_cache_temp`);
                }
                
                // Fetch rankings and user rank in parallel with longer timeout
                let rankings = [];
                let userRank = { rank: null, score: null };
                
                console.log(`[RANKINGS DEBUG] Fetching data for ${gameName}...`);
                
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
                        createTimeoutPromise(this.getUserRank(gameName))
                    ]);
                    
                    // Process rankings result
                    if (results[0].status === 'fulfilled') {
                        const rankingsData = results[0].value;
                        if (Array.isArray(rankingsData)) {
                            rankings = rankingsData;
                            console.log(`[RANKINGS DEBUG] Successfully fetched ${rankings.length} rankings for ${gameName}`);
                        } else {
                            console.warn(`[RANKINGS DEBUG] Rankings data is not an array:`, rankingsData);
                        }
                    } else {
                        console.warn(`[RANKINGS DEBUG] Failed to fetch rankings for ${gameName}:`, results[0].reason);
                    }
                    
                    // Process user rank result
                    if (results[1].status === 'fulfilled') {
                        const userRankData = results[1].value;
                        if (userRankData && (userRankData.rank !== undefined || userRankData.score !== undefined)) {
                            userRank = userRankData;
                            console.log(`[RANKINGS DEBUG] Successfully fetched user rank for ${gameName}:`, userRank);
                        } else {
                            console.warn(`[RANKINGS DEBUG] Invalid user rank data:`, userRankData);
                        }
                    } else {
                        console.warn(`[RANKINGS DEBUG] Failed to fetch user rank for ${gameName}:`, results[1].reason);
                    }
                } catch (fetchError) {
                    console.error(`[RANKINGS DEBUG] Error fetching data for ${gameName}:`, fetchError);
                }

                // Handle rankings display with improved fallback logic
                let finalRankings = rankings;
                
                if (!Array.isArray(finalRankings) || finalRankings.length === 0) {
                    console.log(`[RANKINGS DEBUG] No rankings found for ${gameName}, checking cache...`);
                    
                    // Try to get cached rankings as fallback
                    const cachedRankings = localStorage.getItem(`${gameName}_rankings_cache`);
                    if (cachedRankings) {
                        try {
                            const parsed = JSON.parse(cachedRankings);
                            const cacheAge = Date.now() - (parsed.timestamp || 0);
                            
                            // Use cache if it's less than 10 minutes old and has data
                            if (cacheAge < 600000 && parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
                                console.log(`[RANKINGS DEBUG] Using cached rankings for ${gameName} (age: ${Math.round(cacheAge/1000)}s)`);
                                finalRankings = parsed.data;
                            }
                        } catch (e) {
                            console.warn('[RANKINGS DEBUG] Error parsing cached rankings:', e);
                        }
                    }
                }
                
                // Update rankings list with better error handling
                this.renderRankingsList(rankingsList, finalRankings, gameName);
                
                // Update user rank with better error handling
                this.renderUserRank(userRankElement, userRank, finalRankings);
                
            } catch (error) {
                console.error(`[RANKINGS DEBUG] Critical error in updateRankingsUI for ${gameName}:`, error);
                rankingsList.innerHTML = '<div class="rankings-error">Error loading rankings. Please try refreshing.</div>';
                userRankElement.innerHTML = '<div class="rankings-error">Error loading rank</div>';
            }
            
            // Start periodic refresh if requested and not already running
            if (startPeriodicRefresh && !this._refreshIntervals) {
                this._refreshIntervals = {};
            }
            
            if (startPeriodicRefresh && !this._refreshIntervals[gameName]) {
                console.log(`[RANKINGS DEBUG] Starting periodic refresh for ${gameName}`);
                this._refreshIntervals[gameName] = setInterval(() => {
                    // Only refresh if the game container is visible
                    const container = document.getElementById(containerId);
                    const gameContainer = container?.closest('.game-container');
                    if (gameContainer?.classList.contains('active')) {
                        console.log(`[RANKINGS DEBUG] Periodic refresh for ${gameName}`);
                        this.updateRankingsUI(gameName, containerId, false); // Don't restart the interval
                    }
                }, 30000); // Refresh every 30 seconds
            }
        },

        /**
         * Render the rankings list HTML
         */
        renderRankingsList: function(rankingsList, rankings, gameName) {
            if (!Array.isArray(rankings) || rankings.length === 0) {
                console.log(`[RANKINGS DEBUG] Showing 'no rankings' message for ${gameName}`);
                rankingsList.innerHTML = '<div class="no-rankings">No rankings yet. Be the first!</div>';
                return;
            }

            console.log(`[RANKINGS DEBUG] Rendering ${rankings.length} rankings for ${gameName}`);
            let rankingsHTML = '';
            rankings.forEach((rank, index) => {
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
        renderUserRank: function(userRankElement, userRank, rankings) {
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
        initializeGameScores: async function() {
            console.log('[INIT DEBUG] Initializing game scores...');
            
            // Always initialize high score displays, whether logged in or not
            this.initializeHighScoreDisplays();
            
            // Check if user is logged in for server data
            const token = localStorage.getItem('token');
            if (token) {
                console.log('[INIT DEBUG] User is logged in, fetching server data...');
                
                // Wait for DOM to be fully ready with longer delay
                await this.waitForDOM();
                
                // Initialize rankings containers first
                await this.initializeRankingsContainers();
                
                // Then refresh all games data
                setTimeout(() => {
                    this.forceRefreshAllGames();
                }, 1000);
            } else {
                console.log('[INIT DEBUG] User not logged in, using local high scores');
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
                    console.log('[INIT DEBUG] DOM already complete');
                    resolve();
                    return;
                }
                
                let attempts = 0;
                const maxAttempts = 20;
                
                const checkDOM = () => {
                    attempts++;
                    console.log(`[INIT DEBUG] Checking DOM readiness... attempt ${attempts}/${maxAttempts}`);
                    
                    if (document.readyState === 'complete' || attempts >= maxAttempts) {
                        console.log('[INIT DEBUG] DOM ready or max attempts reached');
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
            console.log('[INIT DEBUG] Initializing ranking containers...');
            
            const games = [
                { name: 'snake', containerId: 'snake-rankings-container' },
                { name: 'memoryMatch', containerId: 'memoryMatch-rankings-container' },
                { name: 'brickBreaker', containerId: 'brickBreaker-rankings-container' }
            ];
            
            for (const game of games) {
                const container = document.getElementById(game.containerId);
                if (container && !container.querySelector('.game-rankings')) {
                    console.log(`[INIT DEBUG] Creating rankings UI for ${game.name}`);
                    
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
                } else {
                    console.log(`[INIT DEBUG] Container ${game.containerId} ${!container ? 'not found' : 'already initialized'}`);
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
                    
                    // Don't show 0 for logged-in users until we get server data
                    if (isLoggedIn && initialScore === 0) {
                        element.textContent = '--';
                    } else {
                        element.textContent = initialScore;
                    }
                    console.log(`Initialized ${game.name} high score display: ${initialScore}`);
                }
            });
        },

        /**
         * Debug function to check rankings status
         */
        debugRankings: function(gameName) {
            console.log(`=== RANKINGS DEBUG for ${gameName} ===`);
            
            // Check DOM elements
            const container = document.getElementById(`${gameName}-rankings-container`);
            const rankingsList = document.getElementById(`${gameName}-rankings-list`);
            const userRank = document.getElementById(`${gameName}-user-rank`);
            
            console.log('DOM Elements:', {
                container: !!container,
                rankingsList: !!rankingsList,
                userRank: !!userRank,
                containerHTML: container?.innerHTML?.substring(0, 100) + '...',
                rankingsListHTML: rankingsList?.innerHTML?.substring(0, 100) + '...'
            });
            
            // Check cache
            const rankingsCache = localStorage.getItem(`${gameName}_rankings_cache`);
            const userRankCache = localStorage.getItem(`${gameName}_user_rank_cache`);
            
            console.log('Cache Status:', {
                hasRankingsCache: !!rankingsCache,
                hasUserRankCache: !!userRankCache,
                rankingsCacheAge: rankingsCache ? Math.round((Date.now() - JSON.parse(rankingsCache).timestamp) / 1000) : 'N/A',
                userRankCacheAge: userRankCache ? Math.round((Date.now() - JSON.parse(userRankCache).timestamp) / 1000) : 'N/A'
            });
            
            // Check auth status
            const token = localStorage.getItem('token');
            console.log('Auth Status:', {
                hasToken: !!token,
                tokenLength: token?.length || 0
            });
            
            // Check refresh intervals
            console.log('Refresh Intervals:', {
                hasRefreshIntervals: !!this._refreshIntervals,
                activeIntervals: this._refreshIntervals ? Object.keys(this._refreshIntervals) : []
            });
            
            console.log('=== END DEBUG ===');
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
    
    // Debug helper functions for console use
    window.debugRankings = function(gameName = 'snake') {
        gameScores.debugRankings(gameName);
    };
    
    window.refreshRankings = async function(gameName = 'snake') {
        console.log(`Manually refreshing rankings for ${gameName}...`);
        const containerId = `${gameName}-rankings-container`;
        await gameScores.updateRankingsUI(gameName, containerId, false);
        console.log(`Refresh complete for ${gameName}`);
    };
    
    window.clearRankingsCache = function(gameName = null) {
        if (gameName) {
            localStorage.removeItem(`${gameName}_rankings_cache`);
            localStorage.removeItem(`${gameName}_user_rank_cache`);
            console.log(`Cleared cache for ${gameName}`);
        } else {
            const games = ['snake', 'memoryMatch', 'brickBreaker'];
            games.forEach(game => {
                localStorage.removeItem(`${game}_rankings_cache`);
                localStorage.removeItem(`${game}_user_rank_cache`);
            });
            console.log('Cleared all rankings cache');
        }
    };
})();
