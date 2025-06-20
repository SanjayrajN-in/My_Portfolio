// Simplified Authentication System for Login Page
// Configuration  
const getAPIBaseURL = () => {
    if (window.API && window.API.baseURL) {
        return window.API.baseURL;
    }
    
    // Force production mode - always use production URL to avoid localhost issues
    const FORCE_PRODUCTION = true; // Set to true to always use production URL
    
    // Fallback - detect environment
    const isProduction = FORCE_PRODUCTION || (
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1' && 
        !window.location.hostname.includes('local')
    );
    
    const baseURL = isProduction ? 'https://sanjayraj-n.onrender.com' : 'http://localhost:3000';
    console.log('API Base URL set to:', baseURL);
    return baseURL;
};

const API_BASE_URL = getAPIBaseURL();
// Make API_BASE_URL available globally
window.API_BASE_URL = API_BASE_URL;

// Simplified Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check if user is logged in via token validation
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
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
                } else {
                    // Token is invalid, clear it
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
        // If user is not logged in, redirect to login page
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        // Load profile data
        this.loadProfileData();
    }

    async logout() {
        try {
            // Call logout API to invalidate session on server
            const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token') || ''}`
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
        
        // Update navigation immediately
        this.updateNavigation();
        
        // Show logout message
        this.showFloatingNotification('You have been logged out successfully.', 'success');
        
        // Redirect to login page after a brief delay
        setTimeout(() => {
            if (window.location.pathname.includes('profile.html')) {
                window.location.href = 'login.html';
            } else if (window.location.pathname.includes('pages/')) {
                window.location.href = 'login.html';
            } else {
                window.location.href = 'pages/login.html';
            }
        }, 1500);
    }

    updateNavigation() {
        const navContainer = document.querySelector('.nav-container');
        const navLinks = document.querySelector('.nav-links');
        const hamburger = document.querySelector('.hamburger');
        const moreDropdown = document.querySelector('.dropdown'); // Find the "More" dropdown
        const isInPagesFolder = window.location.pathname.includes('pages/');
        
        if (this.currentUser) {
            // User is logged in - create or show user menu
            let userMenu = document.querySelector('.user-menu');
            let userMenuWrapper = document.querySelector('.nav-user-menu');
            
            // Hide login link
            const loginLink = document.querySelector('a[href*="login.html"]');
            if (loginLink) {
                loginLink.closest('li').style.display = 'none';
            }
            
            if (!userMenu) {
                // Create user menu if it doesn't exist
                userMenu = document.createElement('div');
                userMenu.className = 'user-menu';
                
                const avatarPath = isInPagesFolder ? '../images/default-avatar.svg' : 'images/default-avatar.svg';
                const profilePath = isInPagesFolder ? 'profile.html' : 'pages/profile.html';
                
                userMenu.innerHTML = `
                    <div class="user-avatar-container">
                        <img src="${this.currentUser.avatar || avatarPath}" alt="User Avatar" class="user-avatar" id="navUserAvatar">
                        <div class="user-dropdown">
                            <a href="${profilePath}" class="user-dropdown-item">
                                <i class="fas fa-user"></i>
                                <span>Profile</span>
                            </a>
                            <button onclick="authSystem.logout()" class="user-dropdown-item logout-btn">
                                <i class="fas fa-sign-out-alt"></i>
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                `;
                
                // Position the user menu correctly:
                // Desktop: After the "More" dropdown in nav-links
                // Mobile: Before hamburger in nav-container
                if (window.innerWidth >= 993 && navLinks && moreDropdown) {
                    // Desktop: Insert after the "More" dropdown within nav-links
                    const moreDropdownParent = moreDropdown.parentElement; // This should be the <li> containing the dropdown
                    if (moreDropdownParent) {
                        // Create a list item wrapper for the user menu on desktop
                        const userMenuLi = document.createElement('li');
                        userMenuLi.className = 'nav-user-menu';
                        userMenuLi.appendChild(userMenu);
                        
                        if (moreDropdownParent.nextSibling) {
                            navLinks.insertBefore(userMenuLi, moreDropdownParent.nextSibling);
                        } else {
                            navLinks.appendChild(userMenuLi);
                        }
                    } else {
                        navLinks.appendChild(userMenu);
                    }
                } else {
                    // Mobile: Insert before hamburger in nav container
                    navContainer.insertBefore(userMenu, hamburger);
                }
                
                console.log('✅ User menu created and added to DOM');
            }
            
            // Show user menu with proper styles
            userMenu.style.setProperty('display', 'flex', 'important');
            userMenu.style.setProperty('visibility', 'visible', 'important');
            userMenu.style.setProperty('opacity', '1', 'important');
            
            // Update avatar if available
            const avatarImg = document.getElementById('navUserAvatar');
            if (avatarImg && this.currentUser.avatar) {
                avatarImg.src = this.currentUser.avatar;
            }
            
        } else {
            // User is not logged in - hide user menu and show login link
            const userMenu = document.querySelector('.user-menu');
            const userMenuWrapper = document.querySelector('.nav-user-menu');
            
            if (userMenu) {
                userMenu.style.display = 'none';
            }
            if (userMenuWrapper) {
                userMenuWrapper.style.display = 'none';
            }
            
            // Show login link
            const loginLink = document.querySelector('a[href*="login.html"]');
            if (loginLink) {
                loginLink.closest('li').style.display = 'block';
            }
        }
    }

    async loadProfileData() {
        if (!this.currentUser) return;

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                
                // Update profile page elements
                this.updateProfileElements();
            }
        } catch (error) {
            console.error('Load profile data error:', error);
        }
    }

    updateProfileElements() {
        // Update profile page elements with user data
        const elements = {
            'profileName': this.currentUser.name,
            'profileEmail': this.currentUser.email,
            'joinedDate': new Date(this.currentUser.joinedDate).toLocaleDateString(),
            'lastLogin': this.currentUser.lastLogin ? new Date(this.currentUser.lastLogin).toLocaleDateString() : 'Never'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Update avatar
        const avatarImg = document.getElementById('profileAvatar');
        if (avatarImg && this.currentUser.avatar) {
            avatarImg.src = this.currentUser.avatar;
        }
    }

    showFloatingNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `floating-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Redirect to login if not authenticated
    requireAuth() {
        if (!this.isAuthenticated()) {
            const isInPagesFolder = window.location.pathname.includes('pages/');
            const loginPath = isInPagesFolder ? 'login.html' : 'pages/login.html';
            window.location.href = loginPath;
            return false;
        }
        return true;
    }
}

// Initialize auth system
const authSystem = new AuthSystem();

// Make it globally available
window.authSystem = authSystem;

// Add CSS for floating notifications
const notificationCSS = `
.floating-notification {
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: linear-gradient(135deg, rgba(30, 30, 47, 0.95), rgba(20, 20, 35, 0.95));
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    border-left: 4px solid;
    z-index: 10000;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 400px;
}

.floating-notification.show {
    transform: translateX(0);
    opacity: 1;
}

.floating-notification.success {
    border-left-color: #28a745;
}

.floating-notification.error {
    border-left-color: #dc3545;
}

.floating-notification.warning {
    border-left-color: #ffc107;
}

.floating-notification.info {
    border-left-color: #17a2b8;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.notification-content i {
    font-size: 1.2rem;
}

@media (max-width: 768px) {
    .floating-notification {
        top: 1rem;
        right: 1rem;
        left: 1rem;
        max-width: none;
    }
}
`;

// Add notification styles to page
const style = document.createElement('style');
style.textContent = notificationCSS;
document.head.appendChild(style);