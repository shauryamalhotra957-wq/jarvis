[CmdletBinding()]
param([switch]$StartNow)

$ErrorActionPreference = "Stop"
$wakeScript = Join-Path $PSScriptRoot "JarvisWake.ps1"
if (-not (Test-Path -LiteralPath $wakeScript)) { throw "JarvisWake.ps1 was not found." }

$startup = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startup "JARVIS Wake Service.lnk"
$powershell = (Get-Command powershell.exe -ErrorAction Stop).Source
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $powershell
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$wakeScript`""
$shortcut.WorkingDirectory = Split-Path -Parent $PSScriptRoot
$shortcut.WindowStyle = 7
$shortcut.Description = "Local JARVIS wake-word service"
$shortcut.Save()

Write-Host "Installed the JARVIS wake service startup shortcut: $shortcutPath"
if ($StartNow) {
  Start-Process -FilePath $powershell -WindowStyle Hidden -ArgumentList @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$wakeScript`""
  ) | Out-Null
  Write-Host "JARVIS wake service started."
}
