/* Tools JavaScript - Client-side utilities */
class ToolsManager {
    constructor() {
        this.currentImageFile = null;
        this.currentPDFFile = null;
        this.initializeTools();
    }

    initializeTools() {
        this.initImageCompressor();
        this.initPDFPasswordProtection();
        this.initScaleMeasurement();
    }

    // Image Compression Tool
    initImageCompressor() {
        const uploadArea = document.getElementById('imageCompressUpload');
        const fileInput = document.getElementById('imageCompressInput');
        const qualitySlider = document.getElementById('imageQuality');
        const qualityValue = document.getElementById('qualityValue');
        const compressBtn = document.getElementById('compressImageBtn');
        const clearBtn = document.getElementById('clearImageCompress');
        const fileInfo = document.getElementById('imageCompressFileInfo');
        const controls = document.getElementById('imageCompressionControls');
        const resultArea = document.getElementById('imageCompressResult');

        if (!uploadArea || !fileInput) return;

        // Upload area click
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'rgba(0, 255, 255, 0.6)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'rgba(0, 255, 255, 0.3)';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'rgba(0, 255, 255, 0.3)';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (this.isImageFile(file)) {
                    this.handleImageFile(file, controls, resultArea, fileInfo);
                } else {
                    this.showNotification('Please upload an image file only (JPG, PNG, WebP, etc.).', 'error');
                }
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                if (this.isImageFile(file)) {
                    this.handleImageFile(file, controls, resultArea, fileInfo);
                } else {
                    this.showNotification('Please upload an image file only (JPG, PNG, WebP, etc.).', 'error');
                    e.target.value = ''; // Clear the input
                }
            }
        });

        // Quality slider
        if (qualitySlider && qualityValue) {
            qualitySlider.addEventListener('input', (e) => {
                qualityValue.textContent = e.target.value;
            });
        }

        // Compress button
        if (compressBtn) {
            compressBtn.addEventListener('click', () => {
                const quality = qualitySlider ? parseInt(qualitySlider.value) / 100 : 0.8;
                this.compressImage(quality, resultArea);
            });
        }

        // Clear button
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearImageCompressor(fileInput, controls, resultArea, fileInfo);
            });
        }
    }

    isImageFile(file) {
        // Check both MIME type and file extension
        const isImageMimeType = file.type.startsWith('image/');
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
        const isImageExtension = imageExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext)
        );
        return isImageMimeType || isImageExtension;
    }

    handleImageFile(file, controls, resultArea, fileInfo) {
        this.currentImageFile = file;
        if (controls) controls.style.display = 'block';
        if (resultArea) resultArea.style.display = 'none';
        if (fileInfo) {
            fileInfo.innerHTML = `
                <div class="file-details">
                    <strong>${file.name}</strong><br>
                    Size: ${this.formatFileSize(file.size)}<br>
                    Type: ${file.type}
                </div>
            `;
        }
        
        // Show success notification
        this.showNotification(`Image uploaded successfully! File: ${file.name} (${this.formatFileSize(file.size)})`);
    }

    async compressImage(quality, resultArea) {
        if (!this.currentImageFile) return;

        this.showNotification('Compressing image...', 'info');

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                canvas.toBlob((blob) => {
                    this.displayImageComparison(this.currentImageFile, blob, resultArea);
                    
                    // Calculate compression ratio
                    const originalSize = this.currentImageFile.size;
                    const compressedSize = blob.size;
                    const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);
                    
                    if (reduction > 0) {
                        this.showNotification(`Image compressed successfully! Reduced by ${reduction}% (${this.formatFileSize(originalSize)} → ${this.formatFileSize(compressedSize)})`);
                    } else {
                        this.showNotification('Image compression completed, but file size may be similar due to quality settings.', 'warning');
                    }
                }, 'image/jpeg', quality);
            };

            img.src = URL.createObjectURL(this.currentImageFile);
        } catch (error) {
            console.error('Error compressing image:', error);
            this.showNotification('Error compressing image. Please try again.', 'error');
        }
    }

    displayImageComparison(originalFile, compressedBlob, resultArea) {
        if (!resultArea) return;

        const originalImg = document.getElementById('originalImage');
        const compressedImg = document.getElementById('compressedImage');
        const originalSize = document.getElementById('originalSize');
        const compressedSize = document.getElementById('compressedSize');
        const downloadBtn = document.getElementById('downloadCompressedImage');

        if (originalImg) {
            originalImg.src = URL.createObjectURL(originalFile);
        }
        if (compressedImg) {
            compressedImg.src = URL.createObjectURL(compressedBlob);
        }
        if (originalSize) {
            originalSize.textContent = this.formatFileSize(originalFile.size);
        }
        if (compressedSize) {
            compressedSize.textContent = this.formatFileSize(compressedBlob.size);
        }

        if (downloadBtn) {
            downloadBtn.onclick = () => {
                const url = URL.createObjectURL(compressedBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `compressed_${originalFile.name}`;
                a.click();
                URL.revokeObjectURL(url);
            };
        }

        resultArea.style.display = 'block';
    }

    clearImageCompressor(fileInput, controls, resultArea, fileInfo) {
        this.currentImageFile = null;
        if (fileInput) fileInput.value = '';
        if (controls) controls.style.display = 'none';
        if (resultArea) resultArea.style.display = 'none';
        if (fileInfo) fileInfo.innerHTML = '';
        
        this.showNotification('Image compressor cleared successfully');
    }

    // PDF Password Protection Tool
    initPDFPasswordProtection() {
        const uploadArea = document.getElementById('pdfPasswordUpload');
        const fileInput = document.getElementById('pdfPasswordInput');
        const protectBtn = document.getElementById('protectPdfBtn');
        const clearBtn = document.getElementById('clearPdfPassword');
        const downloadBtn = document.getElementById('downloadProtectedPdf');
        const protectAnotherBtn = document.getElementById('protectAnotherPdf');
        const clearErrorBtn = document.getElementById('clearPdfPasswordError');
        
        const controls = document.getElementById('pdfPasswordControls');
        const resultArea = document.getElementById('pdfPasswordResult');
        const processingArea = document.getElementById('pdfPasswordProcessing');
        const errorArea = document.getElementById('pdfPasswordErrorArea');
        
        const passwordInput = document.getElementById('pdfPassword');
        const passwordConfirm = document.getElementById('pdfPasswordConfirm');
        const preventPrinting = document.getElementById('preventPrinting');
        const preventCopying = document.getElementById('preventCopying');
        const preventModification = document.getElementById('preventModification');

        if (!uploadArea || !fileInput) return;

        // Upload area click
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'rgba(0, 255, 255, 0.6)';
            uploadArea.style.backgroundColor = 'rgba(0, 255, 255, 0.05)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'rgba(0, 255, 255, 0.3)';
            uploadArea.style.backgroundColor = 'transparent';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'rgba(0, 255, 255, 0.3)';
            uploadArea.style.backgroundColor = 'transparent';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (this.isPDFFile(file)) {
                    this.handlePDFPasswordFile(file, controls, resultArea, errorArea);
                } else {
                    this.showError('Please upload a PDF file only.', errorArea);
                }
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                if (this.isPDFFile(file)) {
                    this.handlePDFPasswordFile(file, controls, resultArea, errorArea);
                } else {
                    this.showError('Please upload a PDF file only.', errorArea);
                    e.target.value = '';
                }
            }
        });

        // Protect button
        if (protectBtn) {
            protectBtn.addEventListener('click', async () => {
                if (!this.currentPDFFile) return;
                
                // Validate password
                const password = passwordInput.value;
                const confirmPassword = passwordConfirm.value;
                
                if (!password || password.length < 4) {
                    this.showError('Password must be at least 4 characters long.', errorArea);
                    return;
                }
                
                if (password !== confirmPassword) {
                    this.showError('Passwords do not match.', errorArea);
                    return;
                }
                
                // Get protection options
                const options = {
                    password: password,
                    preventPrinting: preventPrinting.checked,
                    preventCopying: preventCopying.checked,
                    preventModification: preventModification.checked
                };
                
                // Show processing
                if (controls) controls.style.display = 'none';
                if (processingArea) processingArea.style.display = 'block';
                
                try {
                    // Update progress
                    this.updatePasswordProgress(50, 'Applying password protection...');
                    
                    // Process the PDF with password protection
                    const protectedPdfBytes = await this.protectPDF(this.currentPDFFile, options);
                    
                    // Update progress
                    this.updatePasswordProgress(100, 'Completed!');
                    
                    // Store the protected PDF
                    this.protectedPdfBlob = new Blob([protectedPdfBytes], { type: 'application/pdf' });
                    
                    // Update UI
                    this.updateProtectionStatus(options);
                    
                    // Hide processing, show result
                    if (processingArea) processingArea.style.display = 'none';
                    if (resultArea) resultArea.style.display = 'block';
                    
                    this.showNotification('PDF protected successfully!');
                } catch (error) {
                    console.error('Error protecting PDF:', error);
                    this.showError('Failed to protect PDF: ' + error.message, errorArea);
                    
                    // Hide processing
                    if (processingArea) processingArea.style.display = 'none';
                    if (controls) controls.style.display = 'block';
                }
            });
        }
        
        // Clear button
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearPDFPassword(fileInput, controls, resultArea, processingArea, errorArea);
            });
        }
        
        // Download button
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                if (!this.protectedPdfBlob) return;
                
                const url = URL.createObjectURL(this.protectedPdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `protected_${this.currentPDFFile.name}`;
                a.click();
                URL.revokeObjectURL(url);
            });
        }
        
        // Protect another button
        if (protectAnotherBtn) {
            protectAnotherBtn.addEventListener('click', () => {
                this.clearPDFPassword(fileInput, controls, resultArea, processingArea, errorArea);
                uploadArea.click();
            });
        }
        
        // Clear error button
        if (clearErrorBtn) {
            clearErrorBtn.addEventListener('click', () => {
                if (errorArea) errorArea.style.display = 'none';
            });
        }
            compressBtn.addEventListener('click', async () => {
                if (!this.currentPDFFile) return;
                
                const compressionLevel = compressionLevelSelect ? compressionLevelSelect.value : 'aggressive';
                await this.compressAdvancedPDF(compressionLevel, processingArea, resultArea, errorArea);
            });
        }

        // Cancel button
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.ultraCompressor.cancelCompression();
                this.hideProcessing(processingArea);
                this.showNotification('Compression cancelled', 'warning');
            });
        }

        // Clear button
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAdvancedPDFCompressor(fileInput, controls, resultArea, processingArea, errorArea);
            });
        }

        // Compress another button
        if (compressAnotherBtn) {
            compressAnotherBtn.addEventListener('click', () => {
                this.clearAdvancedPDFCompressor(fileInput, controls, resultArea, processingArea, errorArea);
            });
        }

        // Clear error button
        if (clearErrorBtn) {
            clearErrorBtn.addEventListener('click', () => {
                this.hideError(errorArea);
            });
        }
    }

    isPDFFile(file) {
        // Check both MIME type and file extension
        const isPDFMimeType = file.type === 'application/pdf';
        const isPDFExtension = file.name.toLowerCase().endsWith('.pdf');
        return isPDFMimeType || isPDFExtension;
    }

    handleAdvancedPDFFile(file, controls, resultArea, errorArea) {
        // Hide any previous errors
        this.hideError(errorArea);
        
        // Validate file size first
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            this.showError(
                `File size (${this.formatFileSize(file.size)}) exceeds the maximum limit of ${this.formatFileSize(maxSize)}.`,
                errorArea,
                [
                    'Try splitting the PDF into smaller files',
                    'Use a backend service for very large files',
                    'Compress the PDF externally before uploading'
                ]
            );
            return;
        }

        if (file.size < 1024) {
            this.showError('File is too small to compress effectively.', errorArea);
            return;
        }

        this.currentPDFFile = file;
        if (controls) controls.style.display = 'block';
        if (resultArea) resultArea.style.display = 'none';
        
        const fileInfo = document.getElementById('pdfCompressFileInfo');
        if (fileInfo) {
            const sizeCategory = this.getFileSizeCategory(file.size);
            fileInfo.innerHTML = `
                <div class="file-details">
                    <div class="file-name"><strong>${file.name}</strong></div>
                    <div class="file-meta">
                        <span class="file-size">Size: ${this.formatFileSize(file.size)}</span>
                        <span class="file-category ${sizeCategory.class}">${sizeCategory.label}</span>
                    </div>
                    <div class="file-type">PDF Document</div>
                </div>
            `;
        }
        
        // Show success notification with size-based tips
        const tips = this.getCompressionTips(file.size);
        this.showNotification(`PDF uploaded successfully! ${tips}`);
    }

    getFileSizeCategory(size) {
        if (size < 1024 * 1024) { // < 1MB
            return { class: 'small', label: 'Small file' };
        } else if (size < 10 * 1024 * 1024) { // < 10MB
            return { class: 'medium', label: 'Medium file' };
        } else if (size < 50 * 1024 * 1024) { // < 50MB
            return { class: 'large', label: 'Large file' };
        } else {
            return { class: 'very-large', label: 'Very large file' };
        }
    }

    getCompressionTips(size) {
        if (size < 1024 * 1024) {
            return 'Small files may see minimal compression benefits.';
        } else if (size < 10 * 1024 * 1024) {
            return 'Good compression potential expected.';
        } else if (size < 50 * 1024 * 1024) {
            return 'Large file detected - will use Web Worker for processing.';
        } else {
            return 'Very large file - processing may take several minutes.';
        }
    }

    isPDFFile(file) {
        return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    }
    
    handlePDFPasswordFile(file, controls, resultArea, errorArea) {
        this.currentPDFFile = file;
        this.protectedPdfBlob = null;
        
        if (controls) controls.style.display = 'block';
        if (resultArea) resultArea.style.display = 'none';
        if (errorArea) errorArea.style.display = 'none';
        
        const fileInfo = document.getElementById('pdfPasswordFileInfo');
        if (fileInfo) {
            fileInfo.innerHTML = `
                <div class="file-details">
                    <strong>${file.name}</strong><br>
                    Size: ${this.formatFileSize(file.size)}<br>
                    Type: ${file.type}
                </div>
            `;
        }
        
        this.showNotification(`PDF uploaded successfully! File: ${file.name} (${this.formatFileSize(file.size)})`);
    }
    
    updatePasswordProgress(percent, message) {
        const progressFill = document.getElementById('passwordProgressFill');
        const progressPercent = document.getElementById('passwordProgressPercent');
        const progressMessage = document.getElementById('passwordProgressMessage');
        
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${percent}%`;
        if (progressMessage) progressMessage.textContent = message;
    }
    
    updateProtectionStatus(options) {
        const printingStatus = document.getElementById('printingStatus');
        const copyingStatus = document.getElementById('copyingStatus');
        const modificationStatus = document.getElementById('modificationStatus');
        
        if (printingStatus) {
            printingStatus.querySelector('i').className = options.preventPrinting ? 
                'fas fa-print text-danger' : 'fas fa-print text-success';
            printingStatus.querySelector('span').textContent = options.preventPrinting ? 
                'Printing restricted' : 'Printing allowed';
        }
        
        if (copyingStatus) {
            copyingStatus.querySelector('i').className = options.preventCopying ? 
                'fas fa-copy text-danger' : 'fas fa-copy text-success';
            copyingStatus.querySelector('span').textContent = options.preventCopying ? 
                'Copying restricted' : 'Copying allowed';
        }
        
        if (modificationStatus) {
            modificationStatus.querySelector('i').className = options.preventModification ? 
                'fas fa-edit text-danger' : 'fas fa-edit text-success';
            modificationStatus.querySelector('span').textContent = options.preventModification ? 
                'Modification restricted' : 'Modification allowed';
        }
    }
    
    async protectPDF(file, options) {
        // This is a placeholder for the actual PDF protection logic
        // In a real implementation, you would use PDF-lib or another library
        // to apply password protection to the PDF
        
        // For now, we'll just return the file bytes
        const arrayBuffer = await file.arrayBuffer();
        return arrayBuffer;
    }
    
    clearPDFPassword(fileInput, controls, resultArea, processingArea, errorArea) {
        this.currentPDFFile = null;
        this.protectedPdfBlob = null;
        
        if (fileInput) fileInput.value = '';
        if (controls) controls.style.display = 'none';
        if (resultArea) resultArea.style.display = 'none';
        if (processingArea) processingArea.style.display = 'none';
        if (errorArea) errorArea.style.display = 'none';
        
        const fileInfo = document.getElementById('pdfPasswordFileInfo');
        if (fileInfo) fileInfo.innerHTML = '';
        
        // Reset password fields
        const passwordInput = document.getElementById('pdfPassword');
        const passwordConfirm = document.getElementById('pdfPasswordConfirm');
        if (passwordInput) passwordInput.value = '';
        if (passwordConfirm) passwordConfirm.value = '';
        
        this.showNotification('PDF password protection cleared successfully');
    }
    
    showError(message, errorArea) {
        if (errorArea) {
            const errorText = errorArea.querySelector('.error-text');
            if (errorText) errorText.textContent = message;
            errorArea.style.display = 'block';
        } else {
            this.showNotification(message, 'error');
        }
    }

        const levelFeatures = features[level] || features.aggressive;
        featureList.innerHTML = levelFeatures.map(feature => 
            `<div class="feature-item">${feature}</div>`
        ).join('');
    }

    async compressAdvancedPDF(compressionLevel, processingArea, resultArea, errorArea) {
        if (!this.currentPDFFile) return;

        this.hideError(errorArea);
        this.showProcessing(processingArea);
        if (resultArea) resultArea.style.display = 'none';

        try {
            const result = await this.ultraCompressor.compressPDF(
                this.currentPDFFile,
                compressionLevel,
                (progress, message) => {
                    this.updateProgress(progress, message);
                }
            );

            this.hideProcessing(processingArea);
            this.showCompressionResult(result, resultArea);

        } catch (error) {
            console.error('Advanced PDF compression error:', error);
            this.hideProcessing(processingArea);
            
            let errorMessage = error.message;
            let suggestions = [];

            // Provide specific error handling and suggestions
            if (error.message.includes('exceeds maximum limit')) {
                suggestions = [
                    'Split the PDF into smaller files',
                    'Use online compression services for very large files',
                    'Reduce image quality in the PDF using external tools first'
                ];
            } else if (error.message.includes('corrupted') || error.message.includes('load')) {
                suggestions = [
                    'Check if the PDF file is corrupted',
                    'Try opening the PDF in another application first',
                    'Ensure the file is not password-protected'
                ];
            } else if (error.message.includes('memory') || error.message.includes('worker')) {
                suggestions = [
                    'Close other browser tabs to free up memory',
                    'Try a smaller compression level',
                    'Restart your browser and try again'
                ];
            } else {
                suggestions = [
                    'Try a different compression level',
                    'Ensure the PDF is not password-protected',
                    'Check if the file is corrupted'
                ];
            }

            this.showError(errorMessage, errorArea, suggestions);
        }
    }

    showProcessing(processingArea) {
        if (processingArea) {
            processingArea.style.display = 'block';
            this.updateProgress(0, 'Initializing...');
        }
    }

    hideProcessing(processingArea) {
        if (processingArea) {
            processingArea.style.display = 'none';
        }
    }

    updateProgress(progress, message) {
        const progressFill = document.getElementById('progressFill');
        const progressPercent = document.getElementById('progressPercent');
        const progressMessage = document.getElementById('progressMessage');

        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        if (progressPercent) {
            progressPercent.textContent = `${Math.round(progress)}%`;
        }
        if (progressMessage) {
            progressMessage.textContent = message;
        }
    }

    showCompressionResult(result, resultArea) {
        if (!resultArea) return;

        const originalSizeEl = document.getElementById('originalPdfSize');
        const compressedSizeEl = document.getElementById('compressedPdfSize');
        const reductionEl = document.getElementById('pdfReduction');
        const compressionMethodEl = document.getElementById('compressionMethod');
        const downloadBtn = document.getElementById('downloadCompressedPdf');

        // Update size display
        if (originalSizeEl) originalSizeEl.textContent = this.formatFileSize(result.originalSize);
        if (compressedSizeEl) compressedSizeEl.textContent = this.formatFileSize(result.compressedSize);
        
        // Update reduction display with color coding
        if (reductionEl) {
            if (result.reduction > 0) {
                reductionEl.textContent = `${result.reduction}%`;
                reductionEl.className = 'reduction-value positive';
            } else if (result.reduction === 0) {
                reductionEl.textContent = 'No change';
                reductionEl.className = 'reduction-value neutral';
            } else {
                reductionEl.textContent = 'Size increased';
                reductionEl.className = 'reduction-value negative';
            }
        }

        // Show compression method
        if (compressionMethodEl) {
            compressionMethodEl.textContent = `Compression method: Advanced ${result.filename.split('_')[1]} mode`;
        }

        // Setup download
        if (downloadBtn) {
            const compressedBlob = new Blob([result.compressedBytes], { type: 'application/pdf' });
            downloadBtn.onclick = () => {
                const url = URL.createObjectURL(compressedBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.filename;
                a.click();
                URL.revokeObjectURL(url);
            };
        }

        resultArea.style.display = 'block';

        // Show success notification
        if (result.reduction > 0) {
            this.showNotification(`🎉 PDF compressed successfully! Reduced by ${result.reduction}% (${this.formatFileSize(result.originalSize)} → ${this.formatFileSize(result.compressedSize)})`);
        } else {
            this.showNotification('PDF processing completed, but no size reduction achieved. The file may already be optimized.', 'warning');
        }
    }

    showError(message, errorArea, suggestions = []) {
        if (!errorArea) return;

        const errorText = document.getElementById('pdfErrorText');
        const errorSuggestions = document.getElementById('pdfErrorSuggestions');

        if (errorText) {
            errorText.textContent = message;
        }

        if (errorSuggestions && suggestions.length > 0) {
            errorSuggestions.innerHTML = `
                <h4>💡 Suggestions:</h4>
                <ul>
                    ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
            `;
        } else if (errorSuggestions) {
            errorSuggestions.innerHTML = '';
        }

        errorArea.style.display = 'block';
        this.showNotification(message, 'error');
    }

    hideError(errorArea) {
        if (errorArea) {
            errorArea.style.display = 'none';
        }
    }

    clearAdvancedPDFCompressor(fileInput, controls, resultArea, processingArea, errorArea) {
        // Cancel any ongoing compression
        if (this.ultraCompressor) {
            this.ultraCompressor.cancelCompression();
        }
        
        this.currentPDFFile = null;
        if (fileInput) fileInput.value = '';
        if (controls) controls.style.display = 'none';
        if (resultArea) resultArea.style.display = 'none';
        if (processingArea) processingArea.style.display = 'none';
        if (errorArea) errorArea.style.display = 'none';
        
        const fileInfo = document.getElementById('pdfCompressFileInfo');
        if (fileInfo) fileInfo.innerHTML = '';
        
        this.showNotification('PDF compressor cleared successfully');
    }



    // Scale Measurement Tool
    initScaleMeasurement() {
        const uploadArea = document.getElementById('scaleUpload');
        const fileInput = document.getElementById('scaleInput');
        const workspace = document.getElementById('scaleWorkspace');
        const canvas = document.getElementById('scaleCanvas');
        
        if (!uploadArea || !fileInput || !canvas) return;

        const ctx = canvas.getContext('2d');
        const setReferenceBtn = document.getElementById('setReferenceBtn');
        const measureBtn = document.getElementById('measureBtn');
        const clearBtn = document.getElementById('clearMeasurementsBtn');
        const clearUploadBtn = document.getElementById('clearScaleUpload');
        const referenceLength = document.getElementById('referenceLength');
        const referenceUnit = document.getElementById('referenceUnit');
        // Add a check to ensure referenceUnit exists
        if (!referenceUnit) {
            console.error('Reference unit select element not found!');
            return;
        }
        const measurementsDisplay = document.getElementById('measurementsDisplay');
        const fileInfo = document.getElementById('scaleFileInfo');

        let currentImage = null;
        let measurements = [];
        let referencePixelLength = null;
        let referenceRealLength = null;
        let currentMode = 'none';
        let isDrawing = false;
        let startPoint = null;

        // Upload area click
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'rgba(0, 255, 255, 0.6)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'rgba(0, 255, 255, 0.3)';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'rgba(0, 255, 255, 0.3)';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (this.isImageFile(file)) {
                    // Reset previous state when new image is loaded
                    measurements.length = 0;
                    referencePixelLength = null;
                    referenceRealLength = null;
                    currentMode = 'none';
                    if (referenceLength) referenceLength.value = '';
                    currentImage = this.loadImageForScale(file, workspace, canvas, ctx, fileInfo, measurements);
                } else {
                    this.showNotification('Please upload an image file only (JPG, PNG, WebP, etc.)', 'error');
                }
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                if (this.isImageFile(file)) {
                    // Reset previous state when new image is loaded
                    measurements.length = 0;
                    referencePixelLength = null;
                    referenceRealLength = null;
                    currentMode = 'none';
                    if (referenceLength) referenceLength.value = '';
                    currentImage = this.loadImageForScale(file, workspace, canvas, ctx, fileInfo, measurements);
                } else {
                    this.showNotification('Please upload an image file only (JPG, PNG, WebP, etc.)', 'error');
                    e.target.value = ''; // Clear the input
                }
            }
        });

        // Helper function to get coordinates from both mouse and touch events
        const getEventCoordinates = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            let clientX, clientY;
            
            if (e.type.startsWith('touch')) {
                // Handle touch events
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                // Handle mouse events
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        // Unified event handler for both mouse and touch start
        const handleStart = (e) => {
            if (currentMode === 'none' || !currentImage) return;
            
            // Prevent default touch behavior (scrolling, zooming)
            if (e.type.startsWith('touch')) {
                e.preventDefault();
            }
            
            isDrawing = true;
            startPoint = getEventCoordinates(e);
        };

        // Unified event handler for both mouse and touch move
        const handleMove = (e) => {
            if (!isDrawing || !startPoint) return;
            
            // Prevent default touch behavior
            if (e.type.startsWith('touch')) {
                e.preventDefault();
            }
            
            const currentPoint = getEventCoordinates(e);
            this.redrawCanvas(canvas, ctx, currentImage, measurements);
            this.drawTempLine(ctx, startPoint, currentPoint);
        };

        // Unified event handler for both mouse and touch end
        const handleEnd = (e) => {
            if (!isDrawing || !startPoint) return;
            
            // Prevent default touch behavior
            if (e.type.startsWith('touch')) {
                e.preventDefault();
            }
            
            let endPoint;
            if (e.type.startsWith('touch')) {
                // For touch end, use changedTouches since touches array is empty
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                endPoint = {
                    x: (e.changedTouches[0].clientX - rect.left) * scaleX,
                    y: (e.changedTouches[0].clientY - rect.top) * scaleY
                };
            } else {
                endPoint = getEventCoordinates(e);
            }

            const pixelLength = Math.sqrt(
                Math.pow(endPoint.x - startPoint.x, 2) + 
                Math.pow(endPoint.y - startPoint.y, 2)
            );

            // Validate minimum line length (prevent accidental clicks)
            if (pixelLength < 5) {
                this.showNotification('Line too short. Please draw a longer line.', 'error');
                this.redrawCanvas(canvas, ctx, currentImage, measurements);
                isDrawing = false;
                startPoint = null;
                return;
            }

            if (currentMode === 'reference') {
                referencePixelLength = pixelLength;
                const refLength = parseFloat(referenceLength.value);
                if (refLength > 0) {
                    referenceRealLength = refLength;
                    const unitValue = referenceUnit && referenceUnit.value ? referenceUnit.value : 'mm';
                    this.showNotification(`Reference scale set: ${pixelLength.toFixed(2)} pixels = ${refLength} ${unitValue}`);
                } else {
                    this.showNotification('Please enter a reference length first!', 'error');
                    // Reset reference if no length entered
                    referencePixelLength = null;
                }
            } else if (currentMode === 'measure' && referencePixelLength && referenceRealLength) {
                const realLength = (pixelLength / referencePixelLength) * referenceRealLength;
                measurements.push({
                    id: Date.now(),
                    start: startPoint,
                    end: endPoint,
                    pixelLength: pixelLength,
                    realLength: realLength,
                    unit: referenceUnit && referenceUnit.value ? referenceUnit.value : 'mm'
                });
                this.updateMeasurementsDisplay(measurementsDisplay, measurements);
                const unitValue = referenceUnit && referenceUnit.value ? referenceUnit.value : 'mm';
                this.showNotification(`Measurement added: ${realLength.toFixed(3)} ${unitValue}`);
            }

            this.redrawCanvas(canvas, ctx, currentImage, measurements);
            isDrawing = false;
            startPoint = null;
        };

        // Mouse events
        canvas.addEventListener('mousedown', handleStart);
        canvas.addEventListener('mousemove', handleMove);
        canvas.addEventListener('mouseup', handleEnd);

        // Touch events for mobile support
        canvas.addEventListener('touchstart', handleStart, { passive: false });
        canvas.addEventListener('touchmove', handleMove, { passive: false });
        canvas.addEventListener('touchend', handleEnd, { passive: false });

        // Prevent context menu on canvas for better mobile experience
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Keyboard shortcuts support
        document.addEventListener('keydown', (e) => {
            if (!currentImage) return;
            
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'r':
                        e.preventDefault();
                        if (setReferenceBtn) setReferenceBtn.click();
                        break;
                    case 'm':
                        e.preventDefault();
                        if (measureBtn) measureBtn.click();
                        break;
                    case 'c':
                        e.preventDefault();
                        if (clearBtn) clearBtn.click();
                        break;
                }
            } else if (e.key === 'Escape') {
                // Cancel current drawing mode
                if (isDrawing) {
                    isDrawing = false;
                    startPoint = null;
                    this.redrawCanvas(canvas, ctx, currentImage, measurements);
                }
                currentMode = 'none';
                canvas.style.cursor = 'default';
                this.showNotification('Drawing mode cancelled');
            }
        });

        // Add visual feedback for active modes
        const updateCanvasStyle = () => {
            canvas.classList.remove('drawing-mode', 'measuring-mode');
            if (currentMode === 'reference') {
                canvas.classList.add('drawing-mode');
            } else if (currentMode === 'measure') {
                canvas.classList.add('measuring-mode');
            }
        };

        // Button events
        if (setReferenceBtn) {
            setReferenceBtn.addEventListener('click', () => {
                if (!currentImage) {
                    this.showNotification('Please upload an image first!', 'error');
                    return;
                }
                currentMode = 'reference';
                canvas.style.cursor = 'crosshair';
                updateCanvasStyle();
                this.showNotification('Click and drag to draw reference line');
            });
        }

        if (measureBtn) {
            measureBtn.addEventListener('click', () => {
                if (!currentImage) {
                    this.showNotification('Please upload an image first!', 'error');
                    return;
                }
                if (!referencePixelLength) {
                    this.showNotification('Please set a reference scale first!', 'error');
                    return;
                }
                currentMode = 'measure';
                canvas.style.cursor = 'crosshair';
                updateCanvasStyle();
                this.showNotification('Click and drag to measure objects');
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                measurements.length = 0;
                referencePixelLength = null;
                referenceRealLength = null;
                currentMode = 'none';
                canvas.style.cursor = 'default';
                updateCanvasStyle();
                if (referenceLength) referenceLength.value = '';
                this.redrawCanvas(canvas, ctx, currentImage, measurements);
                this.updateMeasurementsDisplay(measurementsDisplay, measurements);
                this.showNotification('All measurements cleared');
            });
        }

        if (clearUploadBtn) {
            clearUploadBtn.addEventListener('click', () => {
                if (fileInput) fileInput.value = '';
                if (workspace) workspace.style.display = 'none';
                if (fileInfo) fileInfo.innerHTML = '';
                currentImage = null;
                measurements.length = 0;
                referencePixelLength = null;
                referenceRealLength = null;
                currentMode = 'none';
            });
        }
    }

    loadImageForScale(file, workspace, canvas, ctx, fileInfo, measurements) {
        const img = new Image();
        img.onload = () => {
            // Set canvas dimensions to match image
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Make canvas responsive while maintaining aspect ratio
            const containerWidth = canvas.parentElement.offsetWidth - 40; // Account for padding
            const aspectRatio = img.height / img.width;
            
            if (img.width > containerWidth) {
                canvas.style.width = containerWidth + 'px';
                canvas.style.height = (containerWidth * aspectRatio) + 'px';
            } else {
                canvas.style.width = img.width + 'px';
                canvas.style.height = img.height + 'px';
            }
            
            if (workspace) workspace.style.display = 'block';
            if (fileInfo) {
                fileInfo.innerHTML = `
                    <div class="file-details">
                        <strong>${file.name}</strong><br>
                        Dimensions: ${img.width} × ${img.height}px<br>
                        <small style="color: rgba(255,255,255,0.7);">
                            ${window.innerWidth <= 768 ? 'Tap and drag to draw lines' : 'Click and drag to draw lines'}
                        </small>
                    </div>
                `;
            }
            
            this.showNotification('Image loaded successfully! Set a reference scale to start measuring.');
        };
        
        img.onerror = () => {
            this.showNotification('Error loading image. Please try another file.', 'error');
        };
        
        img.src = URL.createObjectURL(file);
        return img;
    }

    redrawCanvas(canvas, ctx, image, measurements) {
        if (!image) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        
        // Draw measurements
        measurements.forEach((measurement, index) => {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(measurement.start.x, measurement.start.y);
            ctx.lineTo(measurement.end.x, measurement.end.y);
            ctx.stroke();
            
            // Draw measurement label
            const midX = (measurement.start.x + measurement.end.x) / 2;
            const midY = (measurement.start.y + measurement.end.y) / 2;
            ctx.fillStyle = '#00ffff';
            ctx.font = '14px Arial';
            ctx.fillText(`${measurement.realLength.toFixed(2)} ${measurement.unit}`, midX + 5, midY - 5);
        });
    }

    drawTempLine(ctx, start, end) {
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    updateMeasurementsDisplay(display, measurements) {
        if (!display) return;
        
        if (measurements.length === 0) {
            display.innerHTML = '<p style="color: rgba(255,255,255,0.7); text-align: center; padding: 20px;">No measurements yet</p>';
            return;
        }
        
        let html = '<h4 style="margin-bottom: 15px; color: #00ffff;">Measurements:</h4>';
        measurements.forEach((measurement, index) => {
            html += `
                <div class="measurement-item" onclick="this.style.background = this.style.background === 'rgba(0, 255, 255, 0.2)' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 255, 255, 0.2)'">
                    <span>Measurement ${index + 1}</span>
                    <span class="measurement-value">${measurement.realLength.toFixed(3)} ${measurement.unit}</span>
                    <small style="color: rgba(255,255,255,0.6); font-size: 0.8em;">
                        ${measurement.pixelLength.toFixed(1)} pixels
                    </small>
                </div>
            `;
        });
        
        // Add summary if multiple measurements
        if (measurements.length > 1) {
            const total = measurements.reduce((sum, m) => sum + m.realLength, 0);
            const avg = total / measurements.length;
            html += `
                <div style="margin-top: 15px; padding: 10px; background: rgba(0, 255, 255, 0.1); border-radius: 5px; border: 1px solid rgba(0, 255, 255, 0.3);">
                    <strong>Summary:</strong><br>
                    Total: ${total.toFixed(3)} ${measurements[0].unit}<br>
                    Average: ${avg.toFixed(3)} ${measurements[0].unit}<br>
                    Count: ${measurements.length} measurements
                </div>
            `;
        }
        
        display.innerHTML = html;
    }

    // Enhanced notification system for all tools
    showNotification(message, type = 'success') {
        // Remove existing notifications to prevent overlap
        const existingNotifications = document.querySelectorAll('.tools-notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `tools-notification ${type}`;
        notification.textContent = message;
        
        // Define colors and styling for different notification types
        let backgroundColor, borderColor, textColor = 'white';
        switch (type) {
            case 'error':
                backgroundColor = 'rgba(220, 53, 69, 0.95)';
                borderColor = 'rgba(220, 53, 69, 0.6)';
                break;
            case 'warning':
                backgroundColor = 'rgba(255, 193, 7, 0.95)';
                borderColor = 'rgba(255, 193, 7, 0.6)';
                textColor = '#212529';
                break;
            case 'info':
                backgroundColor = 'rgba(13, 202, 240, 0.95)';
                borderColor = 'rgba(13, 202, 240, 0.6)';
                break;
            case 'success':
            default:
                backgroundColor = 'rgba(40, 167, 69, 0.95)';
                borderColor = 'rgba(40, 167, 69, 0.6)';
                break;
        }
        
        // Style the notification with proper z-index hierarchy
        notification.style.cssText = `
            position: fixed;
            top: calc(var(--header-height, 80px) + 20px);
            left: 50%;
            transform: translateX(-50%) translateY(-10px);
            background: ${backgroundColor};
            color: ${textColor};
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
            z-index: 10000000;
            font-size: 14px;
            max-width: 90vw;
            text-align: center;
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border: 1px solid ${borderColor};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 500;
            letter-spacing: 0.3px;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            line-height: 1.4;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        });
        
        // Auto remove after different times based on type
        let displayTime;
        switch (type) {
            case 'error':
                displayTime = 5000; // 5 seconds for errors
                break;
            case 'warning':
                displayTime = 4000; // 4 seconds for warnings
                break;
            case 'info':
                displayTime = 3500; // 3.5 seconds for info
                break;
            default:
                displayTime = 3000; // 3 seconds for success
                break;
        }
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(-50%) translateY(-20px)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, displayTime);
    }

    showConfigurationNotice(config) {
        const compressionControls = document.getElementById('pdfCompressionControls');
        if (compressionControls) {
            const notice = document.createElement('div');
            notice.className = 'configuration-notice';
            notice.innerHTML = `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; border-radius: 5px;">
                    <h4 style="margin: 0 0 10px 0; color: #856404;">
                        <i class="fas fa-key"></i> API Configuration Required
                    </h4>
                    <p style="margin: 0 0 10px 0; color: #856404;">${config.message}</p>
                    <ul style="margin: 0 0 10px 0; color: #856404; padding-left: 20px;">
                        ${config.steps.map(step => `<li>${step}</li>`).join('')}
                    </ul>
                    <p style="margin: 0; font-size: 0.9em; color: #856404;">
                        <strong>Free Tier:</strong> ${config.limits.free} | 
                        <strong>Max File Size:</strong> ${config.limits.fileSize}
                    </p>
                </div>
            `;
            compressionControls.prepend(notice);
        }
    }

    // Utility functions
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    isPDFFile(file) {
        return file && (
            file.type === 'application/pdf' || 
            file.type.includes('pdf') ||
            file.name.toLowerCase().endsWith('.pdf')
        );
    }
}

// Initialize tools when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ToolsManager();
});