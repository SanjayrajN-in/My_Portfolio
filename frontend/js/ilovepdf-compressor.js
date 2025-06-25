/**
 * iLovePDF API PDF Compressor
 * Uses iLovePDF REST API for real server-side compression
 * Free tier: 250 files/month
 */
class ILovePDFCompressor {
    constructor() {
        this.isProcessing = false;
        this.cancelled = false;
        this.currentController = null;
        this.maxFileSize = 50 * 1024 * 1024; // 50MB limit
        this.uploadTimeout = 300000; // 5 minutes timeout
        
        // API endpoints
        this.baseURL = 'https://api.ilovepdf.com/v1';
        this.authURL = `${this.baseURL}/auth`;
        
        // You need to register and get these keys from https://www.iloveapi.com/signup
        // For demo purposes, we'll use public demo keys (limited functionality)
        this.publicKey = 'project_public_demo_key'; // Replace with your actual public key
        this.secretKey = 'project_secret_demo_key'; // Replace with your actual secret key
        
        // Current session data
        this.token = null;
        this.server = null;
        this.task = null;
        
        this.compressionLevels = {
            aggressive: 'extreme',
            moderate: 'recommended', 
            conservative: 'low'
        };
    }

    async compressPDF(file, level = 'aggressive', progressCallback = null) {
        if (this.isProcessing) {
            throw new Error('Compression already in progress');
        }

        // Validate file
        if (file.size > this.maxFileSize) {
            throw new Error(`File too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}`);
        }

        if (file.size === 0) {
            throw new Error('File is empty or corrupted');
        }

        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
            throw new Error('Please select a valid PDF file');
        }

        try {
            this.isProcessing = true;
            this.cancelled = false;
            this.currentController = new AbortController();
            
            const compressionLevel = this.compressionLevels[level] || 'recommended';
            
            if (progressCallback) progressCallback(5, 'Authenticating with iLovePDF...');
            
            // Step 1: Authenticate
            await this.authenticate();
            
            if (progressCallback) progressCallback(15, 'Starting compression task...');
            
            // Step 2: Start task
            await this.startTask();
            
            if (progressCallback) progressCallback(25, 'Uploading PDF file...');
            
            // Step 3: Upload file
            const uploadedFile = await this.uploadFile(file, progressCallback);
            
            if (progressCallback) progressCallback(70, 'Processing PDF compression...');
            
            // Step 4: Process file
            const processResult = await this.processFile(uploadedFile, compressionLevel, progressCallback);
            
            if (progressCallback) progressCallback(90, 'Downloading compressed PDF...');
            
            // Step 5: Download result
            const compressedBytes = await this.downloadFile(processResult.download_filename);
            
            if (progressCallback) progressCallback(100, 'Compression complete!');
            
            return this.createResult(file, compressedBytes, compressionLevel);
            
        } catch (error) {
            console.error('iLovePDF compression failed:', error);
            throw error;
        } finally {
            this.isProcessing = false;
            this.currentController = null;
            this.resetSession();
        }
    }

    async authenticate() {
        try {
            const response = await fetch(this.authURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    public_key: this.publicKey
                }),
                signal: this.currentController.signal
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid API keys. Please register at https://www.iloveapi.com/signup');
                }
                throw new Error(`Authentication failed: ${response.status}`);
            }

            const data = await response.json();
            this.token = data.token;
            
            if (!this.token) {
                throw new Error('No authentication token received');
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Authentication timeout');
            }
            throw new Error(`Authentication error: ${error.message}`);
        }
    }

    async startTask() {
        try {
            const response = await fetch(`${this.baseURL}/start/compress`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                signal: this.currentController.signal
            });

            if (!response.ok) {
                throw new Error(`Start task failed: ${response.status}`);
            }

            const data = await response.json();
            this.server = data.server;
            this.task = data.task;
            
            if (!this.server || !this.task) {
                throw new Error('Invalid task response');
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Start task timeout');
            }
            throw error;
        }
    }

    async uploadFile(file, progressCallback) {
        try {
            const formData = new FormData();
            formData.append('task', this.task);
            formData.append('file', file);

            const uploadURL = `https://${this.server}/v1/upload`;
            
            const response = await fetch(uploadURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
                body: formData,
                signal: this.currentController.signal
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            
            if (!data.server_filename) {
                throw new Error('No server filename received');
            }

            if (progressCallback) progressCallback(60, 'File uploaded successfully');
            
            return {
                server_filename: data.server_filename,
                filename: file.name
            };
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Upload timeout');
            }
            throw error;
        }
    }

    async processFile(uploadedFile, compressionLevel, progressCallback) {
        try {
            const processURL = `https://${this.server}/v1/process`;
            
            const processData = {
                task: this.task,
                tool: 'compress',
                files: [uploadedFile],
                compression_level: compressionLevel
            };

            const response = await fetch(processURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(processData),
                signal: this.currentController.signal
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Processing failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            
            if (data.status !== 'TaskSuccess') {
                throw new Error(`Processing failed: ${data.status}`);
            }

            if (progressCallback) progressCallback(85, 'Processing complete');
            
            return data;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Processing timeout');
            }
            throw error;
        }
    }

    async downloadFile(downloadFilename) {
        try {
            const downloadURL = `https://${this.server}/v1/download/${this.task}`;
            
            const response = await fetch(downloadURL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
                signal: this.currentController.signal
            });

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return new Uint8Array(arrayBuffer);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Download timeout');
            }
            throw error;
        }
    }

    createResult(originalFile, compressedBytes, compressionLevel) {
        const originalSize = originalFile.size;
        const compressedSize = compressedBytes.length;
        const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);
        
        return {
            compressedBytes: compressedBytes,
            originalSize: originalSize,
            compressedSize: compressedSize,
            reduction: Math.max(0, reduction),
            filename: `compressed_${originalFile.name}`,
            compressionMethod: `iLovePDF (${compressionLevel})`,
            apiUsed: 'iLovePDF'
        };
    }

    resetSession() {
        this.token = null;
        this.server = null;
        this.task = null;
    }

    cancelCompression() {
        this.cancelled = true;
        this.isProcessing = false;
        if (this.currentController) {
            this.currentController.abort();
        }
        this.resetSession();
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Helper method to check if API keys are configured
    isConfigured() {
        return this.publicKey !== 'project_public_demo_key' && 
               this.secretKey !== 'project_secret_demo_key';
    }

    // Get configuration instructions
    getConfigInstructions() {
        return {
            message: 'To use iLovePDF compression, you need to configure API keys',
            steps: [
                '1. Register for free at https://www.iloveapi.com/signup',
                '2. Get your Project ID and Secret Key from API Keys section',
                '3. Replace the demo keys in the code with your actual keys',
                '4. Free tier includes 250 compressions per month'
            ],
            limits: {
                free: '250 files/month',
                fileSize: '50MB max',
                compressionLevels: ['low', 'recommended', 'extreme']
            }
        };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ILovePDFCompressor;
}