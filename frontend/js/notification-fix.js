/**
 * Enhanced Notification System
 * Features:
 * - Auto-dismiss after 5 seconds
 * - Session-based persistence (only shows once per page load)
 * - Proper z-index hierarchy 
 * - Mobile-friendly positioning
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize notification system
    initNotificationSystem();
});

function initNotificationSystem() {
    // Check if notification was already dismissed in this session
    if (sessionStorage.getItem('feature-notification-dismissed') === 'true') {
        console.log('Notification already dismissed this session');
        return;
    }

    // Find all feature notifications
    const notifications = document.querySelectorAll('.feature-notification');
    
    notifications.forEach(notification => {
        // Setup proper z-index to avoid dropdown conflicts
        setupNotificationZIndex(notification);
        
        // Make sure notification has a close button
        ensureCloseButton(notification);
        
        // Show notification with a slight delay
        setTimeout(() => {
            showNotificationWithTimer(notification);
        }, 1500);
    });
}

function setupNotificationZIndex(notification) {
    // Set z-index higher than navigation (which uses 999999, 1000001, 9999999)
    notification.style.zIndex = '10000000'; // Higher than all navigation elements
    
    // Also update CSS to ensure proper layering
    notification.style.position = 'fixed';
    notification.style.willChange = 'transform, opacity';
}

function showNotificationWithTimer(notification) {
    notification.style.display = 'block';
    
    // Add timer progress bar
    addTimerProgressBar(notification);
    
    // Auto-dismiss after 5 seconds
    const autoDismissTimer = setTimeout(() => {
        if (notification && !notification.classList.contains('hidden')) {
            console.log('Auto-dismissing notification after 5 seconds');
            hideNotification(notification, 'auto-dismiss');
        }
    }, 5000);
    
    // Store timer ID so we can cancel it if user manually closes
    notification.autoDismissTimer = autoDismissTimer;
}

function addTimerProgressBar(notification) {
    // Check if progress bar already exists
    if (notification.querySelector('.notification-timer-bar')) return;
    
    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'notification-timer-bar';
    progressBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #00a8ff, #7d5fff);
        width: 100%;
        border-radius: 0 0 15px 15px;
        animation: notificationTimer 5s linear forwards;
        opacity: 0.8;
    `;
    
    // Add CSS animation if not already present
    if (!document.querySelector('#notification-timer-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-timer-styles';
        style.textContent = `
            @keyframes notificationTimer {
                from { width: 100%; }
                to { width: 0%; }
            }
            
            .notification-timer-bar:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    notification.appendChild(progressBar);
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
            hideNotification(notification, 'manual-close');
        });
    }
}

function hideNotification(notification, reason = 'unknown') {
    console.log(`Hiding notification (reason: ${reason})`);
    
    // Cancel auto-dismiss timer if it exists
    if (notification.autoDismissTimer) {
        clearTimeout(notification.autoDismissTimer);
        notification.autoDismissTimer = null;
    }
    
    // Remove progress bar if it exists
    const progressBar = notification.querySelector('.notification-timer-bar');
    if (progressBar) {
        progressBar.remove();
    }
    
    // Add hidden class for animation
    notification.classList.add('hidden');
    
    // Remember dismissal for this session
    sessionStorage.setItem('feature-notification-dismissed', 'true');
    sessionStorage.setItem('feature-notification-dismiss-reason', reason);
    sessionStorage.setItem('feature-notification-dismiss-time', new Date().toISOString());
    
    // Remove from DOM after animation completes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.display = 'none';
        }
    }, 300);
}

// Add global function to manually trigger notification (for testing)
window.showFeatureNotification = function() {
    sessionStorage.removeItem('feature-notification-dismissed');
    sessionStorage.removeItem('feature-notification-dismiss-reason');
    sessionStorage.removeItem('feature-notification-dismiss-time');
    
    const notification = document.getElementById('feature-notification');
    if (notification) {
        notification.classList.remove('hidden');
        setupNotificationZIndex(notification);
        showNotificationWithTimer(notification);
        console.log('Feature notification manually triggered');
    }
};

// Add session info to console for debugging
console.log('Notification System Loaded:', {
    dismissed: sessionStorage.getItem('feature-notification-dismissed'),
    dismissReason: sessionStorage.getItem('feature-notification-dismiss-reason'),
    dismissTime: sessionStorage.getItem('feature-notification-dismiss-time'),
    currentSession: new Date().toISOString()
});