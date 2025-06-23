// Google Auth Redirect Handler
document.addEventListener('DOMContentLoaded', function() {
    // Check if this page was loaded as a redirect from Google OAuth
    const hash = window.location.hash;
    if (hash && (hash.includes('id_token=') || hash.includes('access_token='))) {
        try {
            // Parse the hash
            const params = new URLSearchParams(hash.substring(1));
            let token = params.get('id_token') || params.get('access_token');
            
            if (token) {
                // Send the token back to the opener window
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                        type: 'googleAuth',
                        token: token
                    }, window.location.origin);
                    
                    // Show success message
                    document.body.innerHTML = '<div style="text-align:center; padding:30px; font-family:sans-serif;"><h2>Authentication Successful</h2><p>You can close this window now.</p></div>';
                    
                    // Close this window after a short delay
                    setTimeout(() => window.close(), 2000);
                } else {
                    document.body.innerHTML = '<div style="text-align:center; padding:30px; font-family:sans-serif;"><h2>Authentication Error</h2><p>Could not communicate with the main window. Please try again.</p></div>';
                }
            } else {
                document.body.innerHTML = '<div style="text-align:center; padding:30px; font-family:sans-serif;"><h2>Authentication Error</h2><p>No authentication token received. Please try again.</p></div>';
            }
        } catch (error) {
            console.error('Error processing authentication response:', error);
            document.body.innerHTML = '<div style="text-align:center; padding:30px; font-family:sans-serif;"><h2>Authentication Error</h2><p>An error occurred during authentication. Please try again.</p></div>';
        }
    }
});