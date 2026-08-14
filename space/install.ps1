param([string]$Feed="https://amni-scient.com/space/latest.json",[switch]$NoLaunch,[switch]$NoShortcuts)
$ErrorActionPreference="Stop"
$ProgressPreference="SilentlyContinue"

function Say($m,$c="Gray"){Write-Host $m -ForegroundColor $c}
Say ""
Say "  Amni-Space setup" "Cyan"
Say "  ----------------" "DarkGray"

$dest=Join-Path $env:LOCALAPPDATA "AmniSpace"
New-Item -ItemType Directory -Force -Path $dest|Out-Null

Say "  1/4  Asking the site what the current version is..."
$rel=$null
try{ $rel=Invoke-RestMethod -Uri $Feed -Headers @{ "User-Agent"="AmniSpace-Setup" } }catch{}
if(-not $rel -or -not $rel.url){
  $rel=[pscustomobject]@{version="1.5.0";url="https://amni-scient.com/space/AmniSpace.exe";sha256=$null}
  Say "       (feed unavailable, using the direct link)" "DarkGray"
}
Say "       version $($rel.version)" "DarkGray"

$exe=Join-Path $dest "AmniSpace.exe"
$tmp="$exe.download"
Say "  2/4  Downloading (about 35 MB)..."
Invoke-WebRequest -Uri $rel.url -OutFile $tmp -UseBasicParsing

if($rel.sha256){
  Say "  3/4  Checking the file matches its published hash..."
  $got=(Get-FileHash -Algorithm SHA256 -LiteralPath $tmp).Hash.ToLower()
  if($got -ne ([string]$rel.sha256).ToLower()){
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
    throw "Downloaded file did not match the published SHA-256. Nothing was installed."
  }
  Say "       verified" "DarkGray"
}else{ Say "  3/4  No hash published; skipping verification." "DarkGray" }

$running=Get-Process -Name "AmniSpace" -ErrorAction SilentlyContinue
if($running){ Say "       closing the running copy..." "DarkGray"; $running|Stop-Process -Force; Start-Sleep 1 }
Move-Item $tmp $exe -Force

if(-not $NoShortcuts){
  Say "  4/4  Adding Start Menu and Desktop shortcuts..."
  $w=New-Object -ComObject WScript.Shell
  $desk=[Environment]::GetFolderPath("Desktop")
  $start=Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs"
  foreach($p in @((Join-Path $desk "Amni-Space.lnk"),(Join-Path $start "Amni-Space.lnk"))){
    $s=$w.CreateShortcut($p)
    $s.TargetPath=$exe
    $s.WorkingDirectory=$dest
    $s.Description="Amni-Space - visual disk map"
    $s.IconLocation="$exe,0"
    $s.Save()
  }
}else{ Say "  4/4  Shortcuts skipped." "DarkGray" }

$un=Join-Path $dest "uninstall.ps1"
@'
$d=Join-Path $env:LOCALAPPDATA "AmniSpace"
Get-Process -Name "AmniSpace" -ErrorAction SilentlyContinue|Stop-Process -Force
Remove-Item (Join-Path ([Environment]::GetFolderPath("Desktop")) "Amni-Space.lnk") -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Amni-Space.lnk") -Force -ErrorAction SilentlyContinue
Remove-Item $d -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Amni-Space removed. Your settings in %APPDATA%\AmniSpace were kept - delete that folder too if you want them gone."
'@ | Set-Content -LiteralPath $un -Encoding UTF8

Say ""
Say "  Installed to $dest" "Green"
Say ""
Say "  What happens when you run it:" "White"
Say "    - Windows asks for administrator. That is only so it can read the drive's" "Gray"
Say "      file table, which is what makes a whole-drive scan take ~20 seconds." "Gray"
Say "      Say no and you can still scan any single folder." "Gray"
Say "    - Your browser opens on the map. Nothing is sent anywhere." "Gray"
Say "    - Deleting sends files to the Recycle Bin, and every action is undoable." "Gray"
Say ""
Say "  Remove it later:  powershell -File `"$un`"" "DarkGray"
Say ""

if(-not $NoLaunch){
  Say "  Starting Amni-Space..." "Cyan"
  Start-Process -FilePath $exe
}
