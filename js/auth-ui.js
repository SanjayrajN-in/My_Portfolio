/**
 * Auth UI Handler
 * Updates the UI based on user authentication status
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    let currentUser = null;
    let token = null;
    
    try {
        currentUser = localStorage.getItem('currentUser');
        token = localStorage.getItem('token');
        console.log('🔐 Auth check - currentUser:', !!currentUser, 'token:', !!token);
    } catch (error) {
        console.error('❌ Error accessing localStorage:', error);
        // Clear potentially corrupted data
        try {
            localStorage.clear();
        } catch (clearError) {
            console.error('❌ Error clearing localStorage:', clearError);
        }
    }
    
    // Get UI elements
    const loginButtons = document.querySelectorAll('.login-button, .btn-login');
    const logoutButtons = document.querySelectorAll('.logout-button, .btn-logout');
    const userProfileLinks = document.querySelectorAll('.user-profile, .profile-link');
    const userNameElements = document.querySelectorAll('.user-name');
    const userAvatarElements = document.querySelectorAll('.user-avatar');
    const authOnlyElements = document.querySelectorAll('.auth-only');
    const guestOnlyElements = document.querySelectorAll('.guest-only');
    
    // We'll create the user menu dynamically if needed
    let userMenu = document.querySelector('.user-menu');
    
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
            
            // Create user menu if it doesn't exist
            if (!userMenu) {
                console.log('🔄 Creating user menu');
                userMenu = document.createElement('div');
                userMenu.className = 'user-menu';
                userMenu.innerHTML = `
                    <div class="user-avatar-container">
                        <img src="${user.avatar || 'images/default-avatar.svg'}" alt="User Avatar" class="user-avatar" id="navUserAvatar">
                        <div class="user-dropdown">
                            <a href="pages/profile.html" class="user-dropdown-item">
                                <i class="fas fa-user"></i>
                                <span>Profile</span>
                            </a>
                            <a href="javascript:void(0);" class="user-dropdown-item logout-button">
                                <i class="fas fa-sign-out-alt"></i>
                                <span>Logout</span>
                            </a>
                        </div>
                    </div>
                `;
                
                // Add to navigation container
                const navContainer = document.querySelector('.nav-container');
                if (navContainer) {
                    navContainer.insertBefore(userMenu, document.querySelector('.hamburger'));
                    console.log('✅ User menu added to navigation');
                    
                    // Add logout event listener to the new button
                    const newLogoutButton = userMenu.querySelector('.logout-button');
                    if (newLogoutButton) {
                        newLogoutButton.addEventListener('click', handleLogout);
                    }
                }
            } else {
                userMenu.style.display = '';
                console.log('✅ User menu displayed');
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
        console.log('🔄 Logging out user...');
        
        try {
            // Clear user data
            localStorage.removeItem('currentUser');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            console.log('✅ User data cleared from localStorage');
            
            // Hide user menu if it exists
            if (userMenu) {
                userMenu.style.display = 'none';
            }
            
            // Show success message
            const logoutMessage = document.createElement('div');
            logoutMessage.className = 'logout-message';
            logoutMessage.innerHTML = `
                <div class="logout-message-content">
                    <i class="fas fa-check-circle"></i>
                    <span>Logged out successfully!</span>
                </div>
            `;
            document.body.appendChild(logoutMessage);
            
            // Remove message after delay
            setTimeout(() => {
                if (logoutMessage.parentNode) {
                    logoutMessage.parentNode.removeChild(logoutMessage);
                }
                // Redirect to home page
                window.location.href = window.location.origin + '/index.html';
            }, 1500);
        } catch (error) {
            console.error('❌ Error during logout:', error);
            // Force reload even if there was an error
            window.location.reload();
        }
    }
});