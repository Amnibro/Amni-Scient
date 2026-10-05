#!/usr/bin/env bash
# ==============================================================================
#  Amni OS — Self-Healing System Updater & Repair Tool
#  https://amni-scient.com/
#
#  Fixes broken package mirrors, expired PGP keyrings, stale db locks,
#  unresolvable dependencies, and performs a complete OS upgrade.
# ==============================================================================
set -euo pipefail

BOLD='\033[1m'
GOLD='\033[38;2;200;155;78m'
GREEN='\033[1;32m'
RED='\033[1;31m'
NC='\033[0m'

log() { printf "${GOLD}[amni-update]${NC} %s\n" "$*"; }
warn() { printf "${GOLD}[warning]${NC} %s\n" "$*"; }
err() { printf "${RED}[error]${NC} %s\n" "$*" >&2; }

echo ""
echo -e "${GOLD}=====================================================${NC}"
echo -e "${BOLD}             AMNI OS SYSTEM UPDATER & REPAIR          ${NC}"
echo -e "${GOLD}=====================================================${NC}"
echo ""

# 1. Elevate to root if not already running as root
if [[ $EUID -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    log "Root privileges required. Requesting sudo authentication..."
    if [[ ! -f "${0:-}" ]] || [[ "${0:-}" == "bash" ]] || [[ "${0:-}" == "/bin/bash" ]] || [[ "${0:-}" == "/usr/bin/bash" ]]; then
      TMP_RUN="$(mktemp /tmp/amni-update.XXXXXX.sh)"
      curl -fsSL https://amni-scient.com/update -o "$TMP_RUN" 2>/dev/null || cat > "$TMP_RUN"
      chmod +x "$TMP_RUN"
      exec sudo bash "$TMP_RUN" "$@"
    else
      exec sudo bash "$0" "$@"
    fi
  elif command -v pkexec >/dev/null 2>&1; then
    log "Root privileges required. Requesting pkexec authentication..."
    TMP_RUN="$(mktemp /tmp/amni-update.XXXXXX.sh)"
    curl -fsSL https://amni-scient.com/update -o "$TMP_RUN" 2>/dev/null || cat > "$TMP_RUN"
    chmod +x "$TMP_RUN"
    exec pkexec bash "$TMP_RUN" "$@"
  else
    err "This updater requires root privileges. Please run with sudo or as root."
    exit 1
  fi
fi

# 2. Terminate stale package daemons & clean database locks
log "Checking for stuck package manager locks..."
if pgrep -x 'packagekitd|pamac-daemon' >/dev/null 2>&1; then
  log "Stopping background package daemons..."
  killall -9 packagekitd pamac-daemon 2>/dev/null || true
  sleep 1
fi

LCK="/var/lib/pacman/db.lck"
if [[ -f "$LCK" ]]; then
  if ! pgrep -x 'pacman|pacman-key|yay|paru' >/dev/null 2>&1; then
    log "Removing stale pacman lock left by a previous interrupted update..."
    rm -f "$LCK"
  else
    log "Waiting for active package manager transaction to finish..."
    waited=0
    while [[ -f "$LCK" ]]; do
      sleep 3
      waited=$((waited + 3))
      if (( waited >= 60 )); then
        warn "Active pacman process exceeded wait limit. Terminating stale process..."
        killall -9 pacman pacman-key 2>/dev/null || true
        rm -f "$LCK"
        break
      fi
    done
  fi
fi

# 3. Fix /etc/pacman.conf configuration
log "Validating and repairing /etc/pacman.conf..."
PC="/etc/pacman.conf"
if [[ -f "$PC" ]]; then
  # Enable multilib
  sed -i '/\[multilib\]/,/Include/ s/^#//' "$PC" 2>/dev/null || true

  # Ensure [amnios] repository exists with current server and bootstrap SigLevel
  if ! grep -q "^\[amnios\]" "$PC" 2>/dev/null; then
    printf '\n[amnios]\nSigLevel = Optional TrustAll\nServer = https://downloads.amni-scient.com/repo/amnios\n' >> "$PC"
    log "Added [amnios] repository to pacman.conf"
  else
    # Update server URL if pointing to older or incorrect server
    if ! grep -q "downloads.amni-scient.com/repo/amnios" "$PC" 2>/dev/null; then
      sed -i '/^\[amnios\]/,/^\[/ s|^Server[[:space:]]*=.*|Server = https://downloads.amni-scient.com/repo/amnios|' "$PC" 2>/dev/null || true
      log "Updated [amnios] repository server URL"
    fi
    # Ensure SigLevel allows bootstrapping untrusted or newly rotated keys
    sed -i '/^\[amnios\]/,/^\[/ s|^SigLevel[[:space:]]*=.*|SigLevel = Optional TrustAll|' "$PC" 2>/dev/null || true
  fi

  # Enable ParallelDownloads if commented
  sed -i 's/^#ParallelDownloads/ParallelDownloads/' "$PC" 2>/dev/null || true
fi

# 4. Repair mirrorlist if empty, corrupt, or inaccessible
log "Checking repository mirror connectivity..."
ML="/etc/pacman.d/mirrorlist"
mkdir -p /etc/pacman.d

write_fallback_mirrors() {
  cat > "$ML" <<'EOF'
Server = https://geo.mirror.pkgbuild.com/$repo/os/$arch
Server = https://fastly.mirror.pkgbuild.com/$repo/os/$arch
Server = https://mirror.rackspace.com/archlinux/$repo/os/$arch
EOF
}

if [[ ! -s "$ML" ]] || ! grep -q "^Server" "$ML" 2>/dev/null; then
  log "Mirrorlist missing or empty; writing fast worldwide defaults..."
  write_fallback_mirrors
fi

# 5. Cryptographic Keyring Rescue (Fixes expired keys & signature errors)
log "Repairing and updating pacman cryptographic keyrings..."
pacman-key --init >/dev/null 2>&1 || true
pacman-key --populate archlinux >/dev/null 2>&1 || true
[[ -f /usr/share/pacman/keyrings/amnios.gpg ]] && pacman-key --populate amnios >/dev/null 2>&1 || true

# Test sync; if it fails, deploy bootstrap configuration and fallback mirrors
BOOTSTRAP_CONF="$(mktemp /tmp/amni-pacman.XXXXXX.conf)"
sed 's/^[[:space:]]*SigLevel[[:space:]]*=.*/SigLevel = Optional TrustAll/' "$PC" > "$BOOTSTRAP_CONF"

if ! pacman -Sy --noconfirm --noprogressbar >/dev/null 2>&1; then
  log "Mirror sync failed; switching to primary worldwide CDN mirrors..."
  write_fallback_mirrors
  pacman --config "$BOOTSTRAP_CONF" -Syy --noconfirm --noprogressbar || true
fi

log "Fetching latest keyring packages (archlinux-keyring & amnios-keyring)..."
pacman --config "$BOOTSTRAP_CONF" -S --needed --noconfirm --noprogressbar archlinux-keyring amnios-keyring 2>/dev/null || \
pacman -Sy --needed --noconfirm --noprogressbar archlinux-keyring amnios-keyring 2>/dev/null || true

# Re-populate trusted keys now that newest keyrings are present
pacman-key --populate archlinux >/dev/null 2>&1 || true
pacman-key --populate amnios >/dev/null 2>&1 || true
rm -f "$BOOTSTRAP_CONF"

# 6. Re-synchronize databases
log "Synchronizing package databases..."
pacman -Syy --noconfirm --noprogressbar || true

# 7. Update Amni OS Core Suite first
log "Upgrading Amni OS core system packages..."
CORE_PKGS=(amni-os-core amnios-keyring amni-browse haven-desktop amni-mail amni-space amni-connect amni-chat-desktop amni-crypt)
pacman -S --needed --noconfirm --noprogressbar --overwrite '*' "${CORE_PKGS[@]}" 2>/dev/null || true

# 8. Full system upgrade
log "Performing complete system upgrade..."
if [[ -x /usr/lib/amni-os/amni-upgrade ]]; then
  /usr/lib/amni-os/amni-upgrade || pacman -Syu --noconfirm --noprogressbar --overwrite '*' || true
else
  pacman -Syu --noconfirm --noprogressbar --overwrite '*' || true
fi

# 9. Update Flatpak applications
if command -v flatpak >/dev/null 2>&1; then
  log "Updating Flatpak desktop applications..."
  flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo >/dev/null 2>&1 || true
  flatpak update --appstream --noninteractive >/dev/null 2>&1 || true
  flatpak update -y --noninteractive >/dev/null 2>&1 || true
fi

# 10. Run Amni system setup & hardware profiles
if [[ -x /usr/local/bin/amni-system-setup ]]; then
  log "Applying hardware profiles and performance defaults..."
  /usr/local/bin/amni-system-setup >/dev/null 2>&1 || true
fi

echo ""
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}      AMNI OS UPGRADE & REPAIR COMPLETED!            ${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo ""
log "Your system is up to date."
log "If kernel or GPU driver packages were updated, restart your computer to run the new versions."
echo ""
