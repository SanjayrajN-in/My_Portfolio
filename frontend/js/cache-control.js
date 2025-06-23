/**
 * Simple Cache Control Script
 * This script helps ensure browsers load the latest version of your website
 * without causing reload loops or flashing screens.
 */

(function() {
    // Current version of the site - increment this when you make significant changes
    const SITE_VERSION = '1.0.0';
    
    // Check if we need to reload due to a version change
    function checkCacheVersion() {
        const storedVersion = localStorage.getItem('site_version');
        
        // If version is different or doesn't exist, update and reload if needed
        if (storedVersion !== SITE_VERSION) {
            // Store the new version
            localStorage.setItem('site_version', SITE_VERSION);
            
            // Only reload if this isn't the first visit and we're not already in a reload loop
            if (storedVersion && !sessionStorage.getItem('reloading')) {
                console.log('Site version changed from', storedVersion, 'to', SITE_VERSION);
                // Set a flag to prevent reload loops
                sessionStorage.setItem('reloading', 'true');
                // Force reload from server
                window.location.reload(true);
            }
        }
        
        // Clear the reload flag if it exists
        if (sessionStorage.getItem('reloading')) {
            sessionStorage.removeItem('reloading');
        }
    }
    
    // Add a timestamp to CSS and JS resources to prevent caching
    function addTimestampToResources() {
        // Only run this once per session
        if (sessionStorage.getItem('resources_timestamped')) return;
        
        const timestamp = new Date().getTime();
        const resources = document.querySelectorAll('link[rel="stylesheet"], script[src]');
        
        resources.forEach(resource => {
            if (!resource.src && !resource.href) return;
            
            const url = resource.src || resource.href;
            if (!url) return;
            
            // Skip external resources and already timestamped resources
            if ((url.startsWith('http') && !url.includes(window.location.hostname)) || 
                url.includes('t=')) return;
            
            try {
                // Add timestamp parameter
                const urlObj = new URL(url, window.location.origin);
                urlObj.searchParams.set('t', timestamp);
                
                if (resource.src) {
                    resource.src = urlObj.toString();
                } else if (resource.href) {
                    resource.href = urlObj.toString();
                }
            } catch (e) {
                console.warn('Error updating resource:', url, e);
            }
        });
        
        // Mark as done
        sessionStorage.setItem('resources_timestamped', 'true');
    }
    
    // Run cache version check immediately
    checkCacheVersion();
    
    // Add timestamps to resources after DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addTimestampToResources);
    } else {
        addTimestampToResources();
    }
})();