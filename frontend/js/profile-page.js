// Profile Page JavaScript
class ProfilePageManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check authentication first
        if (!authSystem.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        this.currentUser = authSystem.getCurrentUser();
        this.setupEventListeners();
        this.loadProfileData();
        this.setupTabs();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.closest('.tab-btn').dataset.tab;
                this.switchTab(tab);
            });
        });

        // Change password modal
        document.getElementById('changePasswordBtn').addEventListener('click', () => {
            this.showChangePasswordModal();
        });

        document.getElementById('closePasswordModal').addEventListener('click', () => {
            this.hideChangePasswordModal();
        });

        document.getElementById('cancelPasswordChange').addEventListener('click', () => {
            this.hideChangePasswordModal();
        });

        document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
            this.handlePasswordChange(e);
        });

        // Password toggles
        document.querySelectorAll('.password-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => this.togglePassword(e));
        });

        // Avatar edit (placeholder)
        document.getElementById('avatarEditBtn').addEventListener('click', () => {
            this.showNotification('Avatar upload feature coming soon!', 'info');
        });

        // Edit profile (placeholder)
        document.getElementById('editProfileBtn').addEventListener('click', () => {
            this.showNotification('Profile editing feature coming soon!', 'info');
        });

        // 2FA enable (placeholder)
        document.getElementById('enable2FABtn').addEventListener('click', () => {
            this.showNotification('Two-factor authentication setup coming soon!', 'info');
        });

        // Close modal when clicking outside
        document.getElementById('changePasswordModal').addEventListener('click', (e) => {
            if (e.target.id === 'changePasswordModal') {
                this.hideChangePasswordModal();
            }
        });
    }

    async loadProfileData() {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const apiBaseURL = this.getAPIBaseURL();
            const response = await fetch(`${apiBaseURL}/api/auth/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.updateProfileElements();
            } else {
                throw new Error('Failed to load profile data');
            }
        } catch (error) {
            console.error('Load profile data error:', error);
            this.showNotification('Failed to load profile data', 'error');
        }
    }

    updateProfileElements() {
        if (!this.currentUser) return;

        // Update basic info
        const elements = {
            'profileName': this.currentUser.name,
            'profileEmail': this.currentUser.email,
            'profileNameInfo': this.currentUser.name,
            'profileEmailInfo': this.currentUser.email,
            'joinedDate': new Date(this.currentUser.joinedDate || this.currentUser.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            'lastLogin': this.currentUser.lastLogin ? 
                new Date(this.currentUser.lastLogin).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : 'Never'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Update avatar
        const avatarImg = document.getElementById('profileAvatar');
        if (avatarImg) {
            avatarImg.src = this.currentUser.avatar || '../images/default-avatar.svg';
        }

        // Update game stats
        if (this.currentUser.gameStats) {
            const stats = this.currentUser.gameStats;
            document.getElementById('totalGamesPlayed').textContent = stats.totalGamesPlayed || 0;
            document.getElementById('totalScore').textContent = stats.totalScore || 0;
            document.getElementById('highScore').textContent = stats.highScore || 0;
            document.getElementById('achievements').textContent = stats.achievements || 0;
        }

        // Update verification badge
        const verifiedBadge = document.getElementById('verifiedBadge');
        if (verifiedBadge) {
            if (this.currentUser.isEmailVerified) {
                verifiedBadge.style.display = 'flex';
            } else {
                verifiedBadge.style.display = 'none';
            }
        }

        // Update device info (placeholder)
        document.getElementById('currentDevice').textContent = this.getDeviceInfo();
        document.getElementById('currentLocation').textContent = 'Location not available';
    }

    getDeviceInfo() {
        const userAgent = navigator.userAgent;
        let device = 'Unknown Device';
        let browser = 'Unknown Browser';

        // Detect device
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
            device = 'Mobile Device';
        } else if (/Tablet|iPad/.test(userAgent)) {
            device = 'Tablet';
        } else {
            device = 'Desktop';
        }

        // Detect browser
        if (userAgent.includes('Chrome')) {
            browser = 'Chrome';
        } else if (userAgent.includes('Firefox')) {
            browser = 'Firefox';
        } else if (userAgent.includes('Safari')) {
            browser = 'Safari';
        } else if (userAgent.includes('Edge')) {
            browser = 'Edge';
        }

        return `${device} - ${browser}`;
    }

    setupTabs() {
        // Set default active tab
        this.switchTab('overview');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Tab');
        });

        // Load tab-specific data
        if (tabName === 'activity') {
            this.loadActivityData();
        }
    }

    loadActivityData() {
        // Placeholder for activity data
        const activityList = document.getElementById('activityList');
        if (activityList) {
            // Add current login activity
            const loginTime = new Date().toLocaleString();
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-sign-in-alt"></i>
                    </div>
                    <div class="activity-info">
                        <h4>Logged in</h4>
                        <p>${loginTime}</p>
                    </div>
                </div>
            `;
        }
    }

    showChangePasswordModal() {
        const modal = document.getElementById('changePasswordModal');
        modal.classList.add('show');
        modal.style.display = 'flex';
        
        // Focus first input
        setTimeout(() => {
            document.getElementById('currentPassword').focus();
        }, 100);
    }

    hideChangePasswordModal() {
        const modal = document.getElementById('changePasswordModal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        
        // Clear form
        document.getElementById('changePasswordForm').reset();
    }

    async handlePasswordChange(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmNewPassword = formData.get('confirmNewPassword');

        // Validate passwords
        if (newPassword !== confirmNewPassword) {
            this.showNotification('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 8) {
            this.showNotification('New password must be at least 8 characters long', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const apiBaseURL = this.getAPIBaseURL();
            const response = await fetch(`${apiBaseURL}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Password changed successfully!', 'success');
                this.hideChangePasswordModal();
            } else {
                this.showNotification(data.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('Change password error:', error);
            this.showNotification('Network error. Please try again.', 'error');
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

    getAPIBaseURL() {
        const isProduction = window.location.hostname !== 'localhost' && 
                            window.location.hostname !== '127.0.0.1' && 
                            !window.location.hostname.includes('local');
        return isProduction ? 'https://sanjayraj-n.onrender.com' : 'http://localhost:3000';
    }

    showNotification(message, type = 'info') {
        // Use the auth system's notification method
        if (authSystem && authSystem.showFloatingNotification) {
            authSystem.showFloatingNotification(message, type);
        } else {
            // Fallback notification
            alert(message);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.profilePageManager = new ProfilePageManager();
});