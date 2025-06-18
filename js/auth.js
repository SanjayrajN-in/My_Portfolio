// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is logged in
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUI();
        }

        // Login page no longer exists - using modal system

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

    handleLogin(e) {
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        // Get registered users
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        
        // Find user
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Login successful
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            this.showMessage('Login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        } else {
            this.showMessage('Invalid email or password', 'error');
        }
    }

    handleRegister(e) {
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        // Validation
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters long', 'error');
            return;
        }

        // Get existing users
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        
        // Check if email already exists
        if (users.find(u => u.email === email)) {
            this.showMessage('Email already registered', 'error');
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            avatar: 'images/default-avatar.svg', // Store relative to root
            joinedDate: new Date().toISOString(),
            gameStats: {
                totalGamesPlayed: 0,
                totalPlaytime: 0,
                gamesHistory: [],
                achievements: []
            }
        };

        // Save user
        users.push(newUser);
        localStorage.setItem('registeredUsers', JSON.stringify(users));

        // Auto login
        this.currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));

        this.showMessage('Account created successfully! Redirecting...', 'success');
        
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1500);
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        
        // Redirect to home page
        if (window.location.pathname.includes('profile.html')) {
            window.location.href = '../index.html';
        } else {
            window.location.reload();
        }
    }

    updateNavigation() {
        const navLinks = document.querySelector('.nav-links');
        const userMenu = document.querySelector('.user-menu');
        const isInPagesFolder = window.location.pathname.includes('pages/');
        
        if (this.currentUser) {
            // User is logged in - show user menu and avatar
            if (userMenu) {
                userMenu.style.display = 'flex';
                userMenu.style.visibility = 'visible';
                userMenu.classList.add('show'); // For mobile
                
                const userAvatar = document.getElementById('navUserAvatar');
                if (userAvatar) {
                    // Set correct avatar path based on current page location
                    let avatarPath = this.currentUser.avatar;
                    if (avatarPath) {
                        // If we're in a subfolder and avatar path doesn't start with ../ add it
                        if (isInPagesFolder && !avatarPath.startsWith('../') && !avatarPath.startsWith('http') && !avatarPath.startsWith('data:')) {
                            avatarPath = '../' + avatarPath.replace(/^\//, '');
                        } else if (!isInPagesFolder && avatarPath.startsWith('../')) {
                            // If we're in root and avatar path starts with ../ remove it
                            avatarPath = avatarPath.substring(3);
                        }
                    } else {
                        // Default avatar path
                        avatarPath = isInPagesFolder ? '../images/default-avatar.svg' : 'images/default-avatar.svg';
                    }
                    userAvatar.src = avatarPath;
                    
                    // Add error handling for avatar loading
                    userAvatar.onerror = function() {
                        console.log('Avatar failed to load, using default');
                        this.src = isInPagesFolder ? '../images/default-avatar.svg' : 'images/default-avatar.svg';
                    };
                }
                
                // Show profile link in dropdown
                const profileLink = userMenu.querySelector('a[href*="profile.html"]');
                if (profileLink) {
                    profileLink.style.display = 'flex';
                    profileLink.style.visibility = 'visible';
                }
                
                // Setup dropdown functionality
                this.setupUserDropdown();
            }

            // Remove login button if exists
            const loginBtn = document.querySelector('.login-btn');
            if (loginBtn) {
                loginBtn.remove();
            }
        } else {
            // User is NOT logged in - completely hide user menu and avatar
            if (userMenu) {
                userMenu.style.display = 'none !important';
                userMenu.style.visibility = 'hidden';
                userMenu.classList.remove('show');
                
                // Hide profile link completely
                const profileLink = userMenu.querySelector('a[href*="profile.html"]');
                if (profileLink) {
                    profileLink.style.display = 'none !important';
                    profileLink.style.visibility = 'hidden';
                }
            }

            // Add login button if not exists
            if (navLinks && !document.querySelector('.login-btn')) {
                const loginBtn = document.createElement('li');
                loginBtn.className = 'login-btn';
                loginBtn.innerHTML = `
                    <button onclick="openLoginModal()" class="btn primary-btn">
                        <i class="fas fa-sign-in-alt"></i>
                        <span>Login</span>
                    </button>
                `;
                navLinks.appendChild(loginBtn);
            }
        }
    }
    
    setupUserDropdown() {
        const userAvatarContainer = document.querySelector('.user-avatar-container');
        const userDropdown = document.querySelector('.user-dropdown');
        
        if (userAvatarContainer && userDropdown) {
            // Remove any existing event listeners
            userAvatarContainer.removeEventListener('click', this.toggleDropdown);
            
            // Add click event for mobile
            userAvatarContainer.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleDropdown();
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userAvatarContainer.contains(e.target)) {
                    this.closeDropdown();
                }
            });
            
            console.log('✅ User dropdown functionality setup complete');
        }
    }
    
    toggleDropdown() {
        const userDropdown = document.querySelector('.user-dropdown');
        if (userDropdown) {
            const isVisible = userDropdown.style.opacity === '1' || userDropdown.classList.contains('show');
            if (isVisible) {
                this.closeDropdown();
            } else {
                this.openDropdown();
            }
        }
    }
    
    openDropdown() {
        const userDropdown = document.querySelector('.user-dropdown');
        if (userDropdown) {
            userDropdown.style.opacity = '1';
            userDropdown.style.visibility = 'visible';
            userDropdown.style.transform = 'translateY(0)';
            userDropdown.classList.add('show');
        }
    }
    
    closeDropdown() {
        const userDropdown = document.querySelector('.user-dropdown');
        if (userDropdown) {
            userDropdown.style.opacity = '0';
            userDropdown.style.visibility = 'hidden';
            userDropdown.style.transform = 'translateY(-10px)';
            userDropdown.classList.remove('show');
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
        const messageDiv = document.getElementById('authMessage');
        if (!messageDiv) return;

        messageDiv.className = `auth-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
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

    endGameSession(score = null) {
        if (!this.currentUser) return;

        const sessionData = JSON.parse(sessionStorage.getItem('currentGameSession'));
        if (!sessionData) return;

        const endTime = Date.now();
        const duration = Math.round((endTime - sessionData.startTime) / 60000); // Convert to minutes

        // Update game history
        const gameRecord = {
            name: sessionData.gameName,
            date: new Date().toISOString(),
            duration,
            score
        };

        this.currentUser.gameStats.gamesHistory = this.currentUser.gameStats.gamesHistory || [];
        this.currentUser.gameStats.gamesHistory.push(gameRecord);
        this.currentUser.gameStats.totalGamesPlayed = (this.currentUser.gameStats.totalGamesPlayed || 0) + 1;
        this.currentUser.gameStats.totalPlaytime = (this.currentUser.gameStats.totalPlaytime || 0) + duration;

        // Check for achievements
        this.checkAchievements();

        // Save updated user data
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        // Update registered users
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = this.currentUser;
            localStorage.setItem('registeredUsers', JSON.stringify(users));
        }

        // Clear session
        sessionStorage.removeItem('currentGameSession');
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

    // Method-based login for the modal
    login(email, password) {
        const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.updateNavigation();
            return { success: true, message: 'Login successful!' };
        } else {
            return { success: false, message: 'Invalid email or password.' };
        }
    }

    // Method-based registration for the modal
    register(name, email, password) {
        // Get existing users
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        
        // Check if email already exists
        if (users.find(u => u.email === email)) {
            return { success: false, message: 'Email already registered.' };
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            avatar: 'images/default-avatar.svg',
            joinedDate: new Date().toISOString(),
            gameStats: {
                totalGamesPlayed: 0,
                totalPlaytime: 0,
                gamesHistory: [],
                achievements: []
            }
        };

        // Add user to list
        users.push(newUser);
        localStorage.setItem('registeredUsers', JSON.stringify(users));

        // Auto login
        this.currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        this.updateNavigation();

        return { success: true, message: 'Registration successful!' };
    }

    loginWithGoogle(googleUserInfo) {
        try {
            const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
            
            // Check if user already exists
            let user = users.find(u => u.email === googleUserInfo.email || u.googleId === googleUserInfo.googleId);
            
            if (user) {
                // Update existing user with Google info
                user.googleId = googleUserInfo.googleId;
                user.avatar = googleUserInfo.picture || user.avatar;
                user.name = googleUserInfo.name || user.name;
            } else {
                // Create new user from Google info
                user = {
                    id: Date.now().toString(),
                    name: googleUserInfo.name,
                    email: googleUserInfo.email,
                    password: null, // No password for Google users
                    googleId: googleUserInfo.googleId,
                    avatar: googleUserInfo.picture || 'images/default-avatar.svg',
                    joinedDate: new Date().toISOString(),
                    gameStats: {
                        totalGamesPlayed: 0,
                        totalPlaytime: 0,
                        gamesHistory: [],
                        achievements: []
                    },
                    loginMethod: 'google'
                };
                users.push(user);
            }
            
            // Save updated users list
            localStorage.setItem('registeredUsers', JSON.stringify(users));
            
            // Set as current user
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.updateNavigation();
            
            return { success: true, message: 'Google login successful!' };
        } catch (error) {
            console.error('Google login error:', error);
            return { success: false, message: 'Google login failed. Please try again.' };
        }
    }
}

// Initialize auth system
const authSystem = new AuthSystem();

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

// Initialize auth system
let authSystem;
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing auth system...');
    authSystem = new AuthSystem();
    
    // Make it globally available
    window.authSystem = authSystem;
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { authSystem };
}