// Google Popup Authentication - Modern Implementation
class GooglePopupAuth {
    constructor() {
        this.clientId = '1026303958134-nncar1hc3ko280tds9r7fa77f0d7cucu.apps.googleusercontent.com';
        this.isInitialized = false;
        this.isLoading = false;
        this.suppressGoogleWarnings();
        this.init();
    }

    suppressGoogleWarnings() {
        // Suppress specific Google Identity Services warnings
        const originalConsoleWarn = console.warn;
        console.warn = function(...args) {
            const message = args.join(' ');
            // Suppress FedCM warnings
            if (message.includes('[GSI_LOGGER]') || 
                message.includes('FedCM') || 
                message.includes('One Tap')) {
                return; // Don't log these warnings
            }
            originalConsoleWarn.apply(console, args);
        };
    }

    async init() {
        console.log('Initializing Google Popup Auth...');
        
        try {
            // Load Google Identity Services
            await this.loadGoogleIdentityServices();
            
            // Initialize with popup-specific configuration
            this.initializeGoogleIdentityServices();
            
            console.log('Google Popup Auth initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Google Popup Auth:', error);
            this.handleInitError(error);
        }
    }

    loadGoogleIdentityServices() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.google && window.google.accounts && window.google.accounts.id) {
                console.log('Google Identity Services already loaded');
                resolve();
                return;
            }

            // Remove any existing script to avoid conflicts
            const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
            if (existingScript) {
                existingScript.remove();
            }

            // Create new script element
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                console.log('Google Identity Services loaded successfully');
                // Wait a bit for the library to fully initialize
                setTimeout(() => {
                    if (window.google && window.google.accounts && window.google.accounts.id) {
                        resolve();
                    } else {
                        reject(new Error('Google Identity Services not properly initialized'));
                    }
                }, 100);
            };
            
            script.onerror = () => {
                console.error('Failed to load Google Identity Services');
                reject(new Error('Failed to load Google Identity Services'));
            };

            document.head.appendChild(script);
        });
    }

    initializeGoogleIdentityServices() {
        if (!window.google || !window.google.accounts || !window.google.accounts.id) {
            throw new Error('Google Identity Services not available');
        }

        try {
            // Initialize with popup-optimized configuration
            window.google.accounts.id.initialize({
                client_id: this.clientId,
                callback: (response) => this.handleCredentialResponse(response),
                auto_select: false,
                cancel_on_tap_outside: true,
                use_fedcm_for_prompt: true, // Enable FedCM for future compatibility
                itp_support: true, // Enable Intelligent Tracking Prevention support
                ux_mode: 'popup', // Force popup mode
                context: 'signin',
                state_cookie_domain: window.location.hostname // Use current hostname
            });

            this.isInitialized = true;
            console.log('Google Identity Services initialized for popup mode');
        } catch (error) {
            console.error('Error initializing Google Identity Services:', error);
            throw error;
        }
    }

    async handleCredentialResponse(response) {
        if (this.isLoading) {
            console.log('Already processing a login request');
            return;
        }

        console.log('Google credential response received');
        this.isLoading = true;
        
        try {
            // Show loading state
            this.showLoadingState();

            // Validate response
            if (!response || !response.credential) {
                throw new Error('Invalid credential response from Google');
            }

            console.log('Sending credential to backend...');

            // Send credential to backend with proper headers for popup mode
            const result = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache'
                },
                credentials: 'include', // Important for CORS with cookies
                body: JSON.stringify({ 
                    credential: response.credential,
                    popup_mode: true // Flag to indicate popup mode
                })
            });

            // Check if response is ok
            if (!result.ok) {
                const errorText = await result.text();
                console.error('Backend response not ok:', result.status, errorText);
                throw new Error(`Server error: ${result.status} - ${errorText}`);
            }

            const data = await result.json();
            console.log('Backend response:', data);

            if (data.success) {
                this.handleLoginSuccess(data);
            } else {
                throw new Error(data.message || 'Login failed');
            }

        } catch (error) {
            console.error('Google popup login error:', error);
            this.handleLoginError(error.message || 'Login failed');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    // Trigger popup login
    startPopupLogin() {
        if (!this.isInitialized) {
            console.error('Google Identity Services not initialized');
            this.showMessage('Google login not available. Please try again.', 'error');
            return;
        }

        if (this.isLoading) {
            console.log('Login already in progress');
            return;
        }

        console.log('Starting Google popup login...');

        try {
            // Use Google Identity Services popup
            window.google.accounts.id.prompt((notification) => {
                console.log('Prompt notification:', notification);
                
                if (notification.isNotDisplayed()) {
                    console.log('Prompt not displayed, trying alternative method');
                    // Fallback to direct popup
                    this.fallbackPopupLogin();
                } else if (notification.isSkippedMoment()) {
                    console.log('Prompt skipped');
                    this.showMessage('Google login was cancelled', 'info');
                } else if (notification.isDismissedMoment()) {
                    console.log('Prompt dismissed');
                    this.showMessage('Google login was dismissed', 'info');
                }
            });
        } catch (error) {
            console.error('Error starting popup login:', error);
            this.fallbackPopupLogin();
        }
    }

    // Fallback popup method using OAuth2 flow
    fallbackPopupLogin() {
        console.log('Using fallback popup method');
        
        const redirectUri = 'https://sanjayrajn.vercel.app/auth/google/callback';
        const scope = 'openid email profile';
        const responseType = 'code';
        const state = this.generateRandomState();
        
        // Store state for verification
        sessionStorage.setItem('google_oauth_state', state);
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${encodeURIComponent(this.clientId)}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=${responseType}&` +
            `scope=${encodeURIComponent(scope)}&` +
            `state=${state}&` +
            `access_type=offline&` +
            `prompt=select_account`;
        
        // Open popup window
        const popup = window.open(
            authUrl,
            'google-login',
            'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
        );

        if (!popup) {
            this.showMessage('Popup blocked. Please allow popups for this site.', 'error');
            return;
        }

        // Monitor popup
        this.monitorPopup(popup);
    }

    monitorPopup(popup) {
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
                console.log('Popup closed');
                
                // Check if login was successful
                setTimeout(() => {
                    const user = localStorage.getItem('user');
                    const token = localStorage.getItem('token');
                    
                    if (user && token) {
                        console.log('Login successful via popup');
                        this.handleLoginSuccess({ user: JSON.parse(user), token });
                    } else {
                        console.log('Popup closed without successful login');
                    }
                }, 1000);
            }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
            if (!popup.closed) {
                popup.close();
                clearInterval(checkClosed);
                this.showMessage('Login timeout. Please try again.', 'error');
            }
        }, 300000);
    }

    generateRandomState() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    handleInitError(error) {
        console.error('Google auth initialization failed:', error);
        this.showMessage('Google login temporarily unavailable', 'error');
    }

    showLoadingState() {
        // Create or show loading overlay
        let overlay = document.getElementById('google-popup-loading');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'google-popup-loading';
            overlay.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    font-family: Arial, sans-serif;
                ">
                    <div style="
                        background: white;
                        padding: 2rem;
                        border-radius: 12px;
                        text-align: center;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                        max-width: 300px;
                    ">
                        <div style="
                            width: 40px;
                            height: 40px;
                            border: 4px solid #f3f3f3;
                            border-top: 4px solid #4285f4;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                            margin: 0 auto 1rem;
                        "></div>
                        <h3 style="margin: 0 0 0.5rem; color: #333;">Signing in with Google</h3>
                        <p style="margin: 0; color: #666; font-size: 14px;">Please wait...</p>
                    </div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    }

    hideLoadingState() {
        const overlay = document.getElementById('google-popup-loading');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    handleLoginSuccess(data) {
        console.log('Google popup login successful:', data);
        
        // Store user data
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('currentUser', JSON.stringify(data.user)); // For compatibility
        }
        if (data.token) {
            localStorage.setItem('token', data.token);
        }

        // Show success message
        this.showMessage('Login successful! Welcome back.', 'success');
        
        // Close modal if it exists
        if (window.loginModal && typeof window.loginModal.close === 'function') {
            setTimeout(() => {
                window.loginModal.close();
                window.location.reload();
            }, 1500);
        } else {
            // Reload page to update UI
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    }

    handleLoginError(errorMessage) {
        console.error('Google popup login error:', errorMessage);
        this.showMessage(`Google login failed: ${errorMessage}`, 'error');
    }

    showMessage(message, type = 'info') {
        // Remove any existing messages
        const existingMessage = document.getElementById('google-popup-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.id = 'google-popup-message';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 10001;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        // Remove message after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 300);
            }
        }, 5000);
    }

    // Public method to trigger login
    login() {
        this.startPopupLogin();
    }
}

// Initialize Google Popup Auth
let googlePopupAuth;
document.addEventListener('DOMContentLoaded', () => {
    googlePopupAuth = new GooglePopupAuth();
    // Export for global use
    window.googlePopupAuth = googlePopupAuth;
});