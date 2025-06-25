/* Tools JavaScript - Client-side utilities */
class ToolsManager {
    constructor() {
        this.currentImageFile = null;
        this.currentPDFFile = null;
        this.initializeTools();
    }

    initializeTools() {
        this.initImageCompressor();
        this.initPDFCompressor();
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
                    alert('Please upload an image file only (JPG, PNG, WebP, etc.).');
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
                    alert('Please upload an image file only (JPG, PNG, WebP, etc.).');
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
    }

    async compressImage(quality, resultArea) {
        if (!this.currentImageFile) return;

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
                }, 'image/jpeg', quality);
            };

            img.src = URL.createObjectURL(this.currentImageFile);
        } catch (error) {
            console.error('Error compressing image:', error);
            alert('Error compressing image. Please try again.');
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
    }

    // PDF Compression Tool
    initPDFCompressor() {
        const uploadArea = document.getElementById('pdfCompressUpload');
        const fileInput = document.getElementById('pdfCompressInput');
        const compressBtn = document.getElementById('compressPdfBtn');
        const clearBtn = document.getElementById('clearPdfCompress');
        const controls = document.getElementById('pdfCompressionControls');
        const resultArea = document.getElementById('pdfCompressResult');

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
                if (this.isPDFFile(file)) {
                    this.handlePDFFile(file, controls, resultArea);
                } else {
                    alert('Please upload a PDF file only.');
                }
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                if (this.isPDFFile(file)) {
                    this.handlePDFFile(file, controls, resultArea);
                } else {
                    alert('Please upload a PDF file only.');
                    e.target.value = ''; // Clear the input
                }
            }
        });

        // Compress button
        if (compressBtn) {
            compressBtn.addEventListener('click', () => {
                const qualitySelect = document.getElementById('pdfQuality');
                const quality = qualitySelect ? parseFloat(qualitySelect.value) : 0.5;
                const processingArea = document.getElementById('pdfProcessing');
                this.compressPDF(quality, resultArea, processingArea);
            });
        }

        // Clear button
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearPDFCompressor(fileInput, controls, resultArea);
            });
        }
    }

    isPDFFile(file) {
        // Check both MIME type and file extension
        const isPDFMimeType = file.type === 'application/pdf';
        const isPDFExtension = file.name.toLowerCase().endsWith('.pdf');
        return isPDFMimeType || isPDFExtension;
    }

    handlePDFFile(file, controls, resultArea) {
        console.log('PDF file selected:', file.name, file.size, file.type);
        this.currentPDFFile = file;
        if (controls) controls.style.display = 'block';
        if (resultArea) resultArea.style.display = 'none';
        
        const fileInfo = document.getElementById('pdfCompressFileInfo');
        if (fileInfo) {
            fileInfo.innerHTML = `
                <div class="file-details">
                    <strong>${file.name}</strong><br>
                    Size: ${this.formatFileSize(file.size)}<br>
                    Type: PDF Document
                </div>
            `;
        }
    }

    async compressPDF(quality, resultArea, processingArea) {
        if (!this.currentPDFFile) return;

        // Show processing indicator
        if (processingArea) processingArea.style.display = 'block';
        if (resultArea) resultArea.style.display = 'none';

        const originalSizeEl = document.getElementById('originalPdfSize');
        const compressedSizeEl = document.getElementById('compressedPdfSize');
        const reductionEl = document.getElementById('pdfReduction');
        const downloadBtn = document.getElementById('downloadCompressedPdf');

        try {
            // Read the PDF file
            const arrayBuffer = await this.currentPDFFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

            console.log(`Starting PDF compression with ${Math.round(quality * 100)}% quality...`);

            // Get compression settings
            const compressionSettings = this.getSimpleCompressionSettings(quality);
            
            // Remove metadata based on quality level
            if (quality <= 0.5) {
                pdfDoc.setTitle('');
                pdfDoc.setAuthor('');
                pdfDoc.setSubject('');
                pdfDoc.setCreator('');
                pdfDoc.setProducer('');
                pdfDoc.setKeywords([]);
            }

            // Save with quality-based compression settings
            const compressedPdfBytes = await pdfDoc.save({
                useObjectStreams: compressionSettings.useObjectStreams,
                addDefaultPage: false,
                objectsPerTick: compressionSettings.objectsPerTick,
                updateFieldAppearances: false
            });

            const originalSize = this.currentPDFFile.size;
            const compressedSize = compressedPdfBytes.length;

            // If compression made it larger, try alternative approach
            let finalBytes = compressedPdfBytes;
            let finalSize = compressedSize;

            if (compressedSize >= originalSize) {
                console.log('Initial compression increased size, trying minimal approach...');
                
                // Try minimal compression
                const minimalBytes = await pdfDoc.save({
                    useObjectStreams: true,
                    addDefaultPage: false,
                    objectsPerTick: 50,
                    updateFieldAppearances: false
                });

                if (minimalBytes.length < originalSize) {
                    finalBytes = minimalBytes;
                    finalSize = minimalBytes.length;
                } else {
                    // If still larger, use original approach but show warning
                    finalBytes = compressedPdfBytes;
                    finalSize = compressedSize;
                }
            }

            const actualReduction = Math.round(((originalSize - finalSize) / originalSize) * 100);

            console.log(`Compression result: ${this.formatFileSize(originalSize)} → ${this.formatFileSize(finalSize)} (${actualReduction}%)`);

            // Update UI
            if (originalSizeEl) originalSizeEl.textContent = this.formatFileSize(originalSize);
            if (compressedSizeEl) compressedSizeEl.textContent = this.formatFileSize(finalSize);
            if (reductionEl) {
                if (actualReduction > 0) {
                    reductionEl.textContent = `${actualReduction}%`;
                    reductionEl.style.color = '#4CAF50';
                } else if (actualReduction === 0) {
                    reductionEl.textContent = 'No change';
                    reductionEl.style.color = '#ff9800';
                } else {
                    reductionEl.textContent = 'Size increased';
                    reductionEl.style.color = '#f44336';
                }
            }

            // Create download functionality
            const compressedBlob = new Blob([finalBytes], { type: 'application/pdf' });
            
            if (downloadBtn) {
                downloadBtn.onclick = () => {
                    const url = URL.createObjectURL(compressedBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `compressed_${Math.round(quality * 100)}%_${this.currentPDFFile.name}`;
                    a.click();
                    URL.revokeObjectURL(url);
                };
            }

            // Hide processing and show results
            if (processingArea) processingArea.style.display = 'none';
            if (resultArea) resultArea.style.display = 'block';

        } catch (error) {
            console.error('Error compressing PDF:', error);
            
            // Hide processing indicator
            if (processingArea) processingArea.style.display = 'none';
            
            // Reset UI on error
            if (originalSizeEl) originalSizeEl.textContent = this.formatFileSize(this.currentPDFFile.size);
            if (compressedSizeEl) compressedSizeEl.textContent = 'Error';
            if (reductionEl) reductionEl.textContent = 'Error';
            
            alert('Error compressing PDF. The file might be corrupted or password-protected.');
        }
    }

    getSimpleCompressionSettings(quality) {
        // Simple, working compression settings for PDF-lib
        switch (quality) {
            case 0.7: // High quality - 70%
                return {
                    useObjectStreams: true,
                    objectsPerTick: 50
                };
            case 0.5: // Medium quality - 50%
                return {
                    useObjectStreams: true,
                    objectsPerTick: 200
                };
            case 0.3: // Low quality - 30%
                return {
                    useObjectStreams: true,
                    objectsPerTick: 1000
                };
            default:
                return {
                    useObjectStreams: true,
                    objectsPerTick: 100
                };
        }
    }

    clearPDFCompressor(fileInput, controls, resultArea) {
        this.currentPDFFile = null;
        if (fileInput) fileInput.value = '';
        if (controls) controls.style.display = 'none';
        if (resultArea) resultArea.style.display = 'none';
        
        const processingArea = document.getElementById('pdfProcessing');
        if (processingArea) processingArea.style.display = 'none';
        
        const fileInfo = document.getElementById('pdfCompressFileInfo');
        if (fileInfo) fileInfo.innerHTML = '';
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
        const measurementsDisplay = document.getElementById('measurementsDisplay');
        const fileInfo = document.getElementById('scaleFileInfo');

        let currentImage = null;
        let measurements = [];
        let referenceLine = null; // Store reference line for redrawing
        let referencePixelLength = null;
        let referenceRealLength = null;
        let currentMode = 'none';
        let isDrawing = false;
        let startPoint = null;

        // Helper function to get correct canvas coordinates
        const getCanvasCoordinates = (e, canvas) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            let clientX, clientY;
            
            // Handle both mouse and touch events
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else if (e.changedTouches && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

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
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                // Reset all measurements when new image is loaded
                measurements.length = 0;
                referenceLine = null;
                referencePixelLength = null;
                referenceRealLength = null;
                currentMode = 'none';
                if (referenceLength) referenceLength.value = '';
                currentImage = this.loadImageForScale(files[0], workspace, canvas, ctx, fileInfo, measurements);
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                // Reset all measurements when new image is loaded
                measurements.length = 0;
                referenceLine = null;
                referencePixelLength = null;
                referenceRealLength = null;
                currentMode = 'none';
                if (referenceLength) referenceLength.value = '';
                currentImage = this.loadImageForScale(e.target.files[0], workspace, canvas, ctx, fileInfo, measurements);
            }
        });

        // Unified start event handler (mouse and touch)
        const handleStart = (e) => {
            if (currentMode === 'none' || !currentImage) return;
            
            e.preventDefault(); // Prevent default touch behavior
            isDrawing = true;
            startPoint = getCanvasCoordinates(e, canvas);
        };

        // Unified move event handler (mouse and touch)
        const handleMove = (e) => {
            if (!isDrawing || !startPoint) return;
            
            e.preventDefault(); // Prevent scrolling on touch
            const currentPoint = getCanvasCoordinates(e, canvas);

            this.redrawCanvas(canvas, ctx, currentImage, measurements, referenceLine);
            this.drawTempLine(ctx, startPoint, currentPoint);
        };

        // Unified end event handler (mouse and touch)
        const handleEnd = (e) => {
            if (!isDrawing || !startPoint) return;
            
            e.preventDefault();
            const endPoint = getCanvasCoordinates(e, canvas);

            const pixelLength = Math.sqrt(
                Math.pow(endPoint.x - startPoint.x, 2) + 
                Math.pow(endPoint.y - startPoint.y, 2)
            );

            if (currentMode === 'reference') {
                referencePixelLength = pixelLength;
                const refLength = parseFloat(referenceLength.value);
                if (refLength > 0) {
                    referenceRealLength = refLength;
                    // Store reference line for redrawing
                    referenceLine = {
                        start: startPoint,
                        end: endPoint,
                        pixelLength: pixelLength,
                        realLength: refLength,
                        unit: referenceUnit.value
                    };
                    alert(`Reference scale set: ${pixelLength.toFixed(2)} pixels = ${refLength} ${referenceUnit.value}`);
                } else {
                    alert('Please enter a reference length first!');
                }
            } else if (currentMode === 'measure' && referencePixelLength && referenceRealLength) {
                const realLength = (pixelLength / referencePixelLength) * referenceRealLength;
                measurements.push({
                    id: Date.now(),
                    start: startPoint,
                    end: endPoint,
                    pixelLength: pixelLength,
                    realLength: realLength,
                    unit: referenceUnit.value
                });
                this.updateMeasurementsDisplay(measurementsDisplay, measurements);
            }

            this.redrawCanvas(canvas, ctx, currentImage, measurements, referenceLine);
            isDrawing = false;
            startPoint = null;
            currentMode = 'none'; // Reset mode after drawing
            canvas.style.cursor = 'default';
            canvas.classList.remove('drawing-mode', 'measuring-mode');
            
            // Reset button visual feedback
            if (setReferenceBtn) setReferenceBtn.style.background = '';
            if (measureBtn) measureBtn.style.background = '';
        };

        // Mouse events
        canvas.addEventListener('mousedown', handleStart);
        canvas.addEventListener('mousemove', handleMove);
        canvas.addEventListener('mouseup', handleEnd);

        // Touch events for mobile support
        canvas.addEventListener('touchstart', handleStart, { passive: false });
        canvas.addEventListener('touchmove', handleMove, { passive: false });
        canvas.addEventListener('touchend', handleEnd, { passive: false });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Only work when canvas is focused or workspace is visible
            if (!workspace || workspace.style.display === 'none') return;
            
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
                e.preventDefault();
                currentMode = 'none';
                canvas.style.cursor = 'default';
                canvas.classList.remove('drawing-mode', 'measuring-mode');
                isDrawing = false;
                startPoint = null;
                
                // Reset button visual feedback
                if (setReferenceBtn) setReferenceBtn.style.background = '';
                if (measureBtn) measureBtn.style.background = '';
            }
        });

        // Button events
        if (setReferenceBtn) {
            setReferenceBtn.addEventListener('click', () => {
                if (!currentImage) {
                    alert('Please upload an image first!');
                    return;
                }
                currentMode = 'reference';
                canvas.style.cursor = 'crosshair';
                canvas.classList.add('drawing-mode');
                canvas.classList.remove('measuring-mode');
                
                // Visual feedback
                setReferenceBtn.style.background = 'rgba(255, 149, 0, 0.3)';
                if (measureBtn) measureBtn.style.background = '';
            });
        }

        if (measureBtn) {
            measureBtn.addEventListener('click', () => {
                if (!currentImage) {
                    alert('Please upload an image first!');
                    return;
                }
                if (!referencePixelLength) {
                    alert('Please set a reference scale first!');
                    return;
                }
                currentMode = 'measure';
                canvas.style.cursor = 'crosshair';
                canvas.classList.add('measuring-mode');
                canvas.classList.remove('drawing-mode');
                
                // Visual feedback
                if (measureBtn) measureBtn.style.background = 'rgba(0, 255, 255, 0.3)';
                if (setReferenceBtn) setReferenceBtn.style.background = '';
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                measurements.length = 0;
                referenceLine = null; // Clear reference line
                referencePixelLength = null;
                referenceRealLength = null;
                currentMode = 'none';
                canvas.style.cursor = 'default';
                canvas.classList.remove('drawing-mode', 'measuring-mode');
                if (referenceLength) referenceLength.value = '';
                
                // Reset button visual feedback
                if (setReferenceBtn) setReferenceBtn.style.background = '';
                if (measureBtn) measureBtn.style.background = '';
                
                this.redrawCanvas(canvas, ctx, currentImage, measurements, referenceLine);
                this.updateMeasurementsDisplay(measurementsDisplay, measurements);
            });
        }

        if (clearUploadBtn) {
            clearUploadBtn.addEventListener('click', () => {
                if (fileInput) fileInput.value = '';
                if (workspace) workspace.style.display = 'none';
                if (fileInfo) fileInfo.innerHTML = '';
                currentImage = null;
                measurements.length = 0;
                referenceLine = null; // Clear reference line
                referencePixelLength = null;
                referenceRealLength = null;
                currentMode = 'none';
                canvas.style.cursor = 'default';
            });
        }
    }

    loadImageForScale(file, workspace, canvas, ctx, fileInfo, measurements) {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            if (workspace) workspace.style.display = 'block';
            if (fileInfo) {
                fileInfo.innerHTML = `
                    <div class="file-details">
                        <strong>${file.name}</strong><br>
                        Dimensions: ${img.width} × ${img.height}px
                    </div>
                `;
            }
        };
        img.src = URL.createObjectURL(file);
        return img;
    }

    redrawCanvas(canvas, ctx, image, measurements, referenceLine = null) {
        if (!image) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        
        // Draw reference line first (in red/orange to distinguish from measurements)
        if (referenceLine) {
            ctx.strokeStyle = '#ff9500'; // Orange color for reference
            ctx.lineWidth = 3; // Slightly thicker
            ctx.setLineDash([10, 5]); // Dashed line to distinguish
            ctx.beginPath();
            ctx.moveTo(referenceLine.start.x, referenceLine.start.y);
            ctx.lineTo(referenceLine.end.x, referenceLine.end.y);
            ctx.stroke();
            ctx.setLineDash([]); // Reset dash
            
            // Draw reference label
            const midX = (referenceLine.start.x + referenceLine.end.x) / 2;
            const midY = (referenceLine.start.y + referenceLine.end.y) / 2;
            ctx.fillStyle = '#ff9500';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`REF: ${referenceLine.realLength} ${referenceLine.unit}`, midX + 5, midY - 10);
        }
        
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
            display.innerHTML = '<p>No measurements yet</p>';
            return;
        }
        
        let html = '<h4>Measurements:</h4><ul>';
        measurements.forEach((measurement, index) => {
            html += `<li>Measurement ${index + 1}: ${measurement.realLength.toFixed(2)} ${measurement.unit}</li>`;
        });
        html += '</ul>';
        display.innerHTML = html;
    }

    // Utility functions
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize tools when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ToolsManager();
});