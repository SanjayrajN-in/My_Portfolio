// Skills page specific JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const categoryButtons = document.querySelectorAll('.skill-category');
    const skillTabs = document.querySelectorAll('.skills-tab');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get category value
            const category = this.getAttribute('data-category');
            
            // Hide all tabs
            skillTabs.forEach(tab => tab.classList.remove('active'));
            
            // Show selected tab
            document.getElementById(category).classList.add('active');
            
            // Animate skill bars after a short delay
            setTimeout(() => {
                animateSkillBars();
            }, 300);
        });
    });
    
    // Animate skill bars when they come into view
    function animateSkillBars() {
        const skillCards = document.querySelectorAll('.skills-tab.active .skill-card');
        
        skillCards.forEach(card => {
            const levelFill = card.querySelector('.level-fill');
            const width = levelFill.style.width;
            
            // Reset width to 0
            levelFill.style.width = '0';
            
            // Set the width as a CSS variable
            levelFill.style.setProperty('--width', width);
            
            // Add animation class after a small delay
            setTimeout(() => {
                card.classList.add('animate');
            }, 100);
        });
    }
    
    // Initialize animation for the first tab
    setTimeout(() => {
        animateSkillBars();
    }, 500);
    
    // Intersection Observer for skill cards
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                
                // If it's a skill card, animate its level bar
                if (entry.target.classList.contains('skill-card')) {
                    setTimeout(() => {
                        entry.target.classList.add('animate');
                    }, 200);
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2
    });
    
    // Observe all skill cards and learning cards
    document.querySelectorAll('.skill-card, .learning-card').forEach(card => {
        observer.observe(card);
    });
    
    // Hover effect for skill projects
    const projectTags = document.querySelectorAll('.skill-projects span');
    
    projectTags.forEach(tag => {
        tag.addEventListener('mouseenter', function() {
            const otherTags = Array.from(this.parentNode.children).filter(t => t !== this);
            otherTags.forEach(t => t.style.opacity = '0.5');
        });
        
        tag.addEventListener('mouseleave', function() {
            const otherTags = Array.from(this.parentNode.children);
            otherTags.forEach(t => t.style.opacity = '1');
        });
    });
});