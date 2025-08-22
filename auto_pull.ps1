while ($true) {
    try {
        git pull origin main
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - Pulled latest changes successfully"
    } catch {
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - Pulled latest changes error $_"
    }
    Start-Sleep -Seconds 60
}