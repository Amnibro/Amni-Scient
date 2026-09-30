#!/usr/bin/env bash
set -euo pipefail
ENV_FILE="${BETA_ENV:-$HOME/.config/amni/beta-admin.env}"
[ -r "$ENV_FILE" ] || { echo "missing $ENV_FILE" >&2; exit 1; }
set -a; . "$ENV_FILE"; set +a
usage(){ echo "usage: $0 [app] | --emails <app> | --delete <email> [app] | --suppressed [--emails] | --suppress <email> [link|reply|admin|bounce] [--remove-testing] | --unsuppress <email>" >&2; echo "apps: crypt chat learn map type contaigion humainity haven" >&2; exit 2; }
auth=(-H "Authorization: Bearer $BETA_ADMIN_KEY")
case "${1:-}" in
-h|--help) usage;;
--emails) [ -n "${2:-}" ] || usage; curl -fsS "${auth[@]}" "$BETA_WORKER_URL/export?format=emails&app=$2";;
--delete) [ -n "${2:-}" ] || usage; body=$(python3 -c 'import json,sys;d={"email":sys.argv[1]};len(sys.argv)>2 and d.update(app=sys.argv[2]);print(json.dumps(d))' "${@:2}"); curl -fsS "${auth[@]}" -H 'Content-Type: application/json' -d "$body" "$BETA_WORKER_URL/delete"; echo;;
--suppressed) curl -fsS "${auth[@]}" "$BETA_WORKER_URL/admin/suppressed$([ "${2:-}" = --emails ] && echo '?format=emails')"; [ "${2:-}" = --emails ] || echo;;
--suppress) [ -n "${2:-}" ] || usage; body=$(python3 -c 'import json,sys;a=sys.argv[1:];print(json.dumps({"email":a[0],"source":next((x for x in a[1:] if not x.startswith("-")),"admin"),"remove_testing":"--remove-testing" in a}))' "${@:2}"); curl -fsS "${auth[@]}" -H 'Content-Type: application/json' -d "$body" "$BETA_WORKER_URL/admin/suppress"; echo;;
--unsuppress) [ -n "${2:-}" ] || usage; body=$(python3 -c 'import json,sys;print(json.dumps({"email":sys.argv[1]}))' "$2"); curl -fsS "${auth[@]}" -H 'Content-Type: application/json' -d "$body" "$BETA_WORKER_URL/admin/unsuppress"; echo;;
"") curl -fsS "${auth[@]}" "$BETA_WORKER_URL/export";;
*) curl -fsS "${auth[@]}" "$BETA_WORKER_URL/export?app=$1";;
esac
