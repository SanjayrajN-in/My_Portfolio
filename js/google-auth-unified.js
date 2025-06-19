// Unified Google Authentication System
class GoogleAuthUnified {
    constructor() {
        this.clientId = '1026303958134-nncar1hc3ko280tds9r7fa77f0d7cucu.apps.googleusercontent.com';
        this.redirectUri = window.location.origin + '/auth/google/callback';
        this.isInitialized = false;
        this.isLoading = false;
        
        // Check for previously successful endpoint
        try {
            this.savedEndpoint = localStorage.getItem('successful_google_auth_endpoint');
            if (this.savedEndpoint) {
                console.log('🔄 Found previously successful endpoint:', this.savedEndpoint);
            }
        } catch (e) {
            console.warn('⚠️ Could not access localStorage:', e);
            this.savedEndpoint = null;
        }
        
        // Log configuration for debugging
        console.log('🔧 Google Auth Configuration:');
        console.log('🔧 Client ID:', this.clientId);
        console.log('🔧 Redirect URI:', this.redirectUri);
        console.log('🔧 Current Origin:', window.location.origin);
        
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
        
        // Log the redirect URI for debugging
        console.log('🔄 Using redirect URI:', this.redirectUri);
        
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
            
            // Try multiple API endpoint formats to find one that works
            // This handles different server configurations
            const possibleEndpoints = [];
            
            // 0. If we have a previously successful endpoint, try it first
            if (this.savedEndpoint) {
                possibleEndpoints.push({
                    url: this.savedEndpoint,
                    description: 'Previously successful endpoint'
                });
            }
            
            // 1. Try API config if available
            if (window.API) {
                // Only add if not already added
                const apiConfigUrl = `${window.API.apiURL}/auth/google`;
                if (!possibleEndpoints.some(e => e.url === apiConfigUrl)) {
                    possibleEndpoints.push({
                        url: apiConfigUrl,
                        description: 'API config endpoint'
                    });
                }
            }
            
            // 2. Add common endpoint formats as fallbacks
            const additionalEndpoints = [
                {
                    url: `${window.location.origin}/api/auth/google`,
                    description: 'Standard API endpoint'
                },
                {
                    url: `${window.location.origin}/api/auth?endpoint=google`,
                    description: 'Query parameter endpoint'
                },
                {
                    url: `${window.location.origin}/api/google-auth`,
                    description: 'Direct endpoint'
                },
                {
                    url: `${window.location.origin}/api/auth/google-signin`,
                    description: 'Alternative endpoint'
                }
            ];
            
            // Add each additional endpoint if not already in the list
            additionalEndpoints.forEach(endpoint => {
                if (!possibleEndpoints.some(e => e.url === endpoint.url)) {
                    possibleEndpoints.push(endpoint);
                }
            });
            
            console.log('🔍 Will try these endpoints in order:', possibleEndpoints.map(e => e.url));
            
            // Start with the first endpoint
            let apiUrl = possibleEndpoints[0].url;
            console.log(`🌐 Trying endpoint: ${apiUrl} (${possibleEndpoints[0].description})`);
            
            // We'll try other endpoints if this one fails (in the error handling section)
            console.log('🌐 API URL:', apiUrl);
            console.log('🌐 Using API URL:', apiUrl);
            
            // Send credential to backend
            const result = await fetch(apiUrl, {
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
                let errorText;
                try {
                    errorText = await result.text();
                    console.error('❌ Backend response not ok:', result.status, errorText);
                } catch (textError) {
                    console.error('❌ Could not read error response:', textError);
                    errorText = 'Unknown error';
                }
                
                // Try alternative endpoints if the current one failed
                // This handles both 404 (not found) and 500 (server error) cases
                const currentEndpointIndex = possibleEndpoints.findIndex(e => e.url === apiUrl);
                
                // If we have more endpoints to try
                if (currentEndpointIndex < possibleEndpoints.length - 1) {
                    console.error(`🚨 Endpoint ${apiUrl} failed with status ${result.status}. Trying next alternative...`);
                    
                    // Try each remaining endpoint in sequence
                    for (let i = currentEndpointIndex + 1; i < possibleEndpoints.length; i++) {
                        const nextEndpoint = possibleEndpoints[i];
                        console.log(`🔄 Trying alternative endpoint: ${nextEndpoint.url} (${nextEndpoint.description})`);
                        
                        try {
                            const alternativeResult = await fetch(nextEndpoint.url, {
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
                            
                            console.log(`📨 Alternative endpoint response status: ${alternativeResult.status}`);
                            
                            if (alternativeResult.ok) {
                                console.log(`✅ Alternative endpoint ${nextEndpoint.url} worked!`);
                                
                                // Store this successful endpoint in localStorage for future use
                                try {
                                    localStorage.setItem('successful_google_auth_endpoint', nextEndpoint.url);
                                    console.log('💾 Saved successful endpoint for future use');
                                } catch (storageError) {
                                    console.warn('⚠️ Could not save endpoint to localStorage:', storageError);
                                }
                                
                                return alternativeResult; // Return the successful response
                            }
                            
                            console.error(`❌ Alternative endpoint ${nextEndpoint.url} also failed:`, alternativeResult.status);
                        } catch (altError) {
                            console.error(`❌ Error with endpoint ${nextEndpoint.url}:`, altError.message);
                        }
                    }
                    
                    // If we've tried all endpoints and none worked, try form submission as last resort
                    console.error('❌ All API endpoints failed, trying form submission fallback');
                    return this.formSubmissionFallback(response.credential);
                }
                
                // For 500 errors, provide more helpful message
                if (result.status === 500) {
                    console.error('🚨 Server error 500 detected');
                    
                    // Try to parse the error as JSON if possible
                    try {
                        const errorJson = JSON.parse(errorText);
                        if (errorJson.error && errorJson.error.message) {
                            console.error('🚨 Server error details:', errorJson.error);
                            
                            // Check if this is a MongoDB connection error
                            if (errorJson.error.message.includes('MongoDB') || 
                                errorJson.error.message.includes('database') ||
                                errorJson.error.message.includes('connection') ||
                                errorJson.error.message.includes('ECONNREFUSED')) {
                                console.error('🚨 Database connection error detected');
                                
                                // For Vercel deployments with MongoDB
                                console.log('💡 Suggestion for Vercel + MongoDB: Check your MongoDB connection string in Vercel environment variables');
                                console.log('💡 Make sure your MongoDB Atlas IP whitelist includes Vercel deployment IPs');
                                
                                throw new Error('Database connection error. Please try again later or contact support.');
                            }
                            
                            throw new Error(`Server error: ${errorJson.error.message}`);
                        }
                    } catch (parseError) {
                        // If parsing fails, just use the text
                        console.log('Could not parse error JSON:', parseError);
                    }
                    
                    // Suggest checking Vercel logs
                    console.log('💡 Suggestion: Check Vercel deployment logs for more details on the 500 error');
                    console.log('💡 For Vercel deployments: Make sure your API routes are properly configured');
                    console.log('💡 Common issues: Missing environment variables, incorrect API route handlers, or MongoDB connection problems');
                    
                    throw new Error('The server encountered an error processing your login. Please try again later.');
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
            console.log('💾 User data saved to localStorage');
        }
        if (data.token) {
            localStorage.setItem('token', data.token);
            console.log('💾 Token saved to localStorage');
        }

        // Show success message
        this.showMessage('Login successful! Welcome back.', 'success');
        
        // Determine redirect URL
        const redirectUrl = this.getRedirectUrl();
        console.log('🔀 Will redirect to:', redirectUrl);
        
        // Close modal and redirect
        if (window.loginModal && typeof window.loginModal.close === 'function') {
            setTimeout(() => {
                window.loginModal.close();
                window.location.href = redirectUrl;
            }, 1500);
        } else {
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500);
        }
    }
    
    getRedirectUrl() {
        // Check if there's a redirect parameter in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirectParam = urlParams.get('redirect');
        
        if (redirectParam) {
            // Make sure the redirect URL is on the same domain for security
            try {
                const redirectUrl = new URL(redirectParam, window.location.origin);
                if (redirectUrl.origin === window.location.origin) {
                    return redirectUrl.href;
                }
            } catch (e) {
                console.error('Invalid redirect URL:', e);
            }
        }
        
        // Default redirect to home page
        return window.location.origin + '/index.html';
    }

    handleLoginError(errorMessage) {
        console.error('❌ Google login error:', errorMessage);
        this.showMessage(`Google login failed: ${errorMessage}`, 'error');
    }

    // Last resort fallback that uses form submission
    formSubmissionFallback(credential) {
        console.log('🔄 Using form submission fallback for Google auth');
        
        return new Promise((resolve, reject) => {
            // Create a hidden form
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `${window.location.origin}/api/auth/google-token`;
            form.target = '_blank';
            form.style.display = 'none';
            
            // Add credential as hidden input
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'credential';
            input.value = credential;
            form.appendChild(input);
            
            // Add a flag to indicate this is from the fallback
            const fallbackFlag = document.createElement('input');
            fallbackFlag.type = 'hidden';
            fallbackFlag.name = 'fallback';
            fallbackFlag.value = 'true';
            form.appendChild(fallbackFlag);
            
            // Add form to body
            document.body.appendChild(form);
            
            // Create a popup window
            const popup = window.open('about:blank', 'google-auth-fallback', 
                'width=500,height=600,scrollbars=yes,resizable=yes');
            
            if (!popup) {
                document.body.removeChild(form);
                this.showMessage('Popup blocked. Please allow popups for this site.', 'error');
                reject(new Error('Popup blocked'));
                return;
            }
            
            // Set form target to the popup
            form.target = 'google-auth-fallback';
            
            // Submit the form
            form.submit();
            
            // Remove form
            document.body.removeChild(form);
            
            // Show message
            this.showMessage('Processing login in a new window...', 'info');
            
            // Monitor the popup
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    console.log('🔒 Auth popup closed');
                    
                    // Check if login was successful
                    setTimeout(() => {
                        const user = localStorage.getItem('user');
                        const token = localStorage.getItem('token');
                        
                        if (user && token) {
                            console.log('✅ Login successful via fallback popup');
                            resolve({ 
                                ok: true, 
                                json: () => Promise.resolve({ 
                                    success: true, 
                                    user: JSON.parse(user), 
                                    token 
                                }) 
                            });
                        } else {
                            console.log('❌ Fallback popup closed without successful login');
                            reject(new Error('Login failed'));
                        }
                    }, 1000);
                }
            }, 1000);
            
            // Timeout after 2 minutes
            setTimeout(() => {
                if (!popup.closed) {
                    popup.close();
                    clearInterval(checkClosed);
                    reject(new Error('Login timeout. Please try again.'));
                }
            }, 120000);
        });
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