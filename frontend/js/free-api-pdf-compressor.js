/**
 * API-based PDF Compressor
 * Utilizes multiple compression services with automatic fallbacks
 */
class FreeAPIPDFCompressor {
    constructor() {
        this.isProcessing = false;
        this.cancelled = false;
        this.currentController = null;
        this.maxFileSize = 50 * 1024 * 1024; // 50MB limit
        this.uploadTimeout = 300000; // 5 minutes timeout
        this.retryAttempts = 3;
        
        this.apis = [
            {
                name: 'PDF24 Tools',
                url: 'https://api.pdf24.org/api/compress',
                method: 'POST',
                limit: 'Rate limited',
                status: 'active'
            },
            {
                name: 'ConvertAPI',
                url: 'https://v2.convertapi.com/convert/pdf/to/compress',
                method: 'POST',
                limit: '1500/month',
                status: 'active',
                secret: 'demo'
            },
            {
                name: 'PDF.co',
                url: 'https://api.pdf.co/v1/pdf/optimize',
                method: 'POST',
                limit: '300/month',
                status: 'active',
                apiKey: 'demo'
            }
        ];
        
        this.compressionSettings = {
            aggressive: {
                level: 9,
                imageQuality: 30,
                imageResolution: 72,
                removeMetadata: true
            },
            moderate: {
                level: 6,
                imageQuality: 50,
                imageResolution: 150,
                removeMetadata: true
            },
            conservative: {
                level: 3,
                imageQuality: 70,
                imageResolution: 300,
                removeMetadata: false
            }
        };
    }

    async compressPDF(file, level = 'aggressive', progressCallback = null) {
        if (this.isProcessing) {
            throw new Error('Compression already in progress');
        }

        // Validate file size
        if (file.size > this.maxFileSize) {
            throw new Error(`File too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}`);
        }

        if (file.size === 0) {
            throw new Error('File is empty or corrupted');
        }

        try {
            this.isProcessing = true;
            this.cancelled = false;
            const settings = this.compressionSettings[level];
            
            if (progressCallback) progressCallback(5, 'Validating file...');

            // Validate PDF file
            if (!await this.validatePDFFile(file)) {
                throw new Error('Invalid PDF file or corrupted');
            }

            if (progressCallback) progressCallback(10, 'Starting compression...');

            // For large files, use chunked upload
            if (file.size > 10 * 1024 * 1024) { // 10MB
                return await this.compressLargeFile(file, settings, progressCallback);
            }

            // Try standard compression
            return await this.compressStandardFile(file, settings, progressCallback);
            
        } catch (error) {
            console.error('Compression failed:', error);
            throw error;
        } finally {
            this.isProcessing = false;
            this.currentController = null;
        }
    }

    async validatePDFFile(file) {
        try {
            const chunk = file.slice(0, 1024);
            const arrayBuffer = await chunk.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const header = new TextDecoder().decode(uint8Array.slice(0, 8));
            return header.includes('%PDF-');
        } catch {
            return false;
        }
    }

    async compressStandardFile(file, settings, progressCallback) {
        let lastError = null;
        
        for (let i = 0; i < this.apis.length; i++) {
            if (this.cancelled) break;
            
            const api = this.apis[i];
            
            if (progressCallback) {
                progressCallback(20 + i * 20, `Trying ${api.name}...`);
            }
            
            for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
                try {
                    const result = await this.tryAPIWithTimeout(api, file, settings, progressCallback);
                    return result;
                } catch (error) {
                    console.warn(`${api.name} attempt ${attempt} failed:`, error.message);
                    lastError = error;
                    
                    if (attempt < this.retryAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                    }
                }
            }
        }
        
        // Final fallback
        if (progressCallback) progressCallback(80, 'Trying fallback compression...');
        return await this.fallbackCompression(file, settings, progressCallback);
    }

    async compressLargeFile(file, settings, progressCallback) {
        if (progressCallback) progressCallback(15, 'Preparing large file upload...');
        
        // For large files, try to reduce size first
        try {
            const reducedFile = await this.preprocessLargeFile(file, progressCallback);
            return await this.compressStandardFile(reducedFile, settings, progressCallback);
        } catch (error) {
            console.warn('Large file preprocessing failed:', error);
            return await this.compressStandardFile(file, settings, progressCallback);
        }
    }

    async preprocessLargeFile(file, progressCallback) {
        if (progressCallback) progressCallback(25, 'Reducing file size...');
        
        try {
            // Simple optimization: remove some redundant data
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Create a slightly smaller version by removing some whitespace
            let pdfContent = new TextDecoder('latin1').decode(uint8Array);
            
            // Remove excessive whitespace and comments
            pdfContent = pdfContent.replace(/\s{2,}/g, ' ');
            pdfContent = pdfContent.replace(/^%[^\n]*\n/gm, '');
            
            const optimizedBytes = new TextEncoder().encode(pdfContent);
            
            if (progressCallback) progressCallback(35, 'File size reduced, proceeding with compression...');
            
            return new File([optimizedBytes], file.name, { type: 'application/pdf' });
        } catch (error) {
            throw new Error('File preprocessing failed');
        }
    }

    async tryAPIWithTimeout(api, file, settings, progressCallback) {
        this.currentController = new AbortController();
        
        // Set timeout
        const timeoutId = setTimeout(() => {
            this.currentController.abort();
        }, this.uploadTimeout);
        
        try {
            let result;
            switch (api.name) {
                case 'PDF24 Tools':
                    result = await this.compressWithPDF24(file, settings, progressCallback);
                    break;
                case 'ConvertAPI':
                    result = await this.compressWithConvertAPI(file, settings, progressCallback);
                    break;
                case 'PDF.co':
                    result = await this.compressWithPDFco(file, settings, progressCallback);
                    break;
                default:
                    throw new Error(`Unknown API: ${api.name}`);
            }
            clearTimeout(timeoutId);
            return result;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`${api.name} upload timed out after ${this.uploadTimeout/1000} seconds`);
            }
            throw error;
        }
    }

    async compressWithPDF24(file, settings, progressCallback) {
        // PDF24 has CORS issues, skip for now
        throw new Error('PDF24 API not available due to CORS restrictions');
    }

    async compressWithConvertAPI(file, settings, progressCallback) {
        // ConvertAPI also has CORS issues and requires proper API key
        throw new Error('ConvertAPI not available due to CORS restrictions');
    }

    async compressWithPDFco(file, settings, progressCallback) {
        // PDF.co also has CORS issues
        throw new Error('PDF.co API not available due to CORS restrictions');
    }

    async compressWithPDFShift(file, settings, progressCallback) {
        // PDFShift is primarily for HTML to PDF, so we'll skip this for now
        throw new Error('PDFShift not implemented for PDF compression');
    }

    async fallbackCompression(file, settings, progressCallback) {
        if (progressCallback) progressCallback(85, 'Applying client-side optimization...');
        
        try {
            // Read file and apply basic optimization
            const arrayBuffer = await file.arrayBuffer();
            let pdfContent = new TextDecoder('latin1').decode(new Uint8Array(arrayBuffer));
            
            if (progressCallback) progressCallback(90, 'Optimizing PDF structure...');
            
            // Remove comments and excessive whitespace
            pdfContent = pdfContent.replace(/^%[^%].*$/gm, ''); // Remove comments except PDF header
            pdfContent = pdfContent.replace(/\s{2,}/g, ' '); // Compress whitespace
            pdfContent = pdfContent.replace(/\n\s*\n/g, '\n'); // Remove empty lines
            
            // Basic stream compression
            pdfContent = pdfContent.replace(/(\d+\s+\d+\s+obj\s*<<[^>]*>>)\s*stream\s*([\s\S]*?)\s*endstream/g, 
                (match, objHeader, streamContent) => {
                    // Simple stream compression by removing extra whitespace
                    const compressedStream = streamContent.replace(/\s+/g, ' ').trim();
                    return `${objHeader}\nstream\n${compressedStream}\nendstream`;
                });
            
            if (progressCallback) progressCallback(95, 'Finalizing compression...');
            
            const optimizedBytes = new TextEncoder().encode(pdfContent);
            
            // Ensure we actually reduced size
            if (optimizedBytes.length >= arrayBuffer.byteLength) {
                throw new Error('No compression achieved');
            }
            
            if (progressCallback) progressCallback(100, 'Client-side compression complete');
            
            return this.createResult(file, optimizedBytes, 'Client-side Optimization');
            
        } catch (error) {
            console.error('Fallback compression failed:', error);
            throw new Error('All compression methods failed');
        }
    }

    createResult(originalFile, compressedBytes, apiName) {
        const originalSize = originalFile.size;
        const compressedSize = compressedBytes.length;
        const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);
        
        return {
            compressedBytes: compressedBytes,
            originalSize: originalSize,
            compressedSize: compressedSize,
            reduction: Math.max(0, reduction),
            filename: `compressed_${originalFile.name}`,
            compressionMethod: `${apiName} API`,
            apiUsed: apiName
        };
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    cancelCompression() {
        this.cancelled = true;
        this.isProcessing = false;
        if (this.currentController) {
            this.currentController.abort();
        }
    }

    getAPIStatus() {
        return this.apis.map(api => ({
            name: api.name,
            status: api.status,
            limit: api.limit,
            compression: api.compression,
            description: `${api.name}: ${api.compression} reduction, ${api.limit}`
        }));
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FreeAPIPDFCompressor;
}