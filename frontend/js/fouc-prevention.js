/**
 * FOUC Prevention Script
 * Prevents Flash of Unstyled Content by controlling when content becomes visible
 * Optimized for both desktop and mobile devices
 */

(function() {
    // Mark document as loading initially
    document.documentElement.classList.add('loading');
    
    // Detect if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                    (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    
    // Function to mark document as ready
    function markAsReady() {
        // Remove loading class and add ready class
        document.documentElement.classList.remove('loading');
        document.documentElement.classList.add('ready');
        
        // Add mobile-specific class if needed
        if (isMobile) {
            document.documentElement.classList.add('mobile-ready');
        }
        
        // Log success message
        console.log('FOUC prevention: Content is now visible');
    }
    
    // Handle page load events
    if (document.readyState === 'complete') {
        // Page already loaded
        markAsReady();
    } else {
        // Wait for page to load
        window.addEventListener('load', markAsReady);
        
        // Mobile-specific: Use a shorter timeout for mobile devices
        const timeout = isMobile ? 1500 : 2000;
        
        // Fallback - if load event doesn't fire for some reason
        setTimeout(markAsReady, timeout);
    }
    
    // iOS-specific fixes
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        // Force repaint on iOS devices to prevent rendering issues
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                const scrollTop = window.pageYOffset;
                window.scrollTo(0, scrollTop + 1);
                window.scrollTo(0, scrollTop);
            }, 0);
        });
    }
})();