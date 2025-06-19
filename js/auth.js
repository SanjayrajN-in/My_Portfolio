// Configuration
const API_BASE_URL = 'http://localhost:3000';

// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check if user is logged in via token validation
        const token = localStorage.getItem('token');
        
        if (token) {
            try {
                // Validate token with server
                const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    this.currentUser = userData.user;
                    console.log('User authenticated from server:', this.currentUser);
                } else {
                    // Token is invalid, clear it
                    console.log('Token invalid, clearing storage');
                    localStorage.clear();
                    sessionStorage.clear();
                }
            } catch (error) {
                console.error('Token validation error:', error);
                localStorage.clear();
                sessionStorage.clear();
            }
        }

        // Initialize profile page if on profile page
        if (window.location.pathname.includes('profile.html')) {
            this.initProfilePage();
        }

        // Update navigation for all pages
        this.updateNavigation();
    }

    initProfilePage() {
        // If user is not logged in, redirect to home and show login modal
        if (!this.currentUser) {
            window.location.href = '../index.html';
            return;
        }

        // Load profile data
        this.loadProfileData();
    }

    async handleLogin(e) {
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            this.showMessage('Logging in...', 'info');
            
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.user) {
                // Login successful
                this.currentUser = data.user;
                console.log('🎉 Login successful! User set:', this.currentUser);
                
                // Only store token for session management, no user data in localStorage
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                
                // Update navigation immediately to show avatar
                console.log('🔄 About to call updateNavigation...');
                this.updateNavigation();
                console.log('✅ updateNavigation called');
                
                this.showMessage('Login successful! Welcome back.', 'success');
                
                // Close modal if it's open
                if (typeof loginModal !== 'undefined' && loginModal) {
                    setTimeout(() => {
                        loginModal.close();
                    }, 1500);
                }
            } else {
                this.showMessage(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    async handleRegister(e) {
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        // Client-side validation
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        // Enhanced password validation
        const passwordValidation = this.validatePassword(password);
        if (!passwordValidation.isValid) {
            this.showMessage(passwordValidation.message, 'error');
            return;
        }

        try {
            this.showMessage('Sending verification code...', 'info');
            
            // First, send OTP for email verification
            const otpResponse = await fetch('http://localhost:3000/api/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, type: 'register' })
            });

            const otpData = await otpResponse.json();

            if (otpResponse.ok) {
                // Store registration data temporarily
                sessionStorage.setItem('pendingRegistration', JSON.stringify({
                    name, email, password, type: 'register'
                }));

                this.showMessage('Verification code sent to your email!', 'success');
                this.showOTPModal(email, 'register');
            } else {
                if (otpData.shouldLogin) {
                    this.showMessage(otpData.message, 'error');
                    // Auto-switch to login form after 2 seconds
                    setTimeout(() => {
                        if (typeof loginModal !== 'undefined' && loginModal) {
                            loginModal.switchToLogin();
                        } else if (typeof switchToLogin === 'function') {
                            switchToLogin();
                        }
                    }, 2000);
                } else {
                    this.showMessage(otpData.message || 'Failed to send verification code', 'error');
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    async logout() {
        try {
            // Call logout API to invalidate session on server
            const response = await fetch('http://localhost:3000/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                }
            });

            const data = await response.json();
            console.log('Logout response:', data);
        } catch (error) {
            console.error('Logout API error:', error);
        }

        // Clear all client-side data regardless of API response
        this.currentUser = null;
        
        // Clear all local storage items
        localStorage.clear();
        
        // Clear session storage as well
        sessionStorage.clear();
        
        // Clear any cookies if they exist
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        console.log('User logged out, all storage cleared');
        
        // Update navigation immediately
        this.updateNavigation();
        
        // Show logout message
        this.showFloatingNotification('You have been logged out successfully.', 'success');
        
        // Redirect to home page after a brief delay
        setTimeout(() => {
            if (window.location.pathname.includes('profile.html')) {
                window.location.href = '../index.html';
            } else {
                window.location.reload();
            }
        }, 1500);
    }

    updateNavigation() {
        console.log('📍 updateNavigation called, user logged in:', !!this.currentUser);
        const navContainer = document.querySelector('.nav-container');
        const navLinks = document.querySelector('.nav-links');
        const hamburger = document.querySelector('.hamburger');
        const isInPagesFolder = window.location.pathname.includes('pages/');
        
        console.log('🔍 DOM elements found:');
        console.log('  navContainer:', !!navContainer);
        console.log('  navLinks:', !!navLinks);
        console.log('  hamburger:', !!hamburger);
        
        if (this.currentUser) {
            // User is logged in - create or show user menu
            let userMenu = document.querySelector('.user-menu');
            
            if (!userMenu) {
                // Create user menu if it doesn't exist
                userMenu = document.createElement('div');
                userMenu.className = 'user-menu';
                
                const avatarPath = isInPagesFolder ? '../images/default-avatar.svg' : 'images/default-avatar.svg';
                const profilePath = isInPagesFolder ? 'profile.html' : 'pages/profile.html';
                
                userMenu.innerHTML = `
                    <div class="user-avatar-container">
                        <img src="${avatarPath}" alt="User Avatar" class="user-avatar" id="navUserAvatar">
                        <div class="user-dropdown">
                            <a href="${profilePath}" class="dropdown-item">
                                <i class="fas fa-user"></i>
                                <span>Profile</span>
                            </a>
                            <button onclick="authSystem.logout()" class="dropdown-item logout-btn">
                                <i class="fas fa-sign-out-alt"></i>
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                `;
                
                // Insert user menu before hamburger button
                navContainer.insertBefore(userMenu, hamburger);
                console.log('✅ User menu created and added to DOM');
                console.log('User menu HTML:', userMenu.outerHTML);
            }
            
            // Show user menu with proper styles (need !important to override CSS)
            userMenu.style.setProperty('display', 'flex', 'important');
            userMenu.style.setProperty('visibility', 'visible', 'important');
            userMenu.style.setProperty('opacity', '1', 'important');
            userMenu.style.alignItems = 'center';
            userMenu.style.marginLeft = '1rem';
            userMenu.classList.add('show');
            
            // Update avatar if user has one
            const userAvatar = document.getElementById('navUserAvatar');
            if (userAvatar && this.currentUser.avatar) {
                let avatarPath = this.currentUser.avatar;
                if (isInPagesFolder && !avatarPath.startsWith('../') && !avatarPath.startsWith('http') && !avatarPath.startsWith('data:')) {
                    avatarPath = '../' + avatarPath.replace(/^\//, '');
                } else if (!isInPagesFolder && avatarPath.startsWith('../')) {
                    avatarPath = avatarPath.substring(3);
                }
                userAvatar.src = avatarPath;
            }
            
            console.log('✅ User menu shown for user:', this.currentUser.name);
            console.log('User menu styles:', {
                display: userMenu.style.display,
                visibility: userMenu.style.visibility,
                opacity: userMenu.style.opacity
            });

            // Remove login button if exists
            const loginBtn = document.querySelector('.login-btn');
            if (loginBtn) {
                loginBtn.remove();
            }
        } else {
            // User is NOT logged in - hide user menu
            console.log('❌ No user logged in, hiding user menu');
            const userMenu = document.querySelector('.user-menu');
            if (userMenu) {
                userMenu.style.display = 'none';
                userMenu.style.visibility = 'hidden';
                userMenu.style.opacity = '0';
                userMenu.classList.remove('show');
            }

            // Add login button if not exists
            if (navLinks && !document.querySelector('.login-btn')) {
                const loginBtn = document.createElement('li');
                loginBtn.className = 'login-btn';
                loginBtn.innerHTML = `
                    <a href="#" onclick="openLoginModal(); return false;" class="login-link">
                        <i class="fas fa-sign-in-alt"></i>
                        <span>Login</span>
                    </a>
                `;
                navLinks.appendChild(loginBtn);
            }
        }
    }

    updateUI() {
        this.updateNavigation();
    }

    loadProfileData() {
        if (!this.currentUser) return;

        // Update profile information
        document.getElementById('profileName').textContent = this.currentUser.name;
        document.getElementById('profileEmail').textContent = this.currentUser.email;
        const isInPagesFolder = window.location.pathname.includes('pages/');
        let avatarPath = this.currentUser.avatar || 'images/default-avatar.svg';
        if (isInPagesFolder && !avatarPath.startsWith('../') && !avatarPath.startsWith('http') && !avatarPath.startsWith('data:')) {
            avatarPath = '../' + avatarPath;
        }
        document.getElementById('profileAvatar').src = avatarPath;
        
        // Format joined date
        const joinedDate = new Date(this.currentUser.joinedDate);
        document.getElementById('profileJoined').textContent = joinedDate.toLocaleDateString();

        // Load game statistics
        this.loadGameStats();
        this.loadRecentGames();
        this.loadAchievements();
    }

    loadGameStats() {
        const stats = this.currentUser.gameStats;
        
        document.getElementById('totalGamesPlayed').textContent = stats.totalGamesPlayed || 0;
        
        // Format playtime
        const totalMinutes = stats.totalPlaytime || 0;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        document.getElementById('totalPlaytime').textContent = `${hours}h ${minutes}m`;

        // Find favorite game
        const gameHistory = stats.gamesHistory || [];
        const gamePlayCounts = {};
        gameHistory.forEach(game => {
            gamePlayCounts[game.name] = (gamePlayCounts[game.name] || 0) + 1;
        });
        
        const favoriteGame = Object.keys(gamePlayCounts).reduce((a, b) => 
            gamePlayCounts[a] > gamePlayCounts[b] ? a : b, 'None');
        document.getElementById('favoriteGame').textContent = favoriteGame;

        // Find longest session
        const longestSession = gameHistory.reduce((max, game) => 
            Math.max(max, game.duration || 0), 0);
        document.getElementById('longestSession').textContent = `${longestSession}m`;
    }

    loadRecentGames() {
        const gamesList = document.getElementById('recentGamesList');
        const gameHistory = this.currentUser.gameStats.gamesHistory || [];
        
        if (gameHistory.length === 0) {
            gamesList.innerHTML = `
                <div class="no-games-message">
                    <i class="fas fa-gamepad"></i>
                    <p>No games played yet. Start playing to see your history!</p>
                    <a href="games.html" class="play-games-btn">
                        <i class="fas fa-play"></i> Play Games
                    </a>
                </div>
            `;
            return;
        }

        // Sort by date (most recent first)
        const recentGames = gameHistory.sort((a, b) => 
            new Date(b.date) - new Date(a.date)).slice(0, 10);

        gamesList.innerHTML = recentGames.map(game => `
            <div class="game-item">
                <div class="game-info">
                    <h4>${game.name}</h4>
                    <p class="game-date">${new Date(game.date).toLocaleDateString()}</p>
                </div>
                <div class="game-stats">
                    <span class="game-duration">${game.duration || 0}m</span>
                    <span class="game-score">${game.score || 'N/A'}</span>
                </div>
            </div>
        `).join('');
    }

    loadAchievements() {
        const achievementsList = document.getElementById('achievementsList');
        const achievements = this.currentUser.gameStats.achievements || [];
        
        // Define possible achievements
        const allAchievements = [
            { id: 'first_game', name: 'First Game', description: 'Play your first game', icon: 'fas fa-play' },
            { id: 'game_master', name: 'Game Master', description: 'Play 10 different games', icon: 'fas fa-crown' },
            { id: 'time_waster', name: 'Time Waster', description: 'Play for 1 hour total', icon: 'fas fa-clock' },
            { id: 'dedication', name: 'Dedication', description: 'Play for 5 hours total', icon: 'fas fa-medal' },
            { id: 'high_scorer', name: 'High Scorer', description: 'Achieve a high score', icon: 'fas fa-trophy' }
        ];

        achievementsList.innerHTML = allAchievements.map(achievement => {
            const isUnlocked = achievements.includes(achievement.id);
            return `
                <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">
                        <i class="${achievement.icon}"></i>
                    </div>
                    <div class="achievement-info">
                        <h4>${achievement.name}</h4>
                        <p>${achievement.description}</p>
                    </div>
                    ${isUnlocked ? '<div class="achievement-unlocked"><i class="fas fa-check"></i></div>' : ''}
                </div>
            `;
        }).join('');
    }

    showMessage(message, type) {
        // Try to show message in modal first
        const modalMessageDiv = document.getElementById('modalMessage');
        if (modalMessageDiv && document.querySelector('.login-modal-overlay.active')) {
            modalMessageDiv.innerHTML = `<div class="${type}-message">${message}</div>`;
            return;
        }

        // Fallback to auth message div
        const messageDiv = document.getElementById('authMessage');
        if (messageDiv) {
            messageDiv.className = `auth-message ${type}`;
            messageDiv.textContent = message;
            messageDiv.style.display = 'block';

            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
            return;
        }

        // Create a floating notification if no message container is found
        this.showFloatingNotification(message, type);
    }

    showFloatingNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `floating-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles if not already present
        if (!document.getElementById('floatingNotificationStyles')) {
            const styles = document.createElement('style');
            styles.id = 'floatingNotificationStyles';
            styles.textContent = `
                .floating-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000000;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    font-weight: 500;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    opacity: 0;
                    transform: translateX(100%);
                    transition: all 0.3s ease;
                }
                .floating-notification.success {
                    background: rgba(40, 167, 69, 0.9);
                    color: white;
                    border: 1px solid rgba(40, 167, 69, 0.3);
                }
                .floating-notification.error {
                    background: rgba(220, 53, 69, 0.9);
                    color: white;
                    border: 1px solid rgba(220, 53, 69, 0.3);
                }
                .floating-notification.info {
                    background: rgba(0, 123, 255, 0.9);
                    color: white;
                    border: 1px solid rgba(0, 123, 255, 0.3);
                }
                .floating-notification.show {
                    opacity: 1;
                    transform: translateX(0);
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Game tracking methods
    startGameSession(gameName) {
        if (!this.currentUser) return null;

        const sessionId = Date.now().toString();
        const sessionData = {
            id: sessionId,
            gameName,
            startTime: Date.now(),
            endTime: null,
            duration: 0
        };

        sessionStorage.setItem('currentGameSession', JSON.stringify(sessionData));
        return sessionId;
    }

    async endGameSession(score = null) {
        if (!this.currentUser) return;

        const sessionData = JSON.parse(sessionStorage.getItem('currentGameSession'));
        if (!sessionData) return;

        const endTime = Date.now();
        const duration = Math.round((endTime - sessionData.startTime) / 60000); // Convert to minutes

        // Prepare game data
        const gameData = {
            name: sessionData.gameName,
            duration,
            score: score || 'N/A'
        };

        try {
            // Send game stats to API
            const response = await fetch('/api/users/update-game-stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    gameData: gameData
                })
            });

            if (response.ok) {
                const data = await response.json();
                
                // Update local user data with new stats
                this.currentUser.gameStats = data.gameStats;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                // Show achievement notifications if any
                if (data.newAchievements && data.newAchievements.length > 0) {
                    this.showAchievementNotifications(data.newAchievements);
                }
                
                console.log('Game stats updated successfully');
            } else {
                console.error('Failed to update game stats:', await response.text());
                // Fallback to local storage update
                this.updateGameStatsLocally(gameData);
            }
        } catch (error) {
            console.error('Error updating game stats:', error);
            // Fallback to local storage update
            this.updateGameStatsLocally(gameData);
        }

        // Clear session
        sessionStorage.removeItem('currentGameSession');
    }

    // Fallback method for local storage update
    updateGameStatsLocally(gameData) {
        const gameRecord = {
            name: gameData.name,
            date: new Date().toISOString(),
            duration: gameData.duration,
            score: gameData.score
        };

        this.currentUser.gameStats.gamesHistory = this.currentUser.gameStats.gamesHistory || [];
        this.currentUser.gameStats.gamesHistory.push(gameRecord);
        this.currentUser.gameStats.totalGamesPlayed = (this.currentUser.gameStats.totalGamesPlayed || 0) + 1;
        this.currentUser.gameStats.totalPlaytime = (this.currentUser.gameStats.totalPlaytime || 0) + gameData.duration;

        // Check for achievements
        this.checkAchievements();

        // Save updated user data
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }

    // Show achievement notifications
    showAchievementNotifications(achievements) {
        achievements.forEach(achievement => {
            const achievementNames = {
                'first_game': 'First Game',
                'game_master': 'Game Master',
                'time_waster': 'Time Waster',
                'dedication': 'Dedication',
                'high_scorer': 'High Scorer'
            };
            
            const name = achievementNames[achievement] || achievement;
            this.showMessage(`🏆 Achievement Unlocked: ${name}!`, 'success');
        });
    }

    // OTP Modal Methods
    showOTPModal(email, type) {
        // Create OTP modal if it doesn't exist
        let otpModal = document.getElementById('otpModal');
        if (!otpModal) {
            otpModal = this.createOTPModal();
            document.body.appendChild(otpModal);
        }

        // Update modal content
        document.getElementById('otpEmail').textContent = email;
        document.getElementById('otpType').textContent = type === 'register' ? 'Registration' : 'Login';
        document.getElementById('otpInput').value = '';
        
        // Show modal
        otpModal.style.display = 'flex';
        document.getElementById('otpInput').focus();
        
        // Start timer
        this.startOTPTimer();
    }

    createOTPModal() {
        const modal = document.createElement('div');
        modal.id = 'otpModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content otp-modal">
                <div class="modal-header">
                    <h2>📧 Email Verification</h2>
                    <button class="close-btn" onclick="authSystem.closeOTPModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="otp-instruction">
                        We've sent a 6-digit verification code to<br>
                        <strong id="otpEmail"></strong>
                    </p>
                    <p class="otp-subtext">
                        Please check your email and enter the code below to complete your <span id="otpType"></span>.
                    </p>
                    
                    <form id="otpForm" onsubmit="authSystem.handleOTPSubmit(event)">
                        <div class="otp-input-container">
                            <input 
                                type="text" 
                                id="otpInput" 
                                placeholder="Enter 6-digit code"
                                maxlength="6"
                                pattern="[0-9]{6}"
                                required
                                autocomplete="one-time-code"
                            >
                        </div>
                        
                        <div class="otp-actions">
                            <button type="submit" class="btn primary-btn">
                                <i class="fas fa-check"></i>
                                Verify Code
                            </button>
                            <button type="button" class="btn secondary-btn" onclick="authSystem.resendOTP()">
                                <i class="fas fa-redo"></i>
                                Resend Code
                            </button>
                        </div>
                    </form>
                    
                    <div class="otp-timer">
                        <p>Code expires in: <span id="otpTimer">10:00</span></p>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        if (!document.getElementById('otpModalStyles')) {
            const styles = document.createElement('style');
            styles.id = 'otpModalStyles';
            styles.textContent = `
                .otp-modal {
                    max-width: 450px;
                    text-align: center;
                }
                
                .otp-instruction {
                    font-size: 16px;
                    margin-bottom: 15px;
                    color: #333;
                }
                
                .otp-subtext {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 30px;
                    line-height: 1.5;
                }
                
                .otp-input-container {
                    margin-bottom: 25px;
                }
                
                #otpInput {
                    width: 200px;
                    height: 60px;
                    font-size: 24px;
                    text-align: center;
                    letter-spacing: 8px;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                }
                
                #otpInput:focus {
                    border-color: var(--primary-color);
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .otp-actions {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    margin-bottom: 20px;
                }
                
                .otp-actions .btn {
                    flex: 1;
                    max-width: 150px;
                }
                
                .otp-timer {
                    font-size: 14px;
                    color: #666;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border: 1px solid #e9ecef;
                }
                
                #otpTimer {
                    font-weight: bold;
                    color: #dc3545;
                }
            `;
            document.head.appendChild(styles);
        }
        
        return modal;
    }

    closeOTPModal() {
        const modal = document.getElementById('otpModal');
        if (modal) {
            modal.style.display = 'none';
        }
        // Clear pending registration data
        sessionStorage.removeItem('pendingRegistration');
    }

    async handleOTPSubmit(e) {
        e.preventDefault();
        
        const otp = document.getElementById('otpInput').value.trim();
        if (otp.length !== 6) {
            this.showMessage('Please enter a 6-digit code', 'error');
            return;
        }

        const pendingData = JSON.parse(sessionStorage.getItem('pendingRegistration'));
        if (!pendingData) {
            this.showMessage('Session expired. Please try again.', 'error');
            this.closeOTPModal();
            return;
        }

        try {
            this.showMessage('Verifying code...', 'info');
            
            const response = await fetch('http://localhost:3000/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: pendingData.email,
                    otp: otp,
                    type: pendingData.type,
                    userData: pendingData.type === 'register' ? {
                        name: pendingData.name,
                        password: pendingData.password
                    } : null
                })
            });

            const data = await response.json();

            if (response.ok && data.user) {
                // Success - login user
                this.currentUser = data.user;
                
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }

                this.closeOTPModal();
                
                // Update navigation immediately to show avatar
                this.updateNavigation();
                
                this.showMessage(data.message || 'Verification successful!', 'success');
                
                // Close modal if it's open
                if (typeof loginModal !== 'undefined' && loginModal) {
                    setTimeout(() => {
                        loginModal.close();
                    }, 1500);
                }
            } else {
                this.showMessage(data.message || 'Invalid verification code', 'error');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    async resendOTP() {
        const pendingData = JSON.parse(sessionStorage.getItem('pendingRegistration'));
        if (!pendingData) {
            this.showMessage('Session expired. Please try again.', 'error');
            this.closeOTPModal();
            return;
        }

        try {
            this.showMessage('Resending code...', 'info');
            
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: pendingData.email,
                    type: pendingData.type
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('New verification code sent!', 'success');
                // Reset timer
                this.startOTPTimer();
            } else {
                this.showMessage(data.message || 'Failed to resend code', 'error');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    startOTPTimer() {
        let timeLeft = 600; // 10 minutes in seconds
        const timerElement = document.getElementById('otpTimer');
        
        const timer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            if (timerElement) {
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                if (timerElement) {
                    timerElement.textContent = 'Expired';
                    timerElement.style.color = '#dc3545';
                }
            }
            
            timeLeft--;
        }, 1000);
    }

    // Password validation function
    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        if (password.length < minLength) {
            return {
                isValid: false,
                message: `Password must be at least ${minLength} characters long`
            };
        }
        
        if (!hasUpperCase) {
            return {
                isValid: false,
                message: 'Password must contain at least one uppercase letter (A-Z)'
            };
        }
        
        if (!hasLowerCase) {
            return {
                isValid: false,
                message: 'Password must contain at least one lowercase letter (a-z)'
            };
        }
        
        if (!hasNumbers) {
            return {
                isValid: false,
                message: 'Password must contain at least one number (0-9)'
            };
        }
        
        if (!hasSpecialChar) {
            return {
                isValid: false,
                message: 'Password must contain at least one special character (!@#$%^&*)'
            };
        }
        
        return {
            isValid: true,
            message: 'Password meets all requirements'
        };
    }

    // Forgot password functionality
    async forgotPassword(email) {
        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, type: 'forgot-password' })
            });

            const data = await response.json();

            if (response.ok) {
                // Store email for password reset
                sessionStorage.setItem('passwordResetEmail', email);
                this.showMessage('Password reset code sent to your email!', 'success');
                this.showPasswordResetModal(email);
                return { success: true, message: data.message };
            } else {
                this.showMessage(data.message || 'Failed to send reset code', 'error');
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            this.showMessage('Network error. Please try again.', 'error');
            return { success: false, message: 'Network error' };
        }
    }

    showPasswordResetModal(email) {
        // Create password reset modal if it doesn't exist
        let resetModal = document.getElementById('passwordResetModal');
        if (!resetModal) {
            resetModal = this.createPasswordResetModal();
            document.body.appendChild(resetModal);
        }

        // Update modal content
        document.getElementById('resetEmail').textContent = email;
        document.getElementById('resetOtpInput').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
        
        // Show modal
        resetModal.style.display = 'flex';
        document.getElementById('resetOtpInput').focus();
        
        // Start timer
        this.startResetTimer();
    }

    createPasswordResetModal() {
        const modal = document.createElement('div');
        modal.id = 'passwordResetModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content password-reset-modal">
                <div class="modal-header">
                    <h2>🔑 Reset Password</h2>
                    <button class="close-btn" onclick="authSystem.closePasswordResetModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="reset-instruction">
                        We've sent a verification code to<br>
                        <strong id="resetEmail"></strong>
                    </p>
                    
                    <form id="passwordResetForm" onsubmit="authSystem.handlePasswordReset(event)">
                        <div class="form-group">
                            <label for="resetOtpInput">Verification Code:</label>
                            <input 
                                type="text" 
                                id="resetOtpInput" 
                                placeholder="Enter 6-digit code"
                                maxlength="6"
                                pattern="[0-9]{6}"
                                required
                                autocomplete="one-time-code"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="newPassword">New Password:</label>
                            <input 
                                type="password" 
                                id="newPassword" 
                                placeholder="Enter new password"
                                required
                            >
                            <div class="password-requirements">
                                <small>Password must contain:</small>
                                <ul>
                                    <li>At least 8 characters</li>
                                    <li>One uppercase letter (A-Z)</li>
                                    <li>One lowercase letter (a-z)</li>
                                    <li>One number (0-9)</li>
                                    <li>One special character (!@#$%^&*)</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="confirmNewPassword">Confirm New Password:</label>
                            <input 
                                type="password" 
                                id="confirmNewPassword" 
                                placeholder="Confirm new password"
                                required
                            >
                        </div>
                        
                        <div class="reset-actions">
                            <button type="submit" class="btn primary-btn">
                                <i class="fas fa-key"></i>
                                Reset Password
                            </button>
                            <button type="button" class="btn secondary-btn" onclick="authSystem.resendPasswordResetOTP()">
                                <i class="fas fa-redo"></i>
                                Resend Code
                            </button>
                        </div>
                    </form>
                    
                    <div class="reset-timer">
                        <p>Code expires in: <span id="resetTimer">10:00</span></p>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles for password reset modal
        if (!document.getElementById('passwordResetStyles')) {
            const styles = document.createElement('style');
            styles.id = 'passwordResetStyles';
            styles.textContent = `
                .password-reset-modal {
                    max-width: 500px;
                }
                
                .reset-instruction {
                    font-size: 16px;
                    margin-bottom: 25px;
                    color: #333;
                    text-align: center;
                }
                
                .password-requirements {
                    margin-top: 8px;
                    padding: 12px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border-left: 4px solid #007bff;
                }
                
                .password-requirements small {
                    font-weight: 600;
                    color: #495057;
                }
                
                .password-requirements ul {
                    margin: 8px 0 0 0;
                    padding-left: 20px;
                }
                
                .password-requirements li {
                    font-size: 12px;
                    color: #6c757d;
                    margin-bottom: 4px;
                }
                
                .reset-actions {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    margin: 25px 0 20px 0;
                }
                
                .reset-actions .btn {
                    flex: 1;
                    max-width: 180px;
                }
                
                .reset-timer {
                    font-size: 14px;
                    color: #666;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border: 1px solid #e9ecef;
                    text-align: center;
                }
                
                #resetTimer {
                    font-weight: bold;
                    color: #dc3545;
                }
            `;
            document.head.appendChild(styles);
        }
        
        return modal;
    }

    closePasswordResetModal() {
        const modal = document.getElementById('passwordResetModal');
        if (modal) {
            modal.style.display = 'none';
        }
        sessionStorage.removeItem('passwordResetEmail');
    }

    async handlePasswordReset(e) {
        e.preventDefault();
        
        const otp = document.getElementById('resetOtpInput').value.trim();
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        
        if (otp.length !== 6) {
            this.showMessage('Please enter a 6-digit code', 'error');
            return;
        }
        
        if (newPassword !== confirmNewPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }
        
        // Validate password strength
        const passwordValidation = this.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            this.showMessage(passwordValidation.message, 'error');
            return;
        }
        
        const email = sessionStorage.getItem('passwordResetEmail');
        if (!email) {
            this.showMessage('Session expired. Please try again.', 'error');
            this.closePasswordResetModal();
            return;
        }

        try {
            this.showMessage('Resetting password...', 'info');
            
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    otp: otp,
                    type: 'forgot-password',
                    userData: { newPassword: newPassword }
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.closePasswordResetModal();
                this.showMessage(data.message || 'Password reset successful!', 'success');
                
                // Auto-switch to login form after 2 seconds
                setTimeout(() => {
                    if (typeof switchToLogin === 'function') {
                        switchToLogin();
                    }
                }, 2000);
            } else {
                this.showMessage(data.message || 'Password reset failed', 'error');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    async resendPasswordResetOTP() {
        const email = sessionStorage.getItem('passwordResetEmail');
        if (!email) {
            this.showMessage('Session expired. Please try again.', 'error');
            this.closePasswordResetModal();
            return;
        }

        try {
            this.showMessage('Resending code...', 'info');
            
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    type: 'forgot-password'
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('New verification code sent!', 'success');
                this.startResetTimer();
            } else {
                this.showMessage(data.message || 'Failed to resend code', 'error');
            }
        } catch (error) {
            console.error('Resend password reset OTP error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    startResetTimer() {
        let timeLeft = 600; // 10 minutes in seconds
        const timerElement = document.getElementById('resetTimer');
        
        const timer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            if (timerElement) {
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                if (timerElement) {
                    timerElement.textContent = 'Expired';
                    timerElement.style.color = '#dc3545';
                }
            }
            
            timeLeft--;
        }, 1000);
    }

    checkAchievements() {
        if (!this.currentUser) return;

        const stats = this.currentUser.gameStats;
        const achievements = stats.achievements || [];

        // First game
        if (stats.totalGamesPlayed >= 1 && !achievements.includes('first_game')) {
            achievements.push('first_game');
        }

        // Game master
        const uniqueGames = [...new Set(stats.gamesHistory.map(g => g.name))];
        if (uniqueGames.length >= 10 && !achievements.includes('game_master')) {
            achievements.push('game_master');
        }

        // Time waster (1 hour = 60 minutes)
        if (stats.totalPlaytime >= 60 && !achievements.includes('time_waster')) {
            achievements.push('time_waster');
        }

        // Dedication (5 hours = 300 minutes)
        if (stats.totalPlaytime >= 300 && !achievements.includes('dedication')) {
            achievements.push('dedication');
        }

        this.currentUser.gameStats.achievements = achievements;
    }

    // Remove the old login/register methods since we're using handleLogin/handleRegister



    // Show forgot password form
    showForgotPasswordForm() {
        const email = document.getElementById('loginEmail')?.value || '';
        
        if (!email) {
            this.showMessage('Please enter your email address first', 'error');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        this.forgotPassword(email);
    }
}

// Initialize auth system
const authSystem = new AuthSystem();
console.log('🔧 AuthSystem initialized:', authSystem);

// Immediately ensure user menu is hidden on page load if not logged in
document.addEventListener('DOMContentLoaded', function() {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu && !authSystem.currentUser) {
        userMenu.style.display = 'none';
        userMenu.style.visibility = 'hidden';
        userMenu.style.opacity = '0';
        userMenu.classList.remove('show');
    }
    
    // Update navigation based on auth status
    authSystem.updateNavigation();
});

// Profile page protection
function protectProfilePage() {
    // Show auth check overlay
    const authCheck = document.getElementById('authCheck');
    if (authCheck) {
        authCheck.style.display = 'flex';
    }
    
    // Check authentication after a short delay
    setTimeout(() => {
        if (!authSystem.currentUser) {
            // Not logged in - redirect to home
            window.location.href = '../index.html';
        } else {
            // Logged in - hide auth check and load profile
            if (authCheck) {
                authCheck.style.display = 'none';
            }
            // Load profile data if function exists
            if (typeof authSystem.loadProfileData === 'function') {
                authSystem.loadProfileData();
            }
        }
    }, 500); // Small delay to show the loading animation
}

// Check if this is the profile page and protect it
if (window.location.pathname.includes('profile.html')) {
    // Immediate check - don't wait for DOM if user is not logged in
    if (!localStorage.getItem('currentUser')) {
        window.location.href = '../index.html';
    } else {
        document.addEventListener('DOMContentLoaded', protectProfilePage);
    }
}

// Global functions for HTML onclick events
function switchToRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('switchToRegister').style.display = 'none';
    document.getElementById('switchToLogin').style.display = 'block';
    document.querySelector('.login-title').textContent = 'Create Account';
    document.querySelector('.login-subtitle').textContent = 'Sign up for a new account';
}

function switchToLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('switchToRegister').style.display = 'block';
    document.getElementById('switchToLogin').style.display = 'none';
    document.querySelector('.login-title').textContent = 'Welcome Back';
    document.querySelector('.login-subtitle').textContent = 'Sign in to your account';
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function logout() {
    authSystem.logout();
}



// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { authSystem };
}