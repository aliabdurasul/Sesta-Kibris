# 🔐 Brain 05 — Güvenlik Modeli

## AUTH SİSTEMİ

```typescript
// Kimlik doğrulama akışı:
// 1. Telefon numarası gir → OTP SMS/WhatsApp
// 2. OTP doğrula → JWT üret (access + refresh)
// 3. access token: 15 dakika
// 4. refresh token: 30 gün (rotation)
// 5. Refresh token DB'de saklanır (UserSession)

// JWT payload:
type JWTPayload = {
  sub: string        // userId
  role: UserRole
  tenantId?: string  // MERCHANT için
  sessionId: string  // UserSession.id
  iat: number
  exp: number
}
```

## RBAC (Role-Based Access Control)

```
SUPER_ADMIN:    Her şeye erişim, tenant isolation bypass
ADMIN:          Platform yönetimi, merchant/courier onay, payout
MERCHANT/OWNER: Kendi tenant'ı tam kontrol
MERCHANT/MGR:   Ürün + sipariş yönetimi (ayarlar değil)
MERCHANT/STAFF: Sadece sipariş görüntüle + hazır işaretle
COURIER:        Kendi siparişleri + lokasyon güncelle
CUSTOMER:       Sipariş ver + kendi profilini gör
```

## SUPABASE ROW LEVEL SECURITY

```sql
-- Müşteriler sadece kendi siparişlerini görür
CREATE POLICY "customers_own_orders" ON orders
  FOR SELECT USING (user_id = auth.uid());

-- Merchant kullanıcıları sadece kendi tenant siparişlerini görür
CREATE POLICY "merchant_tenant_orders" ON orders
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM merchant_users
      WHERE user_id = auth.uid()
    )
  );

-- Ürünler: merchant kendi tenant'ını yönetir
CREATE POLICY "merchant_own_products" ON products
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM merchant_users
      WHERE user_id = auth.uid()
      AND role IN ('OWNER', 'MANAGER')
    )
  );

-- Payout: admin ve ilgili merchant
CREATE POLICY "payout_visibility" ON merchant_payouts
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM merchant_users WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
  );
```

## AUDIT LOG (Her Kritik İşlem)

```typescript
// Audit log tetikleyiciler:
const AUDITED_ACTIONS = [
  'ORDER_STATUS_CHANGE',
  'PAYOUT_PROCESSED',
  'REFUND_ISSUED',
  'USER_BLOCKED',
  'TENANT_SUSPENDED',
  'COURIER_SUSPENDED',
  'ADMIN_OVERRIDE',
  'OTP_BYPASS',           // Asla olmamalı — olursa kritik alarm
  'TENANT_CONFIG_CHANGE',
  'FRAUD_RULE_TRIGGERED',
]

export async function auditLog(params: {
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  before?: unknown,
  after?: unknown,
  req?: NextRequest
}) {
  await db.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before as Prisma.InputJsonValue,
      after: params.after as Prisma.InputJsonValue,
      ipAddress: params.req?.ip,
      userAgent: params.req?.headers.get('user-agent'),
    }
  })
}
```

## RATE LİMİTİNG (Upstash Redis)

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = {
  // OTP isteği: 3 dakikada 3 istek
  otp: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, '3 m'),
    prefix: 'rl:otp',
  }),
  // Sipariş oluşturma: 1 dakikada 5 istek
  order: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    prefix: 'rl:order',
  }),
  // API genel: 1 dakikada 60 istek
  api: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    prefix: 'rl:api',
  }),
}

// Middleware'de kullanım:
const { success, limit, remaining } = await ratelimit.api.limit(userId ?? ip)
if (!success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
}
```
