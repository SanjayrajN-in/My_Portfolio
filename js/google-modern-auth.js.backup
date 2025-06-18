// Modern Google Identity Services Implementation
class GoogleModernAuth {
    constructor() {
        this.clientId = '1026303958134-nncar1hc3ko280tds9r7fa77f0d7cucu.apps.googleusercontent.com';
        this.isInitialized = false;
        this.init();
    }

    async init() {
        console.log('Initializing Google Modern Auth...');
        
        try {
            // Load Google Identity Services
            await this.loadGoogleIdentityServices();
            
            // Initialize Google Identity Services
            this.initializeGoogleIdentityServices();
            
            console.log('Google Modern Auth initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Google Modern Auth:', error);
            // Fallback to manual OAuth flow
            this.fallbackToManualOAuth();
        }
    }

    loadGoogleIdentityServices() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.google && window.google.accounts) {
                resolve();
                return;
            }

            // Create script element
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                console.log('Google Identity Services loaded');
                resolve();
            };
            
            script.onerror = () => {
                console.error('Failed to load Google Identity Services');
                reject(new Error('Failed to load Google Identity Services'));
            };

            document.head.appendChild(script);
        });
    }

    initializeGoogleIdentityServices() {
        if (!window.google || !window.google.accounts) {
            throw new Error('Google Identity Services not available');
        }

        // Initialize Google Identity Services
        window.google.accounts.id.initialize({
            client_id: this.clientId,
            callback: (response) => this.handleCredentialResponse(response),
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: false, // Disable FedCM to avoid errors
            itp_support: true, // Enable Intelligent Tracking Prevention support
            ux_mode: 'popup', // Use popup mode for better compatibility
            context: 'signin' // Specify context for better UX
        });

        this.isInitialized = true;
        console.log('Google Identity Services initialized');
    }

    async handleCredentialResponse(response) {
        console.log('Google credential response received');
        
        try {
            // Show loading state
            this.showLoadingState();

            // Send credential to backend
            const result = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include', // Include credentials for CORS
                body: JSON.stringify({ 
                    credential: response.credential
                })
            });

            const data = await result.json();

            if (data.success) {
                this.handleLoginSuccess(data);
            } else {
                throw new Error(data.message || 'Login failed');
            }

        } catch (error) {
            console.error('Google login error:', error);
            this.handleLoginError(error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    renderSignInButton(containerId) {
        if (!this.isInitialized) {
            console.warn('Google Identity Services not initialized, using fallback');
            this.renderFallbackButton(containerId);
            return;
        }

        try {
            window.google.accounts.id.renderButton(
                document.getElementById(containerId),
                {
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'rectangular',
                    logo_alignment: 'left'
                }
            );
            console.log('Google Sign-In button rendered');
        } catch (error) {
            console.error('Failed to render Google button:', error);
            this.renderFallbackButton(containerId);
        }
    }

    renderFallbackButton(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <button class="google-fallback-btn" onclick="googleModernAuth.startManualOAuth()">
                <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                    <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.53H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                    <path fill="#FBBC05" d="M4.5 10.49a4.8 4.8 0 0 1 0-3.07V5.35H1.83a8 8 0 0 0 0 7.28l2.67-2.14z"/>
                    <path fill="#EA4335" d="M8.98 3.54c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.35L4.5 7.42a4.77 4.77 0 0 1 4.48-3.88z"/>
                </svg>
                Continue with Google
            </button>
        `;
    }

    startManualOAuth() {
        console.log('Starting manual OAuth flow');
        
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
        
        window.location.href = authUrl;
    }

    generateRandomState() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    fallbackToManualOAuth() {
        console.log('Falling back to manual OAuth flow');
        this.isInitialized = false;
    }

    showLoadingState() {
        // Create or show loading overlay
        let overlay = document.getElementById('google-auth-loading');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'google-auth-loading';
            overlay.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                ">
                    <div style="
                        background: white;
                        padding: 2rem;
                        border-radius: 8px;
                        text-align: center;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
                        <p>Signing in with Google...</p>
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
        const overlay = document.getElementById('google-auth-loading');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    handleLoginSuccess(data) {
        console.log('Google login successful:', data);
        
        // Store user data
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        if (data.token) {
            localStorage.setItem('token', data.token);
        }

        // Show success message
        this.showMessage('Login successful! Welcome back.', 'success');
        
        // Close modal if it exists
        if (window.loginModal && window.loginModal.close) {
            setTimeout(() => {
                window.loginModal.close();
                window.location.reload();
            }, 1500);
        } else {
            // Redirect to home page
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        }
    }

    handleLoginError(errorMessage) {
        console.error('Google login error:', errorMessage);
        this.showMessage(`Google login failed: ${errorMessage}`, 'error');
    }

    showMessage(message, type = 'info') {
        // Create a simple message display
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            z-index: 10001;
            max-width: 400px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        // Remove message after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
}

// Initialize Google Modern Auth
let googleModernAuth;
document.addEventListener('DOMContentLoaded', () => {
    googleModernAuth = new GoogleModernAuth();
});

// Export for global use
window.googleModernAuth = googleModernAuth;