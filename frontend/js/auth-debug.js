// Authentication Debug Helper
// Add this script to any page to debug authentication issues

class AuthDebugger {
    constructor() {
        this.init();
    }

    init() {
        // Add debug panel to page
        this.createDebugPanel();
        
        // Log auth status every 5 seconds
        setInterval(() => {
            this.logAuthStatus();
        }, 5000);
        
        // Initial log
        setTimeout(() => {
            this.logAuthStatus();
        }, 1000);
    }

    createDebugPanel() {
        // Only create in development or when debug parameter is present
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('debug') && window.location.hostname !== 'localhost') {
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'auth-debug-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 999999;
            max-width: 300px;
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #333;
        `;

        const title = document.createElement('div');
        title.textContent = 'Auth Debug';
        title.style.cssText = 'font-weight: bold; margin-bottom: 5px; color: #00ff00;';
        panel.appendChild(title);

        const content = document.createElement('div');
        content.id = 'auth-debug-content';
        panel.appendChild(content);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 16px;
        `;
        closeBtn.onclick = () => panel.remove();
        panel.appendChild(closeBtn);

        document.body.appendChild(panel);
    }

    logAuthStatus() {
        const status = this.getAuthStatus();
        console.group('🔍 Auth Debug Status');
        console.log('Timestamp:', new Date().toLocaleTimeString());
        console.log('Page:', window.location.pathname);
        console.log('Auth System Available:', !!window.authSystem);
        console.log('API Available:', !!window.API);
        console.log('Current User:', window.authSystem?.currentUser);
        console.log('Local Token:', !!localStorage.getItem('token'));
        console.log('Session Token:', !!sessionStorage.getItem('token'));
        console.log('Cached User:', !!sessionStorage.getItem('currentUser'));
        console.log('Is Authenticated:', window.authSystem?.isAuthenticated());
        
        // Check navigation buttons
        const loginBtn = document.querySelector('a[href*="login.html"]');
        const profileBtn = document.querySelector('.nav-profile-btn');
        const logoutBtn = document.querySelector('.nav-logout-btn');
        
        console.log('Login Button Visible:', loginBtn ? (loginBtn.closest('li').style.display !== 'none') : false);
        console.log('Profile Button Present:', !!profileBtn);
        console.log('Logout Button Present:', !!logoutBtn);
        console.groupEnd();

        // Update debug panel if it exists
        this.updateDebugPanel(status);
    }

    getAuthStatus() {
        return {
            timestamp: new Date().toLocaleTimeString(),
            page: window.location.pathname,
            authSystemAvailable: !!window.authSystem,
            apiAvailable: !!window.API,
            currentUser: window.authSystem?.currentUser?.name || 'None',
            localToken: !!localStorage.getItem('token'),
            sessionToken: !!sessionStorage.getItem('token'),
            cachedUser: !!sessionStorage.getItem('currentUser'),
            isAuthenticated: window.authSystem?.isAuthenticated() || false,
            loginBtnVisible: this.isLoginButtonVisible(),
            profileBtnPresent: !!document.querySelector('.nav-profile-btn'),
            logoutBtnPresent: !!document.querySelector('.nav-logout-btn')
        };
    }

    isLoginButtonVisible() {
        const loginBtn = document.querySelector('a[href*="login.html"]');
        return loginBtn ? (loginBtn.closest('li').style.display !== 'none') : false;
    }

    updateDebugPanel(status) {
        const panel = document.getElementById('auth-debug-content');
        if (!panel) return;

        panel.innerHTML = `
            <div>Time: ${status.timestamp}</div>
            <div>Page: ${status.page.split('/').pop()}</div>
            <div>Auth: ${status.authSystemAvailable ? '✅' : '❌'}</div>
            <div>API: ${status.apiAvailable ? '✅' : '❌'}</div>
            <div>User: ${status.currentUser}</div>
            <div>Token: ${status.localToken || status.sessionToken ? '✅' : '❌'}</div>
            <div>Authenticated: ${status.isAuthenticated ? '✅' : '❌'}</div>
            <div>Login Btn: ${status.loginBtnVisible ? '👁️' : '🚫'}</div>
            <div>Profile Btn: ${status.profileBtnPresent ? '✅' : '❌'}</div>
            <div>Logout Btn: ${status.logoutBtnPresent ? '✅' : '❌'}</div>
        `;
    }

    // Manual debug methods
    static checkAuth() {
        const debugger = new AuthDebugger();
        debugger.logAuthStatus();
    }

    static clearAuth() {
        localStorage.clear();
        sessionStorage.clear();
        if (window.authSystem) {
            window.authSystem.clearAuthData();
            window.authSystem.updateNavigation();
        }
        console.log('🧹 Auth data cleared');
    }

    static testLogin(email = 'test@example.com', password = 'password123') {
        if (!window.API) {
            console.error('API not available');
            return;
        }
        
        window.API.login({ email, password })
            .then(data => {
                console.log('✅ Test login successful:', data);
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    if (window.authSystem) {
                        window.authSystem.refreshAuthState();
                    }
                }
            })
            .catch(error => {
                console.error('❌ Test login failed:', error);
            });
    }
}

// Initialize debug helper
if (typeof window !== 'undefined') {
    window.AuthDebugger = AuthDebugger;
    
    // Auto-initialize if debug parameter is present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('debug') || window.location.hostname === 'localhost') {
        new AuthDebugger();
    }
    
    // Add global debug methods
    window.checkAuth = AuthDebugger.checkAuth;
    window.clearAuth = AuthDebugger.clearAuth;
    window.testLogin = AuthDebugger.testLogin;
}