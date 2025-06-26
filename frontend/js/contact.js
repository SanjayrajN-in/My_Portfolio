// Contact page specific JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Form submission handling
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmission);
    }
    
    // Wait for auth system to be ready before auto-filling
    waitForAuthThenAutoFill();
    
    // Function to wait for auth system and then auto-fill
    function waitForAuthThenAutoFill() {
        // Check if auth system is already ready
        if (typeof authSystem !== 'undefined' && authSystem.initialized) {
            // Auth system is ready, auto-fill immediately
            autoFillUserEmail();
            return;
        }
        
        const maxRetries = 50; // Maximum 5 seconds wait (50 * 100ms)
        let retryCount = 0;
        
        function checkAuth() {
            if (typeof authSystem !== 'undefined' && authSystem.initialized) {
                // Auth system is ready, auto-fill now
                autoFillUserEmail();
            } else if (retryCount < maxRetries) {
                // Auth system not ready yet, wait and retry
                retryCount++;
                setTimeout(checkAuth, 100);
            } else {
                // Timeout reached, try auto-fill anyway (user might not be logged in)
                autoFillUserEmail();
            }
        }
        
        checkAuth();
    }
    
    // Function to auto-fill email from logged-in user
    function autoFillUserEmail() {
        const emailInput = document.getElementById('email');
        const nameInput = document.getElementById('name');
        const emailHint = document.querySelector('.email-hint');
        

        
        if (emailInput && typeof authSystem !== 'undefined' && authSystem.currentUser) {
            // Auto-fill email from logged-in user
            emailInput.value = authSystem.currentUser.email;
            emailInput.parentElement.classList.add('focused');
            
            // Show the email hint
            if (emailHint) {
                emailHint.style.display = 'block';
                emailHint.style.opacity = '0';
                setTimeout(() => {
                    emailHint.style.transition = 'opacity 0.3s ease';
                    emailHint.style.opacity = '1';
                }, 100);
            }
            
            // Auto-fill name if available
            if (nameInput && authSystem.currentUser.name) {
                nameInput.value = authSystem.currentUser.name;
                nameInput.parentElement.classList.add('focused');
            }
            
            // Add event listener to hide hint when email is manually changed
            // Remove existing listener first to avoid duplicates
            emailInput.removeEventListener('input', handleEmailInputChange);
            emailInput.addEventListener('input', handleEmailInputChange);
        }
    }
    
    // Separate function for email input change handler
    function handleEmailInputChange() {
        const emailHint = document.querySelector('.email-hint');
        if (emailHint && typeof authSystem !== 'undefined' && authSystem.currentUser) {
            if (this.value !== authSystem.currentUser.email) {
                emailHint.style.display = 'none';
            } else if (this.value === authSystem.currentUser.email) {
                emailHint.style.display = 'block';
            }
        }
    }
    
    // Handle form submission
    async function handleFormSubmission(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            subject: document.getElementById('subject').value.trim(),
            message: document.getElementById('message').value.trim()
        };
        
        // Validation
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            showFormMessage('Please fill in all fields.', 'error');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            showFormMessage('Please enter a valid email address.', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.querySelector('.btn-text').textContent;
        submitBtn.querySelector('.btn-text').textContent = 'Sending...';
        submitBtn.disabled = true;
        
        try {
            // Send contact form data to server
            const response = await fetch(`${window.API_BASE_URL || 'https://sanjayraj-n.onrender.com'}/api/contact/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showFormMessage(result.message || 'Thank you for your message! I will get back to you soon.', 'success');
                contactForm.reset();
                
                // Re-fill email if user is logged in (since form was reset)
                // Small delay to ensure form is reset before auto-filling
                setTimeout(() => {
                    autoFillUserEmail();
                }, 50);
            } else {
                showFormMessage(result.message || 'Failed to send message. Please try again.', 'error');
            }
            
        } catch (error) {
            showFormMessage('An error occurred while sending your message. Please try again later.', 'error');
        } finally {
            // Reset button state
            submitBtn.querySelector('.btn-text').textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    }
    
    // Show form message
    function showFormMessage(message, type) {
        // Remove existing messages
        const existingMessages = contactForm.querySelectorAll('.form-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create new message
        const formMessage = document.createElement('div');
        formMessage.className = `form-message ${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
        formMessage.innerHTML = `<i class="${icon}"></i> ${message}`;
        
        contactForm.appendChild(formMessage);
        
        // Auto-remove message after 8 seconds
        setTimeout(() => {
            if (formMessage.parentNode) {
                formMessage.remove();
            }
        }, 8000);
        
        // Scroll to message
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // FAQ accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            // Toggle active class on clicked item
            item.classList.toggle('active');
            
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
        });
    });
    
    // Back to top functionality removed to fix mobile width issues
    
    // Input animation for form fields
    const formInputs = document.querySelectorAll('.form-group input, .form-group textarea');
    
    formInputs.forEach(input => {
        // Add floating label effect
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (this.value === '') {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Check if input has value on page load
        if (input.value !== '') {
            input.parentElement.classList.add('focused');
        }
    });
    
    // Social icons hover effect
    const socialIcons = document.querySelectorAll('.social-links a, .social-icons a');
    
    socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.05)';
        });
        
        icon.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});