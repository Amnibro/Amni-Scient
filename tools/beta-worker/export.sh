#!/usr/bin/env bash
set -euo pipefail
ENV_FILE="${BETA_ENV:-$HOME/.config/amni/beta-admin.env}"
[ -r "$ENV_FILE" ] || { echo "missing $ENV_FILE" >&2; exit 1; }
set -a; . "$ENV_FILE"; set +a
usage(){ echo "usage: $0 [app] | --emails <app> | --delete <email> [app]" >&2; echo "apps: crypt chat learn map type contaigion humainity haven" >&2; exit 2; }
auth=(-H "Authorization: Bearer $BETA_ADMIN_KEY")
case "${1:-}" in
-h|--help) usage;;
--emails) [ -n "${2:-}" ] || usage; curl -fsS "${auth[@]}" "$BETA_WORKER_URL/export?format=emails&app=$2";;
--delete) [ -n "${2:-}" ] || usage; body=$(python3 -c 'import json,sys;d={"email":sys.argv[1]};len(sys.argv)>2 and d.update(app=sys.argv[2]);print(json.dumps(d))' "${@:2}"); curl -fsS "${auth[@]}" -H 'Content-Type: application/json' -d "$body" "$BETA_WORKER_URL/delete"; echo;;
"") curl -fsS "${auth[@]}" "$BETA_WORKER_URL/export";;
*) curl -fsS "${auth[@]}" "$BETA_WORKER_URL/export?app=$1";;
esac
