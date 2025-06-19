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
        
        // Setup Google OAuth
        this.setupGoogleAuth();
        console.log('Google OAuth setup completed');
        
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
                            
                            <div class="forgot-password-link">
                                <a href="#" onclick="authSystem.showForgotPasswordForm(); return false;">Forgot Password?</a>
                            </div>
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
                                <div class="password-requirements">
                                    <small>Password must contain:</small>
                                    <ul>
                                        <li>At least 8 characters</li>
                                        <li>One uppercase letter (A-Z)</li>
                                        <li>One lowercase letter (a-z)</li>
                                        <li>One number (0-9)</li>
                                        <li>One special character (!@#$%^&*)</li>
                                    </ul>
                                </div>
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

    setupGoogleAuth() {
        console.log('Setting up Google OAuth...');
        
        // Ensure the Google button is visible and ready
        const googleBtn = document.getElementById('googleLoginBtn');
        if (googleBtn) {
            googleBtn.style.display = 'block';
            console.log('Google OAuth button ready');
        }
    }

    handleGoogleLogin() {
        console.log('🔐 Google login button clicked');
        
        // Check if unified Google Auth is available
        if (window.googleAuth) {
            console.log('✅ Using Unified Google Auth');
            window.googleAuth.login();
        } else if (window.googlePopupAuth) {
            console.log('🔄 Using fallback Google Auth');
            window.googlePopupAuth.login();
        } else {
            console.log('❌ Google Auth not available, using redirect fallback');
            this.fallbackGoogleLogin();
        }
    }

    fallbackGoogleLogin() {
        console.log('Using fallback Google OAuth redirect flow');
        
        // Your Google Client ID (updated to match your Google Cloud Console)
        const clientId = '962387684215-f3ohlicfr8t1obvcojhlra04dd4kji2f.apps.googleusercontent.com';
        
        // Use the authorized redirect URI that matches Google Cloud Console
        // This should be the exact URL registered in your Google Cloud Console
        let redirectUri;
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            redirectUri = 'http://localhost:3000/api/auth/callback';
        } else {
            redirectUri = 'https://sanjayrajn.vercel.app/api/auth/callback';
        }
        
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
});

// Global function to open login modal
function openLoginModal() {
    if (loginModal) {
        loginModal.open();
    }
}