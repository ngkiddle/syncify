# Starts the Syncify API server and React dev server in the background (if they aren't
# already running) and opens the app. Used by the desktop/taskbar shortcut.
$root = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $root 'logs'
New-Item -ItemType Directory -Force $logs | Out-Null
$node = (Get-Command node -ErrorAction Stop).Source

function Test-Port($port) {
    [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
}

if (-not (Test-Port 5000)) {
    Start-Process $node -ArgumentList 'server.js' -WorkingDirectory $root -NoNewWindow `
        -RedirectStandardOutput "$logs\server.log" -RedirectStandardError "$logs\server-error.log"
}

if (-not (Test-Port 3000)) {
    # HTTPS=true comes from client/.env; the rest match how the dev server has been run
    $env:BROWSER = 'none'
    $env:SKIP_PREFLIGHT_CHECK = 'true'
    $env:NODE_OPTIONS = '--openssl-legacy-provider'
    Start-Process $node -ArgumentList 'node_modules/react-scripts/bin/react-scripts.js', 'start' `
        -WorkingDirectory (Join-Path $root 'client') -NoNewWindow `
        -RedirectStandardOutput "$logs\client.log" -RedirectStandardError "$logs\client-error.log"
}

# the first compile takes a while; open once the page actually answers
$deadline = (Get-Date).AddMinutes(3)
while ((Get-Date) -lt $deadline) {
    try {
        Invoke-WebRequest -Uri 'https://127.0.0.1:3000' -UseBasicParsing -TimeoutSec 3 | Out-Null
        break
    } catch [System.Net.WebException] {
        # a certificate error still means the dev server is up
        if ($_.Exception.Status -eq 'TrustFailure' -or $_.Exception.Status -eq 'SecureChannelFailure') { break }
        Start-Sleep -Seconds 1
    }
}

# 127.0.0.1 (not localhost) is the address registered with Spotify for login
Start-Process 'https://127.0.0.1:3000'
