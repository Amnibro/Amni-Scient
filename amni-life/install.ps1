# Amni-Life self-host installer (Windows)
# Usage: iwr -useb https://amni-scient.com/amni-life/install.ps1 | iex
# Or:    & ([scriptblock]::Create((iwr -useb https://amni-scient.com/amni-life/install.ps1).Content)) -Dir "C:\Apps\amni-life"
param(
    [string]$Dir = "$env:USERPROFILE\amni-life",
    [int]$Port = 8765,
    [switch]$NoOpen,
    [switch]$NoServe
)
$ErrorActionPreference = 'Stop'
$Version = '0.26.0'
$Base = 'https://amni-scient.com/amni-life'
$Zip = "Amni-Life-v$Version.zip"
Write-Host "[amni-life] installing v$Version to $Dir" -ForegroundColor Cyan
if (-not (Test-Path $Dir)) { New-Item -ItemType Directory -Path $Dir | Out-Null }
$tmp = Join-Path $env:TEMP "amni-life-install-$Version"
if (Test-Path $tmp) { Remove-Item -Path $tmp -Recurse -Force }
New-Item -ItemType Directory -Path $tmp | Out-Null
$zipPath = Join-Path $tmp $Zip
Write-Host "[amni-life] downloading $Zip…"
try { Invoke-WebRequest -UseBasicParsing -Uri "$Base/$Zip" -OutFile $zipPath }
catch { Write-Host "[amni-life] download failed: $_" -ForegroundColor Red; exit 1 }
Write-Host "[amni-life] extracting…"
Expand-Archive -Path $zipPath -DestinationPath "$tmp\extract" -Force
$payload = Join-Path "$tmp\extract" "Amni-Life-v$Version"
Copy-Item -Path "$payload\*" -Destination $Dir -Recurse -Force
Remove-Item -Path $tmp -Recurse -Force
Write-Host "[amni-life] installed to $Dir" -ForegroundColor Green
if ($NoServe) {
    Write-Host "[amni-life] skipping server (-NoServe)"
    Write-Host "[amni-life]   run later:   cd $Dir; python server.py $Port"
    return
}
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command python3 -ErrorAction SilentlyContinue }
if (-not $py) {
    Write-Host "[amni-life] python not found — open $Dir\index.html directly in your browser" -ForegroundColor Yellow
    return
}
$url = "http://127.0.0.1:$Port/"
Write-Host "[amni-life] starting server at $url …" -ForegroundColor Cyan
Start-Process -FilePath $py.Source -ArgumentList "server.py $Port" -WorkingDirectory $Dir -WindowStyle Hidden
Start-Sleep -Seconds 1
if (-not $NoOpen) { Start-Process $url }
Write-Host "[amni-life] running at $url" -ForegroundColor Green
Write-Host "[amni-life]   stop server:   Get-Process python | Where-Object { `$_.MainWindowTitle -like '*server.py*' } | Stop-Process"
