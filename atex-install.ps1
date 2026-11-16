# Installs Amnitex (atex) on Windows by running install.ps1 from the latest
# release: https://github.com/Amnibro/amnitex/releases/latest
#   irm https://amni-scient.com/atex-install.ps1 | iex
# On Linux and macOS: curl -fsSL https://amni-scient.com/atex-install.sh | sh
& {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $repo = if ($env:ATEX_REPO) { $env:ATEX_REPO } else { 'Amnibro/amnitex' }
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString("https://github.com/$repo/releases/latest/download/install.ps1"))
}
