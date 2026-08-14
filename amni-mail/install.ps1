param(
    [string]$Dir = "$env:LOCALAPPDATA\Amni-Mail",
    [int]$Port = 8026,
    [switch]$NoOpen
)
$ErrorActionPreference = 'Stop'
$Version = '1.9.0'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "[amni-mail] installing v$Version to $Dir"
if (-not (Test-Path $Dir)) { New-Item -ItemType Directory -Path $Dir | Out-Null }
$src = $here
if (Test-Path (Join-Path $here "Amni-Mail")) { $src = Join-Path $here "Amni-Mail" }
$exe = Join-Path $src "AmniMail.exe"
if (Test-Path $exe) {
    Write-Host "[amni-mail] frozen exe install"
    Copy-Item -Path (Join-Path $src "*") -Destination $Dir -Recurse -Force
    $ws = [Environment]::GetFolderPath("Desktop")
    $w = New-Object -ComObject WScript.Shell
    $target = if (Test-Path (Join-Path $Dir "run.bat")) { Join-Path $Dir "run.bat" } else { Join-Path $Dir "AmniMail.exe" }
    foreach ($lnkPath in @((Join-Path $ws "Amni-Mail.lnk"), (Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs\Amni-Mail.lnk"))) {
        $lnk = $w.CreateShortcut($lnkPath)
        $lnk.TargetPath = $target
        $lnk.WorkingDirectory = $Dir
        $lnk.Description = "Amni-Mail"
        $ico = Join-Path $Dir "AmniMail.ico"
        if (Test-Path $ico) { $lnk.IconLocation = $ico }
        $lnk.Save()
    }
    Write-Host "[amni-mail] installed exe. Desktop + Start Menu shortcuts created."
    if (-not $NoOpen) { Start-Process -FilePath $target -WorkingDirectory $Dir }
    exit 0
}
$need = @("backend\main.py", "backend\requirements.txt")
foreach ($n in $need) {
    if (-not (Test-Path (Join-Path $src $n))) {
        Write-Host "[amni-mail] this folder is not a release. Run scripts\package.ps1 first, or unzip Amni-Mail-v$Version.zip and run install.ps1 from inside it."
        exit 1
    }
}
Copy-Item -Path (Join-Path $src "backend") -Destination (Join-Path $Dir "backend") -Recurse -Force
if (Test-Path (Join-Path $src "frontend\dist")) {
    New-Item -ItemType Directory -Force -Path (Join-Path $Dir "frontend") | Out-Null
    Copy-Item -Path (Join-Path $src "frontend\dist") -Destination (Join-Path $Dir "frontend\dist") -Recurse -Force
}
if (Test-Path (Join-Path $src "frontend\public")) {
    New-Item -ItemType Directory -Force -Path (Join-Path $Dir "frontend") | Out-Null
    Copy-Item -Path (Join-Path $src "frontend\public") -Destination (Join-Path $Dir "frontend\public") -Recurse -Force
}
Copy-Item -Path (Join-Path $src "run.bat") -Destination (Join-Path $Dir "run.bat") -Force
if (Test-Path (Join-Path $src "AmniMail.ico")) { Copy-Item (Join-Path $src "AmniMail.ico") (Join-Path $Dir "AmniMail.ico") -Force }
if (Test-Path (Join-Path $src "README.md")) { Copy-Item (Join-Path $src "README.md") (Join-Path $Dir "README.md") -Force }
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command python3 -ErrorAction SilentlyContinue }
if (-not $py) {
    Write-Host "[amni-mail] Python 3.11+ is required: https://www.python.org/downloads/ (check 'Add python.exe to PATH')"
    exit 1
}
$venvPy = Join-Path $Dir "backend\venv\Scripts\python.exe"
if (-not (Test-Path $venvPy)) {
    Write-Host "[amni-mail] creating venv..."
    & $py.Source -m venv (Join-Path $Dir "backend\venv")
}
Write-Host "[amni-mail] installing Python packages..."
& $venvPy -m pip install --upgrade pip
& $venvPy -m pip install -r (Join-Path $Dir "backend\requirements.txt")
$ws = [Environment]::GetFolderPath("Desktop")
$lnkPath = Join-Path $ws "Amni-Mail.lnk"
$w = New-Object -ComObject WScript.Shell
$lnk = $w.CreateShortcut($lnkPath)
$lnk.TargetPath = Join-Path $Dir "run.bat"
$lnk.WorkingDirectory = $Dir
$lnk.Description = "Amni-Mail"
$ico = Join-Path $Dir "AmniMail.ico"
if (Test-Path $ico) { $lnk.IconLocation = $ico }
$lnk.Save()
$sm = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs\Amni-Mail.lnk"
$lnk2 = $w.CreateShortcut($sm)
$lnk2.TargetPath = Join-Path $Dir "run.bat"
$lnk2.WorkingDirectory = $Dir
$lnk2.Description = "Amni-Mail"
if (Test-Path $ico) { $lnk2.IconLocation = $ico }
$lnk2.Save()
Write-Host "[amni-mail] installed. Desktop + Start Menu shortcuts created."
if (-not $NoOpen) {
    $env:AMNI_MAIL_NO_BROWSER = $null
    Start-Process -FilePath (Join-Path $Dir "run.bat") -WorkingDirectory $Dir
    Write-Host "[amni-mail] launching http://127.0.0.1:$Port"
}
