// Unified Google Authentication System
class GoogleAuthUnified {
    constructor() {
        this.clientId = '1026303958134-nncar1hc3ko280tds9r7fa77f0d7cucu.apps.googleusercontent.com';
        this.redirectUri = 'https://sanjayrajn.vercel.app/auth/google/callback';
        this.isInitialized = false;
        this.isLoading = false;
        
        // Suppress Google warnings
        this.suppressGoogleWarnings();
        
        // Initialize
        this.init();
    }

    suppressGoogleWarnings() {
        // Suppress specific Google Identity Services warnings
        const originalConsoleWarn = console.warn;
        console.warn = function(...args) {
            const message = args.join(' ');
            // Suppress FedCM and GSI warnings
            if (message.includes('[GSI_LOGGER]') || 
                message.includes('FedCM') || 
                message.includes('One Tap') ||
                message.includes('disable FedCM')) {
                return; // Don't log these warnings
            }
            originalConsoleWarn.apply(console, args);
        };
    }

    async init() {
        console.log('🚀 Initializing Unified Google Auth...');
        
        try {
            // Load Google Identity Services
            await this.loadGoogleIdentityServices();
            
            // Initialize with proper configuration
            this.initializeGoogleIdentityServices();
            
            console.log('✅ Google Auth initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Google Auth:', error);
            this.handleInitError(error);
        }
    }

    loadGoogleIdentityServices() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.google && window.google.accounts && window.google.accounts.id) {
                console.log('✅ Google Identity Services already loaded');
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
                console.log('✅ Google Identity Services loaded');
                // Wait for library to fully initialize
                setTimeout(() => {
                    if (window.google && window.google.accounts && window.google.accounts.id) {
                        resolve();
                    } else {
                        reject(new Error('Google Identity Services not properly initialized'));
                    }
                }, 100);
            };
            
            script.onerror = () => {
                console.error('❌ Failed to load Google Identity Services');
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
            // Initialize with optimized configuration
            window.google.accounts.id.initialize({
                client_id: this.clientId,
                callback: (response) => this.handleCredentialResponse(response),
                auto_select: false,
                cancel_on_tap_outside: true,
                use_fedcm_for_prompt: true, // Enable FedCM for future compatibility
                itp_support: true,
                ux_mode: 'popup',
                context: 'signin',
                state_cookie_domain: window.location.hostname
            });

            this.isInitialized = true;
            console.log('✅ Google Identity Services configured');
        } catch (error) {
            console.error('❌ Error configuring Google Identity Services:', error);
            throw error;
        }
    }

    // Main login method - called from UI
    login() {
        if (!this.isInitialized) {
            console.error('❌ Google Identity Services not initialized');
            this.showMessage('Google login not available. Please try again.', 'error');
            return;
        }

        if (this.isLoading) {
            console.log('⏳ Login already in progress');
            return;
        }

        console.log('🔐 Starting Google login...');
        this.startPopupLogin();
    }

    startPopupLogin() {
        try {
            // Use Google Identity Services popup
            window.google.accounts.id.prompt((notification) => {
                console.log('📋 Prompt notification:', notification);
                
                if (notification.isNotDisplayed()) {
                    console.log('🔄 Prompt not displayed, using fallback');
                    this.fallbackPopupLogin();
                } else if (notification.isSkippedMoment()) {
                    console.log('⏭️ Prompt skipped');
                    this.showMessage('Google login was cancelled', 'info');
                } else if (notification.isDismissedMoment()) {
                    console.log('❌ Prompt dismissed');
                    this.showMessage('Google login was dismissed', 'info');
                }
            });
        } catch (error) {
            console.error('❌ Error starting popup login:', error);
            this.fallbackPopupLogin();
        }
    }

    // Fallback popup method using OAuth2 flow
    fallbackPopupLogin() {
        console.log('🔄 Using fallback popup method');
        
        const scope = 'openid email profile';
        const responseType = 'code';
        const state = this.generateRandomState();
        
        // Store state for verification
        sessionStorage.setItem('google_oauth_state', state);
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${encodeURIComponent(this.clientId)}&` +
            `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
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
                console.log('🔒 Popup closed');
                
                // Check if login was successful
                setTimeout(() => {
                    const user = localStorage.getItem('user');
                    const token = localStorage.getItem('token');
                    
                    if (user && token) {
                        console.log('✅ Login successful via popup');
                        this.handleLoginSuccess({ user: JSON.parse(user), token });
                    } else {
                        console.log('❌ Popup closed without successful login');
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

    async handleCredentialResponse(response) {
        if (this.isLoading) {
            console.log('⏳ Already processing a login request');
            return;
        }

        console.log('📨 Google credential response received');
        this.isLoading = true;
        
        try {
            // Show loading state
            this.showLoadingState();

            // Validate response
            if (!response || !response.credential) {
                throw new Error('Invalid credential response from Google');
            }

            console.log('📤 Sending credential to backend...');
            console.log('🌐 API URL:', `${window.location.origin}/api/auth/google`);

            // Send credential to backend
            const result = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache'
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    credential: response.credential,
                    popup_mode: true
                })
            });

            console.log('📨 Response status:', result.status);
            console.log('📨 Response headers:', Object.fromEntries(result.headers.entries()));

            if (!result.ok) {
                const errorText = await result.text();
                console.error('❌ Backend response not ok:', result.status, errorText);
                
                // Check if it's a 404 - API not found
                if (result.status === 404) {
                    console.error('🚨 API endpoint not found! Check Vercel deployment.');
                    throw new Error('Google login service is not available. Please try again later.');
                }
                
                throw new Error(`Server error: ${result.status} - ${errorText}`);
            }

            const data = await result.json();
            console.log('📨 Backend response:', data);

            if (data.success) {
                this.handleLoginSuccess(data);
            } else {
                throw new Error(data.message || 'Login failed');
            }

        } catch (error) {
            console.error('❌ Google login error:', error);
            this.handleLoginError(error.message || 'Login failed');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    generateRandomState() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    handleInitError(error) {
        console.error('❌ Google auth initialization failed:', error);
        this.showMessage('Google login temporarily unavailable', 'error');
    }

    showLoadingState() {
        let overlay = document.getElementById('google-unified-loading');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'google-unified-loading';
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
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
                        <h3 style="margin: 0 0 0.5rem; color: #333; font-size: 18px;">Signing in with Google</h3>
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
        const overlay = document.getElementById('google-unified-loading');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    handleLoginSuccess(data) {
        console.log('✅ Google login successful:', data);
        
        // Store user data
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('currentUser', JSON.stringify(data.user));
        }
        if (data.token) {
            localStorage.setItem('token', data.token);
        }

        // Show success message
        this.showMessage('Login successful! Welcome back.', 'success');
        
        // Close modal and reload
        if (window.loginModal && typeof window.loginModal.close === 'function') {
            setTimeout(() => {
                window.loginModal.close();
                window.location.reload();
            }, 1500);
        } else {
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    }

    handleLoginError(errorMessage) {
        console.error('❌ Google login error:', errorMessage);
        this.showMessage(`Google login failed: ${errorMessage}`, 'error');
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        const bgColor = type === 'error' ? '#ff4444' : type === 'success' ? '#4caf50' : '#2196f3';
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            z-index: 10001;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add animation styles
        if (!document.getElementById('message-styles')) {
            const style = document.createElement('style');
            style.id = 'message-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
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
}

// Initialize unified Google auth
let googleAuth;
document.addEventListener('DOMContentLoaded', () => {
    googleAuth = new GoogleAuthUnified();
    // Export for global use
    window.googleAuth = googleAuth;
    
    // Backward compatibility
    window.googlePopupAuth = googleAuth;
});