/**
 * Navigation JavaScript
 * Handles all navigation-related functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // No dropdown icons - removed as requested
    // Create mobile-friendly menu structure
    function setupMobileMenu() {
        // Only run on mobile devices
        if (window.innerWidth > 992) {
            // Remove mobile menu items on desktop
            const existingMobileItems = document.querySelector('.mobile-more-items');
            if (existingMobileItems) {
                existingMobileItems.remove();
            }
            return;
        }
        
        // Clean up any existing mobile items first
        const existingMobileItems = document.querySelector('.mobile-more-items');
        if (existingMobileItems) {
            existingMobileItems.remove();
        }
        
        // Find the "More" dropdown
        const moreDropdown = document.querySelector('.nav-links .dropdown');
        if (!moreDropdown) return;
        
        // Get the dropdown menu items
        const dropdownMenu = moreDropdown.querySelector('.dropdown-menu');
        if (!dropdownMenu) return;
        
        // Create a container for mobile more items
        const mobileMoreItems = document.createElement('div');
        mobileMoreItems.className = 'mobile-more-items';
        
        // Get all the list items from the dropdown
        const menuItems = dropdownMenu.querySelectorAll('li');
        
        if (menuItems.length > 0) {
            // Create a new list for mobile
            const mobileList = document.createElement('ul');
            mobileList.className = 'mobile-more-list';
            
            // Add each item to the mobile list
            menuItems.forEach(item => {
                const newItem = item.cloneNode(true);
                // Remove any desktop-specific classes
                newItem.classList.remove('dropdown');
                const link = newItem.querySelector('a');
                if (link) {
                    link.classList.remove('dropdown-toggle');
                }
                mobileList.appendChild(newItem);
            });
            
            // Add the mobile list to the container
            mobileMoreItems.appendChild(mobileList);
            
            // Add the mobile container to the nav links
            const navLinksElement = document.querySelector('.nav-links');
            if (navLinksElement) {
                navLinksElement.appendChild(mobileMoreItems);
            }
        }
    }
    
    // Call the setup function with a small delay to prevent conflicts
    setTimeout(() => {
        setupMobileMenu();
    }, 100);
    // Fix for logo-circle animation
    const logoCircle = document.querySelector('.logo-circle');
    if (logoCircle) {
        // Force hardware acceleration
        logoCircle.style.transform = 'translate3d(-50%, -50%, 0)';
        logoCircle.style.willChange = 'box-shadow';
        
        // Temporarily pause animation to prevent glitches during page load
        logoCircle.style.animationPlayState = 'paused';
        
        // Resume animation after a short delay
        setTimeout(() => {
            logoCircle.style.animationPlayState = 'running';
        }, 300);
    }
    
    // Hide page transition with a slight delay for smoother appearance
    if (document.querySelector('.page-transition')) {
        // First ensure it's visible for a moment
        document.querySelector('.page-transition').classList.add('active');
        
        // Then hide it after a short delay
        setTimeout(() => {
            document.querySelector('.page-transition').classList.remove('active');
        }, 100);
    }
    
    // Ensure icons are loaded
    document.querySelectorAll('i[class^="fa"]').forEach(icon => {
        if (icon.offsetParent === null) {
            // Force icon to display if it's not visible
            icon.style.display = 'inline-block';
        }
    });
    
    // Restore scroll position if navigating back
    const savedScrollPosition = sessionStorage.getItem('scrollPosition');
    if (savedScrollPosition) {
        window.scrollTo(0, parseInt(savedScrollPosition));
        sessionStorage.removeItem('scrollPosition');
    }
    
    // Preload Font Awesome to prevent icon flashing
    if (!document.querySelector('#fa-preload')) {
        const faPreload = document.createElement('div');
        faPreload.id = 'fa-preload';
        faPreload.style.position = 'absolute';
        faPreload.style.width = '0';
        faPreload.style.height = '0';
        faPreload.style.overflow = 'hidden';
        faPreload.style.opacity = '0';
        
        // Add all commonly used icons
        const commonIcons = [
            'home', 'user', 'cogs', 'project-diagram', 'envelope', 'ellipsis-h',
            'code', 'laptop-code', 'brain', 'graduation-cap', 'briefcase',
            'chevron-right', 'chevron-left', 'chevron-up', 'chevron-down',
            'bars', 'times', 'plus', 'minus', 'check', 'star', 'heart',
            'linkedin', 'github', 'facebook', 'instagram', 'twitter',
            'certificate', 'tools', 'gamepad', 'music'
        ];
        
        let iconsHTML = '';
        commonIcons.forEach(icon => {
            iconsHTML += `<i class="fas fa-${icon}"></i><i class="far fa-${icon}"></i><i class="fab fa-${icon}"></i>`;
        });
        
        faPreload.innerHTML = iconsHTML;
        document.body.appendChild(faPreload);
    }
    // DOM Elements
    const header = document.querySelector('header');
    let hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;
    let isNavigating = false;
    let currentLayout = window.innerWidth > 992 ? 'desktop' : 'mobile';
    let isLayoutSwitching = false;
    
    // Create nav overlay if it doesn't exist
    let navOverlay;
    if (!document.querySelector('.nav-overlay')) {
        navOverlay = document.createElement('div');
        navOverlay.className = 'nav-overlay';
        body.appendChild(navOverlay);
    } else {
        navOverlay = document.querySelector('.nav-overlay');
    }
    
    // Create page transition element if it doesn't exist
    let pageTransition;
    if (!document.querySelector('.page-transition')) {
        pageTransition = document.createElement('div');
        pageTransition.className = 'page-transition';
        pageTransition.innerHTML = `
            <div class="page-transition-content">
                <div class="page-transition-spinner"></div>
                <div class="page-transition-text">Loading...</div>
            </div>
        `;
        body.appendChild(pageTransition);
    } else {
        pageTransition = document.querySelector('.page-transition');
    }
    
    // Mobile menu toggle
    if (hamburger && navLinks) {
        // Remove any existing event listeners to prevent conflicts
        hamburger.replaceWith(hamburger.cloneNode(true));
        const newHamburger = document.querySelector('.hamburger');
        
        newHamburger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileMenu();
        });
        
        // Update reference
        hamburger = newHamburger;
    }
    
    // Overlay click
    if (navOverlay) {
        navOverlay.addEventListener('click', () => {
            closeMobileMenu();
        });
    }
    
    // Outside click
    document.addEventListener('click', (e) => {
        const currentHamburger = document.querySelector('.hamburger');
        if (navLinks && navLinks.classList.contains('active') && 
            !navLinks.contains(e.target) && 
            currentHamburger && !currentHamburger.contains(e.target)) {
            closeMobileMenu();
        }
    });
    
    // Navigation links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            // Get the href attribute
            const href = link.getAttribute('href');
            
            // Close mobile menu when a link is clicked
            if (window.innerWidth <= 992) {
                closeMobileMenu();
            }
            
            // No dropdown handling on mobile - items are shown directly
            
            // Handle different link types
            if (href && href.startsWith('#') && href.length > 1) {
                // Anchor link
                e.preventDefault();
                smoothScrollTo(href);
            } else if (href && href !== '#' && !href.startsWith('javascript:') && !link.classList.contains('dropdown-toggle')) {
                // External navigation
                e.preventDefault();
                navigateToPage(href);
            }
        });
    });
    
    // Scroll event for header styling
    window.addEventListener('scroll', () => {
        handleScroll();
    }, { passive: true });
    
    // Resize event with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            handleResize();
        }, 150);
    }, { passive: true });
    
    // Handle resize logic
    function handleResize() {
        const newLayout = window.innerWidth > 992 ? 'desktop' : 'mobile';
        
        // Only process if layout actually changed
        if (newLayout !== currentLayout) {
            isLayoutSwitching = true;
            
            if (newLayout === 'desktop') {
                // Switching to desktop mode
                console.log('Switching to desktop layout');
                closeMobileMenu();
                cleanupMobileElements();
                enableDesktopDropdowns();
                
                // Force layout recalculation
                if (navLinks) {
                    navLinks.style.display = 'none';
                    navLinks.offsetHeight; // Force reflow
                    navLinks.style.display = '';
                }
                
            } else if (newLayout === 'mobile') {
                // Switching to mobile mode
                console.log('Switching to mobile layout');
                disableDesktopDropdowns();
                cleanupMobileElements(); // Clean first
                setTimeout(() => {
                    setupMobileMenu();
                }, 50);
            }
            
            currentLayout = newLayout;
            
            setTimeout(() => {
                isLayoutSwitching = false;
            }, 300);
        }
        
        // Handle dropdown positioning
        if (!isLayoutSwitching) {
            handleDropdownPositioning();
        }
    }
    
    // Initialize header state
    handleScroll();
    
    // Initialize layout on page load
    setTimeout(() => {
        handleResize();
    }, 200);
    
    // Add visibility change handler to reset layout when tab becomes visible
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setTimeout(() => {
                handleResize();
            }, 100);
        }
    });
    
    // Handle dropdown positioning when dev tools are opened
    function handleDropdownPositioning() {
        const dropdowns = document.querySelectorAll('.dropdown-menu');
        const viewportHeight = window.innerHeight;
        const headerHeight = header ? header.offsetHeight : 70;
        
        dropdowns.forEach(dropdown => {
            const dropdownParent = dropdown.closest('.dropdown');
            if (dropdownParent) {
                const parentRect = dropdownParent.getBoundingClientRect();
                const dropdownHeight = dropdown.offsetHeight;
                
                // Check if dropdown would go off-screen
                if (parentRect.bottom + dropdownHeight + 20 > viewportHeight) {
                    // Position dropdown above the parent instead
                    dropdown.style.top = 'auto';
                    dropdown.style.bottom = 'calc(100% + 5px)';
                    dropdown.style.transform = 'translateX(-50%) translateY(10px)';
                } else {
                    // Reset to normal positioning
                    dropdown.style.top = 'calc(100% + 5px)';
                    dropdown.style.bottom = 'auto';
                    dropdown.style.transform = 'translateX(-50%) translateY(-10px)';
                }
            }
        });
    }
    
    // Handle dropdown positioning on hover
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        dropdown.addEventListener('mouseenter', handleDropdownPositioning);
    });
    
    // Handle viewport changes (like dev tools opening)
    window.addEventListener('resize', handleDropdownPositioning);
    
    // Toggle mobile menu
    function toggleMobileMenu() {
        const currentHamburger = document.querySelector('.hamburger');
        navLinks.classList.toggle('active');
        if (currentHamburger) {
            currentHamburger.classList.toggle('active');
        }
        navOverlay.classList.toggle('active');
        body.classList.toggle('menu-open');
    }
    
    // Close mobile menu
    function closeMobileMenu() {
        const currentHamburger = document.querySelector('.hamburger');
        navLinks.classList.remove('active');
        if (currentHamburger) {
            currentHamburger.classList.remove('active');
        }
        navOverlay.classList.remove('active');
        body.classList.remove('menu-open');
    }
    
    // Clean up mobile-specific elements when switching to desktop
    function cleanupMobileElements() {
        // Remove mobile menu items
        const mobileMoreItems = document.querySelector('.mobile-more-items');
        if (mobileMoreItems) {
            mobileMoreItems.remove();
        }
        
        // Reset any mobile-specific classes
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
            dropdown.classList.remove('mobile-open');
        });
        
        // Reset nav links positioning and styles
        if (navLinks) {
            // Remove all inline styles
            navLinks.removeAttribute('style');
            
            // Remove mobile-specific classes
            navLinks.classList.remove('active');
            navLinks.classList.remove('mobile-open');
        }
        
        // Reset hamburger
        const currentHamburger = document.querySelector('.hamburger');
        if (currentHamburger) {
            currentHamburger.classList.remove('active');
            currentHamburger.removeAttribute('style');
        }
        
        // Reset body classes and styles
        body.classList.remove('menu-open');
        body.classList.remove('mobile-menu-active');
        body.style.overflow = '';
        
        // Reset nav overlay
        if (navOverlay) {
            navOverlay.classList.remove('active');
            navOverlay.removeAttribute('style');
        }
        
        // Force layout recalculation
        if (header) {
            header.offsetHeight; // Force reflow
        }
    }
    
    // Enable desktop dropdown functionality
    function enableDesktopDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.style.display = '';
            const dropdownMenu = dropdown.querySelector('.dropdown-menu');
            if (dropdownMenu) {
                dropdownMenu.style.display = '';
                dropdownMenu.style.position = '';
                dropdownMenu.style.transform = '';
                dropdownMenu.style.width = '';
                dropdownMenu.style.background = '';
                dropdownMenu.style.border = '';
                dropdownMenu.style.borderRadius = '';
                dropdownMenu.style.marginTop = '';
                dropdownMenu.style.marginBottom = '';
            }
        });
    }
    
    // Disable desktop dropdown functionality for mobile
    function disableDesktopDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            const dropdownMenu = dropdown.querySelector('.dropdown-menu');
            if (dropdownMenu) {
                dropdownMenu.classList.remove('mobile-open');
            }
        });
    }
    
    // Smooth scroll to element
    function smoothScrollTo(target) {
        try {
            const element = document.querySelector(target);
            if (element) {
                const headerHeight = header ? header.offsetHeight : 80;
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
    function navigateToPage(href) {
        if (isNavigating) return;
        isNavigating = true;
        
        // Show page transition
        showPageTransition();
        
        // Store the current scroll position
        sessionStorage.setItem('scrollPosition', window.scrollY);
        
        // Navigate after a short delay to allow transition to show
        setTimeout(() => {
            window.location.href = href;
        }, 400);
    }
    
    // Show page transition
    function showPageTransition() {
        if (pageTransition) {
            // Force repaint before adding the class
            pageTransition.offsetHeight;
            pageTransition.classList.add('active');
        }
    }
    
    // Hide page transition
    function hidePageTransition() {
        if (pageTransition) {
            pageTransition.classList.remove('active');
        }
    }
    
    // Handle scroll events
    function handleScroll() {
        const scrollY = window.scrollY;
        
        // Update header state
        if (header) {
            // Dynamic blur effect based on scroll
            const maxScroll = 300;
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
            header.style.backdropFilter = `blur(${blurAmount}px) saturate(${saturation}%)`;
            header.style.webkitBackdropFilter = `blur(${blurAmount}px) saturate(${saturation}%)`;
            header.style.background = `rgba(12, 12, 20, ${opacity})`;
            header.style.borderBottom = `1px solid rgba(0, 168, 255, ${borderOpacity})`;
            
            // Add subtle shadow intensity based on scroll
            const shadowIntensity = 0.1 + (0.3 * easedRatio);
            header.style.boxShadow = `0 4px ${20 + (easedRatio * 10)}px rgba(0, 0, 0, ${shadowIntensity}), 0 1px ${5 + (easedRatio * 5)}px rgba(0, 168, 255, ${borderOpacity * 0.8})`;
            
            // Add/remove scrolled class for additional styling
            if (scrollY > 30) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    }
    
    // Initialize cursor if elements exist
    const cursor = document.querySelector('.cursor');
    const cursorFollower = document.querySelector('.cursor-follower');
    
    if (cursor && cursorFollower && window.innerWidth > 768) {
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
    
    // Initialize particles.js if available
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
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
});