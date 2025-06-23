/**
 * FOUC Prevention Script
 * Prevents Flash of Unstyled Content by controlling when content becomes visible
 */

(function() {
    // Mark document as loading initially
    document.documentElement.classList.add('loading');
    
    // Function to mark document as ready
    function markAsReady() {
        // Remove loading class and add ready class
        document.documentElement.classList.remove('loading');
        document.documentElement.classList.add('ready');
    }
    
    // Handle page load events
    if (document.readyState === 'complete') {
        // Page already loaded
        markAsReady();
    } else {
        // Wait for page to load
        window.addEventListener('load', markAsReady);
        
        // Fallback - if load event doesn't fire for some reason
        setTimeout(markAsReady, 2000);
    }
})();