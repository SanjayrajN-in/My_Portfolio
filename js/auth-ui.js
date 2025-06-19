/**
 * Auth UI Handler
 * Updates the UI based on user authentication status
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    // Get UI elements
    const loginButtons = document.querySelectorAll('.login-button, .btn-login');
    const logoutButtons = document.querySelectorAll('.logout-button, .btn-logout');
    const userProfileLinks = document.querySelectorAll('.user-profile, .profile-link');
    const userNameElements = document.querySelectorAll('.user-name');
    const userAvatarElements = document.querySelectorAll('.user-avatar');
    const authOnlyElements = document.querySelectorAll('.auth-only');
    const guestOnlyElements = document.querySelectorAll('.guest-only');
    const userMenu = document.querySelector('.user-menu');
    
    // Update UI based on auth status
    if (currentUser && token) {
        // User is logged in
        try {
            const user = JSON.parse(currentUser);
            console.log('🔐 User is logged in:', user.name);
            
            // Show user name
            userNameElements.forEach(element => {
                element.textContent = user.name;
                element.style.display = '';
            });
            
            // Show user avatar if available
            if (user.avatar) {
                userAvatarElements.forEach(element => {
                    element.src = user.avatar;
                    element.style.display = '';
                });
            }
            
            // Show logout buttons
            logoutButtons.forEach(button => {
                button.style.display = '';
            });
            
            // Show user profile links
            userProfileLinks.forEach(link => {
                link.style.display = '';
            });
            
            // Show auth-only elements
            authOnlyElements.forEach(element => {
                element.style.display = '';
            });
            
            // Hide guest-only elements
            guestOnlyElements.forEach(element => {
                element.style.display = 'none';
            });
            
            // Hide login buttons
            loginButtons.forEach(button => {
                button.style.display = 'none';
            });
            
        } catch (error) {
            console.error('Error parsing user data:', error);
            handleLogout();
        }
    } else {
        // User is not logged in
        console.log('👋 User is not logged in');
        
        // Hide user name
        userNameElements.forEach(element => {
            element.style.display = 'none';
        });
        
        // Hide user avatar
        userAvatarElements.forEach(element => {
            element.style.display = 'none';
        });
        
        // Hide logout buttons
        logoutButtons.forEach(button => {
            button.style.display = 'none';
        });
        
        // Hide user profile links
        userProfileLinks.forEach(link => {
            link.style.display = 'none';
        });
        
        // Hide auth-only elements
        authOnlyElements.forEach(element => {
            element.style.display = 'none';
        });
        
        // Show guest-only elements
        guestOnlyElements.forEach(element => {
            element.style.display = '';
        });
        
        // Show login buttons
        loginButtons.forEach(button => {
            button.style.display = '';
        });
    }
    
    // Add logout functionality
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    });
    
    // Logout handler
    function handleLogout() {
        // Clear user data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Reload page
        window.location.reload();
    }
});