/**
 * Mobile Navigation Handler
 * Handles dynamic viewport adjustments and navigation overlap fixes
 */

(function() {
    'use strict';
    
    let isInitialized = false;
    let viewportHeight = window.innerHeight;
    let headerHeight = 80;
    let safeAreaTop = 0;
    
    // Utility function to get CSS variable value
    function getCSSVariable(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }
    
    // Utility function to set CSS variable
    function setCSSVariable(name, value) {
        document.documentElement.style.setProperty(name, value);
    }
    
    // Check if device is mobile
    function isMobile() {
        return window.innerWidth <= 768;
    }
    
    // Get safe area inset top for devices with notch
    function getSafeAreaTop() {
        // Try to get from CSS env() function
        const safeAreaValue = getCSSVariable('--safe-area-top');
        if (safeAreaValue && safeAreaValue !== '0px') {
            return parseInt(safeAreaValue);
        }
        
        // Fallback detection for iOS devices
        if (window.navigator.userAgent.includes('iPhone') || window.navigator.userAgent.includes('iPad')) {
            // Check if it's a device with notch (iPhone X and later)
            const isNotchDevice = window.screen.height >= 812 && window.screen.width >= 375;
            if (isNotchDevice) {
                return window.orientation === 0 ? 44 : 0; // 44px for portrait, 0 for landscape
            }
        }
        
        return 0;
    }
    
    // Get safe area inset bottom for devices with home indicator
    function getSafeAreaBottom() {
        // Try to get from CSS env() function
        const safeAreaValue = getCSSVariable('--safe-area-bottom');
        if (safeAreaValue && safeAreaValue !== '0px') {
            return parseInt(safeAreaValue);
        }
        
        // Fallback detection for iOS devices
        if (window.navigator.userAgent.includes('iPhone') || window.navigator.userAgent.includes('iPad')) {
            // Check if it's a device with home indicator (iPhone X and later)
            const isNotchDevice = window.screen.height >= 812 && window.screen.width >= 375;
            if (isNotchDevice) {
                return window.orientation === 0 ? 34 : 21; // 34px for portrait, 21px for landscape
            }
        }
        
        return 0;
    }
    
    // Calculate actual header height including safe area
    function calculateHeaderHeight() {
        if (!isMobile()) {
            return 80;
        }
        
        safeAreaTop = getSafeAreaTop();
        return headerHeight + safeAreaTop;
    }
    
    // Adjust viewport units for mobile devices
    function adjustViewportUnits() {
        if (!isMobile()) {
            return;
        }
        
        // Update viewport height for mobile
        viewportHeight = window.innerHeight;
        const mobileHeaderHeight = calculateHeaderHeight();
        
        // Set CSS custom properties
        setCSSVariable('--viewport-height', `${viewportHeight}px`);
        setCSSVariable('--mobile-header-height', `${mobileHeaderHeight}px`);
        setCSSVariable('--safe-area-top', `${safeAreaTop}px`);
        setCSSVariable('--safe-area-bottom', `${getSafeAreaBottom()}px`);
        setCSSVariable('--mobile-vh', `${viewportHeight}px`);
        
        // Update hero section height
        const heroElement = document.querySelector('.hero');
        if (heroElement) {
            const heroHeight = Math.max(viewportHeight - mobileHeaderHeight, 400);
            heroElement.style.minHeight = `${heroHeight}px`;
        }
        
        // Fix mobile navigation height
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            const safeAreaBottom = getSafeAreaBottom();
            const navHeight = Math.max(viewportHeight - mobileHeaderHeight - safeAreaBottom - 10, 300);
            navLinks.style.height = `${navHeight}px`;
            navLinks.style.maxHeight = `${navHeight}px`;
            
            // Ensure scrolling works
            navLinks.style.overflowY = 'auto';
            navLinks.style.overflowX = 'hidden';
            navLinks.style.webkitOverflowScrolling = 'touch';
            navLinks.style.overscrollBehavior = 'contain';
        }
    }
    
    // Fix navigation overlap
    function fixNavigationOverlap() {
        if (!isMobile()) {
            return;
        }
        
        const header = document.querySelector('header');
        const body = document.body;
        const mobileHeaderHeight = calculateHeaderHeight();
        
        if (header) {
            header.style.height = `${mobileHeaderHeight}px`;
            if (safeAreaTop > 0) {
                header.style.paddingTop = `${safeAreaTop}px`;
            }
        }
        
        if (body) {
            body.style.paddingTop = `${mobileHeaderHeight}px`;
        }
        
        // Update scroll padding
        const html = document.documentElement;
        if (html) {
            html.style.scrollPaddingTop = `${mobileHeaderHeight + 20}px`;
        }
    }
    
    // Handle orientation changes
    function handleOrientationChange() {
        if (!isMobile()) {
            return;
        }
        
        // Wait for orientation change to complete
        setTimeout(() => {
            adjustViewportUnits();
            fixNavigationOverlap();
        }, 100);
    }
    
    // Handle window resize
    function handleResize() {
        if (!isMobile()) {
            return;
        }
        
        // Debounce resize events
        clearTimeout(window.mobileNavResizeTimeout);
        window.mobileNavResizeTimeout = setTimeout(() => {
            adjustViewportUnits();
            fixNavigationOverlap();
        }, 150);
    }
    
    // Initialize mobile navigation handler
    function initialize() {
        if (isInitialized) {
            return;
        }
        
        isInitialized = true;
        
        // Initial setup
        adjustViewportUnits();
        fixNavigationOverlap();
        
        // Event listeners
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleOrientationChange);
        
        // Handle iOS keyboard appearance
        if (window.navigator.userAgent.includes('iPhone') || window.navigator.userAgent.includes('iPad')) {
            window.addEventListener('focusin', () => {
                if (isMobile()) {
                    document.body.classList.add('keyboard-active');
                }
            });
            
            window.addEventListener('focusout', () => {
                if (isMobile()) {
                    document.body.classList.remove('keyboard-active');
                    setTimeout(() => {
                        adjustViewportUnits();
                        fixNavigationOverlap();
                    }, 300);
                }
            });
        }
        
        // Handle viewport meta tag changes
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta && 'MutationObserver' in window) {
            const observer = new MutationObserver(() => {
                setTimeout(() => {
                    adjustViewportUnits();
                    fixNavigationOverlap();
                }, 100);
            });
            
            observer.observe(viewportMeta, {
                attributes: true,
                attributeFilter: ['content']
            });
        }
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Expose methods for manual control if needed
    window.mobileNavHandler = {
        initialize: initialize,
        adjustViewportUnits: adjustViewportUnits,
        fixNavigationOverlap: fixNavigationOverlap,
        isMobile: isMobile
    };
    
})();