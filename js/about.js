// About page specific JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Counter animation for stats
    const statNumbers = document.querySelectorAll('.stat-number');
    
    function animateCounter(element) {
        const target = parseInt(element.getAttribute('data-count'));
        const duration = 2000; // 2 seconds
        const step = target / (duration / 16); // 60fps
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }
    
    // Start counter animation when element is in viewport
    function checkCounters() {
        statNumbers.forEach(stat => {
            const rect = stat.getBoundingClientRect();
            const isInViewport = (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
            
            if (isInViewport && !stat.classList.contains('counted')) {
                animateCounter(stat);
                stat.classList.add('counted');
            }
        });
    }
    
    // Check counters on scroll
    window.addEventListener('scroll', checkCounters);
    
    // Initial check
    checkCounters();
    
    // Testimonial slider (only if elements exist)
    const testimonialTrack = document.querySelector('.testimonial-track');
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    const prevButton = document.querySelector('.testimonial-prev');
    const nextButton = document.querySelector('.testimonial-next');
    const dots = document.querySelectorAll('.dot');
    
    // Only initialize testimonial slider if elements exist
    if (testimonialTrack && testimonialSlides.length > 0) {
        let currentSlide = 0;
        const slideWidth = 100; // 100%
        
        function goToSlide(index) {
            if (index < 0) {
                index = testimonialSlides.length - 1;
            } else if (index >= testimonialSlides.length) {
                index = 0;
            }
            
            currentSlide = index;
            testimonialTrack.style.transform = `translateX(-${slideWidth * currentSlide}%)`;
            
            // Update dots
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        }
        
        // Event listeners for controls
        if (prevButton && nextButton) {
            prevButton.addEventListener('click', () => {
                goToSlide(currentSlide - 1);
            });
            
            nextButton.addEventListener('click', () => {
                goToSlide(currentSlide + 1);
            });
        }
        
        // Event listeners for dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                goToSlide(index);
            });
        });
        
        // Auto slide
        let slideInterval = setInterval(() => {
            goToSlide(currentSlide + 1);
        }, 5000);
        
        // Pause auto slide on hover
        testimonialTrack.addEventListener('mouseenter', () => {
            clearInterval(slideInterval);
        });
        
        testimonialTrack.addEventListener('mouseleave', () => {
            slideInterval = setInterval(() => {
                goToSlide(currentSlide + 1);
            }, 5000);
        });
        
        // Initialize slider
        goToSlide(0);
    }
});