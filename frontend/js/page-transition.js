/**
 * Page Transition Handler
 * Provides smooth transitions between pages and prevents FOUC
 */

class PageTransitionHandler {
    constructor() {
        this.init();
    }
    
    init() {
        this.pageTransition = document.querySelector('.page-transition');
        this.links = document.querySelectorAll('a[href]:not([href^="#"]):not([href^="javascript:"]):not([href^="mailto:"]):not([href^="tel:"]):not([target="_blank"])');
        
        // Show page transition immediately on initial page load
        this.showPageTransition();
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Handle link clicks for smooth transitions
        this.links.forEach(link => {
            link.addEventListener('click', (e) => {
                // Skip if modifier keys are pressed
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                
                const href = link.getAttribute('href');
                
                // Skip if it's an external link
                if (href.indexOf('http') === 0 && !href.includes(window.location.hostname)) return;
                
                e.preventDefault();
                this.navigateToPage(href);
            });
        });
        
        // Handle browser back/forward navigation
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                this.hidePageTransition();
            }
        });
        
        // Show transition on unload
        window.addEventListener('beforeunload', () => {
            this.showPageTransition();
        });
    }
    
    navigateToPage(href) {
        this.showPageTransition();
        
        setTimeout(() => {
            window.location.href = href;
        }, 400);
    }
    
    showPageTransition() {
        if (this.pageTransition) {
            this.pageTransition.classList.add('active');
        }
    }
    
    hidePageTransition() {
        if (this.pageTransition) {
            this.pageTransition.classList.remove('active');
        }
    }
}

// Initialize page transitions
document.addEventListener('DOMContentLoaded', () => {
    new PageTransitionHandler();
});

// Add fade-in effect to body when page loads and handle FOUC prevention
window.addEventListener('load', () => {
    // First make sure body is visible
    document.body.style.opacity = '1';
    
    // Mark document as ready (remove loading class, add ready class)
    document.documentElement.classList.remove('loading');
    document.documentElement.classList.add('ready');
    
    // Hide the page transition overlay after a short delay to ensure all CSS is applied
    setTimeout(() => {
        const pageTransitionHandler = document.querySelector('.page-transition');
        if (pageTransitionHandler) {
            pageTransitionHandler.classList.remove('active');
        }
    }, 300); // 300ms delay to ensure everything is rendered properly
});

// Ensure consistent navigation across pages
document.addEventListener('DOMContentLoaded', () => {
    // Force consistent header height
    const header = document.querySelector('header');
    if (header) {
        header.style.height = 'var(--header-height)';
    }
    
    // Mobile menu toggle - Handled by navigation.js
    
    // Ensure dropdown menus work consistently
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            if (window.innerWidth <= 992) {
                e.preventDefault();
                const menu = toggle.nextElementSibling;
                if (menu && menu.classList.contains('dropdown-menu')) {
                    menu.classList.toggle('mobile-open');
                }
            }
        });
    });
});