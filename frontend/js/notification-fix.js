/**
 * Notification Popup Fix
 * Makes feature notifications appear as popups instead of affecting page layout
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize notification system
    initNotificationSystem();
});

function initNotificationSystem() {
    // Find all feature notifications
    const notifications = document.querySelectorAll('.feature-notification');
    
    notifications.forEach(notification => {
        // Make sure notification has a close button
        ensureCloseButton(notification);
        
        // Show notification with a slight delay
        setTimeout(() => {
            notification.style.display = 'block';
            
            // Auto-hide after 8 seconds
            setTimeout(() => {
                hideNotification(notification);
            }, 8000);
        }, 1500);
    });
}

function ensureCloseButton(notification) {
    // Check if notification already has a close button
    let closeButton = notification.querySelector('.notification-close');
    
    if (!closeButton) {
        // Create close button if it doesn't exist
        const notificationContent = notification.querySelector('.notification-content');
        
        if (notificationContent) {
            closeButton = document.createElement('button');
            closeButton.className = 'notification-close';
            closeButton.innerHTML = '<i class="fas fa-times"></i>';
            closeButton.setAttribute('aria-label', 'Close notification');
            
            notificationContent.appendChild(closeButton);
        }
    }
    
    // Add event listener to close button
    if (closeButton) {
        closeButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            hideNotification(notification);
        });
    }
}

function hideNotification(notification) {
    // Add hidden class for animation
    notification.classList.add('hidden');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
        notification.style.display = 'none';
    }, 300);
}