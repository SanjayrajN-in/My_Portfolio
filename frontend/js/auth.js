// Optimized Authentication System - Clean and Functional

// CRITICAL: Auth Pre-Initialization - Prevents Flickering
(function() {
    'use strict';
    
    // Pre-check auth state from localStorage to make instant decisions
    const hasToken = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
    const cachedUser = sessionStorage.getItem('currentUser');
    
    // Add initial body class based on cached auth state
    if (hasToken && cachedUser) {
        document.documentElement.classList.add('auth-likely-logged-in');
    } else {
        document.documentElement.classList.add('auth-likely-logged-out');
    }
    
    // Function to apply auth state
    function applyAuthState(isLoggedIn) {
        const loginLinks = document.querySelectorAll('a[href*="login.html"]');
        const authButtons = document.querySelectorAll('.nav-profile-btn, .nav-logout-btn');
        
        if (isLoggedIn) {
            // Hide login links, show auth buttons
            loginLinks.forEach(link => {
                const li = link.closest('li');
                if (li) {
                    li.classList.add('auth-hidden');
                }
            });
            
            authButtons.forEach(btn => {
                btn.classList.remove('auth-hidden');
            });
        } else {
            // Show login links, hide auth buttons
            loginLinks.forEach(link => {
                const li = link.closest('li');
                if (li) {
                    li.classList.remove('auth-hidden');
                }
            });
            
            authButtons.forEach(btn => {
                btn.classList.add('auth-hidden');
            });
        }
        
        // Mark auth state as ready
        document.body.classList.add('auth-loaded');
    }
    
    // Wait for DOM to be ready, then apply initial state
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Apply initial state based on cached data
            applyAuthState(hasToken && cachedUser);
        });
    } else {
        // DOM is already ready
        applyAuthState(hasToken && cachedUser);
    }
    
    // Make the function globally available for the main auth system
    window.applyAuthState = applyAuthState;
    
})();

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

// Authentication System - No Flickering
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.initialized = false;
        this.authStateLoaded = false;
        
        // Wait for API to be ready before initializing
        if (window.API) {
            this.init();
        } else {
            // Wait for API to load
            setTimeout(() => this.init(), 100);
        }
    }

    async init() {
        // Ensure API is available
        if (!window.API) {
            console.warn('API not available, retrying auth init...');
            setTimeout(() => this.init(), 200);
            return;
        }

        // Check if user is logged in via token validation
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        console.log('🔍 Auth init - Token found:', !!token);
        
        if (token) {
            try {
                // Validate token with server using API config
                console.log('🔍 Validating token with server...');
                const userData = await window.API.getProfile(token);
                
                if (userData && userData.user) {
                    this.currentUser = userData.user;
                    console.log('✅ User authenticated:', this.currentUser?.name || this.currentUser?.email);
                    console.log('✅ Current user object:', this.currentUser);
                    
                    // Store user data in sessionStorage for quick access
                    sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                } else {
                    throw new Error('Invalid user data received');
                }
            } catch (error) {
                console.error('❌ Token validation error:', error);
                // Token is invalid, clear all auth data
                this.clearAuthData();
            }
        } else {
            console.log('ℹ️ No token found, user not logged in');
            this.clearAuthData();
        }

        // Create global notification container if it doesn't exist
        this.createNotificationContainer();

        // CRITICAL: Mark auth state as loaded and update navigation
        this.authStateLoaded = true;
        this.updateNavigation();

        // Initialize profile page if on profile page (after auth check is complete)
        if (window.location.pathname.includes('profile.html')) {
            this.initProfilePage();
        }
        
        // Mark auth system as initialized
        this.initialized = true;
        
        // Add auth-loaded class to body for CSS transitions
        document.body.classList.add('auth-loaded');
        
        // Start periodic navigation check to ensure consistency (less aggressive)
        this.startNavigationWatchdog();
    }

    // Clear all authentication data
    clearAuthData() {
        this.currentUser = null;
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('currentUser');
    }
    
    // Force clear all auth data and refresh (for debugging)
    forceLogout() {
        console.log('🔄 Force logout initiated');
        this.clearAuthData();
        this.initialized = false;
        this.updateNavigation();
        console.log('✅ Force logout completed');
    }
    
    // Debug method to check auth state
    debugAuthState() {
        console.log('🔍 Auth Debug Information:');
        console.log('- Initialized:', this.initialized);
        console.log('- Current User:', this.currentUser);
        console.log('- LocalStorage Token:', localStorage.getItem('token'));
        console.log('- SessionStorage Token:', sessionStorage.getItem('token'));
        console.log('- SessionStorage User:', sessionStorage.getItem('currentUser'));
        
        const loginLinks = document.querySelectorAll('a[href*="login.html"]');
        console.log('- Login Links Found:', loginLinks.length);
        loginLinks.forEach((link, index) => {
            const li = link.closest('li');
            console.log(`  Login Link ${index + 1}:`, {
                display: li?.style.display || 'default',
                visibility: li?.style.visibility || 'default',
                visible: li?.style.display !== 'none'
            });
        });
        
        console.log('- Profile Buttons:', document.querySelectorAll('.nav-profile-btn').length);
        console.log('- Logout Buttons:', document.querySelectorAll('.nav-logout-btn').length);
        
        return {
            initialized: this.initialized,
            currentUser: this.currentUser,
            tokens: {
                localStorage: localStorage.getItem('token'),
                sessionStorage: sessionStorage.getItem('token')
            },
            navigation: {
                loginLinksCount: loginLinks.length,
                loginLinksVisible: Array.from(loginLinks).filter(link => 
                    link.closest('li')?.style.display !== 'none'
                ).length,
                profileButtons: document.querySelectorAll('.nav-profile-btn').length,
                logoutButtons: document.querySelectorAll('.nav-logout-btn').length
            }
        };
    }
    
    // Force refresh navigation (for debugging)
    forceRefreshNavigation() {
        console.log('🔄 Force refreshing navigation');
        this.updateNavigation();
        console.log('✅ Navigation refresh completed');
    }
    
    // Navigation watchdog - less aggressive, more reliable
    startNavigationWatchdog() {
        // Prevent multiple watchdogs
        if (this.watchdogInterval) {
            clearInterval(this.watchdogInterval);
        }
        
        // Check navigation state every 5 seconds (less aggressive)
        this.watchdogInterval = setInterval(() => {
            if (!this.initialized || !this.authStateLoaded) return;
            
            // Skip watchdog on special pages
            const currentPath = window.location.pathname;
            if (currentPath.includes('login.html') || 
                currentPath.includes('profile.html') ||
                currentPath.includes('auth-debug.html')) return;
            
            const loginLinks = document.querySelectorAll('a[href*="login.html"]');
            const profileButtons = document.querySelectorAll('.nav-profile-btn');
            const isLoggedIn = !!this.currentUser;
            
            // Check for inconsistencies using CSS classes instead of styles
            let loginVisible = false;
            loginLinks.forEach(loginLink => {
                const li = loginLink.closest('li');
                if (li && !li.classList.contains('auth-hidden')) {
                    loginVisible = true;
                }
            });
            
            const hasProfileButtons = profileButtons.length > 0;
            
            // Less aggressive checking - only fix major inconsistencies
            if (isLoggedIn && loginVisible) {
                console.log('🔧 Navigation inconsistency detected: User logged in but login button visible');
                this.updateNavigation();
            } else if (!isLoggedIn && hasProfileButtons) {
                console.log('🔧 Navigation inconsistency detected: User not logged in but profile buttons visible');
                this.updateNavigation();
            }
        }, 5000);
    }

    // Method to refresh auth state (useful after login)
    async refreshAuthState() {
        this.initialized = false;
        await this.init();
    }

    // Create global notification container
    createNotificationContainer() {
        if (!document.getElementById('notificationContainer')) {
            const container = document.createElement('div');
            container.className = 'notification-container';
            container.id = 'notificationContainer';
            document.body.appendChild(container);
        }
    }

    // Global notification method
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    initProfilePage() {
        // Wait for auth system to be fully initialized
        const waitForAuth = () => {
            if (!this.initialized) {
                setTimeout(waitForAuth, 100);
                return;
            }
            
            console.log('🔍 Profile page init - Current user:', this.currentUser);
            
            const authLoading = document.getElementById('authLoading');
            const profileContainer = document.getElementById('profileContainer');
            
            // If user is not logged in, redirect to login page
            if (!this.currentUser) {
                console.log('❌ No user found, redirecting to login');
                const isInPagesFolder = window.location.pathname.includes('pages/');
                const loginPath = isInPagesFolder ? 'login.html' : 'pages/login.html';
                window.location.href = loginPath;
                return;
            }

            console.log('✅ User authenticated, loading profile data');
            
            // Hide loading state and show profile content
            if (authLoading) {
                authLoading.style.display = 'none';
            }
            if (profileContainer) {
                profileContainer.style.display = 'block';
            }
            
            // Load profile data
            this.loadProfileData();
        };
        
        waitForAuth();
    }

    async logout() {
        try {
            // Call logout API to invalidate session on server
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (token) {
                const data = await window.API.logout(token);
                console.log('Logout response:', data);
            }
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
        
        // Clear watchdog interval
        if (this.watchdogInterval) {
            clearInterval(this.watchdogInterval);
            this.watchdogInterval = null;
        }
        
        // Update navigation immediately
        this.updateNavigation();
        
        // Show logout message
        this.showNotification('You have been logged out successfully.', 'success');
        
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

    // Optimized navigation update - clean and functional
    updateNavigation() {
        console.log('🔄 Updating navigation, user:', this.currentUser ? 'logged in' : 'not logged in');
        
        // Check page type and skip if not a main navigation page
        const currentPath = window.location.pathname;
        const isSpecialPage = currentPath.includes('login.html') || 
                             currentPath.includes('profile.html') ||
                             currentPath.includes('auth-debug.html');
        
        if (isSpecialPage) {
            console.log('ℹ️ Special page detected, skipping navigation update');
            return;
        }
        
        // Use the optimized auth state function if available
        if (window.applyAuthState) {
            window.applyAuthState(!!this.currentUser);
        }
        
        // Clean up any existing profile and logout buttons in the main navigation bar
        this.cleanupMainNavAuthButtons();
        
        // Update dropdown and mobile menu
        const isInPagesFolder = currentPath.includes('pages/');
        if (this.currentUser) {
            this.addAuthButtonsToDropdown(isInPagesFolder);
            this.updateMobileMenu(true, isInPagesFolder);
        } else {
            this.removeAuthButtonsFromDropdown();
            this.updateMobileMenu(false, false);
        }
    }
    
    // Clean up any profile and logout buttons in the main navigation bar
    cleanupMainNavAuthButtons() {
        // Find all profile and logout buttons in the main navigation bar
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;
        
        // Remove any direct children that are profile or logout buttons
        const mainNavAuthButtons = navLinks.querySelectorAll(':scope > li > .nav-profile-btn, :scope > li > .nav-logout-btn');
        mainNavAuthButtons.forEach(button => {
            const li = button.closest('li');
            if (li && li.parentNode === navLinks) {
                li.remove();
            }
        });
        
        // Also remove any mobile auth items
        const mobileAuthItems = navLinks.querySelectorAll('.mobile-auth-item, .mobile-auth-items');
        mobileAuthItems.forEach(item => item.remove());
    }





    removeAuthButtonsFromDropdown() {
        const moreDropdown = document.querySelector('.dropdown-menu');
        if (!moreDropdown) return;
        
        // Hide auth buttons instead of removing them
        const separatorLi = moreDropdown.querySelector('.nav-auth-separator');
        const profileLi = moreDropdown.querySelector('.nav-profile-btn')?.closest('li');
        const logoutLi = moreDropdown.querySelector('.nav-logout-btn')?.closest('li');
        
        if (separatorLi) separatorLi.style.display = 'none';
        if (profileLi) profileLi.style.display = 'none';
        if (logoutLi) logoutLi.style.display = 'none';
        
        console.log('✅ Auth buttons hidden in dropdown');
        
        // Refresh mobile menu to remove auth buttons
        if (window.refreshMobileMenu) {
            setTimeout(() => {
                window.refreshMobileMenu();
            }, 100);
        }
    }



    // Legacy method for compatibility - remove this if not needed
    updateNavigationLegacy() {
        // This was the old method - now just calls the main one
        this.updateNavigation();
    }

    setupAuthenticatedNavigation(isInPagesFolder, navLinks) {
        // Hide ALL login links aggressively
        const loginLinks = document.querySelectorAll('a[href*="login.html"]');
        console.log('🔍 Found', loginLinks.length, 'login links to hide');
        
        loginLinks.forEach((loginLink, index) => {
            const li = loginLink.closest('li');
            if (li) {
                li.style.display = 'none';
                li.style.visibility = 'hidden';
                li.style.opacity = '0';
                li.style.height = '0';
                li.style.overflow = 'hidden';
                console.log(`✅ Login link ${index + 1} hidden completely`);
            }
        });
        
        // Add profile and logout to the More dropdown
        this.addAuthButtonsToDropdown(isInPagesFolder);
        
        // Update mobile menu
        this.updateMobileMenu(true, isInPagesFolder);
    }
    
    setupUnauthenticatedNavigation() {
        // Show ALL login links
        const loginLinks = document.querySelectorAll('a[href*="login.html"]');
        console.log('🔍 Found', loginLinks.length, 'login links to show');
        
        loginLinks.forEach((loginLink, index) => {
            const li = loginLink.closest('li');
            if (li) {
                li.style.display = 'block';
                li.style.visibility = 'visible';
                li.style.opacity = '1';
                li.style.height = 'auto';
                li.style.overflow = 'visible';
                console.log(`✅ Login link ${index + 1} restored`);
            }
        });
        
        // Update mobile menu
        this.updateMobileMenu(false, false);
    }

    cleanupAuthButtons() {
        // Remove any existing profile and logout buttons from More dropdown
        const moreDropdown = document.querySelector('.dropdown-menu');
        if (moreDropdown) {
            const authButtons = moreDropdown.querySelectorAll('.nav-profile-btn, .nav-logout-btn');
            const authSeparators = moreDropdown.querySelectorAll('.nav-auth-separator');
            
            authButtons.forEach(btn => {
                if (btn.closest('li')) {
                    btn.closest('li').remove();
                }
            });
            
            authSeparators.forEach(separator => {
                separator.remove();
            });
        }
        
        // Also clean up any standalone auth buttons
        const existingProfileButtons = document.querySelectorAll('.nav-profile-btn');
        const existingLogoutButtons = document.querySelectorAll('.nav-logout-btn');
        
        existingProfileButtons.forEach(btn => {
            if (btn.closest('li')) {
                btn.closest('li').remove();
            }
        });
        
        existingLogoutButtons.forEach(btn => {
            if (btn.closest('li')) {
                btn.closest('li').remove();
            }
        });
        
        // Also clean up mobile menu
        const mobileUserMenu = document.querySelector('.mobile-nav-menu');
        if (mobileUserMenu) {
            mobileUserMenu.innerHTML = '';
        }
    }

    addAuthButtonsToDropdown(isInPagesFolder) {
        const moreDropdown = document.querySelector('.dropdown-menu');
        if (!moreDropdown) {
            console.warn('❌ More dropdown not found');
            return;
        }
        
        // Check if auth buttons already exist
        let separatorLi = moreDropdown.querySelector('.nav-auth-separator');
        let profileLi = moreDropdown.querySelector('.nav-profile-btn')?.closest('li');
        let logoutLi = moreDropdown.querySelector('.nav-logout-btn')?.closest('li');
        
        // Create buttons only if they don't exist
        if (!separatorLi) {
            separatorLi = document.createElement('li');
            separatorLi.innerHTML = '<hr style="margin: 10px 0; border-color: #444;">';
            separatorLi.className = 'nav-auth-separator';
            moreDropdown.appendChild(separatorLi);
        }
        
        if (!profileLi) {
            const profilePath = isInPagesFolder ? 'profile.html' : 'pages/profile.html';
            profileLi = document.createElement('li');
            profileLi.innerHTML = `
                <a href="${profilePath}" class="nav-profile-btn">
                    <i class="fas fa-user-circle"></i>
                    <span>Profile</span>
                </a>
            `;
            moreDropdown.appendChild(profileLi);
        }
        
        if (!logoutLi) {
            logoutLi = document.createElement('li');
            logoutLi.innerHTML = `
                <a href="#" class="nav-logout-btn">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </a>
            `;
            
            // Add event listener to logout button
            const logoutBtn = logoutLi.querySelector('.nav-logout-btn');
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
          });
            
              moreDropdown.appendChild(logoutLi);
        }
        
        // Show the buttons
        separatorLi.style.display = 'block';
        profileLi.style.display = 'block';
        logoutLi.style.display = 'block';
        
        console.log('✅ Auth buttons shown in More dropdown');
        
        // Refresh mobile menu to include auth buttons
        if (window.refreshMobileMenu) {
            setTimeout(() => {
                window.refreshMobileMenu();
            }, 100);
        }
    }

    // Legacy method - keeping for compatibility but redirecting to dropdown method
    addAuthButtons(isInPagesFolder, navLinks, retryCount = 0) {
        console.log('⚠️ Legacy addAuthButtons called, redirecting to dropdown method');
        this.addAuthButtonsToDropdown(isInPagesFolder);
    }

    updateMobileMenu(isLoggedIn, isInPagesFolder) {
        // The mobile menu is now handled by navigation.js
        // We just need to refresh it when auth state changes
        if (window.refreshMobileMenu) {
            setTimeout(() => {
                window.refreshMobileMenu();
            }, 100);
        }
        
        // Clean up any old mobile menu elements
        let mobileMenu = document.querySelector('.mobile-nav-menu');
        if (mobileMenu) {
            mobileMenu.remove();
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
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        return !!(token && this.currentUser);
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

// Singleton pattern to prevent multiple initializations
(function initializeAuthSystem() {
    // Prevent multiple initializations
    if (window.authSystemInitialized) {
        console.log('🔄 Auth system already initialized, skipping...');
        return;
    }
    
    const initAuth = () => {
        if (!window.authSystem) {
            // Initialize auth system
            const authSystem = new AuthSystem();
            
            // Make it globally available
            window.authSystem = authSystem;
            window.authSystemInitialized = true;
            
            console.log('🚀 Auth system initialized (singleton)');
        }
    };
    
    // Initialize based on DOM state
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }
})();

// Add event listeners only once
if (!window.authEventListenersAdded) {
    // Handle page visibility changes (when user comes back from another page)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && window.authSystem) {
            console.log('🔄 Page became visible, refreshing auth state');
            // Small delay to ensure page is fully loaded
            setTimeout(() => {
                window.authSystem.forceRefreshNavigation();
            }, 300);
        }
    });

    // Handle page focus (when user switches back to tab)
    window.addEventListener('focus', function() {
        if (window.authSystem) {
            console.log('🔄 Window focused, refreshing auth state');
            setTimeout(() => {
                window.authSystem.forceRefreshNavigation();
            }, 100);
        }
    });
    
    window.authEventListenersAdded = true;
}

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