#!/bin/sh
# Bazadan zaxira nusxa oladi va eskilarini o'chiradi.
# Qo'lda:   sh deploy/backup.sh
# Har kuni: crontab -e  ->  0 3 * * * cd /srv/sanat-hoca && sh deploy/backup.sh >> /var/log/sanat-backup.log 2>&1
set -eu

DIR="${BACKUP_DIR:-/srv/backups/sanat-hoca}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
COMPOSE="docker compose -f docker-compose.prod.yml"

# .env dan POSTGRES_* ni o'qiymiz (parol ekranga chiqmaydi)
[ -f .env ] || { echo "Xato: .env fayli topilmadi"; exit 1; }
. ./.env

mkdir -p "$DIR"
FILE="$DIR/sanat-$(date +%Y%m%d-%H%M%S).dump"

# -Fc: Postgres'ning siqilgan formati (pg_restore bilan tiklanadi)
$COMPOSE exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$FILE"

# Bo'sh yoki juda kichik fayl = nosoz zaxira
SIZE=$(wc -c < "$FILE")
if [ "$SIZE" -lt 10000 ]; then
  echo "XATO: zaxira juda kichik ($SIZE bayt), o'chirildi"
  rm -f "$FILE"
  exit 1
fi

find "$DIR" -name 'sanat-*.dump' -type f -mtime +"$KEEP_DAYS" -delete
echo "Zaxira tayyor: $FILE ($SIZE bayt). Saqlanadigan muddat: $KEEP_DAYS kun."
echo "ESLATMA: zaxirani boshqa joyga ham ko'chiring (server buzilsa, nusxa ham yo'qoladi)."
