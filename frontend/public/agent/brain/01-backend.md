# 🤖 Agent 01 — @backend

> API routes, business logic, state machine, middleware.
> Veritabanı şemasını değiştirme → @database
> Frontend kodu yazma → @frontend

---

## OKUMA LİSTESİ (Her Oturumda)

```
ZORUNLU:
  brain/01-system-forensics.md    → Ne simüle, ne gerçek?
  brain/02-domain-model.md        → Entity yapısı
  brain/03-order-lifecycle.md     → State machine kuralları
  brain/05-security-model.md      → Auth + tenant scope

KONUYA GÖRE:
  brain/04-payment-architecture.md → Ödeme kodu yazarken
  brain/06-operations-model.md     → Dispatch / SLA kodu
```

---

## KESİN KURALLAR

```typescript
// ✅ Her API route şablonu
export async function POST(req: NextRequest) {
  // 1. Rate limit
  const { success } = await ratelimit.api.limit(getClientIp(req))
  if (!success) return tooManyRequests()

  // 2. Auth
  const session = await requireSession(req)

  // 3. Role kontrol
  requireRole(session, ['MERCHANT', 'ADMIN'])

  // 4. Input validate (Zod)
  const body = parseBody(RequestSchema, await req.json())

  // 5. Tenant scope (ASLA atlanmaz)
  const db = withTenantScope(session.tenantId!)

  // 6. Business logic
  // ...

  // 7. Audit log (kritik işlemler)
  await auditLog({ ... })

  // 8. Response
  return ok({ data: result })
}
```

```typescript
// ✅ State geçişi — sadece bu fonksiyon
await transitionOrder(orderId, 'CONFIRMED', `merchant:${session.userId}`)

// ❌ Direkt DB update — YASAK
await db.order.update({ where: { id }, data: { status: 'CONFIRMED' } })
```

```typescript
// ✅ Tenant scope — her merchant sorgusunda
const db = withTenantScope(session.tenantId!)
const orders = await db.order.findMany(...)

// ❌ Global scope — market izolasyonu yok
const orders = await db.order.findMany({ where: { tenantId: body.tenantId } })
```

---

## STATE MACHINE — TAM İMPLEMENTASYON

```typescript
// src/lib/order/state-machine.ts

import { OrderStatus, Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { runSideEffects } from './side-effects'

export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED:       ['PAID', 'CANCELLED'],
  PAID:         ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:    ['PREPARING', 'CANCELLED'],
  PREPARING:    ['READY', 'CANCELLED'],
  READY:        ['ASSIGNED', 'CANCELLED'],
  ASSIGNED:     ['PICKED_UP', 'READY'],    // READY = yeniden dispatch
  PICKED_UP:    ['IN_TRANSIT'],
  IN_TRANSIT:   ['DELIVERED'],
  DELIVERED:    ['SETTLED', 'DISPUTE_OPEN'],
  SETTLED:      [],
  CANCELLED:    ['REFUNDED'],
  REFUNDED:     [],
  DISPUTE_OPEN: ['SETTLED', 'REFUNDED', 'CANCELLED'],
}

export async function transitionOrder(
  orderId: string,
  to: OrderStatus,
  actor: string,
  note?: string,
  metadata?: Record<string, unknown>,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client = tx ?? db
  const order = await client.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { tenant: { include: { config: true } }, items: true, user: true }
  })

  if (!TRANSITIONS[order.status]?.includes(to)) {
    throw new OrderTransitionError(order.status, to, orderId)
  }

  await (tx
    ? performTransition(tx, order, to, actor, note, metadata)
    : db.$transaction(async (tx2) =>
        performTransition(tx2, order, to, actor, note, metadata)
      )
  )

  // Side effects dışarıda — transaction rollback etmesin
  setImmediate(() => runSideEffects(order, to, actor).catch(console.error))
}

async function performTransition(
  tx: Prisma.TransactionClient,
  order: FullOrder,
  to: OrderStatus,
  actor: string,
  note?: string,
  metadata?: Record<string, unknown>
) {
  await tx.order.update({
    where: { id: order.id },
    data: {
      status: to,
      updatedAt: new Date(),
      ...(to === 'DELIVERED' && { deliveredAt: new Date() }),
      ...(to === 'CANCELLED' && { cancelledAt: new Date(), cancelledBy: actor }),
    }
  })

  await tx.orderStateLog.create({
    data: { orderId: order.id, fromState: order.status, toState: to, actor, note, metadata }
  })
}

export class OrderTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus, orderId: string) {
    super(`Invalid transition: ${from} → ${to} [order: ${orderId}]`)
    this.name = 'OrderTransitionError'
  }
}
```

---

## SIDE EFFECTS (Her State Geçişi İçin)

```typescript
// src/lib/order/side-effects.ts

export async function runSideEffects(order: FullOrder, to: OrderStatus, actor: string) {
  const handlers: Partial<Record<OrderStatus, () => Promise<void>>> = {
    PAID: async () => {
      await notifyMerchant(order.tenantId, order.id, 'NEW_ORDER')
      await scheduleTimeout(order.id, 'MERCHANT_CONFIRM', 10 * 60 * 1000)
    },
    CONFIRMED: async () => {
      await notifyCustomer(order.userId, order.id, 'ORDER_CONFIRMED')
      await cancelTimeout(order.id, 'MERCHANT_CONFIRM')
    },
    READY: async () => {
      await dispatchCourier(order.id)
    },
    ASSIGNED: async () => {
      await notifyCustomer(order.userId, order.id, 'COURIER_ASSIGNED')
      await scheduleTimeout(order.id, 'COURIER_PICKUP', 15 * 60 * 1000)
    },
    PICKED_UP: async () => {
      await notifyCustomer(order.userId, order.id, 'ORDER_PICKED_UP')
      await cancelTimeout(order.id, 'COURIER_PICKUP')
    },
    DELIVERED: async () => {
      await notifyCustomer(order.userId, order.id, 'ORDER_DELIVERED')
      await schedulePayouts(order)
      await updateCourierStats(order)
      await updateMerchantStats(order)
    },
    CANCELLED: async () => {
      await processRefundIfPaid(order)
      await notifyAllParties(order, 'ORDER_CANCELLED')
      await releaseInventory(order)
    },
    SETTLED: async () => {
      await markPayoutsCompleted(order.id)
    },
  }

  await handlers[to]?.()
}
```

---

## API ENDPOINT REHBERİ

```
AUTH:
POST  /api/auth/otp/request    → OTP SMS gönder
POST  /api/auth/otp/verify     → OTP doğrula, JWT döndür
POST  /api/auth/refresh        → Access token yenile
POST  /api/auth/logout         → Session iptal

CUSTOMER:
GET   /api/markets             → Aktif market listesi (public, cached)
GET   /api/markets/[slug]      → Market + ürünler (public, cached)
POST  /api/orders              → Sipariş oluştur (auth, idempotency_key)
GET   /api/orders              → Sipariş geçmişi
GET   /api/orders/[id]         → Sipariş detayı + durum
POST  /api/orders/[id]/cancel  → İptal et
POST  /api/orders/[id]/rate    → Puan ver

MERCHANT:
GET   /api/merchant/orders           → Panel kanban (PAID→READY)
POST  /api/merchant/orders/[id]/confirm   → Onayla
POST  /api/merchant/orders/[id]/preparing → Hazırlamaya başla
POST  /api/merchant/orders/[id]/ready     → Hazır
GET   /api/merchant/products         → Ürün listesi
POST  /api/merchant/products         → Ürün ekle
PUT   /api/merchant/products/[id]    → Ürün güncelle
DELETE /api/merchant/products/[id]   → Ürün sil
GET   /api/merchant/analytics        → Basit istatistikler

COURIER:
PUT   /api/courier/status            → Online/offline
PUT   /api/courier/location          → Lokasyon güncelle
POST  /api/courier/orders/[id]/accept     → Kabul et
POST  /api/courier/orders/[id]/reject     → Reddet
POST  /api/courier/orders/[id]/pickup     → Pickup OTP doğrula
POST  /api/courier/orders/[id]/deliver    → Delivery OTP doğrula
GET   /api/courier/earnings          → Kazanç özeti

ADMIN:
GET   /api/admin/dashboard           → Canlı metrikler
GET   /api/admin/orders              → Tüm siparişler (filtreli)
POST  /api/admin/orders/[id]/override → Manuel state değiştir
GET   /api/admin/payouts             → Bekleyen payout'lar
POST  /api/admin/payouts/[id]/process → Payout onayla
GET   /api/admin/merchants           → Market listesi + sağlık
POST  /api/admin/merchants/[id]/suspend → Market'i kapat
GET   /api/admin/couriers            → Kurye listesi + skor
POST  /api/admin/couriers/[id]/approve  → Kurye onayla

WEBHOOK:
POST  /api/webhooks/iyzico           → Ödeme bildirimi (public, imzalı)
```

---

## ÇIKTI SÖZLEŞMESİ

```markdown
## @backend Output

Tamamlanan dosyalar:
- src/app/api/orders/route.ts ✓
- src/lib/order/state-machine.ts ✓
- src/lib/order/side-effects.ts ✓

Test gereken:
- POST /api/orders → idempotency test
- Tenant scope → cross-tenant erişim testi

Bir sonraki ajan için:
- @payment: iyzico capture logic eksik
- @notification: side-effects'te bildirim stub'ı var, implement edilmeli
```
