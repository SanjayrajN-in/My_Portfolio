// Projects page specific JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize authentication protection for project buttons
    initProjectAuthProtection();
    
    // Handle direct links with hash in URL (e.g., projects.html#keithley)
    if (window.location.hash) {
        const projectId = window.location.hash.substring(1); // Remove the # character
        console.log(`Direct link detected to project: ${projectId}`);
        
        // First scroll to the project item
        const projectItem = document.getElementById(projectId);
        if (projectItem) {
            console.log(`Scrolling to project: ${projectId}`);
            setTimeout(() => {
                projectItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
        
        // Find the button for this project
        const projectButton = document.querySelector(`.btn-view-project[data-project="${projectId}"]`);
        if (projectButton) {
            console.log(`Found button for project: ${projectId}`);
            // Simulate a click on the button after a short delay to ensure page is loaded
            setTimeout(() => {
                projectButton.click();
            }, 800);
        } else {
            console.warn(`No button found for project: ${projectId}`);
        }
    }
    
    // Project modal functionality
    const modal = document.querySelector('.project-modal');
    const modalContent = document.querySelector('.modal-body');
    const modalClose = document.querySelector('.modal-close');
    const viewButtons = document.querySelectorAll('.btn-view-project');
    
    // Check if modal elements exist
    if (!modal || !modalContent) {
        console.warn('Modal elements not found. Modal functionality will not work.');
        return;
    }
    
    // Debug: Log all project buttons
    console.log('Project buttons found:', viewButtons.length);
    viewButtons.forEach((button, index) => {
        console.log(`Button ${index}: data-project="${button.getAttribute('data-project')}"`);
    });
    
    // Debug: Log all project templates
    const projectTemplates = document.querySelectorAll('.project-details-template');
    console.log('Project templates found:', projectTemplates.length);
    projectTemplates.forEach(template => {
        console.log(`Template: ${template.id}`);
    });
    
    // Close modal function
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Clear modal content after animation completes
        setTimeout(() => {
            modalContent.innerHTML = '';
        }, 300);
    }
    
    // Function to show login notification
    function showLoginNotification() {
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
        
        notification.style.cssText = `
            position: fixed;
            top: calc(var(--header-height) + 20px);
            right: 20px;
            background: linear-gradient(135deg, rgba(0, 168, 255, 0.9), rgba(125, 95, 255, 0.9));
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 1000000;
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
    
    // Handle view project button clicks
    viewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check authentication first
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) {
                showLoginNotification();
                return;
            }
            
            // Get the project ID directly from the button
            const projectId = this.getAttribute('data-project');
            console.log(`Button clicked for project: ${projectId}`);
            
            // Find the template for this project
            const templateId = `${projectId}-details`;
            const template = document.getElementById(templateId);
            
            if (!template) {
                console.error(`Template not found: ${templateId}`);
                console.log('Available templates:');
                document.querySelectorAll('.project-details-template').forEach(t => {
                    console.log(`- ${t.id}`);
                });
                return;
            }
            
            console.log(`Loading template: ${templateId}`);
            
            // Load the template content
            modalContent.innerHTML = template.innerHTML;
            
            // Show the modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Initialize gallery
            initGallery();
        });
    });
    
    // Close modal when close button is clicked
    if (modalClose) {
        modalClose.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
    }
    
    // Close modal when clicking outside content
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
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
        
        if (galleryMain && galleryThumbs.length > 0) {
            galleryThumbs.forEach(thumb => {
                thumb.addEventListener('click', function() {
                    galleryMain.src = this.src;
                    galleryMain.alt = this.alt;
                    
                    galleryThumbs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                });
            });
        }
    }
    
    // Add visual indicators for protected content
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