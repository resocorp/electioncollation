# Health Check Script (PowerShell for Windows)
# Monitors SMS system health and alerts on issues
#
# Usage: .\scripts\run-health-check.ps1

# Configuration
$ApiUrl = if ($env:API_URL) { $env:API_URL } else { "http://localhost:3000" }
$AlertEmail = if ($env:ALERT_EMAIL) { $env:ALERT_EMAIL } else { "admin@election.com" }
$LogFile = if ($env:LOG_FILE) { $env:LOG_FILE } else { "$env:TEMP\sms-health.log" }

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $LogFile -Value "========================================"
Add-Content -Path $LogFile -Value "Health Check - $timestamp"
Add-Content -Path $LogFile -Value "========================================"

try {
    # Fetch health status
    $response = Invoke-RestMethod -Uri "$ApiUrl/api/sms/health" -Method Get -ContentType "application/json"
    $status = $response.status
    
    # Log response
    Add-Content -Path $LogFile -Value "Status: $status"
    Add-Content -Path $LogFile -Value ($response | ConvertTo-Json -Depth 5)
    
    # Check for issues
    if ($status -ne "healthy") {
        Write-Host "⚠️  ALERT: SMS System unhealthy - Status: $status" -ForegroundColor Yellow
        Add-Content -Path $LogFile -Value "⚠️  ALERT: SMS System unhealthy - Status: $status"
        
        # Create alert message
        $alertMsg = "SMS System Alert - Status: $status`n`n"
        
        if ($response.warnings) {
            $alertMsg += "Warnings:`n"
            $response.warnings | ForEach-Object {
                $alertMsg += "  - $_`n"
            }
            $alertMsg += "`n"
        }
        
        if ($response.errors) {
            $alertMsg += "Errors:`n"
            $response.errors | ForEach-Object {
                $alertMsg += "  - $_`n"
            }
            $alertMsg += "`n"
        }
        
        # Get line status
        if ($response.checks.goip_lines) {
            $alertMsg += "GoIP Lines: $($response.checks.goip_lines.active)/$($response.checks.goip_lines.total) active`n"
        }
        
        $alertMsg += "`nFull report: $ApiUrl/api/sms/health`n"
        
        # Send alert (uncomment and configure your preferred method)
        # Send-MailMessage -To $AlertEmail -Subject "SMS System Alert" -Body $alertMsg -SmtpServer "smtp.example.com"
        
        Add-Content -Path $LogFile -Value $alertMsg
        Add-Content -Path $LogFile -Value "ALERT logged!"
        
        # Exit with error code
        if ($status -eq "critical") {
            exit 2
        } else {
            exit 1
        }
    } else {
        Write-Host "✓ System healthy" -ForegroundColor Green
        Add-Content -Path $LogFile -Value "✓ System healthy"
        exit 0
    }
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
    Add-Content -Path $LogFile -Value "❌ Health check failed: $_"
    exit 3
}

Add-Content -Path $LogFile -Value ""
