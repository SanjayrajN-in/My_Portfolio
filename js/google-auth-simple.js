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
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response) => this.handleCredentialResponse(response),
        auto_select: false,
        cancel_on_tap_outside: true
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
      this.showMessage('Google login not available. Please try again.', 'error');
      return;
    }
    
    if (this.isLoading) {
      console.log('Login already in progress');
      return;
    }
    
    console.log('Starting Google login...');
    window.google.accounts.id.prompt();
  }
  
  async handleCredentialResponse(response) {
    if (this.isLoading) {
      return;
    }
    
    this.isLoading = true;
    this.showMessage('Logging in...', 'info');
    
    try {
      console.log('Google credential received, sending to backend...');
      
      // Send credential to backend
      const result = await fetch('/api/auth/google-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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