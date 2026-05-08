# 🧠 CLAUDE.md — GapGel Orkestratör Beyni
## Hyperlocal Marketplace Operating System



---

## ⚡ ORKESTRATÖR KİMLİĞİ

Sen bu sistemin baş mimarısın.
Kullanıcıdan gelen her görevi **ayrıştır → doğru ajana devret → sonuçları entegre et**.
Hiçbir şeyi kendin yazmaya çalışma. Doğru ajanı çalıştır.

```
ALTIN KURAL:
"Hangi ajan bu işi en iyi yapar?" → Onu çalıştır.
"İki ajan bu işi birlikte mi yapmalı?" → Paralel çalıştır.
"Sıralı bağımlılık var mı?" → Pipeline oluştur.
```

---

## 🗺️ SİSTEM HARİTASI

```
gapgel-brain/
├── CLAUDE.md                     ← Sen buradasın (Orkestratör)
│
├── agents/                       ← Ajan Beyinleri
│   ├── 01-backend.md             ← API, business logic, state machine
│   ├── 02-database.md            ← Prisma, migration, RLS, queries
│   ├── 03-frontend.md            ← Next.js, bileşenler, sayfalar
│   ├── 04-auth.md                ← JWT, OTP, RBAC, session
│   ├── 05-payment.md             ← iyzico/Stripe, ledger, payout
│   ├── 06-courier.md             ← Dispatch, OTP, tracking, scoring
│   ├── 07-risk.md                ← Fraud, abuse, rate-limit, audit
│   ├── 08-notification.md        ← WhatsApp, SMS, push, email
│   ├── 09-devops.md              ← Deploy, CI/CD, monitoring, env
│   ├── 10-qa.md                  ← Test stratejisi, e2e, unit
│   ├── 11-analytics.md           ← PostHog, events, funnels, metrics
│   └── 12-ai-intelligence.md     ← AI ajan katmanı planı
│
├── brain/                        ← İş Mantığı Gerçekleri
│   ├── 01-system-forensics.md    ← Mevcut sistem analizi
│   ├── 02-domain-model.md        ← Tüm entity'ler + ilişkiler
│   ├── 03-order-lifecycle.md     ← State machine (tam)
│   ├── 04-payment-architecture.md← Finansal mimari
│   ├── 05-security-model.md      ← Auth + RLS + audit
│   ├── 06-operations-model.md    ← SLA, dispatch, onboarding
│   ├── 07-tech-stack.md          ← Stack + gerekçeleri
│   ├── 08-mvp-to-scale.md        ← 30/90/180 gün roadmap
│   └── 09-growth-system.md       ← SEO, referral, cold-start
│
├── skills/                       ← Kod şablonları + pattern'ler
│   ├── api-route.ts.template
│   ├── state-machine.ts.template
│   ├── prisma-query.ts.template
│   └── test.ts.template
│
├── contracts/                    ← Ajan arası sözleşmeler
│   └── inter-agent-schema.md
│
└── state/
    ├── current-sprint.md
    └── decisions-log.md
```

---

## 🤖 AJAN KARAR MATRİSİ

| Kullanıcı İsteği | Birincil Ajan | İkincil Ajan | Sıra |
|---|---|---|---|
| Veritabanı şeması / model değişikliği | `@database` | `@backend` | Sıralı |
| API endpoint yaz | `@backend` | `@qa` | Sıralı |
| UI / sayfa / bileşen | `@frontend` | `@qa` | Sıralı |
| Auth sistemi | `@auth` | `@backend` | Sıralı |
| Ödeme entegrasyonu | `@payment` | `@backend` | Sıralı |
| Kurye sistemi | `@courier` | `@backend` | Paralel |
| Fraud kuralı | `@risk` | `@backend` | Sıralı |
| Bildirim sistemi | `@notification` | `@backend` | Paralel |
| Deploy / CI | `@devops` | — | Bağımsız |
| Test yaz | `@qa` | — | Bağımsız |
| Metrik / analytics | `@analytics` | `@backend` | Sıralı |
| AI katmanı planla | `@ai-intelligence` | — | Bağımsız |
| Tam özellik (uçtan uca) | `@backend` + `@frontend` + `@qa` | `@database` | Pipeline |

---

## 📋 ORKESTRASYON PROTOKOLÜ

### Her Görev Öncesi:
```
1. state/current-sprint.md OKU → ne yapılıyor?
2. brain/ klasöründen ilgili domain dosyasını OKU
3. Hangi ajanlar gerekli? → agents/{name}.md OKU
4. Bağımlılık sırası nedir?
5. Task tool ile ajanları çalıştır
6. contracts/{task-id}-output.md bekle
7. Entegre et → kullanıcıya özetle
8. state/decisions-log.md güncelle
```

### Pipeline Örneği — "Sipariş API'si yaz":
```
Step 1: @database → schema doğrula, Order fields tam mı?
Step 2: @backend  → POST /api/orders endpoint yaz (db output'unu kullan)
Step 3: @auth     → endpoint'e middleware ekle
Step 4: @payment  → ödeme capture logic ekle
Step 5: @notification → sipariş bildirimi tetikle
Step 6: @qa       → endpoint testi yaz
```

### Paralel Örnek — "Merchant + Courier paneli":
```
Paralel A: @frontend → Merchant panel UI
Paralel B: @frontend → Courier app UI
Sonra: @qa → her ikisini test et
```

---

## 🔒 SİSTEM GENELİ DOKUNULMAZ KURALLAR

Bu kurallar HİÇBİR ajan tarafından ihlal edilemez:

```
[GÜVENLIK-01] tenant_id asla client request'ten gelmez
              → Her zaman server-side session'dan inject edilir

[GÜVENLIK-02] OTP bypass edilemez
              → DELIVERED state'i OTP.deliveryVerifiedAt olmadan set edilemez

[FİNANS-01]  Payout sadece DELIVERED → SETTLED geçişinde tetiklenir
              → Başka hiçbir yerde payout komutu çalıştırılamaz

[FİNANS-02]  Float = Σ(captured) - Σ(settled)
              → Bu rakam asla negatif olamaz, günlük audit edilir

[VERİ-01]    State geçişleri sadece transitionOrder() ile yapılır
              → db.order.update({status:...}) direkt çağrısı yasak

[VERİ-02]    Her state geçişi OrderStateLog'a yazılır
              → actor, timestamp, metadata zorunlu

[MİMARİ-01]  Multi-tenant: Market A'nın verisi Market B'ye asla görünmez
              → withTenantScope() her merchant sorgusunda zorunlu

[MİMARİ-02]  Eski LocalStorage/simülasyon kodu temizlenir
              → Gerçek backend çalışmadan simüle edilen hiçbir şey production'a çıkmaz
```

---

## 🔬 MEVCUT SİSTEM DURUM TESPİTİ

> Zip boş geldi — sistemin mevcut durumu belgelenen spec'e göre:

| Bileşen | Gerçek mi? | Durum | Aksiyon |
|---|---|---|---|
| Customer UI | ✅ Prototip var | LocalStorage tabanlı | Yeniden yaz (real backend) |
| Merchant Panel | ✅ Prototip var | Simüle | Yeniden yaz |
| Courier App | ✅ Prototip var | Simüle | Yeniden yaz |
| Admin Panel | ✅ Prototip var | Simüle | Yeniden yaz |
| Auth | ❌ Yok | UI switcher ile rol değişimi | @auth ile inşa et |
| Backend API | ❌ Yok | Simüle | @backend ile inşa et |
| Database | ❌ Yok | LocalStorage | @database ile inşa et |
| Payment | ❌ Yok | Simüle | @payment ile inşa et |
| Courier Dispatch | ❌ Yok | Simüle | @courier ile inşa et |
| Notifications | ❌ Yok | Yok | @notification ile inşa et |
| Order State Machine | ⚠️ UI'da var | Frontend-only | @backend'e taşı |

**Kurtarılacak:** UX flow'ları, sayfa yapısı, interaction pattern'leri
**Silinecek:** localStorage persistence, simüle payment, role switcher, fake state

---

## 🏗️ HEDEF MİMARİ (Gerçek Prodüksiyon)

```
┌──────────────────────────────────────────────────────────────────┐
│                         CDN / EDGE (Cloudflare)                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                    NEXT.JS APP (Vercel)                           │
│  /app/(customer)   /app/(merchant)   /app/(courier)   /app/(admin)│
│  Server Components + Client Components + PWA                     │
└────┬──────────────┬────────────────┬──────────────────┬──────────┘
     │              │                │                  │
     ▼              ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│         Next.js API Routes → Edge Functions (Supabase)           │
│  /api/orders  /api/auth  /api/merchant  /api/courier  /api/admin │
│  Auth Middleware → Tenant Middleware → Business Logic             │
└────────────────────────────┬────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
   ┌────────────┐    ┌──────────────┐   ┌──────────────┐
   │ PostgreSQL │    │    Redis     │   │   BullMQ     │
   │ (Supabase) │    │  (Upstash)   │   │  (Queues)    │
   │ RLS aktif  │    │ Session/Cache│   │ Notif/Payout │
   └─────┬──────┘    └──────────────┘   └──────────────┘
         │
   ┌─────▼──────────────────────────────────────────────┐
   │           REALTIME LAYER (Supabase Realtime)        │
   │  Sipariş güncellemeleri, kurye lokasyonu, admin live │
   └────────────────────────────────────────────────────┘

EXTERNAL:
├── iyzico (Ödeme)
├── WhatsApp Business API (Bildirim)
├── Netgsm (SMS / OTP)
├── Cloudinary (Medya)
└── PostHog (Analytics)
```
