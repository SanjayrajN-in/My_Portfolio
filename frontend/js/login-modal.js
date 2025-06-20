// Login Modal JavaScript

class LoginModal {
    constructor() {
        this.modal = null;
        this.overlay = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        // Remove existing modal if it exists
        const existingModal = document.getElementById('loginModalOverlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal HTML
        this.createModal();
        
        // Add event listeners
        this.addEventListeners();
    }

    createModal() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'loginModalOverlay';
        this.overlay.className = 'login-modal-overlay';
        
        // Create modal content
        this.modal = document.createElement('div');
        this.modal.className = 'login-modal';
        this.modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="modalTitle">Login</h2>
                    <button class="close-btn" id="closeModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="auth-tabs">
                        <button class="tab-btn active" data-tab="login">Login</button>
                        <button class="tab-btn" data-tab="signup">Sign Up</button>
                    </div>
                    
                    <div class="tab-content active" id="loginTab">
                        <form id="loginForm">
                            <div class="form-group">
                                <label for="loginEmail">Email</label>
                                <input type="email" id="loginEmail" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="loginPassword">Password</label>
                                <div class="password-input">
                                    <input type="password" id="loginPassword" name="password" required>
                                    <button type="button" class="toggle-password" data-target="loginPassword">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="submit-btn">Login</button>
                                <button type="button" class="google-btn" id="googleLoginBtn">
                                    <i class="fab fa-google"></i>
                                    Sign in with Google
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <div class="tab-content" id="signupTab">
                        <form id="signupForm">
                            <div class="form-group">
                                <label for="signupUsername">Username</label>
                                <input type="text" id="signupUsername" name="username" required>
                            </div>
                            <div class="form-group">
                                <label for="signupEmail">Email</label>
                                <input type="email" id="signupEmail" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="signupPassword">Password</label>
                                <div class="password-input">
                                    <input type="password" id="signupPassword" name="password" required>
                                    <button type="button" class="toggle-password" data-target="signupPassword">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="confirmPassword">Confirm Password</label>
                                <div class="password-input">
                                    <input type="password" id="confirmPassword" name="confirmPassword" required>
                                    <button type="button" class="toggle-password" data-target="confirmPassword">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Inline OTP Verification -->
                            <div class="otp-section" id="otpSection" style="display: none;">
                                <div class="form-group">
                                    <label for="otpInput">Enter OTP sent to your email</label>
                                    <input type="text" id="otpInput" name="otp" maxlength="6" placeholder="123456">
                                    <div class="otp-actions">
                                        <button type="button" id="resendOtpBtn" class="resend-btn">Resend OTP</button>
                                        <span id="otpTimer" class="otp-timer"></span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="submit-btn" id="signupSubmitBtn">Sign Up</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
    }

    addEventListeners() {
        // Close modal
        const closeBtn = this.modal.querySelector('#closeModal');
        closeBtn.addEventListener('click', () => this.close());
        
        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        // Tab switching
        const tabBtns = this.modal.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
        
        // Form submissions
        const loginForm = this.modal.querySelector('#loginForm');
        const signupForm = this.modal.querySelector('#signupForm');
        
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        
        // Google login
        const googleBtn = this.modal.querySelector('#googleLoginBtn');
        googleBtn.addEventListener('click', () => this.handleGoogleLogin());
        
        // Password toggle
        const toggleBtns = this.modal.querySelectorAll('.toggle-password');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => this.togglePassword(btn));
        });
        
        // OTP functionality
        const resendBtn = this.modal.querySelector('#resendOtpBtn');
        if (resendBtn) {
            resendBtn.addEventListener('click', () => this.resendOTP());
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        const tabBtns = this.modal.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });
        
        // Update tab content
        const tabContents = this.modal.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Tab');
        });
        
        // Update modal title
        const title = this.modal.querySelector('#modalTitle');
        title.textContent = tabName === 'login' ? 'Login' : 'Sign Up';
        
        // Hide OTP section when switching tabs
        const otpSection = this.modal.querySelector('#otpSection');
        if (otpSection) {
            otpSection.style.display = 'none';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        try {
            const submitBtn = e.target.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';
            
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                this.close();
                
                // Update auth state
                if (window.authSystem) {
                    window.authSystem.currentUser = data.user;
                    window.authSystem.updateNavigation();
                }
                
                this.showMessage('Login successful!', 'success');
                
                // Redirect to profile if on login page
                if (window.location.pathname.includes('login')) {
                    window.location.href = '/frontend/pages/profile.html';
                }
            } else {
                this.showMessage(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            const submitBtn = e.target.querySelector('.submit-btn');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const otp = formData.get('otp');
        
        // Validate passwords match
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }
        
        const submitBtn = e.target.querySelector('#signupSubmitBtn');
        const otpSection = this.modal.querySelector('#otpSection');
        
        try {
            if (!otp) {
                // Step 1: Send OTP
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending OTP...';
                
                const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, username, password, type: 'signup' }),
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    otpSection.style.display = 'block';
                    submitBtn.textContent = 'Verify & Sign Up';
                    this.showMessage('OTP sent to your email', 'success');
                    this.startOTPTimer();
                } else {
                    this.showMessage(data.message || 'Failed to send OTP', 'error');
                }
            } else {
                // Step 2: Verify OTP and create account
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating Account...';
                
                const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password, otp }),
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    this.close();
                    
                    // Update auth state
                    if (window.authSystem) {
                        window.authSystem.currentUser = data.user;
                        window.authSystem.updateNavigation();
                    }
                    
                    this.showMessage('Account created successfully!', 'success');
                    
                    // Redirect to profile
                    setTimeout(() => {
                        window.location.href = '/frontend/pages/profile.html';
                    }, 1000);
                } else {
                    this.showMessage(data.message || 'Registration failed', 'error');
                    
                    // If OTP is invalid, allow user to retry
                    if (data.message && data.message.includes('OTP')) {
                        const otpInput = this.modal.querySelector('#otpInput');
                        otpInput.value = '';
                        otpInput.focus();
                    }
                }
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            if (!otp) {
                submitBtn.textContent = 'Send OTP';
            } else {
                submitBtn.textContent = 'Verify & Sign Up';
            }
        }
    }

    async handleGoogleLogin() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/google/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (response.ok && data.authUrl) {
                // Open Google OAuth in a popup
                const popup = window.open(
                    data.authUrl,
                    'googleLogin',
                    'width=500,height=600,scrollbars=yes,resizable=yes'
                );
                
                // Listen for the popup to complete
                const checkClosed = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(checkClosed);
                        // Check if login was successful
                        this.checkGoogleLoginStatus();
                    }
                }, 1000);
            } else {
                this.showMessage('Failed to initialize Google login', 'error');
            }
        } catch (error) {
            this.showMessage('Network error during Google login', 'error');
        }
    }

    async checkGoogleLoginStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/google/verify`, {
                method: 'GET',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok && data.token) {
                localStorage.setItem('token', data.token);
                this.close();
                
                // Update auth state
                if (window.authSystem) {
                    window.authSystem.currentUser = data.user;
                    window.authSystem.updateNavigation();
                }
                
                this.showMessage('Google login successful!', 'success');
                
                // Redirect to profile
                setTimeout(() => {
                    window.location.href = '/frontend/pages/profile.html';
                }, 1000);
            }
        } catch (error) {
            // Silent fail - user might have canceled the popup
        }
    }

    async resendOTP() {
        const email = this.modal.querySelector('#signupEmail').value;
        const username = this.modal.querySelector('#signupUsername').value;
        const password = this.modal.querySelector('#signupPassword').value;
        
        if (!email || !username || !password) {
            this.showMessage('Please fill in all fields first', 'error');
            return;
        }
        
        try {
            const resendBtn = this.modal.querySelector('#resendOtpBtn');
            resendBtn.disabled = true;
            resendBtn.textContent = 'Sending...';
            
            const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, username, password, type: 'signup' }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showMessage('OTP resent successfully', 'success');
                this.startOTPTimer();
            } else {
                this.showMessage(data.message || 'Failed to resend OTP', 'error');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            const resendBtn = this.modal.querySelector('#resendOtpBtn');
            resendBtn.disabled = false;
            resendBtn.textContent = 'Resend OTP';
        }
        
        // Cleanup unverified accounts
        try {
            await fetch(`${API_BASE_URL}/api/auth/cleanup-unverified`, {
                method: 'POST'
            });
        } catch (error) {
            // Silent cleanup
        }
    }

    startOTPTimer() {
        const timerElement = this.modal.querySelector('#otpTimer');
        const resendBtn = this.modal.querySelector('#resendOtpBtn');
        let timeLeft = 60;
        
        resendBtn.disabled = true;
        
        const timer = setInterval(() => {
            timerElement.textContent = `Resend in ${timeLeft}s`;
            timeLeft--;
            
            if (timeLeft < 0) {
                clearInterval(timer);
                timerElement.textContent = '';
                resendBtn.disabled = false;
            }
        }, 1000);
    }

    togglePassword(btn) {
        const targetId = btn.getAttribute('data-target');
        const input = this.modal.querySelector(`#${targetId}`);
        const icon = btn.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    showMessage(message, type) {
        // Create or update message element
        let messageEl = document.querySelector('.auth-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'auth-message';
            document.body.appendChild(messageEl);
        }
        
        messageEl.textContent = message;
        messageEl.className = `auth-message ${type}`;
        messageEl.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }

    open() {
        this.overlay.style.display = 'flex';
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        setTimeout(() => {
            const firstInput = this.modal.querySelector('input:not([type="hidden"])');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }

    close() {
        this.overlay.style.display = 'none';
        this.isOpen = false;
        document.body.style.overflow = '';
        
        // Reset forms
        const forms = this.modal.querySelectorAll('form');
        forms.forEach(form => form.reset());
        
        // Hide OTP section
        const otpSection = this.modal.querySelector('#otpSection');
        if (otpSection) {
            otpSection.style.display = 'none';
        }
        
        // Reset to login tab
        this.switchTab('login');
    }
}

// Initialize login modal when DOM is loaded
let loginModal;
document.addEventListener('DOMContentLoaded', function() {
    loginModal = new LoginModal();
    window.loginModal = loginModal;
});

// Also ensure initialization on window load as backup
window.addEventListener('load', function() {
    if (!loginModal) {
        loginModal = new LoginModal();
        window.loginModal = loginModal;
    }
});

// Global function to open login modal - available immediately
window.openLoginModal = function() {
    if (window.loginModal) {
        window.loginModal.open();
    } else if (loginModal) {
        loginModal.open();
    } else {
        // Reinitialize if needed
        loginModal = new LoginModal();
        window.loginModal = loginModal;
        setTimeout(() => {
            loginModal.open();
        }, 100);
    }
};