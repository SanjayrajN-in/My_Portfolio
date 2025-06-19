/**
 * API Test Script
 * This script tests the API endpoints to ensure they're working correctly
 */

document.addEventListener('DOMContentLoaded', function() {
    // Create test button
    const testButton = document.createElement('button');
    testButton.textContent = 'Test API';
    testButton.className = 'api-test-button';
    testButton.style.position = 'fixed';
    testButton.style.bottom = '20px';
    testButton.style.right = '20px';
    testButton.style.zIndex = '9999';
    testButton.style.padding = '10px 15px';
    testButton.style.backgroundColor = '#333';
    testButton.style.color = '#00ffff';
    testButton.style.border = '1px solid #00ffff';
    testButton.style.borderRadius = '5px';
    testButton.style.cursor = 'pointer';
    testButton.style.fontFamily = 'Rajdhani, sans-serif';
    testButton.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.3)';
    
    // Add hover effect
    testButton.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#444';
        this.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.5)';
    });
    
    testButton.addEventListener('mouseleave', function() {
        this.style.backgroundColor = '#333';
        this.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.3)';
    });
    
    // Add click event
    testButton.addEventListener('click', testAPI);
    
    // Add to body
    document.body.appendChild(testButton);
    
    // Test API function
    async function testAPI() {
        // Create results container
        let resultsContainer = document.getElementById('api-test-results');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'api-test-results';
            resultsContainer.style.position = 'fixed';
            resultsContainer.style.top = '50%';
            resultsContainer.style.left = '50%';
            resultsContainer.style.transform = 'translate(-50%, -50%)';
            resultsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            resultsContainer.style.padding = '20px';
            resultsContainer.style.borderRadius = '10px';
            resultsContainer.style.border = '1px solid #00ffff';
            resultsContainer.style.color = 'white';
            resultsContainer.style.zIndex = '10000';
            resultsContainer.style.maxWidth = '80%';
            resultsContainer.style.maxHeight = '80vh';
            resultsContainer.style.overflow = 'auto';
            resultsContainer.style.fontFamily = 'monospace';
            resultsContainer.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
            
            // Add close button
            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '10px';
            closeButton.style.right = '10px';
            closeButton.style.padding = '5px 10px';
            closeButton.style.backgroundColor = '#333';
            closeButton.style.color = 'white';
            closeButton.style.border = '1px solid #666';
            closeButton.style.borderRadius = '3px';
            closeButton.style.cursor = 'pointer';
            
            closeButton.addEventListener('click', function() {
                resultsContainer.style.display = 'none';
            });
            
            resultsContainer.appendChild(closeButton);
            document.body.appendChild(resultsContainer);
        }
        
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = '<h3>API Test Results</h3><div id="test-results-content"></div>';
        const resultsContent = document.getElementById('test-results-content');
        
        // Test endpoints
        const endpoints = [
            { name: 'API Root', url: '/api' },
            { name: 'Auth Root', url: '/api/auth' },
            { name: 'Auth Google', url: '/api/auth?endpoint=google', method: 'OPTIONS' },
            { name: 'Utils Hello', url: '/api/hello' },
            { name: 'Utils Test', url: '/api/test' },
            { name: 'Utils Debug', url: '/api/debug' }
        ];
        
        // Test each endpoint one at a time
        for (let i = 0; i < endpoints.length; i++) {
            const endpoint = endpoints[i];
            try {
                const method = endpoint.method || 'GET';
                resultsContent.innerHTML += `<p>Testing ${endpoint.name} (${method} ${endpoint.url})...</p>`;
                
                // Add a small delay between requests to avoid overwhelming the server
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                
                const response = await fetch(endpoint.url, { 
                    method,
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                const status = response.status;
                
                let responseText;
                try {
                    // Try to parse as JSON first
                    const responseData = await response.json();
                    responseText = JSON.stringify(responseData, null, 2);
                } catch (e) {
                    try {
                        // If JSON parsing fails, make a new request for text
                        const textResponse = await fetch(endpoint.url, { 
                            method,
                            headers: {
                                'Cache-Control': 'no-cache',
                                'Pragma': 'no-cache'
                            }
                        });
                        responseText = await textResponse.text();
                    } catch (textError) {
                        responseText = `Error reading response: ${textError.message}`;
                    }
                }
                
                const statusColor = status >= 200 && status < 300 ? 'green' : 'red';
                
                resultsContent.innerHTML += `
                    <p>Status: <span style="color: ${statusColor};">${status}</span></p>
                    <pre style="background-color: #222; padding: 10px; border-radius: 5px; overflow: auto; max-height: 200px;">${responseText}</pre>
                    <hr style="border-color: #444;">
                `;
            } catch (error) {
                resultsContent.innerHTML += `
                    <p>Error: <span style="color: red;">${error.message}</span></p>
                    <hr style="border-color: #444;">
                `;
            }
        }
    }
});