$pages = Get-ChildItem -Path "pages" -Filter "*.html"

$newScript = @"
    <!-- FOUC Prevention and Page Transition -->
    <script>
        // Prevent FOUC
        document.documentElement.style.visibility='visible';
        document.documentElement.style.opacity='1';
        document.documentElement.classList.add('loaded');
        
        // Ensure Font Awesome is loaded
        (function() {
            // Create a link checker
            const linkChecker = document.createElement('i');
            linkChecker.className = 'fas fa-home';
            linkChecker.style.position = 'absolute';
            linkChecker.style.opacity = '0';
            document.head.appendChild(linkChecker);
            
            // Check if Font Awesome is loaded
            const isFontAwesomeLoaded = () => {
                return window.getComputedStyle(linkChecker).fontFamily.includes('Font Awesome');
            };
            
            // If not loaded, add inline styles for common icons
            if (!isFontAwesomeLoaded()) {
                const style = document.createElement('style');
                style.textContent = `
                    .fas.fa-home:before { content: "\\f015"; }
                    .fas.fa-user:before { content: "\\f007"; }
                    .fas.fa-cogs:before { content: "\\f085"; }
                    .fas.fa-envelope:before { content: "\\f0e0"; }
                    .fab.fa-linkedin:before { content: "\\f08c"; }
                    .fab.fa-github:before { content: "\\f09b"; }
                    .fab.fa-facebook:before { content: "\\f09a"; }
                    .fab.fa-instagram:before { content: "\\f16d"; }
                `;
                document.head.appendChild(style);
            }
            
            // Clean up
            document.head.removeChild(linkChecker);
        })();
        
        // Show page transition on unload
        window.addEventListener('beforeunload', function() {
            const pageTransition = document.querySelector('.page-transition');
            if (pageTransition && !pageTransition.classList.contains('active')) {
                pageTransition.classList.add('active');
            }
        });
    </script>
"@

foreach ($page in $pages) {
    $content = Get-Content -Path $page.FullName -Raw
    
    # Update FOUC Prevention script
    $pattern = '(?s)<!-- FOUC Prevention and Page Transition -->.*?</script>'
    if ($content -match $pattern) {
        $content = [regex]::Replace($content, $pattern, $newScript)
        
        # Write the updated content back to the file
        Set-Content -Path $page.FullName -Value $content
        
        Write-Host "Updated Font Awesome script in $($page.Name)"
    }
}

Write-Host "All pages updated successfully!"