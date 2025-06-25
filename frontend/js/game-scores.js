/**
 * Game Scores Service
 * Handles score submission and rankings display for games
 */

(function() {
    // Define API_URL for use in this module
    const API_URL = window.API ? window.API.baseURL : 'https://sanjayraj-n.onrender.com';
    
    // Initialize the service when the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        
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
                        score,
                        level,
                        timeElapsed
                    })
                });

                // If response is not ok, log more details
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
                const response = await fetch(`${API_URL}/api/scores/rankings/${gameName}`);
                
                // Check if the response is ok (status in the range 200-299)
                if (!response.ok) {
                    return [];
                }
                
                const data = await response.json();
                
                // Ensure the data is an array
                if (!Array.isArray(data)) {
                    return [];
                }
                
                return data;
            } catch (error) {
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
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                // Check if the response is ok (status in the range 200-299)
                if (!response.ok) {
                    return { rank: null, score: null };
                }
                
                const data = await response.json();
                
                // Validate the data structure
                if (!data || (data.rank === undefined && data.score === undefined)) {
                    return { rank: null, score: null };
                }
                
                return data;
            } catch (error) {
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
         */
        updateRankingsUI: async function(gameName, containerId) {
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
                    // Use Promise.allSettled to handle potential failures gracefully
                    const results = await Promise.allSettled([
                        this.getRankings(gameName),
                        this.getUserRank(gameName)
                    ]);
                    
                    // Check if rankings request succeeded
                    if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) {
                        rankings = results[0].value;
                    }
                    
                    // Check if user rank request succeeded
                    if (results[1].status === 'fulfilled' && results[1].value) {
                        userRank = results[1].value;
                    }
                } catch (fetchError) {
                    // Handle fetch errors silently
                }

                // Update rankings list
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

                // Update user rank
                if (userRank && userRank.rank) {
                    userRankElement.innerHTML = `
                        <div class="user-rank-title">Your Rank</div>
                        <div class="user-rank-info">
                            <span class="user-rank-position">#${userRank.rank}</span>
                            <span class="user-rank-score">Score: ${userRank.score}</span>
                        </div>
                    `;
                } else {
                    userRankElement.innerHTML = `
                        <div class="user-rank-title">Your Rank</div>
                        <div class="user-rank-info">
                            <span class="user-not-ranked">Not ranked yet</span>
                        </div>
                    `;
                }
            } catch (error) {
                rankingsList.innerHTML = '<div class="rankings-error">Error loading rankings</div>';
            }
        }
    };

    // Make the service available globally
    window.gameScores = gameScores;
})();
