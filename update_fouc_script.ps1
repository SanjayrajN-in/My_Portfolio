$pages = Get-ChildItem -Path "pages" -Filter "*.html"

$newScript = @"
        <!-- FOUC Prevention and Page Transition -->
    <script>
        // Prevent FOUC
        document.documentElement.style.visibility='visible';
        document.documentElement.style.opacity='1';
        document.documentElement.classList.add('loaded');
        
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
    $content = $content -replace '<!-- FOUC Prevention -->\s*<script>[\s\S]*?</script>', $newScript
    
    # Write the updated content back to the file
    Set-Content -Path $page.FullName -Value $content
    
    Write-Host "Updated FOUC script in $($page.Name)"
}

Write-Host "All pages updated successfully!"