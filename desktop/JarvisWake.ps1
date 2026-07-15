[CmdletBinding()]
param(
  [ValidateRange(1024, 65535)]
  [int]$Port = 4374,

  [ValidateRange(0.1, 0.99)]
  [double]$MinimumConfidence = 0.72,

  [ValidateRange(1, 30)]
  [int]$CooldownSeconds = 4,

  [switch]$NoBuild
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$distRoot = Join-Path $repoRoot "dist"
$serverScript = Join-Path $PSScriptRoot "server.mjs"
$healthUrl = "http://127.0.0.1:$Port/api/health"
$wakeUrl = "http://127.0.0.1:$Port/api/wake"
$dashboardUrl = "http://127.0.0.1:$Port/?desktop=1&wake=1"
$bridgeProcess = $null
$recognizer = $null

function Test-JarvisBridge {
  try {
    $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 1
    return $response.status -eq "ok"
  } catch {
    return $false
  }
}

function Start-JarvisBridge {
  if (Test-JarvisBridge) { return }
  if (-not (Test-Path -LiteralPath (Join-Path $distRoot "index.html"))) {
    if ($NoBuild) { throw "The production build is missing. Run npm.cmd run build first." }
    Push-Location $repoRoot
    try {
      & npm.cmd run build
      if ($LASTEXITCODE -ne 0) { throw "The JARVIS production build failed." }
    } finally {
      Pop-Location
    }
  }

  $node = (Get-Command node -ErrorAction Stop).Source
  $script:bridgeProcess = Start-Process -FilePath $node -WindowStyle Hidden -PassThru -ArgumentList @(
    "`"$serverScript`"",
    "--port", $Port,
    "--root", "`"$distRoot`""
  )

  $deadline = (Get-Date).AddSeconds(20)
  while ((Get-Date) -lt $deadline) {
    if (Test-JarvisBridge) { return }
    if ($bridgeProcess.HasExited) { throw "The local JARVIS bridge exited before becoming ready." }
    Start-Sleep -Milliseconds 250
  }
  throw "The local JARVIS bridge did not become ready within 20 seconds."
}

function Find-Edge {
  $candidates = @(
    (Join-Path ${env:ProgramFiles(x86)} "Microsoft\Edge\Application\msedge.exe"),
    (Join-Path $env:ProgramFiles "Microsoft\Edge\Application\msedge.exe"),
    (Join-Path $env:LOCALAPPDATA "Microsoft\Edge\Application\msedge.exe")
  )
  return $candidates | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
}

function Show-Jarvis {
  $shell = New-Object -ComObject WScript.Shell
  $window = Get-Process msedge -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowTitle -like "*JARVIS*" } |
    Select-Object -First 1

  if ($window -and $shell.AppActivate($window.Id)) {
    # Existing app window is now in the foreground.
  } else {
    $edge = Find-Edge
    if ($edge) {
      Start-Process -FilePath $edge -ArgumentList @("--app=$dashboardUrl", "--start-maximized") | Out-Null
    } else {
      Start-Process $dashboardUrl | Out-Null
    }
    Start-Sleep -Milliseconds 900
  }

  try {
    Invoke-RestMethod -Uri $wakeUrl -Method Post -TimeoutSec 2 | Out-Null
  } catch {
    Write-Warning "The interface opened, but its live wake event could not be delivered: $($_.Exception.Message)"
  }
}

try {
  Start-JarvisBridge
  Add-Type -AssemblyName System.Speech
  $recognizerInfo = [System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers() |
    Where-Object { $_.Culture.Name -eq "en-US" } |
    Select-Object -First 1
  if (-not $recognizerInfo) {
    $recognizerInfo = [System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers() | Select-Object -First 1
  }
  if (-not $recognizerInfo) { throw "Windows Speech Recognition has no installed recognizer." }

  $recognizer = [System.Speech.Recognition.SpeechRecognitionEngine]::new($recognizerInfo)
  $choices = [System.Speech.Recognition.Choices]::new()
  $choices.Add(@("jarvis", "hey jarvis", "okay jarvis"))
  $builder = [System.Speech.Recognition.GrammarBuilder]::new()
  $builder.Culture = $recognizerInfo.Culture
  $builder.Append($choices)
  $recognizer.LoadGrammar([System.Speech.Recognition.Grammar]::new($builder))
  $recognizer.SetInputToDefaultAudioDevice()

  Write-Host "JARVIS wake service online. Say 'Jarvis' to foreground the interface. Press Ctrl+C to stop."
  $lastWake = [DateTime]::MinValue
  while ($true) {
    $result = $recognizer.Recognize([TimeSpan]::FromMilliseconds(900))
    if (-not $result -or $result.Confidence -lt $MinimumConfidence) { continue }
    if (((Get-Date) - $lastWake).TotalSeconds -lt $CooldownSeconds) { continue }
    $lastWake = Get-Date
    Write-Host ("Wake phrase accepted: {0} ({1:P0})" -f $result.Text, $result.Confidence)
    Show-Jarvis
  }
} finally {
  if ($recognizer) { $recognizer.Dispose() }
  if ($bridgeProcess -and -not $bridgeProcess.HasExited) { Stop-Process -Id $bridgeProcess.Id -Force }
}
