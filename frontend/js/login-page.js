// Login Page JavaScript
class LoginPageManager {
    constructor() {
        this.currentForm = 'login';
        this.otpCountdown = null;
        this.pendingData = null;
        this.googleInitialized = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupGoogleAuth();
        this.setupPasswordValidation();
        this.setupOTPInput();
        
        // Delay auth state check to ensure API is loaded
        setTimeout(() => {
            this.checkAuthState();
            this.showLoginMessage();
        }, 1000);
    }
    
    setupGoogleAuth() {
        // Get API config
        const apiConfig = window.apiConfig || {};
        const baseUrl = apiConfig.baseURL || 'https://sanjayraj-n.onrender.com';
        
        // Set up Google login buttons
        const googleLoginBtn = document.getElementById('googleLoginBtn');
        const googleRegisterBtn = document.getElementById('googleRegisterBtn');
        
        // Fetch Google Client ID from server
        this.fetchGoogleClientId().then(clientId => {
            if (!clientId) {
                console.error('Failed to get Google Client ID');
                return;
            }
            
            // Initialize Google Identity Services
            google.accounts.id.initialize({
                client_id: clientId,
                callback: this.handleGoogleCredentialResponse.bind(this),
                auto_select: false,
                cancel_on_tap_outside: true
            });
            
            // Set up custom Google Sign In buttons
            if (googleLoginBtn) {
                googleLoginBtn.addEventListener('click', () => {
                    this.showNotification('Select your Google account...', 'info');
                    // Use the client-side prompt which works well on desktop
                    google.accounts.id.prompt();
                });
            }
            
            if (googleRegisterBtn) {
                googleRegisterBtn.addEventListener('click', () => {
                    this.showNotification('Select your Google account...', 'info');
                    // Use the client-side prompt which works well on desktop
                    google.accounts.id.prompt();
                });
            }
        }).catch(error => {
            console.error('Error setting up Google auth:', error);
        });
        
        // Check URL parameters for auth success or error
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('error')) {
            const error = urlParams.get('error');
            const message = urlParams.get('message') || 'Google authentication failed';
            
            this.showNotification(message, 'error');
            
            // Clean up URL
            const cleanUrl = window.location.href.split('?')[0];
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }
    
    async fetchGoogleClientId() {
        try {
            // Try to get client ID from API
            const response = await window.API.getGoogleClientId();
            return response.clientId;
        } catch (error) {
            console.error('Error fetching Google Client ID:', error);
            return null;
        }
    }
    
    async handleGoogleCredentialResponse(response) {
        if (!response || !response.credential) {
            this.showNotification('Google authentication failed', 'error');
            return;
        }
        
        this.showNotification('Google authentication successful, logging in...', 'info');
        
        try {
            // Send the credential to your backend
            const data = await window.API.googleLogin(response.credential);
            
            if (data.success) {
                // Store token
                localStorage.setItem('token', data.token);
                
                // Store user data
                if (data.user) {
                    sessionStorage.setItem('currentUser', JSON.stringify(data.user));
                }
                
                // Update auth system
                if (window.authSystem) {
                    window.authSystem.handleSuccessfulLogin(data.user);
                }
                
                this.showNotification('Login successful! Redirecting...', 'success');
                
                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            } else {
                this.showNotification(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Google login error:', error);
            this.showNotification('Failed to complete Google login', 'error');
        }
    }
    
    // Helper function to get cookie value by name
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.closest('.tab-btn').dataset.tab;
                this.switchTab(tab);
            });
        });

        // Form submissions
        document.getElementById('loginFormElement').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerFormElement').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('otpFormElement').addEventListener('submit', (e) => this.handleOTPVerification(e));
        document.getElementById('forgotPasswordFormElement').addEventListener('submit', (e) => this.handleForgotPassword(e));
        document.getElementById('resetPasswordFormElement').addEventListener('submit', (e) => this.handleResetPassword(e));

        // Password toggles
        document.querySelectorAll('.password-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => this.togglePassword(e));
        });

        // Password generators
        document.querySelectorAll('.password-generate').forEach(btn => {
            btn.addEventListener('click', (e) => this.generatePassword(e));
        });

        // Navigation buttons
        document.getElementById('forgotPasswordBtn').addEventListener('click', () => this.showForm('forgotPassword'));
        document.getElementById('backToLoginBtn').addEventListener('click', () => this.showForm('login'));
        document.getElementById('backToFormBtn').addEventListener('click', () => this.backToForm());
        document.getElementById('backToForgotBtn').addEventListener('click', () => this.showForm('forgotPassword'));

        // OTP actions
        document.getElementById('resendOtpBtn').addEventListener('click', () => this.resendOTP());

        // Google login buttons are now handled by direct links to the backend
        // No event listeners needed

        // Real-time validation
        document.getElementById('registerPassword').addEventListener('input', (e) => this.validatePassword(e.target.value));
        document.getElementById('confirmPassword').addEventListener('input', (e) => this.validatePasswordMatch());
        document.getElementById('newPassword').addEventListener('input', (e) => this.validatePassword(e.target.value, 'newPassword'));
        document.getElementById('confirmNewPassword').addEventListener('input', (e) => this.validatePasswordMatch('newPassword', 'confirmNewPassword'));
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === tab + 'Form');
        });

        // Update header
        const title = document.getElementById('authTitle');
        const subtitle = document.getElementById('authSubtitle');
        
        if (tab === 'login') {
            title.textContent = 'Welcome Back';
            subtitle.textContent = 'Sign in to your account';
        } else {
            title.textContent = 'Create Account';
            subtitle.textContent = 'Join our community today';
        }

        this.currentForm = tab;
        this.clearErrors();
    }

    showForm(formName) {
        // Hide all forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.style.display = 'none';
            form.classList.remove('active');
        });

        // Show target form
        const targetForm = document.getElementById(formName + 'Form');
        if (targetForm) {
            targetForm.style.display = 'block';
            targetForm.classList.add('active');
        }

        // Update header based on form
        const title = document.getElementById('authTitle');
        const subtitle = document.getElementById('authSubtitle');

        switch (formName) {
            case 'login':
                title.textContent = 'Welcome Back';
                subtitle.textContent = 'Sign in to your account';
                break;
            case 'register':
                title.textContent = 'Create Account';
                subtitle.textContent = 'Join our community today';
                break;
            case 'otp':
                title.textContent = 'Verify Email';
                subtitle.textContent = 'Enter the code we sent you';
                break;
            case 'forgotPassword':
                title.textContent = 'Reset Password';
                subtitle.textContent = 'We\'ll send you a reset code';
                break;
            case 'resetPassword':
                title.textContent = 'New Password';
                subtitle.textContent = 'Create your new password';
                break;
        }

        this.clearErrors();
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email').trim();
        const password = formData.get('password');
        const rememberMe = formData.get('rememberMe');

        if (!this.validateLoginForm(email, password)) return;

        const submitBtn = document.getElementById('loginSubmitBtn');
        this.setLoading(submitBtn, true);

        try {
            const data = await window.API.login({ email, password });

            if (data.user) {
                // Store token
                if (rememberMe) {
                    localStorage.setItem('token', data.token);
                } else {
                    sessionStorage.setItem('token', data.token);
                }

                // Update auth system with user data
                if (window.authSystem) {
                    if (data.user) {
                        window.authSystem.handleSuccessfulLogin(data.user);
                        
                        // Force navigation refresh to ensure UI updates
                        setTimeout(() => {
                            window.authSystem.forceRefreshNavigation();
                        }, 100);
                        // Additional force refresh after a longer delay
                        setTimeout(() => {
                            window.authSystem.forceRefreshNavigation();
                        }, 1000);
                    }
                } else {
                    console.warn('Auth system not available during login');
                }

                this.showNotification('Login successful! Welcome back.', 'success');
                
                // Redirect after short delay
                setTimeout(() => {
                    // Store a flag to force navigation update on the target page
                    sessionStorage.setItem('forceNavUpdate', 'true');
                    window.location.href = '../index.html';
                }, 1500);

            } else if (data.requiresVerification) {
                this.showNotification('Account not verified. Sending verification code...', 'info');
                
                // Send OTP for login verification
                await this.sendOTP(email, 'login_verification');
                
            } else {
                this.showNotification(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            // Handle API errors that contain a message
            if (error.message && error.message !== 'API request failed') {
                this.showNotification(error.message, 'error');
            } else {
                this.showNotification('Network error. Please try again.', 'error');
            }
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const name = formData.get('name').trim();
        const email = formData.get('email').trim();
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const agreeTerms = formData.get('agreeTerms');

        if (!this.validateRegisterForm(name, email, password, confirmPassword, agreeTerms)) return;

        const submitBtn = document.getElementById('registerSubmitBtn');
        this.setLoading(submitBtn, true);

        try {
            // Send OTP for registration
            await this.sendOTP(email, 'register', { name, password });
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('Network error. Please try again.', 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async sendOTP(email, type, additionalData = {}) {
        try {
            const data = await window.API.sendOTP(email, type);

            // Store pending data
            this.pendingData = {
                email,
                type,
                ...additionalData
            };

            this.showNotification('Verification code sent to your email!', 'success');
            this.showOTPForm(email);
            this.startOTPCountdown();
        } catch (error) {
            console.error('Send OTP error:', error);
            this.showNotification('Failed to send verification code. Please try again.', 'error');
        }
    }

    showOTPForm(email) {
        document.getElementById('otpEmail').textContent = email;
        this.showForm('otp');
        
        // Focus first OTP input
        setTimeout(() => {
            document.querySelector('.otp-digit').focus();
        }, 100);
    }

    async handleOTPVerification(e) {
        e.preventDefault();
        
        const otpInputs = document.querySelectorAll('.otp-digit');
        const otp = Array.from(otpInputs).map(input => input.value).join('');

        if (otp.length !== 6) {
            this.showError('otpError', 'Please enter the complete 6-digit code');
            return;
        }

        const submitBtn = document.getElementById('otpSubmitBtn');
        this.setLoading(submitBtn, true);

        try {
            if (this.pendingData.type === 'register') {
                await this.completeRegistration(otp);
            } else if (this.pendingData.type === 'login_verification') {
                await this.completeLoginVerification(otp);
            } else if (this.pendingData.type === 'forgot-password') {
                this.showResetPasswordForm(otp);
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            this.showNotification('Network error. Please try again.', 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async completeRegistration(otp) {
        const data = await window.API.register({
            name: this.pendingData.name,
            email: this.pendingData.email,
            password: this.pendingData.password,
            confirmPassword: this.pendingData.password,
            otp
        });

        if (data.token) {
            localStorage.setItem('token', data.token);
            this.showNotification('Account created successfully! Welcome!', 'success');
            
            setTimeout(() => {
                sessionStorage.setItem('forceNavUpdate', 'true');
                
                // Check if there's a redirect URL stored
                const redirectUrl = localStorage.getItem('redirect-after-login');
                if (redirectUrl) {
                    localStorage.removeItem('redirect-after-login');
                    window.location.href = redirectUrl;
                } else {
                    window.location.href = '../index.html';
                }
            }, 1500);
        } else {
            this.showError('otpError', data.message || 'Invalid or expired code');
        }
    }

    async completeLoginVerification(otp) {
        const data = await window.API.verifyLogin(this.pendingData.email, otp);

        if (data.token) {
            localStorage.setItem('token', data.token);
            this.showNotification('Login successful! Welcome back.', 'success');
            
            setTimeout(() => {
                sessionStorage.setItem('forceNavUpdate', 'true');
                
                // Check if there's a redirect URL stored
                const redirectUrl = localStorage.getItem('redirect-after-login');
                if (redirectUrl) {
                    localStorage.removeItem('redirect-after-login');
                    window.location.href = redirectUrl;
                } else {
                    window.location.href = '../index.html';
                }
            }, 1500);
        } else {
            this.showError('otpError', data.message || 'Invalid or expired code');
        }
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email').trim();

        if (!this.validateEmail(email)) {
            this.showError('forgotEmailError', 'Please enter a valid email address');
            return;
        }

        const submitBtn = document.getElementById('forgotSubmitBtn');
        this.setLoading(submitBtn, true);

        try {
            await this.sendOTP(email, 'forgot-password');
        } catch (error) {
            console.error('Forgot password error:', error);
            this.showNotification('Network error. Please try again.', 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    showResetPasswordForm(otp) {
        this.pendingData.otp = otp;
        this.showForm('resetPassword');
    }

    async handleResetPassword(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const otp = formData.get('otp');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (!this.validateResetForm(otp, password, confirmPassword)) return;

        const submitBtn = document.getElementById('resetSubmitBtn');
        this.setLoading(submitBtn, true);

        try {
            const data = await window.API.resetPassword(this.pendingData.email, otp, password);

            if (data) {
                this.showNotification('Password reset successful! You can now login.', 'success');
                setTimeout(() => {
                    this.switchTab('login');
                }, 2000);
            } else {
                this.showNotification(data.message || 'Password reset failed', 'error');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            this.showNotification('Network error. Please try again.', 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async resendOTP() {
        if (!this.pendingData) return;

        try {
            await this.sendOTP(this.pendingData.email, this.pendingData.type, this.pendingData);
        } catch (error) {
            console.error('Resend OTP error:', error);
            this.showNotification('Failed to resend code. Please try again.', 'error');
        }
    }

    startOTPCountdown() {
        let timeLeft = 60;
        const countdownEl = document.getElementById('otpCountdown');
        const resendBtn = document.getElementById('resendOtpBtn');
        
        resendBtn.disabled = true;
        
        this.otpCountdown = setInterval(() => {
            timeLeft--;
            countdownEl.textContent = `(${timeLeft}s)`;
            
            if (timeLeft <= 0) {
                clearInterval(this.otpCountdown);
                resendBtn.disabled = false;
                countdownEl.textContent = '';
            }
        }, 1000);
    }

    setupOTPInput() {
        const otpInputs = document.querySelectorAll('.otp-digit');
        
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                // Only allow numbers
                if (!/^\d$/.test(value)) {
                    e.target.value = '';
                    return;
                }
                
                // Move to next input
                if (value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });
            
            input.addEventListener('keydown', (e) => {
                // Handle backspace
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
                
                // Handle paste
                if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    navigator.clipboard.readText().then(text => {
                        const digits = text.replace(/\D/g, '').slice(0, 6);
                        digits.split('').forEach((digit, i) => {
                            if (otpInputs[i]) {
                                otpInputs[i].value = digit;
                            }
                        });
                        if (digits.length > 0) {
                            otpInputs[Math.min(digits.length - 1, 5)].focus();
                        }
                    });
                }
            });
        });
    }

    setupPasswordValidation() {
        const requirements = {
            length: { regex: /.{8,}/, element: 'req-length' },
            lowercase: { regex: /[a-z]/, element: 'req-lowercase' },
            uppercase: { regex: /[A-Z]/, element: 'req-uppercase' },
            number: { regex: /\d/, element: 'req-number' },
            special: { regex: /[@$!%*?&]/, element: 'req-special' }
        };

        this.passwordRequirements = requirements;
    }

    validatePassword(password, targetPrefix = 'register') {
        const strengthEl = document.getElementById('passwordStrength');
        const requirementsEl = document.getElementById('passwordRequirements');
        
        if (!password) {
            if (strengthEl) strengthEl.classList.remove('visible');
            return;
        }

        if (strengthEl) strengthEl.classList.add('visible');

        let score = 0;
        let validCount = 0;

        Object.entries(this.passwordRequirements).forEach(([key, req]) => {
            const isValid = req.regex.test(password);
            const element = document.getElementById(req.element);
            
            if (element) {
                const li = element.closest('li');
                if (li) {
                    li.classList.toggle('valid', isValid);
                }
            }
            
            if (isValid) {
                score += 20;
                validCount++;
            }
        });

        // Update strength bar
        const strengthFill = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');
        
        if (strengthFill && strengthText) {
            strengthFill.className = 'strength-fill';
            
            if (score < 40) {
                strengthFill.classList.add('weak');
                strengthText.textContent = 'Weak password';
            } else if (score < 60) {
                strengthFill.classList.add('fair');
                strengthText.textContent = 'Fair password';
            } else if (score < 80) {
                strengthFill.classList.add('good');
                strengthText.textContent = 'Good password';
            } else {
                strengthFill.classList.add('strong');
                strengthText.textContent = 'Strong password';
            }
        }

        return validCount === 5;
    }

    validatePasswordMatch(passwordId = 'registerPassword', confirmId = 'confirmPassword') {
        const password = document.getElementById(passwordId).value;
        const confirmPassword = document.getElementById(confirmId).value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.showError(confirmId + 'Error', 'Passwords do not match');
            return false;
        } else {
            this.clearError(confirmId + 'Error');
            return true;
        }
    }

    togglePassword(e) {
        const button = e.target.closest('.password-toggle');
        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    generatePassword(e) {
        const button = e.target.closest('.password-generate');
        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);
        
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
        let password = '';
        
        // Ensure at least one character from each required category
        password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
        password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
        password += '0123456789'[Math.floor(Math.random() * 10)]; // number
        password += '@$!%*?&'[Math.floor(Math.random() * 7)]; // special
        
        // Fill the rest randomly
        for (let i = 4; i < 12; i++) {
            password += charset[Math.floor(Math.random() * charset.length)];
        }
        
        // Shuffle the password
        password = password.split('').sort(() => Math.random() - 0.5).join('');
        
        input.value = password;
        input.type = 'text';
        
        // Update password toggle icon
        const toggleBtn = input.parentElement.querySelector('.password-toggle i');
        if (toggleBtn) {
            toggleBtn.className = 'fas fa-eye-slash';
        }
        
        // Trigger validation
        if (targetId.includes('register') || targetId.includes('new')) {
            this.validatePassword(password, targetId.includes('new') ? 'new' : 'register');
        }
        
        // Show notification
        this.showNotification('Strong password generated!', 'success');
        
        // Auto-hide password after 3 seconds
        setTimeout(() => {
            input.type = 'password';
            if (toggleBtn) {
                toggleBtn.className = 'fas fa-eye';
            }
        }, 3000);
    }

    // Google authentication is now handled by direct links to the backend
    async initializeGoogleAuth() {
        // No client-side Google authentication code needed
        console.log('Google auth is now handled by direct links to the backend');
    }
    
    // Google authentication is now handled by direct links to the backend
    // No client-side rendering needed

    // Google authentication is now handled by direct links to the backend
    // No client-side handling needed

    // Google authentication is now handled by direct links to the backend
    // No client-side callback needed
    
    // Google authentication is now handled by direct links to the backend
    // No client-side button handling needed

    // Validation methods
    validateLoginForm(email, password) {
        let isValid = true;

        if (!this.validateEmail(email)) {
            this.showError('loginEmailError', 'Please enter a valid email address');
            isValid = false;
        } else {
            this.clearError('loginEmailError');
        }

        if (!password) {
            this.showError('loginPasswordError', 'Password is required');
            isValid = false;
        } else {
            this.clearError('loginPasswordError');
        }

        return isValid;
    }

    validateRegisterForm(name, email, password, confirmPassword, agreeTerms) {
        let isValid = true;

        if (!name || name.length < 2) {
            this.showError('registerNameError', 'Name must be at least 2 characters long');
            isValid = false;
        } else {
            this.clearError('registerNameError');
        }

        if (!this.validateEmail(email)) {
            this.showError('registerEmailError', 'Please enter a valid email address');
            isValid = false;
        } else {
            this.clearError('registerEmailError');
        }

        if (!this.validatePassword(password)) {
            this.showError('registerPasswordError', 'Password does not meet requirements');
            isValid = false;
        } else {
            this.clearError('registerPasswordError');
        }

        if (password !== confirmPassword) {
            this.showError('confirmPasswordError', 'Passwords do not match');
            isValid = false;
        } else {
            this.clearError('confirmPasswordError');
        }

        if (!agreeTerms) {
            this.showNotification('Please agree to the Terms of Service and Privacy Policy', 'error');
            isValid = false;
        }

        return isValid;
    }

    validateResetForm(otp, password, confirmPassword) {
        let isValid = true;

        if (!otp || otp.length !== 6) {
            this.showError('resetOtpError', 'Please enter the 6-digit reset code');
            isValid = false;
        } else {
            this.clearError('resetOtpError');
        }

        if (!this.validatePassword(password, 'new')) {
            this.showError('newPasswordError', 'Password does not meet requirements');
            isValid = false;
        } else {
            this.clearError('newPasswordError');
        }

        if (password !== confirmPassword) {
            this.showError('confirmNewPasswordError', 'Passwords do not match');
            isValid = false;
        } else {
            this.clearError('confirmNewPasswordError');
        }

        return isValid;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Utility methods
    showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }
    }

    clearError(elementId) {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.classList.remove('show');
        }
    }

    clearErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.classList.remove('show');
        });
    }

    setLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification container if it doesn't exist
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            container.id = 'notificationContainer';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    backToForm() {
        if (this.pendingData && this.pendingData.type === 'register') {
            this.switchTab('register');
        } else {
            this.switchTab('login');
        }
    }

    showLoginMessage() {
        const message = localStorage.getItem('login-message');
        if (message) {
            this.showNotification(message, 'info');
            localStorage.removeItem('login-message');
        }
    }

    async checkAuthState() {
        console.log('🔍 Login page: Checking auth state...');
        
        // Check if API is available
        if (!window.API) {
            console.log('⚠️ Login page: API not available yet, skipping auth check');
            return;
        }
        
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (token) {
            console.log('🔍 Login page: Token found, validating...');
            try {
                // Validate token with server
                const userData = await window.API.getProfile(token);
                if (userData && userData.user) {
                    // Token is valid, user is logged in, redirect to home
                    console.log('✅ Login page: User already logged in, redirecting to home');
                    console.log('✅ Login page: User data:', userData.user);
                    sessionStorage.setItem('forceNavUpdate', 'true');
                    window.location.href = '../index.html';
                    return;
                } else {
                    console.log('❌ Login page: Invalid user data received');
                    throw new Error('Invalid user data received');
                }
            } catch (error) {
                console.log('❌ Login page: Token validation failed, clearing invalid token');
                console.error('❌ Login page: Error details:', error);
                // Token is invalid, clear it
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('currentUser');
            }
        } else {
            console.log('ℹ️ Login page: No token found, showing login form');
        }
    }

    getAPIBaseURL() {
        // Force production mode - always use production URL to avoid localhost issues
        const FORCE_PRODUCTION = true; // Set to true to always use production URL
        
        const isProduction = FORCE_PRODUCTION || (
            window.location.hostname !== 'localhost' && 
            window.location.hostname !== '127.0.0.1' && 
            !window.location.hostname.includes('local')
        );
        
        const baseURL = isProduction ? 'https://sanjayraj-n.onrender.com' : 'http://localhost:3000';
        console.log('LoginPageManager API Base URL:', baseURL);
        return baseURL;
    }

    // Google authentication is now handled by direct links to the backend
    // No client-side Google client ID needed
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.loginPageManager = new LoginPageManager();
});