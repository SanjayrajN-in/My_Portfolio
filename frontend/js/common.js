/**
 * Common JavaScript functionality for all pages
 * Handles cursor, animations, and other shared features
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize custom cursor (desktop only)
    initializeCursor();
    
    // Initialize AOS animations if available
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-out',
            once: true,
            mirror: false,
            disable: window.innerWidth < 768 ? true : false
        });
    }
    
    // Initialize custom cursor (desktop only)
    function initializeCursor() {
        if (window.innerWidth <= 768) return;
        
        const cursor = document.querySelector('.cursor');
        const cursorFollower = document.querySelector('.cursor-follower');
        
        if (!cursor || !cursorFollower) return;
        
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        
        // Mouse move handler
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        // Animate cursor
        const animateCursor = () => {
            cursorX += (mouseX - cursorX) * 0.1;
            cursorY += (mouseY - cursorY) * 0.1;
            
            cursor.style.left = `${mouseX}px`;
            cursor.style.top = `${mouseY}px`;
            cursorFollower.style.left = `${cursorX}px`;
            cursorFollower.style.top = `${cursorY}px`;
            
            requestAnimationFrame(animateCursor);
        };
        animateCursor();
        
        // Add hover effects
        const interactiveElements = document.querySelectorAll('a, button, .hamburger');
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                cursor.classList.add('hover');
                cursorFollower.classList.add('hover');
            });
            
            element.addEventListener('mouseleave', () => {
                cursor.classList.remove('hover');
                cursorFollower.classList.remove('hover');
            });
        });
    }
});