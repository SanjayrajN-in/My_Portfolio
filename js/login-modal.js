// Login Modal JavaScript
class LoginModal {
    constructor() {
        this.modal = null;
        this.overlay = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        console.log('Initializing LoginModal...');
        
        // Create modal HTML
        this.createModal();
        console.log('Modal HTML created');
        
        // Initialize Google Sign-In
        this.initGoogleSignIn();
        console.log('Google Sign-In initialization started');
        
        // Bind events
        this.bindEvents();
        console.log('Events bound');
    }

    createModal() {
        const modalHTML = `
            <div class="login-modal-overlay" id="loginModalOverlay">
                <div class="login-modal" id="loginModal">
                    <div class="login-modal-header">
                        <button class="login-modal-close" id="closeLoginModal">
                            <i class="fas fa-times"></i>
                        </button>
                        <h2 class="login-modal-title" id="modalTitle">Welcome Back</h2>
                        <p class="login-modal-subtitle" id="modalSubtitle">Sign in to your account</p>
                    </div>
                    
                    <div class="login-modal-body">
                        <div id="modalMessage"></div>
                        
                        <!-- Google Login Button -->
                        <button class="google-login-btn" id="googleLoginBtn">
                            <i class="fab fa-google"></i>
                            <span>Continue with Google</span>
                        </button>
                        
                        <div class="form-divider">
                            <span>Or continue with email</span>
                        </div>
                        
                        <!-- Login Form -->
                        <form class="login-form active" id="loginForm">
                            <div class="form-group">
                                <label for="loginEmail">Email</label>
                                <input type="email" id="loginEmail" name="email" placeholder="Enter your email" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="loginPassword">Password</label>
                                <input type="password" id="loginPassword" name="password" placeholder="Enter your password" required>
                                <button type="button" class="password-toggle" onclick="togglePasswordVisibility('loginPassword')" aria-label="Show password" title="Show password">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            
                            <button type="submit" class="submit-btn">Sign In</button>
                        </form>
                        
                        <!-- Register Form -->
                        <form class="register-form" id="registerForm">
                            <div class="form-group">
                                <label for="registerName">Full Name</label>
                                <input type="text" id="registerName" name="name" placeholder="Enter your full name" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="registerEmail">Email</label>
                                <input type="email" id="registerEmail" name="email" placeholder="Enter your email" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="registerPassword">Password</label>
                                <input type="password" id="registerPassword" name="password" placeholder="Create a password" required>
                                <button type="button" class="password-toggle" onclick="togglePasswordVisibility('registerPassword')" aria-label="Show password" title="Show password">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            
                            <div class="form-group">
                                <label for="confirmPassword">Confirm Password</label>
                                <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm your password" required>
                                <button type="button" class="password-toggle" onclick="togglePasswordVisibility('confirmPassword')" aria-label="Show password" title="Show password">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            
                            <button type="submit" class="submit-btn">Create Account</button>
                        </form>
                        
                        <!-- Form Switch -->
                        <div class="form-switch">
                            <div id="switchToRegister">
                                <p>Don't have an account?</p>
                                <button type="button" onclick="loginModal.switchToRegister()">Create Account</button>
                            </div>
                            <div id="switchToLogin" style="display: none;">
                                <p>Already have an account?</p>
                                <button type="button" onclick="loginModal.switchToLogin()">Sign In</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        this.modal = document.getElementById('loginModal');
        this.overlay = document.getElementById('loginModalOverlay');
    }

    bindEvents() {
        // Close modal events
        document.getElementById('closeLoginModal').addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));

        // Google login
        document.getElementById('googleLoginBtn').addEventListener('click', () => this.handleGoogleLogin());
    }

    open() {
        console.log('Opening login modal...');
        // Prevent body scroll
        document.body.classList.add('modal-open');
        this.overlay.classList.add('active');
        this.isOpen = true;
        
        // Try to render Google button again when modal opens
        setTimeout(() => {
            console.log('Re-attempting Google button render after modal open...');
            this.renderGoogleButton();
        }, 100);
        
        // Focus on first input after animation
        setTimeout(() => {
            const firstInput = this.modal.querySelector('input:not([type="hidden"])');
            if (firstInput) firstInput.focus();
        }, 300);
    }

    close() {
        // Restore body scroll
        document.body.classList.remove('modal-open');
        this.overlay.classList.remove('active');
        this.isOpen = false;
        
        // Clear forms and messages
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
        this.clearMessage();
        
        // Clean up Google button container
        const googleContainer = document.getElementById('googleSignInButton');
        if (googleContainer) {
            googleContainer.remove();
        }
        
        // Show the original Google button
        const googleBtn = document.getElementById('googleLoginBtn');
        if (googleBtn) {
            googleBtn.style.display = 'block';
        }
        
        // Reset to login form if on register
        this.switchToLogin();
    }

    switchToRegister() {
        document.getElementById('loginForm').classList.remove('active');
        document.getElementById('registerForm').classList.add('active');
        document.getElementById('switchToRegister').style.display = 'none';
        document.getElementById('switchToLogin').style.display = 'block';
        document.getElementById('modalTitle').textContent = 'Create Account';
        document.getElementById('modalSubtitle').textContent = 'Sign up for a new account';
        this.clearMessage();
    }

    switchToLogin() {
        document.getElementById('registerForm').classList.remove('active');
        document.getElementById('loginForm').classList.add('active');
        document.getElementById('switchToLogin').style.display = 'none';
        document.getElementById('switchToRegister').style.display = 'block';
        document.getElementById('modalTitle').textContent = 'Welcome Back';
        document.getElementById('modalSubtitle').textContent = 'Sign in to your account';
        this.clearMessage();
    }

    showMessage(message, type = 'error') {
        const messageDiv = document.getElementById('modalMessage');
        messageDiv.innerHTML = `<div class="${type}-message">${message}</div>`;
    }

    clearMessage() {
        document.getElementById('modalMessage').innerHTML = '';
    }

    setLoading(loading = true) {
        const modal = document.getElementById('loginModal');
        if (loading) {
            modal.classList.add('loading');
        } else {
            modal.classList.remove('loading');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        this.setLoading(true);
        this.clearMessage();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const result = authSystem.login(email, password);
            
            if (result.success) {
                this.showMessage('Login successful! Welcome back.', 'success');
                setTimeout(() => {
                    this.close();
                    // Refresh page to update navigation
                    window.location.reload();
                }, 1500);
            } else {
                this.showMessage(result.message);
            }
        } catch (error) {
            this.showMessage('An error occurred. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        this.setLoading(true);
        this.clearMessage();

        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate passwords match
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match.');
            this.setLoading(false);
            return;
        }

        try {
            const result = authSystem.register(name, email, password);
            
            if (result.success) {
                this.showMessage('Account created successfully! You are now logged in.', 'success');
                setTimeout(() => {
                    this.close();
                    // Refresh page to update navigation
                    window.location.reload();
                }, 1500);
            } else {
                this.showMessage(result.message);
            }
        } catch (error) {
            this.showMessage('An error occurred. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    initGoogleSignIn() {
        console.log('=== Google Sign-In Initialization ===');
        console.log('Current URL:', window.location.href);
        console.log('Current origin:', window.location.origin);
        console.log('Current hostname:', window.location.hostname);
        
        // For now, just show the fallback button to avoid FedCM issues
        console.log('Using fallback Google button to avoid FedCM/CORS issues');
        this.showFallbackGoogleButton();
        
        // Update the fallback button to handle OAuth flow manually
        this.setupManualGoogleAuth();
    }

    setupManualGoogleAuth() {
        console.log('Setting up manual Google OAuth...');
        // The fallback button will handle the OAuth flow manually
        // This avoids all FedCM and CORS issues
    }

    setupGoogleSignIn() {
        console.log('Setting up Google Sign-In...');
        console.log('Current domain:', window.location.hostname);
        console.log('Current origin:', window.location.origin);
        
        if (window.google && window.google.accounts) {
            try {
                console.log('Initializing Google Sign-In...');
                window.google.accounts.id.initialize({
                    client_id: '1026303958134-nncar1hc3ko280tds9r7fa77f0d7cucu.apps.googleusercontent.com',
                    callback: (response) => this.handleGoogleSignInResponse(response),
                    auto_select: false,
                    cancel_on_tap_outside: true,
                    use_fedcm_for_prompt: false, // Disable FedCM to avoid CORS issues
                    ux_mode: 'popup', // Use popup mode for better compatibility
                    context: 'signin'
                });

                console.log('Google Sign-In initialized successfully');
                // Render the Google Sign-In button
                this.renderGoogleButton();
            } catch (error) {
                console.error('Google Sign-In setup error:', error);
                
                // Check if it's a domain authorization error
                if (error.message && error.message.includes('origin')) {
                    console.error('Domain authorization error - please check Google Cloud Console OAuth settings');
                    this.showMessage('Google Sign-In is not configured for this domain. Please use email login.', 'info');
                }
                
                // Show fallback message
                this.showFallbackGoogleButton();
            }
        } else {
            console.log('Google API not ready, retrying...');
            // Retry after a short delay
            setTimeout(() => this.setupGoogleSignIn(), 500);
        }
    }

    renderGoogleButton() {
        console.log('Attempting to render Google button...');
        const googleBtn = document.getElementById('googleLoginBtn');
        console.log('Google button element found:', !!googleBtn);
        console.log('Google API available:', !!(window.google && window.google.accounts));
        
        if (googleBtn && window.google && window.google.accounts) {
            console.log('Rendering official Google button...');
            // Check if Google button container already exists
            let googleContainer = document.getElementById('googleSignInButton');
            if (!googleContainer) {
                // Hide the custom button and render Google's button
                googleBtn.style.display = 'none';
                
                // Create container for Google button
                googleContainer = document.createElement('div');
                googleContainer.id = 'googleSignInButton';
                googleContainer.style.marginBottom = '16px';
                googleBtn.parentNode.insertBefore(googleContainer, googleBtn);
                console.log('Created Google button container');
            }

            try {
                // Clear any existing content
                googleContainer.innerHTML = '';
                
                // Add a small delay to ensure DOM is ready
                setTimeout(() => {
                    try {
                        window.google.accounts.id.renderButton(
                            googleContainer,
                            {
                                theme: 'outline',
                                size: 'large',
                                width: 320,
                                text: 'continue_with',
                                shape: 'rectangular',
                                logo_alignment: 'left',
                                type: 'standard'
                            }
                        );
                        console.log('Google button rendered successfully');
                    } catch (renderError) {
                        console.error('Error rendering Google button:', renderError);
                        this.showFallbackGoogleButton();
                    }
                }, 50);
                
            } catch (error) {
                console.error('Error setting up Google button:', error);
                // Fallback to custom button
                this.showFallbackGoogleButton();
            }
        } else {
            console.log('Using fallback Google button');
            this.showFallbackGoogleButton();
        }
    }

    showFallbackGoogleButton() {
        console.log('Showing fallback Google button...');
        const googleBtn = document.getElementById('googleLoginBtn');
        const googleContainer = document.getElementById('googleSignInButton');
        
        if (googleContainer) {
            googleContainer.remove();
            console.log('Removed Google container');
        }
        
        if (googleBtn) {
            googleBtn.style.display = 'block';
            console.log('Fallback Google button is now visible');
            // Update the button text to indicate it might have issues
            const buttonText = googleBtn.querySelector('span');
            if (buttonText) {
                buttonText.textContent = 'Continue with Google';
            }
        } else {
            console.error('Could not find Google login button element!');
        }
    }

    handleGoogleLogin() {
        console.log('Google login button clicked - starting OAuth flow');
        
        // Create OAuth URL for Google
        const clientId = '1026303958134-nncar1hc3ko280tds9r7fa77f0d7cucu.apps.googleusercontent.com';
        const redirectUri = window.location.origin + '/auth/google/callback';
        const scope = 'openid email profile';
        const responseType = 'code';
        const state = this.generateRandomState();
        
        console.log('=== OAuth Configuration Debug ===');
        console.log('Client ID:', clientId);
        console.log('Redirect URI:', redirectUri);
        console.log('Current Origin:', window.location.origin);
        console.log('Current URL:', window.location.href);
        
        // Store state in sessionStorage for verification
        sessionStorage.setItem('google_oauth_state', state);
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${encodeURIComponent(clientId)}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=${responseType}&` +
            `scope=${encodeURIComponent(scope)}&` +
            `state=${state}&` +
            `access_type=offline&` +
            `prompt=select_account`;
        
        console.log('Full OAuth URL:', authUrl);
        
        // Show a confirmation dialog first
        const confirmed = confirm(
            `About to redirect to Google OAuth.\n\n` +
            `Redirect URI: ${redirectUri}\n\n` +
            `Make sure this exact URL is added to your Google Cloud Console under "Authorized redirect URIs".\n\n` +
            `Click OK to continue, or Cancel to abort.`
        );
        
        if (!confirmed) {
            console.log('OAuth redirect cancelled by user');
            return;
        }
        
        // Show loading state
        this.setLoading(true);
        this.showMessage('Redirecting to Google...', 'info');
        
        // Redirect to Google OAuth
        window.location.href = authUrl;
    }
    
    generateRandomState() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    async handleGoogleSignInResponse(response) {
        try {
            this.setLoading(true);
            this.clearMessage();
            
            console.log('Google sign-in response received:', response);

            // Parse the JWT token to get user information
            const userInfo = this.parseJWT(response.credential);
            
            if (!userInfo) {
                throw new Error('Failed to parse Google user information');
            }

            console.log('Parsed user info:', userInfo);

            // Create user object for our auth system
            const googleUserInfo = {
                googleId: userInfo.sub,
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture
            };

            // Use our local auth system for Google login
            const result = authSystem.loginWithGoogle(googleUserInfo);

            if (result.success) {
                this.showMessage('Google login successful! Welcome.', 'success');
                setTimeout(() => {
                    this.close();
                    window.location.reload();
                }, 1500);
            } else {
                this.showMessage(result.message || 'Google login failed');
            }
        } catch (error) {
            console.error('Google login error:', error);
            this.showMessage(`Google login failed: ${error.message || 'Please try again.'}`);
        } finally {
            this.setLoading(false);
        }
    }

    parseJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('JWT parsing error:', error);
            return null;
        }
    }
}

// Global password toggle function
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const formGroup = input.parentElement;
    const button = formGroup.querySelector('.password-toggle');
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        button.setAttribute('aria-label', 'Hide password');
        button.setAttribute('title', 'Hide password');
        // Ensure proper padding for text input
        input.style.paddingRight = '3rem';
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        button.setAttribute('aria-label', 'Show password');
        button.setAttribute('title', 'Show password');
        // Ensure proper padding for password input
        input.style.paddingRight = '3rem';
    }
}

// Initialize login modal when DOM is loaded
let loginModal;
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing login modal...');
    loginModal = new LoginModal();
    
    // Additional check for Google API after a delay
    setTimeout(() => {
        if (loginModal && window.google && window.google.accounts) {
            console.log('Google API detected after DOM load, re-initializing...');
            loginModal.renderGoogleButton();
        }
    }, 2000);
});

// Global function to open login modal
function openLoginModal() {
    if (loginModal) {
        loginModal.open();
    }
}