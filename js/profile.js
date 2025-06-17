// Profile Page Functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeProfile();
});

function initializeProfile() {
    // Initialize avatar options
    initAvatarOptions();
    
    // Initialize edit name form
    initEditNameForm();
    
    // Add smooth animations
    addProfileAnimations();
}

function initAvatarOptions() {
    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            avatarOptions.forEach(opt => opt.classList.remove('active'));
            // Add active class to clicked option
            this.classList.add('active');
            
            // Update avatar preview
            const avatarSrc = this.dataset.avatar;
            updateAvatarPreview(avatarSrc);
        });
    });
}

function initEditNameForm() {
    const editNameForm = document.getElementById('editNameForm');
    if (editNameForm) {
        editNameForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const newName = document.getElementById('newName').value.trim();
            if (newName) {
                updateUserName(newName);
                closeEditModal();
            }
        });
    }
}

function addProfileAnimations() {
    // Add staggered animation to profile cards
    const profileCards = document.querySelectorAll('.profile-card');
    profileCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in-up');
    });
    
    // Add hover effects to stat items
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.05)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

function openAvatarModal() {
    const modal = document.getElementById('avatarModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Set current avatar as active
    const currentAvatar = document.getElementById('profileAvatar').src;
    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(option => {
        if (option.dataset.avatar === currentAvatar) {
            option.classList.add('active');
        }
    });
}

function closeAvatarModal() {
    const modal = document.getElementById('avatarModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Save selected avatar
    const activeOption = document.querySelector('.avatar-option.active');
    if (activeOption) {
        const avatarSrc = activeOption.dataset.avatar;
        updateUserAvatar(avatarSrc);
    }
}

function updateAvatarPreview(avatarSrc) {
    // This would normally update a preview, but we'll update directly for simplicity
    document.getElementById('profileAvatar').src = avatarSrc;
    const navAvatar = document.getElementById('navUserAvatar');
    if (navAvatar) {
        navAvatar.src = avatarSrc;
    }
}

function updateUserAvatar(avatarSrc) {
    if (authSystem.currentUser) {
        authSystem.currentUser.avatar = avatarSrc;
        
        // Update UI
        document.getElementById('profileAvatar').src = avatarSrc;
        const navAvatar = document.getElementById('navUserAvatar');
        if (navAvatar) {
            navAvatar.src = avatarSrc;
        }
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(authSystem.currentUser));
        
        // Update in registered users
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const userIndex = users.findIndex(u => u.id === authSystem.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = authSystem.currentUser;
            localStorage.setItem('registeredUsers', JSON.stringify(users));
        }
        
        showProfileMessage('Avatar updated successfully!', 'success');
    }
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Check file type
        if (!file.type.startsWith('image/')) {
            showProfileMessage('Please select a valid image file', 'error');
            return;
        }
        
        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showProfileMessage('Image size should be less than 2MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarSrc = e.target.result;
            updateUserAvatar(avatarSrc);
            closeAvatarModal();
        };
        reader.readAsDataURL(file);
    }
}

function editField(fieldName) {
    if (fieldName === 'name') {
        openEditNameModal();
    }
}

function openEditNameModal() {
    const modal = document.getElementById('editNameModal');
    const nameInput = document.getElementById('newName');
    
    // Set current name as default value
    nameInput.value = authSystem.currentUser.name;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus on input
    setTimeout(() => {
        nameInput.focus();
        nameInput.select();
    }, 100);
}

function closeEditModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
}

function updateUserName(newName) {
    if (authSystem.currentUser) {
        authSystem.currentUser.name = newName;
        
        // Update UI
        document.getElementById('profileName').textContent = newName;
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(authSystem.currentUser));
        
        // Update in registered users
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const userIndex = users.findIndex(u => u.id === authSystem.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = authSystem.currentUser;
            localStorage.setItem('registeredUsers', JSON.stringify(users));
        }
        
        showProfileMessage('Name updated successfully!', 'success');
    }
}

function clearGameHistory() {
    if (confirm('Are you sure you want to clear your game history? This action cannot be undone.')) {
        if (authSystem.currentUser) {
            authSystem.currentUser.gameStats = {
                totalGamesPlayed: 0,
                totalPlaytime: 0,
                gamesHistory: [],
                achievements: []
            };
            
            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(authSystem.currentUser));
            
            // Update in registered users
            const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            const userIndex = users.findIndex(u => u.id === authSystem.currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = authSystem.currentUser;
                localStorage.setItem('registeredUsers', JSON.stringify(users));
            }
            
            // Reload profile data
            authSystem.loadProfileData();
            
            showProfileMessage('Game history cleared successfully!', 'success');
        }
    }
}

function showProfileMessage(message, type) {
    // Create message element if it doesn't exist
    let messageDiv = document.querySelector('.profile-message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.className = 'profile-message';
        document.querySelector('.profile-section .container').prepend(messageDiv);
    }
    
    messageDiv.className = `profile-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

// Modal click outside to close
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeEditModal();
        closeAvatarModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeEditModal();
        closeAvatarModal();
    }
});

// Initialize smooth scrolling for profile sections
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}