#!/usr/bin/env bash
# Prisma'ni DVIGATEL YUKLAMASDAN ishlatish.
#
# Muammo: ba'zi tarmoqlarda binaries.prisma.sh bloklangan va Prisma CLI
# har qanday buyruqdan OLDIN dvigatelni yuklashga urinadi — hatto
# `validate` yoki `generate` kabi dvigatel kerak bo'lmagan buyruqlarda ham.
#
# Yechim: dvigatel yo'llarini mavjud (bo'sh) fayllarga ko'rsatamiz. Shunda
# CLI yuklashni o'tkazib yuboradi va ishni WASM bilan bajaradi.
#
# ISHLAYDI:   validate, format, generate (turlarni yaratish — typecheck uchun)
# ISHLAMAYDI: migrate dev, migrate diff, db pull, db push, studio
#             — bularga haqiqiy dvigatel kerak. `migrate diff` eng xatarli:
#             u xato bermaydi, JIM-JITLIKDA bo'sh natija qaytaradi.
#             Shuning uchun migratsiyalar bu loyihada qo'lda yoziladi va
#             `pnpm db:check` bilan sxemaga solishtiriladi.
#
# Ishlatish:  ./scripts/prisma-offline.sh generate
set -euo pipefail

FAKE="${TMPDIR:-/tmp}/prisma-offline-engines"
mkdir -p "$FAKE"
: > "$FAKE/schema-engine"
: > "$FAKE/libquery_engine.so.node"
chmod +x "$FAKE/schema-engine"

export PRISMA_SCHEMA_ENGINE_BINARY="$FAKE/schema-engine"
export PRISMA_QUERY_ENGINE_LIBRARY="$FAKE/libquery_engine.so.node"
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

cd "$(dirname "$0")/../apps/api"
exec npx --yes prisma@6.19.3 "$@"
