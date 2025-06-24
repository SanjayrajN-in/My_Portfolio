// Projects page specific JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize authentication protection for project buttons
    initProjectAuthProtection();
    
    // Project modal functionality
    const modal = document.querySelector('.project-modal');
    const modalContent = document.querySelector('.modal-body');
    const modalClose = document.querySelector('.modal-close');
    const viewButtons = document.querySelectorAll('.btn-view-project');
    const projectTemplates = document.querySelectorAll('.project-details-template');
    
    // Check if modal elements exist
    if (!modal || !modalContent) {
        console.warn('Modal elements not found. Modal functionality will not work.');
        // Don't return here - let other functionality work
    }
    

    
    // Open modal with project details
    viewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            // Check authentication first
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) {
                // Show notification instead of redirecting
                if (window.authSystem && typeof window.authSystem.showFloatingNotification === 'function') {
                    window.authSystem.showFloatingNotification('Please login to view project details', 'warning');
                } else {
                    // Fallback to simple notification if authSystem is not available
                    showAuthRequiredNotification();
                }
                return;
            }
            
            // Check if modal elements exist before proceeding
            if (!modal || !modalContent) {
                console.error('Modal elements not found!');
                return;
            }
            
            // Get project ID
            const projectId = this.getAttribute('data-project');
            
            // Find corresponding template
            let template;
            if (projectId) {
                template = document.getElementById(`${projectId}-details`);
            }
            
            // If template exists, load content
            if (template) {
                modalContent.innerHTML = template.innerHTML;
                
                // Initialize gallery functionality
                initGallery();
            } else {
                console.warn(`Template not found for project: ${projectId}`);
                // Show a fallback message
                modalContent.innerHTML = `
                    <div class="project-details">
                        <div class="project-details-header">
                            <h2>Project Details</h2>
                        </div>
                        <div class="project-details-content">
                            <div class="details-section">
                                <h3>Error</h3>
                                <p>Project details template not found for: ${projectId}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Show modal with animation
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Reset scroll position to top and enable smooth scrolling
            const modalContentElement = modal.querySelector('.modal-content');
            if (modalContentElement) {
                modalContentElement.scrollTop = 0;
                modalContentElement.style.scrollBehavior = 'smooth';
            }
            
            // Initialize gallery functionality
            setTimeout(() => {
                initGallery();
            }, 100);
        });
    });
    
    // Close modal function
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    // Close modal
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside content
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
    
    // Gallery functionality
    function initGallery() {
        const galleryMain = document.querySelector('.gallery-main img');
        const galleryThumbs = document.querySelectorAll('.gallery-thumbs img');
        
        if (galleryThumbs.length > 0) {
            galleryThumbs.forEach(thumb => {
                thumb.addEventListener('click', function() {
                    // Update main image
                    galleryMain.src = this.src;
                    galleryMain.alt = this.alt;
                    
                    // Update active thumb
                    galleryThumbs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                });
            });
        }
    }
    
    // Tilt effect removed for better performance
    
    // Show authentication required notification
    function showAuthRequiredNotification() {
        const notification = document.createElement('div');
        notification.className = 'auth-notification';
        notification.innerHTML = `
            <div class="auth-notification-content">
                <i class="fas fa-lock"></i>
                <span>Please login to view project details</span>
                <button onclick="window.location.href='login.html'" class="login-btn">Login</button>
                <button onclick="this.parentElement.parentElement.remove()" class="close-btn">×</button>
            </div>
        `;
        
        // Add styles with improved positioning to avoid navbar overlap
        notification.style.cssText = `
            position: fixed;
            top: 120px; /* Position further below navbar to avoid overlap */
            right: 20px;
            background: linear-gradient(135deg, rgba(0, 168, 255, 0.9), rgba(125, 95, 255, 0.9));
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            backdrop-filter: blur(10px);
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Add visual indicators for protected content - keep one lock icon
    function addAuthIndicators() {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            viewButtons.forEach(button => {
                button.classList.add('auth-protected');
                
                // Remove any existing lock indicators first to avoid duplicates
                const existingLocks = button.querySelectorAll('.lock-indicator');
                existingLocks.forEach(lock => lock.remove());
                
                // Add a single lock icon
                const lockIcon = document.createElement('i');
                lockIcon.className = 'fas fa-lock lock-indicator';
                lockIcon.style.cssText = `
                    margin-left: 8px;
                    font-size: 0.8rem;
                    opacity: 0.7;
                `;
                button.appendChild(lockIcon);
            });
        }
    }
    
    // Initialize auth indicators
    addAuthIndicators();

});

// Initialize authentication protection for project buttons
function initProjectAuthProtection() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const isLoggedIn = !!token;
    const viewButtons = document.querySelectorAll('.btn-view-project');
    
    viewButtons.forEach(button => {
        if (!isLoggedIn) {
            button.classList.add('auth-protected');
            
            // Remove any existing lock indicators first to avoid duplicates
            const existingLocks = button.querySelectorAll('.lock-indicator');
            existingLocks.forEach(lock => lock.remove());
            
            // Add a single lock icon
            const lockIcon = document.createElement('i');
            lockIcon.className = 'fas fa-lock lock-indicator';
            lockIcon.style.cssText = `
                margin-left: 8px;
                font-size: 0.8rem;
                opacity: 0.7;
            `;
            button.appendChild(lockIcon);
        } else {
            // Remove auth protection and lock indicators
            button.classList.remove('auth-protected');
            const lockIcons = button.querySelectorAll('.lock-indicator');
            lockIcons.forEach(icon => icon.remove());
        }
    });
}

// Listen for auth state changes
window.addEventListener('focus', () => {
    initProjectAuthProtection();
});

window.addEventListener('storage', (e) => {
    if (e.key === 'token' || e.key === 'currentUser') {
        initProjectAuthProtection();
    }
});