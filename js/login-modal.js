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
        
        // Remove existing modal if it exists
        const existingModal = document.getElementById('loginModalOverlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal HTML
        this.createModal();
        console.log('Modal HTML created');
        
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
                                <div class="password-input-wrapper">
                                    <input type="password" id="registerPassword" name="password" placeholder="Create a password" required>
                                    <button type="button" class="password-toggle" onclick="togglePasswordVisibility('registerPassword')" aria-label="Show password" title="Show password">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button type="button" class="password-generate" onclick="loginModal.generatePassword()" aria-label="Generate password" title="Generate strong password">
                                        <i class="fas fa-magic"></i>
                                    </button>
                                </div>
                                <div class="password-strength">
                                    <div class="password-strength-bar"></div>
                                </div>
                                <div class="password-strength-text"></div>
                                <div class="password-requirements">
                                    <small>Password must contain:</small>
                                    <ul>
                                        <li id="req-length" class="requirement">At least 8 characters</li>
                                        <li id="req-uppercase" class="requirement">One uppercase letter (A-Z)</li>
                                        <li id="req-lowercase" class="requirement">One lowercase letter (a-z)</li>
                                        <li id="req-number" class="requirement">One number (0-9)</li>
                                        <li id="req-special" class="requirement">One special character (!@#$%^&*)</li>
                                    </ul>
                                </div>
                                <div class="validation-message" id="passwordValidation"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="confirmPassword">Confirm Password</label>
                                <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm your password" required>
                                <button type="button" class="password-toggle" onclick="togglePasswordVisibility('confirmPassword')" aria-label="Show password" title="Show password">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <div class="validation-message" id="confirmPasswordValidation"></div>
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
        
        console.log('✅ Modal HTML injected with enhanced password features');
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

        // Password validation events
        this.setupPasswordValidation();
    }

    open() {
        console.log('Opening login modal...');
        
        // Recreate modal to ensure latest HTML structure
        const existingModal = document.getElementById('loginModalOverlay');
        if (existingModal) {
            existingModal.remove();
        }
        this.createModal();
        this.bindEvents();
        
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
            // Call the auth system's handleLogin method (database-based)
            await authSystem.handleLogin(e);
        } catch (error) {
            console.error('Login error:', error);
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

        // Validate password strength
        if (!this.isPasswordValid(password)) {
            this.showMessage('Please ensure your password meets all requirements.');
            this.setLoading(false);
            return;
        }

        try {
            // Call the auth system's handleRegister method (database-based)
            await authSystem.handleRegister(e);
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage('An error occurred. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    setupPasswordValidation() {
        const passwordInput = document.getElementById('registerPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.validatePasswordRealTime(passwordInput.value);
                this.updatePasswordStrength(passwordInput.value);
            });

            passwordInput.addEventListener('focus', () => {
                const requirements = document.querySelector('.password-requirements');
                if (requirements) {
                    requirements.classList.add('show');
                    requirements.style.display = 'block';
                }
            });

            passwordInput.addEventListener('blur', () => {
                const requirements = document.querySelector('.password-requirements');
                if (requirements && passwordInput.value.length === 0) {
                    requirements.classList.remove('show');
                    setTimeout(() => {
                        if (!requirements.classList.contains('show')) {
                            requirements.style.display = 'none';
                        }
                    }, 300);
                }
            });
        }

        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
        }
        
        console.log('✅ Enhanced password validation setup complete');
    }

    validatePasswordRealTime(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        // Update requirement indicators
        Object.keys(requirements).forEach(req => {
            const element = document.getElementById(`req-${req}`);
            if (element) {
                if (requirements[req]) {
                    element.classList.add('met');
                    element.classList.remove('unmet');
                } else {
                    element.classList.add('unmet');
                    element.classList.remove('met');
                }
            }
        });

        return requirements;
    }

    updatePasswordStrength(password) {
        const strengthBar = document.querySelector('.password-strength-bar');
        const strengthText = document.querySelector('.password-strength-text');
        const requirements = this.validatePasswordRealTime(password);
        
        if (!strengthBar || !strengthText) return;

        const metCount = Object.values(requirements).filter(Boolean).length;
        let strength = 0;
        let strengthLabel = '';
        let strengthClass = '';

        if (password.length === 0) {
            strength = 0;
            strengthLabel = '';
            strengthClass = '';
        } else if (metCount <= 2) {
            strength = 25;
            strengthLabel = 'Weak';
            strengthClass = 'password-strength-weak';
        } else if (metCount === 3) {
            strength = 50;
            strengthLabel = 'Fair';
            strengthClass = 'password-strength-fair';
        } else if (metCount === 4) {
            strength = 75;
            strengthLabel = 'Good';
            strengthClass = 'password-strength-good';
        } else if (metCount === 5) {
            strength = 100;
            strengthLabel = 'Strong';
            strengthClass = 'password-strength-strong';
        }

        // Remove all strength classes
        strengthBar.parentElement.className = 'password-strength';
        if (strengthClass) {
            strengthBar.parentElement.classList.add(strengthClass);
        }

        strengthBar.style.width = strength + '%';
        strengthText.textContent = strengthLabel;
        strengthText.className = 'password-strength-text ' + strengthClass;
    }

    validatePasswordMatch() {
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const validationDiv = document.getElementById('confirmPasswordValidation');

        if (!validationDiv) return;

        if (confirmPassword.length === 0) {
            validationDiv.textContent = '';
            validationDiv.className = 'validation-message';
            return;
        }

        if (password === confirmPassword) {
            validationDiv.textContent = '✓ Passwords match';
            validationDiv.className = 'validation-message success';
        } else {
            validationDiv.textContent = '✗ Passwords do not match';
            validationDiv.className = 'validation-message error';
        }
    }

    isPasswordValid(password) {
        const requirements = this.validatePasswordRealTime(password);
        return Object.values(requirements).every(Boolean);
    }

    generatePassword() {
        // Check if user wants to replace existing password
        const currentPassword = document.getElementById('registerPassword').value;
        if (currentPassword && !confirm('This will replace your current password. Continue?')) {
            return;
        }

        const length = 14;
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*';
        
        let password = '';
        
        // Ensure at least one character from each required category
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];
        
        // Fill the rest with random characters from all categories
        const allChars = uppercase + lowercase + numbers + symbols;
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        // Shuffle the password to avoid predictable patterns
        password = password.split('').sort(() => Math.random() - 0.5).join('');
        
        // Set the password
        const passwordInput = document.getElementById('registerPassword');
        if (passwordInput) {
            passwordInput.value = password;
            passwordInput.type = 'text'; // Show the generated password
            
            // Update the toggle button
            const toggleButton = passwordInput.parentElement.querySelector('.password-toggle');
            if (toggleButton) {
                const icon = toggleButton.querySelector('i');
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                toggleButton.setAttribute('aria-label', 'Hide password');
                toggleButton.setAttribute('title', 'Hide password');
            }
            
            // Trigger validation
            this.validatePasswordRealTime(password);
            this.updatePasswordStrength(password);
            
            // Show requirements
            const requirements = document.querySelector('.password-requirements');
            if (requirements) {
                requirements.classList.add('show');
                requirements.style.display = 'block';
            }
            
            // Copy to clipboard
            this.copyToClipboard(password);
            
            // Auto-fill confirm password
            const confirmPasswordInput = document.getElementById('confirmPassword');
            if (confirmPasswordInput) {
                confirmPasswordInput.value = password;
                this.validatePasswordMatch();
                setTimeout(() => {
                    confirmPasswordInput.focus();
                }, 100);
            }
            
            // Show success message
            this.showMessage('🎉 Strong password generated and copied to clipboard!', 'success');
        }
    }

    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                this.showCopyNotification();
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
                this.showCopyNotification();
            }
        } catch (err) {
            console.log('Could not copy password:', err);
        }
    }

    showCopyNotification() {
        let notification = document.querySelector('.copy-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'copy-notification';
            notification.innerHTML = '<i class="fas fa-check"></i> Password copied to clipboard!';
            document.body.appendChild(notification);
        }

        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
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
    console.log('Opening login modal...');
    if (loginModal) {
        loginModal.open();
    } else {
        // Reinitialize if needed
        console.log('Reinitializing login modal...');
        loginModal = new LoginModal();
        loginModal.open();
    }
}