/**
 * Authentication protection for elements across the site
 * Handles protected elements like Download CV buttons
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize protection for all auth-protected elements
    initAuthProtection();
});

// Initialize authentication protection for all protected elements
function initAuthProtection() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const isLoggedIn = !!token;
    
    // Handle Download CV buttons
    const downloadButtons = document.querySelectorAll('.auth-protected[download], .auth-protected.locked');
    
    downloadButtons.forEach(button => {
        if (!isLoggedIn) {
            // Make sure the button has the locked class
            button.classList.add('locked');
            
            // Add click event to show login popup
            button.addEventListener('click', function(e) {
                e.preventDefault();
                showAuthRequiredNotification();
            });
        } else {
            // Remove locked class if user is logged in
            button.classList.remove('locked');
            
            // Remove click event handler
            button.removeEventListener('click', function(e) {
                e.preventDefault();
                showAuthRequiredNotification();
            });
        }
    });
}

// Show authentication required notification
function showAuthRequiredNotification() {
    const notification = document.createElement('div');
    notification.className = 'auth-notification';
    notification.innerHTML = `
        <div class="auth-notification-content">
            <i class="fas fa-lock"></i>
            <span>Please login to access this content</span>
            <button onclick="window.location.href='${window.location.pathname.includes('/pages/') ? '' : 'pages/'}login.html'" class="login-btn">Login</button>
            <button onclick="this.parentElement.parentElement.remove()" class="close-btn">×</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, rgba(0, 168, 255, 0.9), rgba(125, 95, 255, 0.9));
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        backdrop-filter: blur(10px);
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Listen for auth state changes
window.addEventListener('focus', () => {
    initAuthProtection();
});

window.addEventListener('storage', (e) => {
    if (e.key === 'token' || e.key === 'currentUser') {
        initAuthProtection();
    }
});