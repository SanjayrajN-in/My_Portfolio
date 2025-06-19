// Direct Google OAuth Implementation
// This implementation uses the traditional OAuth 2.0 flow without relying on Google Identity Services

class GoogleOAuthDirect {
  constructor() {
    // Google OAuth configuration
    this.clientId = '962387684215-f3ohlicfr8t1obvcojhlra04dd4kji2f.apps.googleusercontent.com';
    
    // Use the correct redirect URI that matches what's configured in Google Cloud Console
    // For Vercel deployment
    if (window.location.hostname === 'sanjayrajn.vercel.app') {
      this.redirectUri = 'https://sanjayrajn.vercel.app/api/auth/callback';
    } 
    // For localhost development
    else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      this.redirectUri = 'http://localhost:3000/api/auth/callback';
    } 
    // Fallback
    else {
      this.redirectUri = `${window.location.origin}/api/auth/callback`;
    }
    
    this.scope = 'openid email profile';
    
    console.log('Google OAuth Direct initialized with redirect URI:', this.redirectUri);
    
    // Initialize
    this.init();
  }
  
  init() {
    console.log('Initializing Direct Google OAuth...');
    
    // Add login buttons
    this.setupLoginButtons();
    
    // Add a floating login button for easy access
    this.addFloatingButton();
  }
  
  setupLoginButtons() {
    // Find all buttons with the direct-google-oauth class
    document.addEventListener('DOMContentLoaded', () => {
      const buttons = document.querySelectorAll('.direct-google-oauth');
      
      buttons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          this.startLogin();
        });
      });
      
      console.log(`Found and initialized ${buttons.length} direct Google OAuth buttons`);
    });
  }
  
  addFloatingButton() {
    // Create a floating button that appears after 2 seconds
    setTimeout(() => {
      const buttonContainer = document.createElement('div');
      buttonContainer.id = 'floating-google-login';
      buttonContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: block;';
      
      const button = document.createElement('button');
      button.className = 'direct-google-oauth';
      button.style.cssText = 'background: #4285F4; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; font-family: Arial, sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.2);';
      button.innerHTML = '<i class="fab fa-google" style="margin-right: 10px;"></i> Sign in with Google';
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.startLogin();
      });
      
      buttonContainer.appendChild(button);
      document.body.appendChild(buttonContainer);
      
      console.log('Added floating Google login button');
    }, 2000);
  }
  
  startLogin() {
    console.log('Starting Google OAuth login flow...');
    
    // Generate a random state value for security
    const state = this.generateRandomState();
    
    // Store state for verification
    try {
      sessionStorage.setItem('google_oauth_state', state);
    } catch (e) {
      console.warn('Could not store state in sessionStorage:', e);
    }
    
    // Build the OAuth URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(this.clientId)}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(this.scope)}&` +
      `state=${encodeURIComponent(state)}&` +
      `access_type=offline&` +
      `prompt=select_account`;
    
    // Open the OAuth popup
    const popup = window.open(
      authUrl,
      'google-oauth-login',
      'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
    );
    
    if (!popup) {
      alert('Popup blocked. Please allow popups for this site.');
      return;
    }
    
    // Monitor the popup
    this.monitorPopup(popup);
  }
  
  monitorPopup(popup) {
    console.log('Monitoring OAuth popup...');
    
    // Check if the popup is closed
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        console.log('OAuth popup closed');
        
        // Check if login was successful
        setTimeout(() => {
          const user = localStorage.getItem('user');
          const token = localStorage.getItem('token');
          
          if (user && token) {
            console.log('Login successful via OAuth popup');
            alert('Login successful!');
            
            // Reload the page to update the UI
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            console.log('Login was not completed or failed');
          }
        }, 1000);
      }
    }, 1000);
    
    // Set a timeout to clear the interval if the popup stays open too long
    setTimeout(() => {
      clearInterval(checkClosed);
      if (!popup.closed) {
        popup.close();
        console.log('OAuth popup timed out');
      }
    }, 300000); // 5 minutes
  }
  
  generateRandomState() {
    // Generate a random string for state parameter
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Initialize and expose globally
window.googleOAuthDirect = new GoogleOAuthDirect();

// Add a direct login button to the login modal if it exists
document.addEventListener('DOMContentLoaded', () => {
  // Wait for the login modal to be created
  setTimeout(() => {
    const loginModalBody = document.querySelector('.login-modal-body');
    if (loginModalBody) {
      // Create a direct OAuth button
      const directButton = document.createElement('button');
      directButton.className = 'google-login-btn direct-google-oauth';
      directButton.innerHTML = '<i class="fab fa-google"></i><span>Sign in with Google (Direct)</span>';
      
      // Add it to the modal
      const formDivider = loginModalBody.querySelector('.form-divider');
      if (formDivider) {
        loginModalBody.insertBefore(directButton, formDivider);
        console.log('Added direct Google OAuth button to login modal');
      }
    }
  }, 1000);
});