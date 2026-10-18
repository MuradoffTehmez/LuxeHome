# Telegram inteqrasiyası və sosial giriş (Telegram, Apple, Facebook) — yerləşdirmə

Bu sənəd kodun yox, **əməliyyatın** mənbəyidir: secret-lər, BotFather / Apple / Meta konsol ayarları, webhook
quraşdırması, yayım ardıcıllığı və geri qaytarma. Arxitektura qeydi `CLAUDE.md` → «Telegram inteqrasiyası və sosial giriş»
bölməsindədir.

> **Heç bir secret repoya, `wrangler.jsonc`-yə və ya `NEXT_PUBLIC_*` dəyişəninə yazılmır.** Hamısı Cloudflare secret-idir
> və mühit üzrə ayrıdır (`--env staging`).

## 1. Miqrasiyalar

| Fayl | Məzmun |
|---|---|
| `migrations/0087_telegram_integration.sql` | `TelegramAccount`, `TelegramLinkToken`, `TelegramChat`, `TelegramUpdate`, `TelegramDelivery`, `SupportTicket`, `SupportMessage` |
| `migrations/0088_social_identities.sql` | `AuthIdentity` (Apple/Facebook), `OAuthSignupToken` |

Hər ikisi yalnız yeni cədvəl yaradır, mövcud sətirlərə toxunmur. CI `main`-ə push-da miqrasiyanı bundle-dan **əvvəl**
tətbiq edir. Əl ilə:

```bash
npm run db:migrate:staging
npm run db:migrate:remote
```

## 2. Cloudflare secret-ləri

| Ad | Məcburi | Təyinat |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | bot üçün | @BotFather tokeni. Webhook, istifadəçi bildirişləri, admin xəbərdarlıqları |
| `TELEGRAM_WEBHOOK_SECRET` | bot üçün | 16–256 simvol, `A–Z a–z 0–9 _ -`. Telegram onu `X-Telegram-Bot-Api-Secret-Token` başlığında göndərir |
| `TELEGRAM_CHAT_ID` | istəyə bağlı | Ofis çatı (köhnə müraciət bildirişi). Olmasa admin xəbərdarlığı yalnız təsdiqlənmiş qruplara gedir |
| `TELEGRAM_CLIENT_ID` | Telegram Login | BotFather → Login Widget-dəki Client ID (bot ID) |
| `TELEGRAM_CLIENT_SECRET` | Telegram Login | BotFather → Login Widget-dəki Client Secret |
| `TELEGRAM_BOT_USERNAME` | istəyə bağlı | Defolt `luxehomeestatebot` (deep-link və komanda adı yoxlaması). Staging botu fərqlidirsə yazın |
| `APPLE_CLIENT_ID` | Apple | Services ID (məs. `az.luxehomeestate.web`) |
| `APPLE_TEAM_ID` | Apple | Apple Developer Team ID |
| `APPLE_KEY_ID` | Apple | «Sign in with Apple» açarının Key ID-si |
| `APPLE_PRIVATE_KEY` | Apple | `.p8` faylının PEM məzmunu (sətir sonları `\n` kimi yazıla bilər) |
| `FACEBOOK_APP_ID` | Facebook | Meta App ID |
| `FACEBOOK_APP_SECRET` | Facebook | Meta App Secret |

Hər provayder öz açarları olmayanda **tam söndürülüdür**: düymə görünmür, marşrut 404 verir.

```bash
# Webhook secret-i yaradın (bir dəfə, mühit üzrə fərqli):
openssl rand -hex 32

npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler secret put TELEGRAM_CLIENT_ID
npx wrangler secret put TELEGRAM_CLIENT_SECRET
npx wrangler secret put APPLE_CLIENT_ID
npx wrangler secret put APPLE_TEAM_ID
npx wrangler secret put APPLE_KEY_ID
npx wrangler secret put APPLE_PRIVATE_KEY
npx wrangler secret put FACEBOOK_APP_ID
npx wrangler secret put FACEBOOK_APP_SECRET
# Staging üçün eyni əmrlər `--env staging` ilə.
```

Dashboard ilə: Workers & Pages → `luxehomeestate` (və ya `luxehomeestate-staging`) → Settings → Variables and Secrets →
Add → **Secret**.

**Eyni bot tokeni iki mühitdə işlənməməlidir.** Telegram bir botda yalnız bir webhook saxlayır — staging eyni tokenlə
webhook qursa production botu susar. Staging üçün ayrıca test botu yaradın və ya staging-də `TELEGRAM_BOT_TOKEN` qoymayın.
Panel başqa ünvana yönəlmiş webhook-u açıq təsdiq olmadan əvəz etmir.

## 3. BotFather

1. `/mybots` → `@luxehomeestatebot` → **Bot Settings → Login Widget** (Telegram Login):
   - Allowed URLs: `https://luxehomeestate.az` və callback `https://luxehomeestate.az/api/auth/telegram/callback`.
   - Client ID / Client Secret → `TELEGRAM_CLIENT_ID` / `TELEGRAM_CLIENT_SECRET`.
   - Advanced → imza alqoritmi **RS256** (defolt), ES256 və ya EdDSA. **ES256K seçməyin** — Workers Web Crypto onu dəstəkləmir.
2. **Group Privacy** açıq qalsın (defolt). Bot qrupda yalnız ona ünvanlanmış komandaları alır.
3. **Allow Groups** — admin xəbərdarlıqları/yayım üçün qrup lazımdırsa açıq.
4. Komandalar: paneldə «Komandaları sinxronlaşdır» `setMyCommands`-i AZ (defolt), EN və RU üçün çağırır. Əl ilə `/setcommands`
   ilə yazılsa, siyahı `src/lib/telegram-bot/copy.ts` → `BOT_COMMANDS` ilə eyni olmalıdır.

## 4. Webhook-un aktivləşdirilməsi

Ən təhlükəsiz yol — **Panel → İdarəetmə → Telegram → «Webhook-u qur»** (`settings:manage`). O:

- URL-i bu mühitin `siteUrl("/api/telegram/webhook")` ünvanına qurur (HTTPS məcburidir);
- `secret_token = TELEGRAM_WEBHOOK_SECRET`, `allowed_updates = message, callback_query, my_chat_member`;
- `drop_pending_updates = false` — webhook qurulmazdan əvvəl gələn mesajlar itmir;
- botda başqa URL varsa, «əvəz edirəm» qutusu işarələnmədən heç nə dəyişmir; audit jurnalına yazılır.

Terminal ekvivalenti (token terminal tarixçəsinə düşməsin deyə dəyişən kimi oxunur):

```bash
read -rs TELEGRAM_BOT_TOKEN && read -rs TELEGRAM_WEBHOOK_SECRET
curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe"
curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H 'content-type: application/json' \
  -d "{\"url\":\"https://luxehomeestate.az/api/telegram/webhook\",\"secret_token\":\"${TELEGRAM_WEBHOOK_SECRET}\",\"allowed_updates\":[\"message\",\"callback_query\",\"my_chat_member\"],\"drop_pending_updates\":false}"
curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

Yoxlama: `getWebhookInfo` → `url` düzgün, `last_error_message` boş, `pending_update_count` azalır. Botda `/start` →
salamlama və menyu gəlməlidir. Paneldə «Bot və webhook vəziyyəti» kartı eyni məlumatı göstərir.

Cloudflare: `/api/telegram/webhook` üçün WAF/Bot Fight Mode qaydası Telegram serverlərinin POST-unu bloklamamalıdır
(Security → Events-də 403 görünərsə, yol üzrə «Skip» qaydası əlavə edin). Marşrut kənar HTML keşindən kənardır (`/api`).

## 5. Apple (Sign in with Apple)

Apple Developer → Certificates, IDs & Profiles:

1. **App ID** — «Sign in with Apple» capability açıq.
2. **Services ID** (`APPLE_CLIENT_ID`) → Configure: Primary App ID, Domains `luxehomeestate.az`, Return URL
   `https://luxehomeestate.az/api/auth/apple/callback`.
3. **Keys** → yeni açar, «Sign in with Apple» → `.p8` yüklənir (bir dəfə!) → `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`.
4. Team ID → `APPLE_TEAM_ID`.

Apple callback-i `form_post` ilə kənar saytdan POST edir — flow cookie-si buna görə `SameSite=None; Secure`-dur.
Apple e-poçtu təsdiqli verir (gizli relay ünvanı da daxil), ona görə mövcud hesaba e-poçt üzrə bağlanır (Google qaydası).

## 6. Facebook (Meta)

Meta for Developers → App → **Facebook Login → Settings**:

- Valid OAuth Redirect URIs: `https://luxehomeestate.az/api/auth/facebook/callback`
- Client OAuth Login və Web OAuth Login açıq, **Enforce HTTPS** açıq, «Use Strict Mode for Redirect URIs» açıq.
- İcazələr: `public_profile`, `email` (Advanced Access üçün App Review lazım ola bilər).
- App **Live** rejimində olmalıdır — Development rejimində yalnız test istifadəçiləri daxil ola bilir.

Facebook e-poçtun təsdiq vəziyyətini vermir, ona görə: mövcud e-poçta avtomatik bağlanmır, yeni hesab isə yalnız e-poçta
göndərilən təsdiq linkindən sonra yaranır.

## 7. Yayım ardıcıllığı

Staging → production, hər mühit öz əmrləri ilə (`CLAUDE.md` qaydası):

```bash
npm run db:migrate:staging
npm run db:taxonomy:staging
npm run deploy:staging
# staging-də: panel → Telegram → vəziyyət kartı, /daxil-ol düymələri, test botu ilə /start
npm run db:migrate:remote
npm run db:taxonomy:remote
npm run deploy
```

Sonra secret-lər (2), BotFather/Apple/Meta ayarları (3, 5, 6), panel → «Webhook-u qur» və «Komandaları sinxronlaşdır».

## 8. Geri qaytarma

| Problem | Addım |
|---|---|
| Bot sorğuları xəta verir | Panel → «Webhook-u sil» (və ya `deleteWebhook` ilə `drop_pending_updates=false`). Update-lər Telegram-da 24 saat gözləyir |
| Telegram/Apple/Facebook girişi problemlidir | Müvafiq `*_CLIENT_ID`/`APP_ID` secret-ini silin — düymə dərhal itir, marşrut 404 olur. Mövcud sessiyalara toxunulmur |
| İstifadəçi bildirişləri dayandırılmalıdır | `TELEGRAM_BOT_TOKEN`-i silin — `notifyAccount` Telegram addımını səssizcə buraxır, e-poçt/saytdaxili kanallar işləyir |
| Kod geri qaytarılır | Əvvəlki worker versiyasına `wrangler rollback`. `0087`/`0088` yalnız yeni cədvəl əlavə edib — köhnə kod onları görmür, sxemi geri almaq lazım deyil |

## 9. Məlumat saxlama

| Məlumat | Müddət |
|---|---|
| `TelegramUpdate` (idempotentlik) | 3 gün |
| `TelegramDelivery` jurnalı | 30 gün; mətn göndərişdən və ya qəti uğursuzluqdan dərhal sonra silinir |
| Bağlama/qeydiyyat tokenləri | Müddəti bitən və ya istifadə olunan kimi gündəlik baxımda silinir |
| Bağlanmış dəstək müraciəti | 90 gün |
| `TelegramAccount`, `AuthIdentity` | Hesab silinəndə cascade ilə |
