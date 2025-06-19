// Projects page specific JavaScript

document.addEventListener('DOMContentLoaded', function() {

    
    // Project modal functionality
    const modal = document.querySelector('.project-modal');
    const modalContent = document.querySelector('.modal-body');
    const modalClose = document.querySelector('.modal-close');
    const viewButtons = document.querySelectorAll('.btn-view-project');
    const projectTemplates = document.querySelectorAll('.project-details-template');
    
    // Check if modal elements exist
    if (!modal || !modalContent) {
        console.warn('Modal elements not found. Modal functionality will not work.');
        // Don't return here - let other functionality work
    }
    

    
    // Open modal with project details
    viewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            
            // Check if modal elements exist before proceeding
            if (!modal || !modalContent) {
                console.error('Modal elements not found!');
                return;
            }
            
            // Get project ID
            const projectId = this.getAttribute('data-project');
            
            // Find corresponding template
            let template;
            if (projectId) {
                template = document.getElementById(`${projectId}-details`);
            }
            
            // If template exists, load content
            if (template) {
                modalContent.innerHTML = template.innerHTML;
                
                // Initialize gallery functionality
                initGallery();
            } else {
                console.warn(`Template not found for project: ${projectId}`);
                // Show a fallback message
                modalContent.innerHTML = `
                    <div class="project-details">
                        <div class="project-details-header">
                            <h2>Project Details</h2>
                        </div>
                        <div class="project-details-content">
                            <div class="details-section">
                                <h3>Error</h3>
                                <p>Project details template not found for: ${projectId}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Show modal with animation
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Reset scroll position to top and enable smooth scrolling
            const modalContentElement = modal.querySelector('.modal-content');
            if (modalContentElement) {
                modalContentElement.scrollTop = 0;
                modalContentElement.style.scrollBehavior = 'smooth';
            }
            
            // Initialize gallery functionality
            setTimeout(() => {
                initGallery();
            }, 100);
        });
    });
    
    // Close modal function
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    // Close modal
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside content
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
    
    // Gallery functionality
    function initGallery() {
        const galleryMain = document.querySelector('.gallery-main img');
        const galleryThumbs = document.querySelectorAll('.gallery-thumbs img');
        
        if (galleryThumbs.length > 0) {
            galleryThumbs.forEach(thumb => {
                thumb.addEventListener('click', function() {
                    // Update main image
                    galleryMain.src = this.src;
                    galleryMain.alt = this.alt;
                    
                    // Update active thumb
                    galleryThumbs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                });
            });
        }
    }
    
    // Tilt effect removed for better performance
    

});