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
        
        // Keep the page transition visible during initial load
        // It will be hidden by the window load event
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
    // First make sure all resources are loaded
    setTimeout(() => {
        // Hide the page transition
        const pageTransition = document.querySelector('.page-transition');
        if (pageTransition) {
            pageTransition.style.opacity = '0';
            pageTransition.style.visibility = 'hidden';
        }
        
        // Make the body visible
        document.body.style.opacity = '1';
        
        // Remove loading class from html element to make content visible
        document.documentElement.classList.remove('loading');
        document.documentElement.classList.add('ready');
        
        console.log('✅ Page fully loaded and displayed');
    }, 300); // Small delay to ensure everything is rendered
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