#!/bin/sh
# Installs Amnitex (atex) on Linux and macOS by running install.sh from the
# latest release: https://github.com/Amnibro/amnitex/releases/latest
#   curl -fsSL https://amni-scient.com/atex-install.sh | sh
# On Windows: irm https://amni-scient.com/atex-install.ps1 | iex
set -eu
D="$(mktemp -d "${TMPDIR:-/tmp}/atex-install.XXXXXX")"
trap 'rm -rf "$D"' EXIT INT TERM
curl -fsSL "https://github.com/${ATEX_REPO:-Amnibro/amnitex}/releases/latest/download/install.sh" -o "$D/install.sh"
sh "$D/install.sh"
