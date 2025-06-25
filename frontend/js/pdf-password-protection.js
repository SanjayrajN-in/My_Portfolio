/**
 * PDF Password Protection Implementation
 */

// Add to ToolsManager class
ToolsManager.prototype.initPDFPasswordProtection = function() {
    const uploadArea = document.getElementById('pdfPasswordUpload');
    const fileInput = document.getElementById('pdfPasswordInput');
    const protectBtn = document.getElementById('protectPdfBtn');
    const clearBtn = document.getElementById('clearPdfPassword');
    const protectAnotherBtn = document.getElementById('protectAnotherPdf');
    const clearErrorBtn = document.getElementById('clearPdfPasswordError');
    const passwordInput = document.getElementById('pdfPassword');
    const passwordConfirmInput = document.getElementById('pdfPasswordConfirm');
    
    const controls = document.getElementById('pdfPasswordControls');
    const resultArea = document.getElementById('pdfPasswordResult');
    const processingArea = document.getElementById('pdfPasswordProcessing');
    const errorArea = document.getElementById('pdfPasswordErrorArea');

    if (!uploadArea || !fileInput) return;

    // Upload area click
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handlePDFPasswordFile(files[0], controls, resultArea, errorArea);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            this.handlePDFPasswordFile(e.target.files[0], controls, resultArea, errorArea);
        }
    });

    // Password validation
    if (passwordInput && passwordConfirmInput) {
        const validatePasswords = () => {
            const password = passwordInput.value;
            const confirmPassword = passwordConfirmInput.value;
            const isValid = password.length >= 4 && password === confirmPassword;
            
            if (protectBtn) {
                protectBtn.disabled = !isValid;
            }
            
            return isValid;
        };

        passwordInput.addEventListener('input', validatePasswords);
        passwordConfirmInput.addEventListener('input', validatePasswords);
    }

    // Start protection
    if (protectBtn) {
        protectBtn.addEventListener('click', () => {
            if (this.currentPDFFile && passwordInput && passwordConfirmInput) {
                const password = passwordInput.value;
                const confirmPassword = passwordConfirmInput.value;
                
                if (password.length < 4) {
                    this.showError('Password must be at least 4 characters long', errorArea);
                    return;
                }
                
                if (password !== confirmPassword) {
                    this.showError('Passwords do not match', errorArea);
                    return;
                }
                
                const options = {
                    preventPrinting: document.getElementById('preventPrinting')?.checked || false,
                    preventCopying: document.getElementById('preventCopying')?.checked || false,
                    preventModification: document.getElementById('preventModification')?.checked || false
                };
                
                this.protectPDFFile(this.currentPDFFile, password, options, controls, resultArea, processingArea, errorArea);
            }
        });
    }

    // Clear protection
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            this.clearPDFPasswordProtection(fileInput, controls, resultArea, processingArea, errorArea);
        });
    }

    // Protect another
    if (protectAnotherBtn) {
        protectAnotherBtn.addEventListener('click', () => {
            this.clearPDFPasswordProtection(fileInput, controls, resultArea, processingArea, errorArea);
        });
    }

    // Clear error
    if (clearErrorBtn) {
        clearErrorBtn.addEventListener('click', () => {
            this.hideError(errorArea);
        });
    }

    // Download protected
    const downloadBtn = document.getElementById('downloadProtectedPdf');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (this.protectedPDFBlob) {
                this.downloadFile(this.protectedPDFBlob, this.protectedPDFFilename || 'protected.pdf');
            }
        });
    }
};

ToolsManager.prototype.handlePDFPasswordFile = function(file, controls, resultArea, errorArea) {
    // Hide any previous errors
    this.hideError(errorArea);
    
    // Validate file size first
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
        this.showError(
            `File size (${this.formatFileSize(file.size)}) exceeds the maximum limit of ${this.formatFileSize(maxSize)}.`,
            errorArea
        );
        return;
    }

    if (file.size < 1024) {
        this.showError('File is too small or may be corrupted.', errorArea);
        return;
    }

    // Check if it's a PDF
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        this.showError('Please select a valid PDF file.', errorArea);
        return;
    }

    this.currentPDFFile = file;
    if (controls) controls.style.display = 'block';
    if (resultArea) resultArea.style.display = 'none';
    
    const fileInfo = document.getElementById('pdfPasswordFileInfo');
    if (fileInfo) {
        fileInfo.innerHTML = `
            <div class="file-details">
                <div class="file-name">
                    <i class="fas fa-file-pdf"></i>
                    <strong>${file.name}</strong>
                </div>
                <div class="file-meta">
                    <span class="file-size">Size: ${this.formatFileSize(file.size)}</span>
                    <span class="file-type">Type: PDF</span>
                </div>
            </div>
        `;
    }
    
    this.showNotification(`PDF uploaded successfully! File: ${file.name} (${this.formatFileSize(file.size)})`);
};

ToolsManager.prototype.protectPDFFile = async function(file, password, options, controls, resultArea, processingArea, errorArea) {
    try {
        // Show processing area
        if (controls) controls.style.display = 'none';
        if (processingArea) processingArea.style.display = 'block';
        if (resultArea) resultArea.style.display = 'none';
        this.hideError(errorArea);

        // Update progress
        const updateProgress = (percent, message) => {
            const progressFill = document.getElementById('passwordProgressFill');
            const progressPercent = document.getElementById('passwordProgressPercent');
            const progressMessage = document.getElementById('passwordProgressMessage');
            
            if (progressFill) progressFill.style.width = `${percent}%`;
            if (progressPercent) progressPercent.textContent = `${percent}%`;
            if (progressMessage) progressMessage.textContent = message;
        };

        updateProgress(10, 'Reading PDF file...');

        // Read the PDF file
        const arrayBuffer = await file.arrayBuffer();
        
        updateProgress(30, 'Loading PDF document...');

        // Load the PDF with PDF-lib
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        
        updateProgress(50, 'Applying password protection...');

        // Create permissions based on options
        let permissions = [];
        if (!options.preventPrinting) {
            permissions.push(PDFLib.PDFPermissions.Printing);
        }
        if (!options.preventCopying) {
            permissions.push(PDFLib.PDFPermissions.Copying);
        }
        if (!options.preventModification) {
            permissions.push(PDFLib.PDFPermissions.Modifying);
            permissions.push(PDFLib.PDFPermissions.DocumentAssembly);
            permissions.push(PDFLib.PDFPermissions.FillingForms);
            permissions.push(PDFLib.PDFPermissions.Annotating);
        }
        
        updateProgress(70, 'Encrypting PDF...');

        // Set password and permissions
        pdfDoc.encrypt({
            userPassword: password,
            ownerPassword: password + '_owner', // Different owner password
            permissions: permissions
        });

        updateProgress(90, 'Finalizing protected PDF...');

        // Save the protected PDF
        const pdfBytes = await pdfDoc.save();
        
        updateProgress(100, 'Protection complete!');

        // Create blob for download
        this.protectedPDFBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        this.protectedPDFFilename = `protected_${file.name}`;

        // Update protection status display
        this.updateProtectionStatus(options);

        // Show result area
        setTimeout(() => {
            if (processingArea) processingArea.style.display = 'none';
            if (resultArea) resultArea.style.display = 'block';
            
            this.showNotification('PDF protected successfully!');
        }, 500);

    } catch (error) {

        
        // Hide processing area
        if (processingArea) processingArea.style.display = 'none';
        if (controls) controls.style.display = 'block';
        
        this.showError(`Protection failed: ${error.message}`, errorArea);
    }
};

ToolsManager.prototype.updateProtectionStatus = function(options) {
    const printingStatus = document.getElementById('printingStatus');
    const copyingStatus = document.getElementById('copyingStatus');
    const modificationStatus = document.getElementById('modificationStatus');

    if (printingStatus) {
        printingStatus.innerHTML = options.preventPrinting ? 
            '<i class="fas fa-print text-danger"></i><span>Printing restricted</span>' :
            '<i class="fas fa-print text-success"></i><span>Printing allowed</span>';
    }

    if (copyingStatus) {
        copyingStatus.innerHTML = options.preventCopying ? 
            '<i class="fas fa-copy text-danger"></i><span>Copying restricted</span>' :
            '<i class="fas fa-copy text-success"></i><span>Copying allowed</span>';
    }

    if (modificationStatus) {
        modificationStatus.innerHTML = options.preventModification ? 
            '<i class="fas fa-edit text-danger"></i><span>Modification restricted</span>' :
            '<i class="fas fa-edit text-success"></i><span>Modification allowed</span>';
    }
};

ToolsManager.prototype.clearPDFPasswordProtection = function(fileInput, controls, resultArea, processingArea, errorArea) {
    this.currentPDFFile = null;
    this.protectedPDFBlob = null;
    this.protectedPDFFilename = null;
    
    if (fileInput) fileInput.value = '';
    if (controls) controls.style.display = 'none';
    if (resultArea) resultArea.style.display = 'none';
    if (processingArea) processingArea.style.display = 'none';
    if (errorArea) errorArea.style.display = 'none';
    
    // Clear password inputs
    const passwordInput = document.getElementById('pdfPassword');
    const passwordConfirmInput = document.getElementById('pdfPasswordConfirm');
    if (passwordInput) passwordInput.value = '';
    if (passwordConfirmInput) passwordConfirmInput.value = '';
    
    // Reset checkboxes
    const preventPrinting = document.getElementById('preventPrinting');
    const preventCopying = document.getElementById('preventCopying');
    const preventModification = document.getElementById('preventModification');
    if (preventPrinting) preventPrinting.checked = true;
    if (preventCopying) preventCopying.checked = true;
    if (preventModification) preventModification.checked = true;
    
    const fileInfo = document.getElementById('pdfPasswordFileInfo');
    if (fileInfo) fileInfo.innerHTML = '';
    
    this.showNotification('PDF password protection cleared successfully');
};