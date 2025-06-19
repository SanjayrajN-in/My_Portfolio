// Simple Google Authentication
class GoogleAuthSimple {
  constructor() {
    this.clientId = '962387684215-f3ohlicfr8t1obvcojhlra04dd4kji2f.apps.googleusercontent.com';
    this.isInitialized = false;
    this.isLoading = false;
    
    // Initialize Google Identity Services
    this.loadGoogleScript();
  }
  
  loadGoogleScript() {
    if (document.getElementById('google-auth-script')) {
      this.initGoogleAuth();
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'google-auth-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.initGoogleAuth();
    document.head.appendChild(script);
  }
  
  initGoogleAuth() {
    if (window.google && window.google.accounts) {
      // Suppress Google Identity Services warnings
      const originalConsoleWarn = console.warn;
      console.warn = function(...args) {
        const message = args.join(' ');
        if (message.includes('[GSI_LOGGER]') || 
            message.includes('FedCM') || 
            message.includes('Identity Credential')) {
          return; // Suppress these warnings
        }
        originalConsoleWarn.apply(console, args);
      };
      
      // Initialize Google Identity Services with more options
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response) => this.handleCredentialResponse(response),
        auto_select: false,
        cancel_on_tap_outside: true,
        prompt_parent_id: 'g_id_onload', // Optional container ID
        context: 'signin',
        ux_mode: 'popup',
        itp_support: true
      });
      
      this.isInitialized = true;
      console.log('Google Identity Services initialized');
    } else {
      console.error('Google Identity Services not available');
    }
  }
  
  login() {
    if (!this.isInitialized) {
      console.error('Google Identity Services not initialized');
      this.showMessage('Google login not available. Using fallback...', 'info');
      this.useOAuthFallback();
      return;
    }
    
    if (this.isLoading) {
      console.log('Login already in progress');
      return;
    }
    
    console.log('Starting Google login...');
    
    try {
      window.google.accounts.id.prompt();
    } catch (error) {
      console.error('Error with Google Identity Services:', error);
      this.showMessage('Using alternative login method...', 'info');
      this.useOAuthFallback();
    }
  }
  
  useOAuthFallback() {
    console.log('Using OAuth fallback for Google login');
    
    // Create OAuth URL
    const clientId = this.clientId;
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/callback`);
    const scope = encodeURIComponent('openid email profile');
    const state = this.generateRandomState();
    
    // Store state for verification
    try {
      sessionStorage.setItem('google_oauth_state', state);
    } catch (e) {
      console.warn('Could not store state in sessionStorage:', e);
    }
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=${scope}&` +
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
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        console.log('Popup closed');
        
        // Check if login was successful
        setTimeout(() => {
          const user = localStorage.getItem('user');
          const token = localStorage.getItem('token');
          
          if (user && token) {
            console.log('Login successful via popup');
            this.showMessage('Login successful!', 'success');
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }, 1000);
      }
    }, 1000);
  }
  
  generateRandomState() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  async handleCredentialResponse(response) {
    if (this.isLoading) {
      return;
    }
    
    this.isLoading = true;
    this.showMessage('Logging in...', 'info');
    
    try {
      console.log('Google credential received, sending to backend...');
      
      // Get the current origin for proper CORS handling
      const apiUrl = `${window.location.origin}/api/auth/google-simple`;
      console.log('Using API URL:', apiUrl);
      
      // Send credential to backend with proper CORS headers
      const result = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: JSON.stringify({ credential: response.credential })
      });
      
      if (!result.ok) {
        throw new Error(`Server error: ${result.status}`);
      }
      
      const data = await result.json();
      
      if (data.success) {
        // Store user data and token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        this.showMessage('Login successful!', 'success');
        console.log('Login successful:', data.user.name);
        
        // Reload page after successful login
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      this.showMessage(`Login failed: ${error.message}`, 'error');
    } finally {
      this.isLoading = false;
    }
  }
  
  showMessage(message, type = 'info') {
    // Simple alert for now
    alert(message);
    
    // You can replace this with a more sophisticated notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

// Initialize and expose globally
window.googleAuthSimple = new GoogleAuthSimple();

// Add login button if needed
document.addEventListener('DOMContentLoaded', () => {
  // Find all Google login buttons
  const googleButtons = document.querySelectorAll('.google-login-button');
  
  googleButtons.forEach(button => {
    button.addEventListener('click', () => {
      window.googleAuthSimple.login();
    });
  });
});