#!/usr/bin/env bash
# Lokal stack E2E üçün təzə D1 hazırlayır (#87).
#
# Vəziyyət ayrıca qovluqdadır (`.wrangler/e2e-state`) və hər dəfə sıfırlanır —
# tərtibatçının adi lokal bazasına (`.wrangler/state`) toxunulmur.
#
# Tələb: AUTH_SECRET (worker-in .dev.vars-dakı ilə eyni) və E2E_ADMIN_TOTP_SECRET.
set -euo pipefail

: "${AUTH_SECRET:?AUTH_SECRET təyin edilməlidir}"
: "${E2E_ADMIN_TOTP_SECRET:?E2E_ADMIN_TOTP_SECRET təyin edilməlidir}"

STATE_DIR="${E2E_STATE_DIR:-.wrangler/e2e-state}"
rm -rf "$STATE_DIR"
mkdir -p "$STATE_DIR"

d1() { npx wrangler d1 execute luxehome-db --local --persist-to "$STATE_DIR" "$@" > /dev/null; }

npx wrangler d1 migrations apply DB --local --persist-to "$STATE_DIR" > /dev/null
d1 --file=prisma/seed.sql
d1 --file=prisma/taxonomy.sql
# Staging-dəki kimi nümunə məzmun: ictimai E2E dəsti 300+ elana güvənir.
d1 --file=prisma/demo-content.sql

FIXTURES="$STATE_DIR/e2e-fixtures.sql"
npx tsx scripts/e2e/local-stack-fixtures.ts > "$FIXTURES"
d1 --file="$FIXTURES"

# Worker sirri adi `.dev.vars`-a deyil, ayrıca fayla yazılır — `e2e:local:serve`
# (`serve-local-stack.mjs`) onu oxuyub worker-ə ötürür. Tərtibatçının öz lokal
# parametrləri toxunulmaz qalır.
printf 'AUTH_SECRET=%s
' "$AUTH_SECRET" > "$STATE_DIR/e2e.env"

echo "Lokal stack D1 hazırdır: $STATE_DIR"
