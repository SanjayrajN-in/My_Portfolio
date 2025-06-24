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
    
    // Check if notification was previously closed
    const notificationClosed = localStorage.getItem('feature_notification_closed') === 'true';
    
    if (notificationClosed) {
        return; // Don't show notification if it was previously closed
    }
    
    notifications.forEach(notification => {
        // Make sure notification has a close button
        ensureCloseButton(notification);
        
        // Show notification with a slight delay
        setTimeout(() => {
            notification.style.display = 'block';
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                hideNotification(notification);
            }, 10000);
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
        
        // Store in localStorage that notification was closed
        localStorage.setItem('feature_notification_closed', 'true');
    }, 300);
}

// Global function to hide notification (for onclick handler)
window.hideFeatureNotification = function() {
    const notification = document.getElementById('feature-notification');
    if (notification) {
        hideNotification(notification);
    }
}