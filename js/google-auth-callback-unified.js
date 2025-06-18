// Unified Google OAuth Callback Handler
class GoogleAuthCallbackUnified {
    constructor() {
        this.init();
    }

    init() {
        console.log('🔄 Initializing Google OAuth callback handler...');
        
        // Check if we're on a callback URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            console.error('❌ Google OAuth error:', error);
            this.handleError(error);
            return;
        }

        if (code && state) {
            console.log('📨 Google OAuth callback received');
            this.handleCallback(code, state);
        } else {
            console.log('❌ No valid callback parameters found');
            this.handleError('Invalid callback parameters');
        }
    }

    async handleCallback(code, state) {
        try {
            console.log('🔐 Processing Google OAuth callback...');
            
            // Verify state parameter
            const storedState = sessionStorage.getItem('google_oauth_state');
            if (state !== storedState) {
                throw new Error('Invalid state parameter - possible CSRF attack');
            }

            // Clear stored state
            sessionStorage.removeItem('google_oauth_state');

            // Show processing message
            this.updateStatus('🔄 Verifying with Google...', 'info');

            // Send code to our backend
            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache'
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    code: code,
                    redirect_uri: 'https://sanjayrajn.vercel.app/auth/google/callback',
                    callback_mode: true
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Backend response not ok:', response.status, errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('📨 Backend response:', result);

            if (result.success) {
                this.updateStatus('✅ Login successful! Redirecting...', 'success');
                
                // Store user data and token
                if (result.user) {
                    localStorage.setItem('user', JSON.stringify(result.user));
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                }
                if (result.token) {
                    localStorage.setItem('token', result.token);
                }

                // Redirect to home page after a short delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                throw new Error(result.message || 'Login failed');
            }

        } catch (error) {
            console.error('❌ Google OAuth callback error:', error);
            this.handleError(error.message);
        }
    }

    handleError(errorMessage) {
        console.error('❌ Google OAuth error:', errorMessage);
        this.updateStatus(`❌ Login failed: ${errorMessage}`, 'error');
        
        // Redirect back to home page after a delay
        setTimeout(() => {
            window.location.href = '/';
        }, 3000);
    }

    updateStatus(message, type = 'info') {
        // Update the page content
        const container = document.querySelector('.container');
        if (container) {
            const bgColor = type === 'error' ? 'rgba(244, 67, 54, 0.2)' : 
                           type === 'success' ? 'rgba(76, 175, 80, 0.2)' : 
                           'rgba(255, 255, 255, 0.1)';
            
            container.style.background = bgColor;
            
            const spinner = container.querySelector('.spinner');
            const heading = container.querySelector('h2');
            const paragraph = container.querySelector('p');
            
            if (type === 'success') {
                if (spinner) spinner.style.display = 'none';
                if (heading) heading.textContent = 'Login Successful!';
                if (paragraph) paragraph.textContent = message;
            } else if (type === 'error') {
                if (spinner) spinner.style.display = 'none';
                if (heading) heading.textContent = 'Login Failed';
                if (paragraph) paragraph.textContent = message;
            } else {
                if (heading) heading.textContent = 'Processing...';
                if (paragraph) paragraph.textContent = message;
            }
        }

        // Also show a toast message
        this.showToast(message, type);
    }

    showToast(message, type = 'info') {
        // Create a toast notification
        const toast = document.createElement('div');
        const bgColor = type === 'error' ? '#f44336' : 
                       type === 'success' ? '#4caf50' : 
                       '#2196f3';
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add animation styles if not already present
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        toast.textContent = message;
        document.body.appendChild(toast);

        // Remove toast after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);
    }
}

// Initialize callback handler when page loads
document.addEventListener('DOMContentLoaded', () => {
    new GoogleAuthCallbackUnified();
});