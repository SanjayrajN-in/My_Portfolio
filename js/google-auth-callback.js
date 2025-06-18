// Google OAuth Callback Handler
class GoogleAuthCallback {
    constructor() {
        this.init();
    }

    init() {
        // Check if we're on a callback URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            console.error('Google OAuth error:', error);
            this.handleError(error);
            return;
        }

        if (code && state) {
            console.log('Google OAuth callback received');
            this.handleCallback(code, state);
        }
    }

    async handleCallback(code, state) {
        try {
            // Verify state parameter
            const storedState = sessionStorage.getItem('google_oauth_state');
            if (state !== storedState) {
                throw new Error('Invalid state parameter');
            }

            // Clear stored state
            sessionStorage.removeItem('google_oauth_state');

            // Show loading
            this.showMessage('Processing Google login...', 'info');

            // Send code to our backend
            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    code: code,
                    redirect_uri: 'https://sanjayrajn.vercel.app/auth/google/callback'
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('Login successful! Welcome back.', 'success');
                
                // Store user data properly for the auth system
                if (result.user) {
                    // Store in the format expected by the auth system
                    const userData = {
                        id: result.user.id,
                        name: result.user.name,
                        email: result.user.email,
                        avatar: result.user.avatar,
                        joinedDate: new Date().toISOString(),
                        gameStats: result.user.gameStats || {
                            totalGamesPlayed: 0,
                            totalPlaytime: 0,
                            gamesHistory: [],
                            achievements: []
                        }
                    };
                    
                    // Store user data in localStorage for auth system
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    
                    // Also store token if provided
                    if (result.token) {
                        localStorage.setItem('authToken', result.token);
                    }
                }

                // Redirect to home page after a short delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                throw new Error(result.message || 'Login failed');
            }

        } catch (error) {
            console.error('Google OAuth callback error:', error);
            this.handleError(error.message);
        }
    }

    handleError(errorMessage) {
        this.showMessage(`Google login failed: ${errorMessage}`, 'error');
        
        // Redirect back to home page after a delay
        setTimeout(() => {
            window.location.href = '/';
        }, 3000);
    }

    showMessage(message, type = 'info') {
        // Create a simple message display
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            z-index: 10000;
            max-width: 400px;
            text-align: center;
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

// Initialize callback handler when page loads
document.addEventListener('DOMContentLoaded', () => {
    new GoogleAuthCallback();
});