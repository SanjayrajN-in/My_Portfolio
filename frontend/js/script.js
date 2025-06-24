/**
 * =================================================================
 * SANJAYRAJ N - PORTFOLIO WEBSITE
 * Clean, Consolidated JavaScript (No Duplicates, No Conflicts)
 * =================================================================
 */

// Main application class
class PortfolioApp {
    constructor() {
        this.header = null;
        this.hamburger = null;
        this.navLinks = null;
        this.navOverlay = null;
        this.pageTransition = null;
        this.isMenuOpen = false;
        this.isNavigating = false;
        this.scrollTicking = false;
        
        this.init();
    }
    
    // Initialize the application
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    // Main setup function
    setup() {
        // Prevent white flash
        this.preventFlash();
        
        // Find DOM elements
        this.findElements();
        
        // Create required elements
        this.createRequiredElements();
        

        
        // Initialize features
        this.initializeNavigation();
        this.initializeParticles();
        this.initializeTypedText();
        this.initializeCursor();
        this.initializeAnimations();
        this.initializeFormHandling();
        
        // Bind events
        this.bindEvents();
        
        // Set initial states
        this.setInitialStates();
        
        console.log('✅ Portfolio App Initialized Successfully');
    }
    
    // Prevent white flash on load
    preventFlash() {
        document.documentElement.style.visibility = 'visible';
        document.documentElement.style.opacity = '1';
        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';
    }
    

    
    // Find all required DOM elements
    findElements() {
        this.header = document.querySelector('header');
        this.hamburger = document.querySelector('.hamburger');
        this.navLinks = document.querySelector('.nav-links');
        this.body = document.body;
    }
    
    // Create required DOM elements
    createRequiredElements() {
        // Create nav overlay
        if (!document.querySelector('.nav-overlay')) {
            this.navOverlay = document.createElement('div');
            this.navOverlay.className = 'nav-overlay';
            this.body.appendChild(this.navOverlay);
        } else {
            this.navOverlay = document.querySelector('.nav-overlay');
        }
        
        // Create page transition
        if (!document.querySelector('.page-transition')) {
            this.pageTransition = document.createElement('div');
            this.pageTransition.className = 'page-transition';
            this.pageTransition.innerHTML = `
                <div class="page-transition-content">
                    <div class="page-transition-spinner"></div>
                    <div class="page-transition-text">Loading...</div>
                </div>
            `;
            this.body.appendChild(this.pageTransition);
        } else {
            this.pageTransition = document.querySelector('.page-transition');
        }
    }
    
    // Initialize navigation functionality
    initializeNavigation() {
        if (!this.header) return;
        
        // Ensure header is always fixed and visible
        this.enforceHeaderPosition();
        
        // Set active navigation link
        this.setActiveNavLink();
        
        // Setup dropdown functionality
        this.setupDropdowns();
    }
    
    // Enforce header positioning (bulletproof)
    enforceHeaderPosition() {
        if (!this.header) return;
        
        const criticalStyles = {
            'position': 'fixed',
            'top': '0',
            'left': '0',
            'width': '100%',
            'z-index': '999999',
            'display': 'flex',
            'visibility': 'visible',
            'opacity': '1'
        };
        
        Object.entries(criticalStyles).forEach(([property, value]) => {
            this.header.style.setProperty(property, value, 'important');
        });
    }
    
    // Set active navigation link based on current page
    setActiveNavLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-links a');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === currentPage || 
                (currentPage === '' && href === 'index.html') ||
                (currentPage === 'index.html' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    }
    
    // Setup dropdown menus
    setupDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            if (toggle && menu) {
                toggle.addEventListener('click', (e) => {
                    if (window.innerWidth <= 992) {
                        e.preventDefault();
                        menu.classList.toggle('mobile-open');
                    } else if (toggle.getAttribute('href') === '#') {
                        e.preventDefault();
                    }
                });
            }
        });
    }
    
    // Initialize particles.js
    initializeParticles() {
        if (typeof particlesJS === 'undefined' || !document.getElementById('particles-js')) {
            return;
        }
        
        // Only on desktop for performance
        if (window.innerWidth > 768) {
            particlesJS('particles-js', {
                particles: {
                    number: {
                        value: 60,
                        density: {
                            enable: true,
                            value_area: 1000
                        }
                    },
                    color: {
                        value: "#00a8ff"
                    },
                    shape: {
                        type: "circle"
                    },
                    opacity: {
                        value: 0.4,
                        random: false
                    },
                    size: {
                        value: 2,
                        random: true
                    },
                    line_linked: {
                        enable: true,
                        distance: 150,
                        color: "#00a8ff",
                        opacity: 0.2,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: 1,
                        direction: "none",
                        random: false,
                        straight: false,
                        out_mode: "out",
                        bounce: false
                    }
                },
                interactivity: {
                    detect_on: "canvas",
                    events: {
                        onhover: {
                            enable: true,
                            mode: "grab"
                        },
                        onclick: {
                            enable: false
                        },
                        resize: true
                    },
                    modes: {
                        grab: {
                            distance: 140,
                            line_linked: {
                                opacity: 0.5
                            }
                        }
                    }
                },
                retina_detect: false
            });
        }
    }
    
    // Initialize typed text animation
    initializeTypedText() {
        if (typeof Typed === 'undefined' || !document.querySelector('.typed-text')) {
            return;
        }
        
        new Typed('.typed-text', {
            strings: [
                'Embedded Systems Engineer',
                'Automation Specialist', 
                'Software Developer',
                'PCB Designer'
            ],
            typeSpeed: 60,
            backSpeed: 40,
            backDelay: 2000,
            loop: true
        });
    }
    
    // Initialize custom cursor (desktop only)
    initializeCursor() {
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
    
    // Initialize AOS animations
    initializeAnimations() {
        if (typeof AOS === 'undefined') return;
        
        AOS.init({
            duration: 800,
            easing: 'ease-out',
            once: true,
            mirror: false,
            disable: window.innerWidth < 768 ? true : false
        });
    }
    
    // Initialize form handling
    initializeFormHandling() {
        const contactForm = document.getElementById('contactForm');
        if (!contactForm) return;
        
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmission(contactForm);
        });
    }
    
    // Handle form submission
    handleFormSubmission(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Show success message
        this.showFormMessage('Thank you for your message! I will get back to you soon.', 'success');
        
        // Reset form
        form.reset();
        
        console.log('Form submitted:', data);
    }
    
    // Show form message
    showFormMessage(message, type = 'success') {
        const formMessage = document.createElement('div');
        formMessage.className = `form-message ${type}`;
        formMessage.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        const form = document.getElementById('contactForm');
        if (form) {
            form.appendChild(formMessage);
            
            setTimeout(() => {
                formMessage.remove();
            }, 5000);
        }
    }
    
    // Bind all event listeners
    bindEvents() {
        // Mobile menu toggle - Handled by navigation.js
        
        // Overlay click
        if (this.navOverlay) {
            this.navOverlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }
        
        // Outside click
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && 
                !this.navLinks.contains(e.target) && 
                !this.hamburger.contains(e.target)) {
                this.closeMobileMenu();
            }
        });
        
        // Navigation links
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e, link));
        });
        
        // Scroll events
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
        
        // Resize events
        window.addEventListener('resize', () => this.handleResize(), { passive: true });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Page load events
        window.addEventListener('load', () => this.handlePageLoad());
        window.addEventListener('pageshow', (e) => this.handlePageShow(e));
    }
    
    // Toggle mobile menu
    toggleMobileMenu() {
        if (this.isMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }
    
    // Open mobile menu
    openMobileMenu() {
        this.hamburger.classList.add('active');
        this.navLinks.classList.add('active');
        this.navOverlay.classList.add('active');
        this.body.classList.add('menu-open');
        this.isMenuOpen = true;
        
        // Accessibility
        this.hamburger.setAttribute('aria-expanded', 'true');
        this.navLinks.querySelector('a')?.focus();
    }
    
    // Close mobile menu
    closeMobileMenu() {
        this.hamburger.classList.remove('active');
        this.navLinks.classList.remove('active');
        this.navOverlay.classList.remove('active');
        this.body.classList.remove('menu-open');
        this.isMenuOpen = false;
        
        // Close any open dropdowns
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('mobile-open');
        });
        
        // Accessibility
        this.hamburger.setAttribute('aria-expanded', 'false');
    }
    
    // Handle navigation link clicks
    handleNavClick(e, link) {
        if (this.isNavigating) {
            e.preventDefault();
            return;
        }
        
        const href = link.getAttribute('href');
        
        // Always close mobile menu
        this.closeMobileMenu();
        
        // Handle different link types
        if (href && href.startsWith('#') && href.length > 1) {
            // Anchor link
            e.preventDefault();
            this.smoothScrollTo(href);
        } else if (href && href !== '#' && !href.startsWith('javascript:') && !link.classList.contains('dropdown-toggle')) {
            // External navigation
            e.preventDefault();
            this.navigateToPage(href);
        }
    }
    
    // Smooth scroll to element
    smoothScrollTo(target) {
        try {
            const element = document.querySelector(target);
            if (element) {
                const headerHeight = this.header ? this.header.offsetHeight : 80;
                const targetPosition = element.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        } catch (error) {
            console.warn('Invalid selector for smooth scroll:', target);
        }
    }
    
    // Navigate to page with transition
    navigateToPage(href) {
        this.isNavigating = true;
        this.showPageTransition();
        
        setTimeout(() => {
            window.location.href = href;
        }, 300);
    }
    
    // Show page transition
    showPageTransition() {
        if (this.pageTransition) {
            this.pageTransition.classList.add('active');
        }
    }
    
    // Hide page transition
    hidePageTransition() {
        if (this.pageTransition) {
            this.pageTransition.classList.remove('active');
        }
    }
    
    // Handle scroll events
    handleScroll() {
        if (!this.scrollTicking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                
                // Update header state
                if (this.header) {
                    this.enforceHeaderPosition();
                    
                    // Dynamic blur effect based on scroll
                    const maxScroll = 300; // Increased for smoother transition
                    const scrollRatio = Math.min(scrollY / maxScroll, 1);
                    
                    // Dynamic blur values with easing
                    const minBlur = 15;
                    const maxBlur = 40;
                    // Apply easing function for smoother transition
                    const easeOutQuad = t => t * (2 - t);
                    const easedRatio = easeOutQuad(scrollRatio);
                    const blurAmount = minBlur + (maxBlur - minBlur) * easedRatio;
                    
                    // Dynamic saturation
                    const minSaturation = 150;
                    const maxSaturation = 200;
                    const saturation = minSaturation + (maxSaturation - minSaturation) * easedRatio;
                    
                    // Dynamic background opacity with slightly more transparency
                    const minOpacity = 0.75;
                    const maxOpacity = 0.92;
                    const opacity = minOpacity + (maxOpacity - minOpacity) * easedRatio;
                    
                    // Dynamic border glow
                    const minBorderOpacity = 0.08;
                    const maxBorderOpacity = 0.25;
                    const borderOpacity = minBorderOpacity + (maxBorderOpacity - minBorderOpacity) * easedRatio;
                    
                    // Apply dynamic styles with smooth transitions
                    this.header.style.backdropFilter = `blur(${blurAmount}px) saturate(${saturation}%)`;
                    this.header.style.webkitBackdropFilter = `blur(${blurAmount}px) saturate(${saturation}%)`;
                    this.header.style.background = `rgba(12, 12, 20, ${opacity})`;
                    this.header.style.borderBottom = `1px solid rgba(0, 168, 255, ${borderOpacity})`;
                    
                    // Add subtle shadow intensity based on scroll
                    const shadowIntensity = 0.1 + (0.3 * easedRatio);
                    this.header.style.boxShadow = `0 4px ${20 + (easedRatio * 10)}px rgba(0, 0, 0, ${shadowIntensity}), 0 1px ${5 + (easedRatio * 5)}px rgba(0, 168, 255, ${borderOpacity * 0.8})`;
                    
                    // Add/remove scrolled class for additional styling
                    if (scrollY > 30) { // Reduced threshold for earlier effect
                        this.header.classList.add('scrolled');
                    } else {
                        this.header.classList.remove('scrolled');
                    }
                }
                
                this.scrollTicking = false;
            });
            this.scrollTicking = true;
        }
    }
    
    // Handle resize events
    handleResize() {
        // Close mobile menu on desktop
        if (window.innerWidth > 992 && this.isMenuOpen) {
            this.closeMobileMenu();
        }
        
        // Re-enforce header positioning
        this.enforceHeaderPosition();
        
        // Reinitialize cursor on resize
        if (window.innerWidth > 768) {
            this.initializeCursor();
        }
    }
    
    // Handle keyboard events
    handleKeydown(e) {
        // Close mobile menu with Escape key
        if (e.key === 'Escape' && this.isMenuOpen) {
            this.closeMobileMenu();
        }
    }
    
    // Handle page load
    handlePageLoad() {
        this.hidePageTransition();
        this.enforceHeaderPosition();
    }
    
    // Handle page show (back/forward navigation)
    handlePageShow(e) {
        if (e.persisted) {
            this.hidePageTransition();
        }
    }
    
    // Set initial states
    setInitialStates() {
        // Ensure proper initial visibility
        this.body.style.visibility = 'visible';
        this.body.style.opacity = '1';
        
        // Set accessibility attributes
        if (this.hamburger) {
            this.hamburger.setAttribute('aria-expanded', 'false');
            this.hamburger.setAttribute('aria-label', 'Toggle navigation menu');
        }
        
        // Hide page transition
        this.hidePageTransition();
        
        // Initialize authentication protection
        this.initAuthProtection();
        
        // Initialize feature notifications
        this.initFeatureNotifications();
        
        // Listen for auth state changes
        this.setupAuthStateListener();
        
        // Check auth state immediately on page load
        this.refreshAuthState();
        this.debugAuthState();
        this.forceRemoveLockIfAuthenticated();
        
        // Also check after a short delay to ensure everything is loaded
        setTimeout(() => {
            this.refreshAuthState();
            this.debugAuthState();
            this.forceRemoveLockIfAuthenticated();
        }, 500);
    }
    
    // Initialize authentication protection
    initAuthProtection() {
        const resumeBtn = document.getElementById('resume-download');
        if (resumeBtn) {
            // Check if user is already authenticated
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const isLoggedIn = !!token;
            
            // Remove any existing click handlers first
            if (resumeBtn._protectedClickHandler) {
                resumeBtn.removeEventListener('click', resumeBtn._protectedClickHandler);
                delete resumeBtn._protectedClickHandler;
            }
            
            if (!isLoggedIn) {
                // For locked buttons, set href to javascript:void(0) to prevent any navigation
                resumeBtn.setAttribute('data-original-href', resumeBtn.href);
                resumeBtn.href = 'javascript:void(0)';
                
                // Only add the click handler if the user is not logged in
                resumeBtn._protectedClickHandler = (e) => {
                    // Always prevent default for locked buttons
                    if (resumeBtn.classList.contains('locked')) {
                        console.log('🔒 Preventing download for locked resume button');
                        e.preventDefault();
                        e.stopPropagation();
                        this.showLoginPrompt();
                        return false;
                    }
                };
                
                resumeBtn.addEventListener('click', resumeBtn._protectedClickHandler);
            } else {
                // If user is logged in, make sure the button works correctly
                resumeBtn.classList.remove('locked');
                
                // Restore original href if it was saved, otherwise set it based on the page
                if (resumeBtn.hasAttribute('data-original-href')) {
                    resumeBtn.href = resumeBtn.getAttribute('data-original-href');
                    resumeBtn.removeAttribute('data-original-href');
                } else {
                    const isAboutPage = window.location.pathname.includes('/pages/about.html');
                    resumeBtn.href = isAboutPage ? '../resume.pdf' : 'resume.pdf';
                }
                
                resumeBtn.download = 'Sanjayraj_N_Resume.pdf';
                resumeBtn.target = '_blank';
            }
            
            // Check auth status but don't add another click handler
            this.checkAuthStatusWithoutHandler(resumeBtn);
        }
        
        // Check immediately for any other auth-protected elements
        const authProtectedElements = document.querySelectorAll('.auth-protected:not(#resume-download)');
        authProtectedElements.forEach(element => {
            this.checkAuthStatus(element);
        });
    }
    
    // Check authentication status and add click handler
    checkAuthStatus(element) {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const isLoggedIn = !!token;
        
        console.log('🔍 Checking auth for element:', element.id, 'Token exists:', !!token);
        
        if (!isLoggedIn) {
            element.classList.add('auth-protected', 'locked');
            // Store the bound function to remove it later
            if (!element._protectedClickHandler) {
                element._protectedClickHandler = this.handleProtectedClick.bind(this);
            }
            element.addEventListener('click', element._protectedClickHandler);
            console.log('🔒 Lock added to:', element.id);
        } else {
            // Remove locked state and hide lock overlay
            element.classList.remove('locked');
            // Keep auth-protected class but remove locked to hide the lock icon
            
            // Remove the click handler for authenticated users
            if (element._protectedClickHandler) {
                element.removeEventListener('click', element._protectedClickHandler);
                delete element._protectedClickHandler;
            }
            
            // For resume download, ensure it works properly
            if (element.id === 'resume-download') {
                // Check if we're on the about page or another page
                const isAboutPage = window.location.pathname.includes('/pages/about.html');
                element.href = isAboutPage ? '../resume.pdf' : 'resume.pdf';
                element.download = 'Sanjayraj_N_Resume.pdf';
                element.target = '_blank';
            }
            
            console.log('🔓 Lock removed from:', element.id, 'Classes now:', element.className);
        }
    }
    
    // Check authentication status without adding click handler
    checkAuthStatusWithoutHandler(element) {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const isLoggedIn = !!token;
        
        console.log('🔍 Checking auth for element (no handler):', element.id, 'Token exists:', !!token);
        
        if (!isLoggedIn) {
            element.classList.add('auth-protected', 'locked');
            
            // For resume download, save original href and set to javascript:void(0)
            if (element.id === 'resume-download' && element.href !== 'javascript:void(0)') {
                element.setAttribute('data-original-href', element.href);
                element.href = 'javascript:void(0)';
            }
            
            console.log('🔒 Lock added to:', element.id, '(no handler)');
        } else {
            // Remove locked state and hide lock overlay
            element.classList.remove('locked');
            
            // For resume download, ensure it works properly
            if (element.id === 'resume-download') {
                // Restore original href if it was saved, otherwise set it based on the page
                if (element.hasAttribute('data-original-href')) {
                    element.href = element.getAttribute('data-original-href');
                    element.removeAttribute('data-original-href');
                } else {
                    const isAboutPage = window.location.pathname.includes('/pages/about.html');
                    element.href = isAboutPage ? '../resume.pdf' : 'resume.pdf';
                }
                
                element.download = 'Sanjayraj_N_Resume.pdf';
                element.target = '_blank';
            }
            
            console.log('🔓 Lock removed from:', element.id, 'Classes now:', element.className);
        }
    }
    
    // Handle clicks on protected elements
    handleProtectedClick(e) {
        e.preventDefault();
        // Check if we're on the about page or another page in the pages directory
        const isInPagesDirectory = window.location.pathname.includes('/pages/');
        const loginPath = isInPagesDirectory ? 'login.html' : 'pages/login.html';
        
        // Redirect to login page with message
        localStorage.setItem('login-message', 'Please login to access this feature');
        localStorage.setItem('redirect-after-login', window.location.href);
        window.location.href = loginPath;
    }
    
    // Show login prompt
    showLoginPrompt() {
        // Check if we're on the about page or another page in the pages directory
        const isInPagesDirectory = window.location.pathname.includes('/pages/');
        const loginPath = isInPagesDirectory ? 'login.html' : 'pages/login.html';
        
        const notification = document.createElement('div');
        notification.className = 'auth-notification';
        notification.innerHTML = `
            <div class="auth-notification-content">
                <i class="fas fa-lock"></i>
                <span>Please login to download the resume</span>
                <button onclick="window.location.href='${loginPath}'" class="login-btn">Login</button>
                <button onclick="this.parentElement.parentElement.remove()" class="close-btn">×</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: calc(var(--header-height) + 20px);
            right: 20px;
            background: linear-gradient(135deg, rgba(0, 168, 255, 0.9), rgba(125, 95, 255, 0.9));
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 1000000;
            animation: slideInRight 0.3s ease;
            backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Initialize feature notifications
    initFeatureNotifications() {
        // Notification handling is now managed by notification-fix.js
        // which implements a fixed popup for all screen sizes
        console.log('✅ Feature notifications initialized - using fixed positioning for all screen sizes');
        
        // For backward compatibility, we'll still check for the old localStorage key
        if (localStorage.getItem('feature-notification-dismissed')) {
            localStorage.setItem('feature_notification_closed', 'true');
        }
    }
    
    // These methods are kept for backward compatibility but are no longer used
    // as notification-fix.js now handles all notification positioning
    adjustNotificationForMobile(notification) {
        // No longer needed - notification is now fixed positioned for all screen sizes
        console.log('Mobile notification adjustment bypassed - using fixed positioning');
    }
    
    adjustNotificationForDesktop(notification) {
        // No longer needed - notification is now fixed positioned for all screen sizes
        console.log('Desktop notification adjustment bypassed - using fixed positioning');
    }
    
    // Setup auth state listener
    setupAuthStateListener() {
        // Listen for storage changes (when user logs in/out in another tab)
        window.addEventListener('storage', (e) => {
            if (e.key === 'token' || e.key === 'currentUser') {
                this.refreshAuthState();
            }
        });
        
        // Listen for focus events (when user returns from login page)
        window.addEventListener('focus', () => {
            this.refreshAuthState();
        });
    }
    
    // Refresh authentication state
    refreshAuthState() {
        const resumeBtn = document.getElementById('resume-download');
        if (resumeBtn) {
            // Use the version without adding click handler to avoid conflicts
            this.checkAuthStatusWithoutHandler(resumeBtn);
        }
        
        // Also refresh project buttons if on projects page
        const projectButtons = document.querySelectorAll('.btn-view-project');
        projectButtons.forEach(btn => {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (token) {
                // Remove lock indicators
                const lockIcon = btn.querySelector('.lock-indicator');
                if (lockIcon) {
                    lockIcon.remove();
                }
                btn.classList.remove('auth-protected');
            }
        });
    }
    
    // Debug authentication state
    debugAuthState() {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const resumeBtn = document.getElementById('resume-download');
        
        console.log('🔍 Auth Debug:');
        console.log('- Token exists:', !!token);
        console.log('- Resume button classes:', resumeBtn?.className);
        console.log('- Lock overlay visible:', resumeBtn?.querySelector('.lock-overlay')?.style.opacity || 'default');
        
        // Manual fix for testing
        if (token && resumeBtn) {
            console.log('🔧 Manually fixing lock icon...');
            resumeBtn.classList.remove('locked');
            console.log('- Classes after manual fix:', resumeBtn.className);
        }
    }
    
    // Manual function to remove lock (for testing)
    removeLockManually() {
        const resumeBtn = document.getElementById('resume-download');
        if (resumeBtn) {
            resumeBtn.classList.remove('locked');
            console.log('🔓 Manual lock removal - Classes:', resumeBtn.className);
        }
    }
    
    // Force remove lock if authenticated (aggressive approach)
    forceRemoveLockIfAuthenticated() {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            const resumeBtn = document.getElementById('resume-download');
            if (resumeBtn) {
                // Remove locked class
                if (resumeBtn.classList.contains('locked')) {
                    resumeBtn.classList.remove('locked');
                    console.log('🔓 Force removed lock - user is authenticated');
                }
                
                // Restore original href if it was saved, otherwise set it based on the page
                if (resumeBtn.hasAttribute('data-original-href')) {
                    resumeBtn.href = resumeBtn.getAttribute('data-original-href');
                    resumeBtn.removeAttribute('data-original-href');
                } else {
                    const isAboutPage = window.location.pathname.includes('/pages/about.html');
                    resumeBtn.href = isAboutPage ? '../resume.pdf' : 'resume.pdf';
                }
                
                resumeBtn.download = 'Sanjayraj_N_Resume.pdf';
                resumeBtn.target = '_blank';
                
                // Remove any click handlers that might be preventing the download
                const newResumeBtn = resumeBtn.cloneNode(true);
                resumeBtn.parentNode.replaceChild(newResumeBtn, resumeBtn);
                
                console.log('🔄 Resume button reset to ensure download works');
            }
        }
    }
}

// Initialize the application when DOM is ready
const portfolioApp = new PortfolioApp();

// Global functions for testing
window.testLockRemoval = function() {
    console.log('🧪 Testing lock removal...');
    const resumeBtn = document.getElementById('resume-download');
    if (resumeBtn) {
        console.log('Before:', resumeBtn.className);
        resumeBtn.classList.remove('locked');
        console.log('After:', resumeBtn.className);
        
        // Also try direct style manipulation
        const lockOverlay = resumeBtn.querySelector('.lock-overlay');
        if (lockOverlay) {
            lockOverlay.style.opacity = '0';
            console.log('Lock overlay opacity set to 0');
        }
    }
};

window.testAuthState = function() {
    portfolioApp.debugAuthState();
};

window.forceRemoveLock = function() {
    portfolioApp.forceRemoveLockIfAuthenticated();
};

// Global function to hide feature notification
function hideFeatureNotification() {
    const notification = document.getElementById('feature-notification');
    if (notification) {
        // Add hidden class for animation
        notification.classList.add('hidden');
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
        
        // Store in both localStorage keys for backward compatibility
        localStorage.setItem('feature-notification-dismissed', 'true');
        localStorage.setItem('feature_notification_closed', 'true');
    }
}

// Resize event handler - notification positioning is now handled by CSS
window.addEventListener('resize', function() {
    // No need to adjust notification position as it's now fixed positioned for all screen sizes
    // and handled by CSS media queries
});