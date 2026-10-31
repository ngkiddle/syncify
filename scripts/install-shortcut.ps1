# Creates "Syncify" shortcuts on the Desktop and in the Start menu that run start-syncify.ps1
# with no console window. Windows doesn't let scripts pin to the taskbar, so pin it by hand:
# right-click the Start menu entry -> Pin to taskbar.
$root = Split-Path -Parent $PSScriptRoot
$start = Join-Path $PSScriptRoot 'start-syncify.ps1'
$icon = Join-Path $PSScriptRoot 'syncify.ico'
$shell = New-Object -ComObject WScript.Shell

$places = @(
    [Environment]::GetFolderPath('Desktop'),
    (Join-Path ([Environment]::GetFolderPath('Programs')) '')
)
foreach ($dir in $places) {
    $lnk = $shell.CreateShortcut((Join-Path $dir 'Syncify.lnk'))
    $lnk.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
    $lnk.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$start`""
    $lnk.WorkingDirectory = $root
    $lnk.IconLocation = "$icon,0"
    $lnk.Description = 'Start Syncify and open it in the browser'
    $lnk.WindowStyle = 7    # minimized, so no console flashes up
    $lnk.Save()
    Write-Output "created $(Join-Path $dir 'Syncify.lnk')"
}
