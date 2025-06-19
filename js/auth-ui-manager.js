// Authentication UI Manager
class AuthUIManager {
    constructor() {
        this.init();
    }

    init() {
        // Listen for auth state changes
        document.addEventListener('authStateChanged', (event) => {
            this.handleAuthStateChange(event.detail);
        });

        // Initialize UI after DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeUI();
            });
        } else {
            this.initializeUI();
        }
    }

    initializeUI() {
        // Create auth UI elements if they don't exist
        this.createAuthUI();
        
        // Update UI based on current auth state
        setTimeout(() => {
            this.updateAuthUI();
        }, 1000); // Wait for auth to initialize
    }

    createAuthUI() {
        // Create login button container
        this.createLoginButton();
        
        // Create user profile dropdown
        this.createUserProfile();
    }

    createLoginButton() {
        // Check if login button container already exists
        let loginContainer = document.getElementById('login-container');
        if (loginContainer) return;

        // Create login button container
        loginContainer = document.createElement('div');
        loginContainer.id = 'login-container';
        loginContainer.className = 'auth-login-container';
        loginContainer.style.cssText = `
            display: none;
            margin: 10px 0;
        `;



        // Add to navigation or appropriate location
        const nav = document.querySelector('nav') || document.querySelector('.navigation');
        if (nav) {
            nav.appendChild(loginContainer);
        } else {
            // Fallback: add to body
            document.body.appendChild(loginContainer);
        }
    }

    createUserProfile() {
        // Check if user profile already exists
        let userProfile = document.getElementById('user-profile-container');
        if (userProfile) return;

        // Create user profile container
        userProfile = document.createElement('div');
        userProfile.id = 'user-profile-container';
        userProfile.className = 'auth-user-profile';
        userProfile.style.cssText = `
            display: none;
            position: relative;
            margin: 10px 0;
        `;

        userProfile.innerHTML = `
            <div class="user-profile-button" id="userProfileButton">
                <img id="userAvatar" src="" alt="User Avatar" class="user-avatar">
                <span id="userName" class="user-name"></span>
                <i class="fas fa-chevron-down dropdown-icon"></i>
            </div>
            <div class="user-dropdown" id="userDropdown">
                <div class="user-info">
                    <img id="dropdownAvatar" src="" alt="User Avatar" class="dropdown-avatar">
                    <div class="user-details">
                        <div id="dropdownName" class="dropdown-name"></div>
                        <div id="dropdownEmail" class="dropdown-email"></div>
                    </div>
                </div>
                <hr class="dropdown-divider">
                <button class="dropdown-item" onclick="authUIManager.viewProfile()">
                    <i class="fas fa-user"></i> View Profile
                </button>
                <button class="dropdown-item" onclick="authUIManager.signOut()">
                    <i class="fas fa-sign-out-alt"></i> Sign Out
                </button>
            </div>
        `;

        // Add styles
        this.addUserProfileStyles();

        // Add click handler for dropdown
        const profileButton = userProfile.querySelector('#userProfileButton');
        const dropdown = userProfile.querySelector('#userDropdown');
        
        profileButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });

        // Add to navigation
        const nav = document.querySelector('nav') || document.querySelector('.navigation');
        if (nav) {
            nav.appendChild(userProfile);
        } else {
            document.body.appendChild(userProfile);
        }
    }

    addUserProfileStyles() {
        // Check if styles already added
        if (document.getElementById('auth-ui-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'auth-ui-styles';
        styles.textContent = `
            .auth-user-profile {
                position: relative;
                display: inline-block;
            }

            .user-profile-button {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
            }

            .user-profile-button:hover {
                background: #e9ecef;
                border-color: #dee2e6;
            }

            .user-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .user-name {
                font-weight: 500;
                color: #333;
                max-width: 120px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .dropdown-icon {
                font-size: 12px;
                color: #666;
                transition: transform 0.2s ease;
            }

            .user-profile-button:hover .dropdown-icon {
                transform: rotate(180deg);
            }

            .user-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                min-width: 250px;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.2s ease;
            }

            .user-dropdown.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .user-info {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
            }

            .dropdown-avatar {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #f8f9fa;
            }

            .user-details {
                flex: 1;
                min-width: 0;
            }

            .dropdown-name {
                font-weight: 600;
                color: #333;
                font-size: 16px;
                margin-bottom: 4px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .dropdown-email {
                color: #666;
                font-size: 14px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .dropdown-divider {
                margin: 0;
                border: none;
                border-top: 1px solid #e9ecef;
            }

            .dropdown-item {
                display: flex;
                align-items: center;
                gap: 12px;
                width: 100%;
                padding: 12px 16px;
                border: none;
                background: none;
                text-align: left;
                cursor: pointer;
                transition: background-color 0.2s ease;
                font-size: 14px;
                color: #333;
            }

            .dropdown-item:hover {
                background: #f8f9fa;
            }

            .dropdown-item i {
                width: 16px;
                color: #666;
            }

            /* Responsive design */
            @media (max-width: 768px) {
                .user-name {
                    display: none;
                }
                
                .user-dropdown {
                    right: -10px;
                    min-width: 200px;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    handleAuthStateChange(authState) {
        console.log('Auth state changed:', authState);
        
        switch (authState.type) {
            case 'login':
            case 'session_restored':
                this.showUserProfile(authState.data);
                break;
            case 'logout':
                this.showLoginButton();
                break;
        }
    }

    updateAuthUI() {
        if (window.authSystem && window.authSystem.isLoggedIn()) {
            const user = window.authSystem.getCurrentUser();
            this.showUserProfile(user);
        } else {
            this.showLoginButton();
        }
    }

    showLoginButton() {
        const loginContainer = document.getElementById('login-container');
        const userProfile = document.getElementById('user-profile-container');
        
        if (loginContainer) {
            loginContainer.style.display = 'block';
            
            // Create a simple login button instead
            const simpleLoginBtn = document.createElement('button');
            simpleLoginBtn.textContent = 'Sign In';
            simpleLoginBtn.className = 'simple-login-btn';
            simpleLoginBtn.style.cssText = `
                background: #007bff;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                width: 100%;
                margin: 10px 0;
            `;
            simpleLoginBtn.onclick = () => {
                if (window.loginModal) {
                    window.loginModal.open();
                }
            };
            loginContainer.innerHTML = '';
            loginContainer.appendChild(simpleLoginBtn);
        }
        
        if (userProfile) {
            userProfile.style.display = 'none';
        }
    }

    showUserProfile(user) {
        const loginContainer = document.getElementById('login-container');
        const userProfile = document.getElementById('user-profile-container');
        
        if (loginContainer) {
            loginContainer.style.display = 'none';
        }
        
        if (userProfile && user) {
            // Update user info in profile button
            document.getElementById('userAvatar').src = user.avatar || 'images/default-avatar.svg';
            document.getElementById('userName').textContent = user.name || 'User';
            
            // Update user info in dropdown
            document.getElementById('dropdownAvatar').src = user.avatar || 'images/default-avatar.svg';
            document.getElementById('dropdownName').textContent = user.name || 'User';
            document.getElementById('dropdownEmail').textContent = user.email || '';
            
            userProfile.style.display = 'block';
        }
    }

    viewProfile() {
        // Close dropdown
        document.getElementById('userDropdown').classList.remove('show');
        
        // Navigate to profile page or show profile modal
        if (document.querySelector('[href="pages/profile.html"]')) {
            window.location.href = 'pages/profile.html';
        } else {
            console.log('Profile page not found');
            // You can implement a profile modal here
        }
    }

    async signOut() {
        // Close dropdown
        document.getElementById('userDropdown').classList.remove('show');
        
        // Sign out using auth system
        if (window.authSystem) {
            window.authSystem.logout();
        }
    }
}

// Initialize Auth UI Manager
const authUIManager = new AuthUIManager();

// Export for global access
window.authUIManager = authUIManager;