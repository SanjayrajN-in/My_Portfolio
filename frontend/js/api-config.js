// API Configuration
class APIConfig {
    constructor() {
        // Detect if we're in production or development
        this.isProduction = window.location.hostname !== 'localhost' && 
                           window.location.hostname !== '127.0.0.1' && 
                           !window.location.hostname.includes('local');
        
        this.baseURL = this.isProduction ? 'https://sanjayraj-n.onrender.com' : 'http://localhost:3000';
        this.apiVersion = '/api';
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
            console.error('API request error:', error);
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