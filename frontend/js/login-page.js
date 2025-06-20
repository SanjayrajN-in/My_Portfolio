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
        this.initializeGoogleAuth();
        this.checkAuthState();
        this.setupPasswordValidation();
        this.setupOTPInput();
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

        // Google login buttons
        document.getElementById('googleLoginBtn').addEventListener('click', () => this.handleGoogleAuth('login'));
        document.getElementById('googleRegisterBtn').addEventListener('click', () => this.handleGoogleAuth('register'));

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
            const response = await fetch(`${window.API_BASE_URL || this.getAPIBaseURL()}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.user) {
                // Store token
                if (rememberMe) {
                    localStorage.setItem('token', data.token);
                } else {
                    sessionStorage.setItem('token', data.token);
                }

                this.showNotification('Login successful! Welcome back.', 'success');
                
                // Redirect after short delay
                setTimeout(() => {
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
            this.showNotification('Network error. Please try again.', 'error');
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
            const response = await fetch(`${window.API_BASE_URL || this.getAPIBaseURL()}/api/auth/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, type })
            });

            const data = await response.json();

            if (response.ok) {
                // Store pending data
                this.pendingData = {
                    email,
                    type,
                    ...additionalData
                };

                this.showNotification('Verification code sent to your email!', 'success');
                this.showOTPForm(email);
                this.startOTPCountdown();
                
            } else {
                if (data.shouldLogin && type === 'register') {
                    this.showNotification(data.message, 'error');
                    setTimeout(() => this.switchTab('login'), 2000);
                } else {
                    this.showNotification(data.message || 'Failed to send verification code', 'error');
                }
            }
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
        const response = await fetch(`${window.API_BASE_URL || this.getAPIBaseURL()}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: this.pendingData.name,
                email: this.pendingData.email,
                password: this.pendingData.password,
                confirmPassword: this.pendingData.password,
                otp
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            this.showNotification('Account created successfully! Welcome!', 'success');
            
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        } else {
            this.showError('otpError', data.message || 'Invalid or expired code');
        }
    }

    async completeLoginVerification(otp) {
        const response = await fetch(`${window.API_BASE_URL || this.getAPIBaseURL()}/api/auth/verify-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: this.pendingData.email,
                otp
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            this.showNotification('Login successful! Welcome back.', 'success');
            
            setTimeout(() => {
                window.location.href = '../index.html';
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
            const response = await fetch(`${window.API_BASE_URL || this.getAPIBaseURL()}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: this.pendingData.email,
                    otp,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
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

    async initializeGoogleAuth() {
        try {
            if (typeof google !== 'undefined' && google.accounts) {
                const clientId = await this.fetchGoogleClientId();
                if (clientId) {
                    google.accounts.id.initialize({
                        client_id: clientId,
                        callback: this.handleGoogleCallback.bind(this)
                    });
                    this.googleInitialized = true;
                    console.log('Google Auth initialized successfully');
                } else {
                    console.error('Failed to get Google Client ID');
                }
            } else {
                console.log('Google Identity Services not loaded yet, retrying...');
                // Retry after a delay
                setTimeout(() => this.initializeGoogleAuth(), 1000);
            }
        } catch (error) {
            console.error('Google Auth initialization error:', error);
        }
    }

    handleGoogleAuth(type) {
        if (!this.googleInitialized) {
            this.showNotification('Google authentication not available', 'error');
            return;
        }

        this.googleAuthType = type;
        google.accounts.id.prompt();
    }

    async handleGoogleCallback(response) {
        try {
            const endpoint = this.googleAuthType === 'register' ? 'google-register' : 'google-login';
            
            const res = await fetch(`${window.API_BASE_URL || this.getAPIBaseURL()}/api/auth/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    credential: response.credential
                })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                this.showNotification(`${this.googleAuthType === 'register' ? 'Registration' : 'Login'} successful!`, 'success');
                
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            } else {
                this.showNotification(data.message || 'Google authentication failed', 'error');
            }
        } catch (error) {
            console.error('Google auth error:', error);
            this.showNotification('Google authentication failed', 'error');
        }
    }

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
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    backToForm() {
        if (this.pendingData && this.pendingData.type === 'register') {
            this.switchTab('register');
        } else {
            this.switchTab('login');
        }
    }

    checkAuthState() {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            // User is already logged in, redirect to home
            window.location.href = '../index.html';
        }
    }

    getAPIBaseURL() {
        const isProduction = window.location.hostname !== 'localhost' && 
                            window.location.hostname !== '127.0.0.1' && 
                            !window.location.hostname.includes('local');
        return isProduction ? 'https://sanjayraj-n.onrender.com' : 'http://localhost:3000';
    }

    getGoogleClientId() {
        // For frontend, we'll need to get this from the server or set it in a config
        // Since we can't access process.env directly in frontend, we'll make an API call
        return this.fetchGoogleClientId();
    }

    async fetchGoogleClientId() {
        try {
            const response = await fetch(`${this.getAPIBaseURL()}/api/auth/google-config`);
            const data = await response.json();
            return data.clientId;
        } catch (error) {
            console.error('Failed to fetch Google Client ID:', error);
            return null;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.loginPageManager = new LoginPageManager();
});