# Saytni internetga chiqarish (deploy)

Bu qo'llanma saytni haqiqiy serverga joylashtirishni qadam-baqadam ko'rsatadi.
Hammasi Docker orqali ishlaydi: baza, Redis, backend, sayt va HTTPS sertifikati.

> **Ogohlantirish.** Docker fayllari bu yerda yozildi, lekin **haqiqiy serverda hali sinalmagan**
> (ishlab chiqish muhitida Docker yo'q edi). Birinchi joylashtirishda xato chiqishi mumkin.
> Shuning uchun avval arzon sinov serverida bir marta sinab ko'ring, keyin haqiqiy domenga o'ting.

---

## 1. Nima kerak

| Narsa | Tavsiya |
|---|---|
| Server | 2 yadro, 4 GB operativ xotira, 40 GB disk. Ubuntu 24.04 |
| Domen | masalan `sanathoca.uz` |
| DNS yozuvlari | `A` yozuv: `sanathoca.uz` → server IP; `A` yozuv: `api.sanathoca.uz` → o'sha IP; `A` yozuv: `www` → o'sha IP |
| Portlar | 80 va 443 ochiq bo'lsin |

**Server qayerda bo'lsin?** 2026-yil mart oyidan beri O'zbekistonda barcha shaxsiy ma'lumotlarni
mamlakat ichida saqlash majburiy emas, lekin shartlari bor. O'quvchilar orasida bolalar bo'lgani uchun
bu masalani **yurist bilan tasdiqlang**. Shubha bo'lsa, mahalliy hosting xavfsizroq tanlov.

## 2. Serverni tayyorlash

Serverga ulaning (`ssh root@SERVER_IP`) va Docker o'rnating:

```bash
curl -fsSL https://get.docker.com | sh
docker --version && docker compose version
```

Oddiy foydalanuvchi yarating (doim `root` bilan ishlash xavfli):

```bash
adduser sanat && usermod -aG docker,sudo sanat
su - sanat
```

## 3. Loyihani serverga ko'chirish

```bash
sudo mkdir -p /srv/sanat-hoca && sudo chown $USER /srv/sanat-hoca
cd /srv/sanat-hoca
# Loyiha arxivini shu papkaga ko'chiring va oching, yoki git bilan oling:
# git clone <sizning-repo> .
```

## 4. Sozlamalarni to'ldirish

```bash
cp deploy/.env.production.example .env
openssl rand -hex 24      # POSTGRES_PASSWORD uchun
openssl rand -hex 24      # REDIS_PASSWORD uchun
openssl rand -base64 48   # JWT_ACCESS_SECRET uchun
openssl rand -base64 48   # TOTP_ENCRYPTION_KEY uchun
nano .env                 # qiymatlarni joylashtiring, domenlarni yozing
chmod 600 .env            # faylni faqat o'zingiz o'qiy olasiz
```

`SITE_DOMAIN`, `API_DOMAIN` va `ACME_EMAIL` ni to'g'ri yozganingizga ishonch hosil qiling:
sertifikat shular bo'yicha olinadi.

## 5. Birinchi ishga tushirish

```bash
docker compose -f docker-compose.prod.yml build          # 5-15 daqiqa
docker compose -f docker-compose.prod.yml up -d db redis
docker compose -f docker-compose.prod.yml run --rm api pnpm db:deploy   # jadvallarni yaratadi
docker compose -f docker-compose.prod.yml run --rm api pnpm db:seed     # lug'at + birinchi admin
docker compose -f docker-compose.prod.yml up -d          # hammasini ishga tushiradi
```

`db:seed` tugagach **`.env` dagi `ADMIN_EMAIL` va `ADMIN_PASSWORD` qatorlarini o'chiring**:

```bash
nano .env   # ikkala qatorni o'chiring
docker compose -f docker-compose.prod.yml up -d api
```

## 6. Ishlayotganini tekshirish

```bash
docker compose -f docker-compose.prod.yml ps        # hammasi "running (healthy)" bo'lsin
curl -I https://sanathoca.uz                        # 200
curl https://api.sanathoca.uz/health                # {"status":"ok"}
```

Brauzerda saytni oching va:
1. Bosh sahifa va 3D masjid ko'rinadimi.
2. Ariza qoldirib ko'ring.
3. Admin bilan kiring → 2FA sozlashga yo'naltiradi → Google Authenticator bilan yoqing.
4. Guruh yarating, o'quvchi qo'shing, vazifa bering.

Sertifikat darhol olinmasa, 1-2 daqiqa kuting va loglarni ko'ring:
`docker compose -f docker-compose.prod.yml logs caddy | tail -30`

## 7. Yangilash

```bash
cd /srv/sanat-hoca
sh deploy/backup.sh                                    # avval zaxira!
git pull                                               # yoki yangi arxivni oching
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm api pnpm db:deploy
docker compose -f docker-compose.prod.yml up -d
```

## 8. Zaxira nusxa (eng muhim qadam)

```bash
sh deploy/backup.sh          # qo'lda
crontab -e                   # har kuni soat 03:00 da:
# 0 3 * * * cd /srv/sanat-hoca && sh deploy/backup.sh >> /var/log/sanat-backup.log 2>&1
```

**Zaxirani boshqa joyga ham ko'chiring.** Server buzilsa, undagi zaxira ham yo'qoladi.

Tiklash:

```bash
docker compose -f docker-compose.prod.yml up -d db
cat /srv/backups/sanat-hoca/sanat-YYYYMMDD-HHMMSS.dump | \
  docker compose -f docker-compose.prod.yml exec -T db \
  pg_restore -U sanat -d sanat_hoca --clean --if-exists
```

Zaxirani yiliga bir marta **haqiqatan tiklab ko'ring**. Sinalmagan zaxira: zaxira emas.

## 9. Muammo chiqsa

```bash
docker compose -f docker-compose.prod.yml logs -f api     # backend loglari
docker compose -f docker-compose.prod.yml logs -f caddy   # sertifikat va proksi
docker compose -f docker-compose.prod.yml restart api     # qayta ishga tushirish
docker stats                                              # xotira va protsessor
```

| Belgi | Ehtimoliy sabab |
|---|---|
| Sayt ochilmaydi, sertifikat xatosi | DNS hali tarqalmagan yoki 80/443 port yopiq |
| `api` konteyneri qayta-qayta o'chadi | `.env` da kalit yo'q yoki qisqa (kamida 32 belgi) |
| Kirish ishlamaydi, cookie saqlanmaydi | `SITE_DOMAIN`/`API_DOMAIN` noto'g'ri yoki HTTPS ishlamayapti |
| `db:deploy` xato beradi | Baza hali tayyor emas: `docker compose ... up -d db` va 10 soniya kuting |

## 10. Ishga tushirishdan oldingi ro'yxat

- [ ] `.env` da hamma kalitlar to'ldirilgan, `chmod 600` qo'yilgan
- [ ] `ADMIN_PASSWORD` seed'dan keyin `.env` dan o'chirilgan
- [ ] Admin va ustoz hisoblarida **2FA yoqilgan**, tiklash kodlari saqlangan
- [ ] Zaxira cron ishlayapti va **boshqa joyga** ham ko'chirilyapti
- [ ] Maxfiylik siyosati (`/maxfiylik`) yurist ko'rigidan o'tgan va to'ldirilgan
- [ ] Lug'atdagi avtomatik tuzatishlar (`docs/lugat/tuzatishlar.csv`) ustoz tomonidan ko'rilgan
- [ ] Serverga faqat SSH kalit bilan kirish, parol bilan kirish o'chirilgan
- [ ] Hali yopilmagan kamchiliklar o'qilgan: `docs/AUTH.md` → "Ma'lum cheklovlar"

## 11. Hali qilinmagan ishlar

Bular sayt ishlashiga to'sqinlik qilmaydi, lekin rejada turibdi:

- **Email/SMS tasdiqlash yo'q**: hozir birov boshqaning emaili bilan ro'yxatdan o'tishi mumkin.
- **Chat, to'lov, Telegram bot** qo'shilmagan.
- Docker fayllari haqiqiy serverda sinalmagan (yuqoridagi ogohlantirishga qarang).
- Nazorat (monitoring) va xatolarni yig'ish tizimi ulanmagan.
