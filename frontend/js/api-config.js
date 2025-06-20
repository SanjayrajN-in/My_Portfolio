// API Configuration
class APIConfig {
    constructor() {
        // Force production mode - always use production URL to avoid localhost issues
        const FORCE_PRODUCTION = true; // Set to true to always use production URL
        
        // Detect if we're in production or development
        this.isProduction = FORCE_PRODUCTION || (
            window.location.hostname !== 'localhost' && 
            window.location.hostname !== '127.0.0.1' && 
            !window.location.hostname.includes('local')
        );
        
        this.baseURL = this.isProduction ? 'https://sanjayraj-n.onrender.com' : 'http://localhost:3000';
        this.apiVersion = '/api';
        console.log('APIConfig Base URL set to:', this.baseURL);
    }

    get apiURL() {
        return this.baseURL + this.apiVersion;
    }

    // Helper method to make API calls
    async makeRequest(endpoint, options = {}) {
        const url = this.apiURL + endpoint;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const requestOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, requestOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Authentication endpoints
    async register(userData) {
        return this.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        return this.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async sendOTP(email, type) {
        return this.makeRequest('/auth/send-otp', {
            method: 'POST',
            body: JSON.stringify({ email, type })
        });
    }

    async verifyOTP(email, otp, type, additionalData = {}) {
        return this.makeRequest('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ email, otp, type, ...additionalData })
        });
    }

    async verifyLogin(email, otp) {
        return this.makeRequest('/auth/verify-login', {
            method: 'POST',
            body: JSON.stringify({ email, otp })
        });
    }

    async resetPassword(email, otp, newPassword) {
        return this.makeRequest('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, otp, newPassword })
        });
    }

    async getProfile(token) {
        return this.makeRequest('/auth/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    async getGoogleClientId() {
        return this.makeRequest('/auth/google/init', {
            method: 'GET'
        });
    }

    async logout(token) {
        return this.makeRequest('/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    async googleLogin(credential) {
        return this.makeRequest('/auth/google-login', {
            method: 'POST',
            body: JSON.stringify({ credential })
        });
    }

    async googleRegister(credential) {
        return this.makeRequest('/auth/google-register', {
            method: 'POST',
            body: JSON.stringify({ credential })
        });
    }

    // Contact endpoint
    async submitContact(contactData) {
        return this.makeRequest('/contact/submit', {
            method: 'POST',
            body: JSON.stringify(contactData)
        });
    }

    // User endpoints
    async updateGameStats(userId, gameData) {
        return this.makeRequest('/users/update-game-stats', {
            method: 'POST',
            body: JSON.stringify({ userId, gameData })
        });
    }
}

// Export as global instance
window.API = new APIConfig();