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
    console.log('🔔 Initializing enhanced notification system...');
    
    // Prevent multiple initializations
    if (window.notificationSystemInitialized) {
        console.log('⚠️ Notification system already initialized - skipping');
        return;
    }
    window.notificationSystemInitialized = true;
    
    // Check if notification was already dismissed in this session
    const dismissed = sessionStorage.getItem('feature-notification-dismissed');
    console.log('📊 Session check - dismissed:', dismissed);
    
    if (dismissed === 'true') {
        console.log('✅ Notification already dismissed this session');
        return;
    }

    // Find all feature notifications and clean up any duplicates
    let notifications = document.querySelectorAll('.feature-notification');
    console.log(`📋 Found ${notifications.length} notification(s)`);
    
    if (notifications.length === 0) {
        console.log('❌ No notifications found in DOM!');
        return;
    }
    
    // Debug: Log each notification found
    notifications.forEach((notification, index) => {
        console.log(`📍 Notification ${index + 1}:`, {
            id: notification.id,
            classes: notification.className,
            display: window.getComputedStyle(notification).display,
            position: window.getComputedStyle(notification).position
        });
    });
    
    // If multiple notifications exist, remove duplicates
    if (notifications.length > 1) {
        console.log('🚨 Multiple notifications detected - cleaning up duplicates...');
        
        // Keep only the first one and remove others
        for (let i = 1; i < notifications.length; i++) {
            console.log(`🗑️ Removing duplicate notification ${i + 1}`);
            notifications[i].remove();
        }
        
        // Re-query after cleanup
        notifications = document.querySelectorAll('.feature-notification');
        console.log(`✅ After cleanup: ${notifications.length} notification(s) remain`);
    }
    
    notifications.forEach((notification, index) => {
        console.log(`🔧 Setting up notification ${index + 1}...`);
        
        // Add unique identifier to prevent conflicts
        notification.setAttribute('data-notification-system', 'enhanced');
        
        // Setup proper z-index to avoid dropdown conflicts
        setupNotificationZIndex(notification);
        
        // Make sure notification has a close button
        ensureCloseButton(notification);
        
        // Show notification with a slight delay
        setTimeout(() => {
            console.log(`🎯 Showing notification ${index + 1} with timer`);
            showNotificationWithTimer(notification);
        }, 1500);
    });
}

function setupNotificationZIndex(notification) {
    // Set z-index lower than navigation to prevent overlap with hamburger menu
    notification.style.zIndex = '999997'; // Lower than navigation elements (999999, 1000001)
    
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
    
    // Ensure the notification is positioned relatively for absolute positioning of progress bar
    notification.style.position = 'fixed';
    notification.style.overflow = 'hidden';
    
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
        opacity: 0.7;
        box-shadow: 0 0 8px rgba(0, 168, 255, 0.4);
        z-index: 1;
    `;
    
    // Add CSS animation if not already present
    if (!document.querySelector('#notification-timer-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-timer-styles';
        style.textContent = `
            @keyframes notificationTimer {
                from { 
                    width: 100%; 
                    opacity: 0.7;
                }
                to { 
                    width: 0%; 
                    opacity: 0.3;
                }
            }
            
            .notification-timer-bar:hover {
                opacity: 1 !important;
            }
            
            /* Ensure notification has proper positioning for progress bar */
            .feature-notification {
                position: fixed !important;
                overflow: hidden !important;
            }
            
            /* Progress bar alignment fixes */
            .notification-timer-bar {
                margin: 0 !important;
                padding: 0 !important;
                left: 0 !important;
                right: 0 !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            
            /* Fix mobile alignment issues */
            @media (max-width: 768px) {
                .feature-notification {
                    border-radius: 12px !important;
                }
                .notification-timer-bar {
                    border-radius: 0 0 12px 12px !important;
                }
            }
            
            @media (max-width: 480px) and (orientation: portrait) {
                .feature-notification {
                    border-radius: 12px !important;
                }
                .notification-timer-bar {
                    border-radius: 0 0 12px 12px !important;
                }
            }
            
            @media (max-width: 896px) and (orientation: landscape) and (max-height: 500px) {
                .feature-notification {
                    border-radius: 12px !important;
                }
                .notification-timer-bar {
                    border-radius: 0 0 12px 12px !important;
                }
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
    console.log('🧪 Manual notification trigger called');
    
    sessionStorage.removeItem('feature-notification-dismissed');
    sessionStorage.removeItem('feature-notification-dismiss-reason');
    sessionStorage.removeItem('feature-notification-dismiss-time');
    
    const notification = document.getElementById('feature-notification');
    console.log('🔍 Found notification element:', !!notification);
    
    if (notification) {
        notification.classList.remove('hidden');
        notification.setAttribute('data-notification-system', 'enhanced');
        setupNotificationZIndex(notification);
        ensureCloseButton(notification);
        showNotificationWithTimer(notification);
        console.log('✅ Feature notification manually triggered');
    } else {
        console.log('❌ No notification element found with ID: feature-notification');
    }
};

// Add global function to reset and debug
window.debugNotificationSystem = function() {
    console.log('🔧 Notification System Debug:', {
        systemInitialized: window.notificationSystemInitialized,
        sessionDismissed: sessionStorage.getItem('feature-notification-dismissed'),
        notificationsInDOM: document.querySelectorAll('.feature-notification').length,
        notificationElement: !!document.getElementById('feature-notification')
    });
    
    const notification = document.getElementById('feature-notification');
    if (notification) {
        console.log('📊 Notification Element Info:', {
            id: notification.id,
            classes: notification.className,
            display: window.getComputedStyle(notification).display,
            visibility: window.getComputedStyle(notification).visibility,
            opacity: window.getComputedStyle(notification).opacity,
            dataSystem: notification.getAttribute('data-notification-system')
        });
    }
};

// Disable any conflicting notification systems
window.disableConflictingNotificationSystems = function() {
    console.log('🚫 Disabling all conflicting notification systems...');
    
    // Disable PortfolioApp methods
    if (window.portfolioApp) {
        window.portfolioApp.initFeatureNotifications = () => console.log('🚫 PortfolioApp.initFeatureNotifications disabled');
        window.portfolioApp.adjustNotificationForMobile = () => console.log('🚫 PortfolioApp.adjustNotificationForMobile disabled');
        window.portfolioApp.adjustNotificationForDesktop = () => console.log('🚫 PortfolioApp.adjustNotificationForDesktop disabled');
    }
    
    // Remove any unauthorized notifications
    document.querySelectorAll('.feature-notification:not([data-notification-system="enhanced"])').forEach(notification => {
        console.log('🗑️ Removing unauthorized notification');
        notification.remove();
    });
};

// Add mutation observer to catch dynamically created notifications
const observeForConflictingNotifications = () => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.classList && node.classList.contains('feature-notification')) {
                    // Check if it's not our enhanced notification
                    if (!node.getAttribute('data-notification-system')) {
                        console.log('🚨 Unauthorized notification detected:', node);
                        // Give it a delay to allow legitimate notifications to be processed
                        setTimeout(() => {
                            if (!node.getAttribute('data-notification-system')) {
                                console.log('🗑️ Removing unauthorized notification');
                                node.remove();
                            }
                        }, 100);
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('👁️ Notification conflict observer active');
};

// Temporarily disable conflict prevention for debugging
// window.disableConflictingNotificationSystems();

// Start watching for conflicting notifications (with delay)
setTimeout(() => {
    observeForConflictingNotifications();
}, 2000);

// Add session info to console for debugging
console.log('Enhanced Notification System Loaded:', {
    dismissed: sessionStorage.getItem('feature-notification-dismissed'),
    dismissReason: sessionStorage.getItem('feature-notification-dismiss-reason'),
    dismissTime: sessionStorage.getItem('feature-notification-dismiss-time'),
    currentSession: new Date().toISOString(),
    systemInitialized: window.notificationSystemInitialized || false
});

// Add global functions for easy debugging
window.resetNotificationSession = function() {
    sessionStorage.removeItem('feature-notification-dismissed');
    sessionStorage.removeItem('feature-notification-dismiss-reason');
    sessionStorage.removeItem('feature-notification-dismiss-time');
    window.notificationSystemInitialized = false;
    console.log('🔄 Notification session reset. Reload page to see notification.');
};

window.forceShowNotification = function() {
    window.resetNotificationSession();
    setTimeout(() => {
        initNotificationSystem();
    }, 100);
};