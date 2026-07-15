[CmdletBinding()]
param()

$startup = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startup "JARVIS Wake Service.lnk"
if (Test-Path -LiteralPath $shortcutPath) {
  Remove-Item -LiteralPath $shortcutPath -Force
  Write-Host "Removed the JARVIS wake service startup shortcut."
} else {
  Write-Host "The JARVIS wake service startup shortcut is not installed."
}
