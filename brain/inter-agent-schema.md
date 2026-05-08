# 📋 Ajan Arası Sözleşme Şeması

## ÇIKTI FORMATI — Her Ajan Bu Formatı Kullanır

```markdown
# @{agent-name} — Görev Çıktısı
Görev ID: {task-id}
Tarih: {timestamp}

## Tamamlanan Dosyalar
- path/to/file.ts ✓ (yeni)
- path/to/other.ts ✓ (değiştirildi)

## Çalıştırılacak Komutlar
```bash
npx prisma migrate dev --name "task_name"
npm run build
```

## Test Gereken Senaryolar
- [ ] Senaryo 1: ...
- [ ] Senaryo 2: ...

## Bir Sonraki Ajan İçin
- @payment: X implement edilmeli
- @frontend: Y bileşeni güncellenmeli

## Kritik Notlar
- Önemli karar: neden X yerine Y seçildi
- Bilinen kısıt: Z şu an manuel yapılıyor
```

---

## AJAN BAĞIMLILIK KURALLARI

```
@database tamamlanmadan:
  → @backend çalışamaz (şema yok)
  → @payment çalışamaz
  → @auth çalışamaz

@backend tamamlanmadan:
  → @frontend çalışamaz (API yok)
  → @qa çalışamaz (test edilecek şey yok)

@auth tamamlanmadan:
  → @frontend paneller çalışamaz (auth guard yok)

Paralel çalışabilenler:
  → @database + @frontend/design-system (şemadan bağımsız UI)
  → @devops + @analytics (altyapı bağımsız)
  → @notification + @risk (bağımsız lib'ler)
```

---

# 🤖 Agent 09 — @devops

## SORUMLULUK ALANI

```
✓ vercel.json, next.config.ts yapılandırması
✓ .env.example (tüm değişkenler)
✓ GitHub Actions CI/CD
✓ Monitoring (Sentry) kurulumu
✓ Supabase project yapılandırması
✓ Redis (Upstash) kurulumu
✓ Domain + SSL
✓ Deployment environments (dev/staging/prod)
```

## CI/CD ŞABLONU

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx prisma generate
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:unit

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx vercel --token ${{ secrets.VERCEL_TOKEN }} --env staging

  deploy-prod:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx prisma migrate deploy
        env: { DATABASE_URL: ${{ secrets.DATABASE_URL }} }
      - run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## ENVIRONMENT STRATEJİSİ

```
development:  local postgres + sandbox iyzico + test SMS
staging:      Supabase staging project + sandbox iyzico + test SMS
production:   Supabase prod + live iyzico + live SMS

Her environment'ın:
  - Ayrı Supabase project'i
  - Ayrı Redis instance'ı
  - Ayrı domain'i: gapgel.app (prod), staging.gapgel.app (staging)
```

---

# 🤖 Agent 10 — @qa

## TEST STRATEJİSİ

```
Unit Tests (Vitest):
  - State machine geçiş mantığı
  - Payout hesaplama
  - Fraud kuralları
  - OTP doğrulama

Integration Tests (Vitest + test DB):
  - API endpoint'ler (end-to-end flow)
  - Tenant izolasyon (Market A'ya Market B erişemiyor)
  - Idempotency (çift sipariş)

E2E Tests (Playwright):
  - Müşteri: sipariş ver → ödeme → takip
  - Merchant: sipariş onayla → hazır işaretle
  - Kurye: kabul et → OTP → teslim
```

## KRİTİK TEST SENARYOLARI

```typescript
// test/order-isolation.test.ts
describe('Tenant Isolation', () => {
  it('merchant A cannot see merchant B orders', async () => {
    const orderA = await createOrder({ tenantId: TENANT_A })
    const response = await GET('/api/merchant/orders', { auth: MERCHANT_B_TOKEN })
    const orders = response.data
    expect(orders.find(o => o.id === orderA.id)).toBeUndefined()
  })
})

// test/state-machine.test.ts
describe('State Machine', () => {
  it('cannot skip states', async () => {
    const order = await createOrder({ status: 'PLACED' })
    await expect(transitionOrder(order.id, 'DELIVERED', 'system'))
      .rejects.toThrow('Invalid transition')
  })

  it('DELIVERED requires OTP verification', async () => {
    const order = await createOrder({ status: 'IN_TRANSIT' })
    // OTP doğrulaması yapılmadan geçiş deneme
    await expect(transitionOrder(order.id, 'DELIVERED', 'courier:x'))
      .rejects.toThrow()
  })
})

// test/payment-idempotency.test.ts
describe('Payment Idempotency', () => {
  it('same idempotency_key creates only one order', async () => {
    const key = 'test-key-123'
    const r1 = await POST('/api/orders', { idempotencyKey: key, ...orderData })
    const r2 = await POST('/api/orders', { idempotencyKey: key, ...orderData })
    expect(r1.data.id).toBe(r2.data.id)
    const count = await db.order.count({ where: { idempotencyKey: key } })
    expect(count).toBe(1)
  })
})
```
