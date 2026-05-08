# 🤖 Agent 12 — @ai-intelligence
## GapGel Yapay Zeka Katmanı

> Bu ajan, platformun üzerinde çalışan AI agent'larını tasarlar ve yönetir.
> Gerçek kodu @backend/@frontend yazar. Bu ajan plan + kural + strateji üretir.

---

## AI AJAN HARİTASI

```
GapGel Intelligence Layer
│
├── 🔍 DispatchOptimizer         → En iyi kuryeyi en iyi siparişe ata
├── 📊 MerchantAdvisor           → Market'e performans önerileri
├── 🛡️  FraudGuard               → Gerçek zamanlı fraud tespiti
├── 📦 DemandForecaster          → Talep tahmin + stok uyarısı
├── 💬 SupportAgent              → Müşteri destek ilk hat
├── 📈 GrowthAnalyzer            → Büyüme fırsatı tespiti
└── 🗺️  LogisticsOptimizer       → Teslimat bölgesi + ücret optimizasyonu
```

---

## 🔍 DispatchOptimizer

**Amacı:** Sipariş hazır olduğunda en uygun kuryeyi belirle.

**Tükettiği Veri:**
```
- Kurye konumu (Redis, her 15s güncellenir)
- Kurye mevcut yükü (aktif sipariş var mı?)
- Kurye güvenilirlik skoru (CourierStats.reliabilityScore)
- Market konumu
- Teslimat adresi
- Günün saati (peak saatler)
- Hava durumu (gelecekte)
```

**MVP Algoritması (Kural Tabanlı):**
```typescript
export async function selectBestCourier(orderId: string): Promise<string | null> {
  const order = await getOrderWithAddresses(orderId)
  const candidates = await getAvailableCouriers()

  if (candidates.length === 0) return null

  const scored = candidates.map(c => ({
    courierId: c.id,
    score: calculateScore(c, order),
  }))

  scored.sort((a, b) => b.score - a.score)
  return scored[0].courierId
}

function calculateScore(courier: CourierWithStats, order: Order): number {
  const distanceKm = haversine(
    [courier.currentLat!, courier.currentLng!],
    [order.tenant.latitude!, order.tenant.longitude!]
  )

  const distanceScore = Math.max(0, 10 - distanceKm * 2)   // 5km = 0 puan
  const reliabilityScore = courier.stats.reliabilityScore / 10 // 0-10
  const ratingScore = courier.stats.avgRating * 1.5          // 0-7.5

  return distanceScore + reliabilityScore + ratingScore
}
```

**V2 — ML Tabanlı:**
```
Model: XGBoost (veya basit regression)
Features: mesafe, saat, güvenilirlik, hava, market ETA, teslimat mesafesi
Target: delivery_on_time (binary)
Training: her 100 completed delivery sonrası retrain
```

**Otorite:**
- ✅ Kurye öneri üret
- ✅ Dispatch otomatik tetikle
- ❌ Kuryeyi zorla atama (kabul etmezse başkasına geç)

---

## 🛡️ FraudGuard

**Amacı:** Gerçek zamanlı fraud tespiti ve önleme.

**Kural Seti (MVP):**
```typescript
export const FRAUD_RULES: FraudRule[] = [
  {
    id: 'NEW_ACCOUNT_HIGH_VALUE',
    check: async (ctx) => {
      return ctx.accountAgeDays < 1 && ctx.orderAmount > 500
    },
    action: 'REQUIRE_MANUAL_REVIEW',
    severity: 'HIGH',
    autoBlock: false,
  },
  {
    id: 'RAPID_ORDER_BURST',
    check: async (ctx) => {
      const count = await countRecentOrders(ctx.userId, '10m')
      return count >= 5
    },
    action: 'RATE_LIMIT_USER',
    severity: 'MEDIUM',
    autoBlock: true,
  },
  {
    id: 'MULTIPLE_FAILED_PAYMENTS',
    check: async (ctx) => {
      const fails = await countFailedPayments(ctx.ip, '1h')
      return fails >= 3
    },
    action: 'BLOCK_IP_1H',
    severity: 'MEDIUM',
    autoBlock: true,
  },
  {
    id: 'DELIVERY_OTP_BYPASS_ATTEMPT',
    check: async (ctx) => {
      const verification = await getVerification(ctx.orderId)
      return verification?.deliveryFailedAttempts >= 5
    },
    action: 'HOLD_COURIER_PAYOUT_ALERT_ADMIN',
    severity: 'CRITICAL',
    autoBlock: true,
  },
  {
    id: 'UNUSUAL_ORDER_VALUE',
    check: async (ctx) => {
      const avg = await getAvgOrderValue(ctx.userId)
      return avg > 0 && ctx.orderAmount > avg * 5
    },
    action: 'FLAG_FOR_REVIEW',
    severity: 'LOW',
    autoBlock: false,
  },
  {
    id: 'COURIER_ABANDONMENT_PATTERN',
    check: async (ctx) => {
      const stats = await getCourierStats(ctx.courierId)
      return stats.abandonedDeliveries >= 2
    },
    action: 'SUSPEND_COURIER_REVIEW',
    severity: 'HIGH',
    autoBlock: true,
  },
]

// Otomatik aksiyonlar
export const FRAUD_ACTIONS: Record<string, (ctx: FraudContext) => Promise<void>> = {
  REQUIRE_MANUAL_REVIEW: async (ctx) => {
    await alertAdmin('MANUAL_REVIEW_REQUIRED', ctx)
    await holdOrder(ctx.orderId)
  },
  RATE_LIMIT_USER: async (ctx) => {
    await redis.setex(`rl:user:${ctx.userId}`, 3600, 'blocked')
  },
  BLOCK_IP_1H: async (ctx) => {
    await redis.setex(`rl:ip:${ctx.ip}`, 3600, 'blocked')
  },
  HOLD_COURIER_PAYOUT_ALERT_ADMIN: async (ctx) => {
    await db.courierPayout.updateMany({
      where: { courierId: ctx.courierId, status: 'PENDING' },
      data: { status: 'BLOCKED', blockedReason: 'OTP bypass attempt' }
    })
    await alertAdmin('CRITICAL_OTP_BYPASS', ctx)
  },
  SUSPEND_COURIER_REVIEW: async (ctx) => {
    await db.courierProfile.update({
      where: { id: ctx.courierId },
      data: { suspendedUntil: new Date(Date.now() + 48 * 60 * 60 * 1000) }
    })
    await notifyCourierSuspension(ctx.courierId)
  },
}
```

**Otorite:**
- ✅ Kullanıcıyı rate-limit et (otomatik)
- ✅ IP'yi geçici bloke et (otomatik)
- ✅ Kurye ödemesini bloke et (otomatik)
- ✅ Admin'e alert gönder (otomatik)
- ❌ Kullanıcıyı kalıcı bloke et (admin kararı)
- ❌ Para iadesi yap (admin kararı)

---

## 📊 MerchantAdvisor

**Amacı:** Market'e haftalık performans önerileri üret.

**Tükettiği Veri:**
```
- Ortalama onay süresi (target: <5 dk)
- Onaylama oranı (target: >90%)
- Kısmi teslimat oranı (target: <5%)
- Müşteri puanı trendi
- En çok satılan ürünler
- En çok iade edilen ürünler
- Peak saat dağılımı
```

**Ürettiği Aksiyonlar:**
```
"Salı öğleden sonra 13-15 arası 8 sipariş iptal ettin.
Bu saatlerde personel azlığı olabilir. Öğle molasını
12-14'e kaydırmayı dene."

"Domates ürünün bu ay 3 kez 'stokta yok' nedeniyle
iptal oldu. Minimum stok seviyesi belirle."

"Ortalama hazırlık süren 22 dk — platform ortalaması 15 dk.
İlk 5 üründe pre-pack dene."
```

**Otorite:**
- ✅ Öneri üret ve merchant panelinde göster
- ✅ Performans puanı hesapla (TenantHealthScore)
- ❌ Market'i otomatik kapat (admin kararı)

---

## 💬 SupportAgent

**Amacı:** İlk hat müşteri desteği — basit soruları otomatik çöz.

**Kapsamı:**
```
✅ "Siparişim nerede?" → sipariş durumu döndür
✅ "Ne zaman gelecek?" → ETA hesapla
✅ "Ödeme alındı mı?" → payment status döndür
✅ "İptal etmek istiyorum" → iptal politikasını açıkla, PAID öncesi otomatik iptal
❌ "Param nerede?" → Admin'e eskalat
❌ "Kurye bana kötü davrandı" → Admin'e eskalat
❌ Para iadesi → Admin'e eskalat
```

**Implementasyon (Anthropic API kullanarak):**
```typescript
// Bu ajan Claude claude-sonnet-4-6 kullanır
export async function supportAgentResponse(
  userId: string,
  message: string,
  orderId?: string
): Promise<string> {
  const context = await buildSupportContext(userId, orderId)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SUPPORT_AGENT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Kullanıcı bilgisi: ${JSON.stringify(context)}\n\nKullanıcı mesajı: ${message}`
        }
      ]
    })
  })

  const data = await response.json()
  return data.content[0].text
}

const SUPPORT_AGENT_SYSTEM_PROMPT = `
Sen GapGel müşteri destek asistanısın.
Sadece Türkçe yanıt ver.
Şu aksiyonları yapabilirsin: sipariş durumu ver, ETA hesapla, iptal linkini ver.
Şu aksiyonları YAPMAZSIN: iade işle, kurye hakkında karar ver, ödeme işle.
Yapamadığın durumlarda: "Sizi insan destek ekibine bağlıyorum" de ve eskalat et.
Her zaman kibarca ve kısa yanıt ver (max 3 cümle).
`
```

---

## AI GÜVENLİK SINIRLARSI

```
OTOMATIK YAPABİLİR (İnsan onayı gerekmez):
  ✅ Öneri üret ve göster
  ✅ Rate limit uygula
  ✅ Bildirim gönder
  ✅ Skoru güncelle
  ✅ Flag / işaretle
  ✅ Admin'e alert at

İNSAN ONAYI GEREKTİRİR:
  ⚠️ Kullanıcı/merchant/kurye hesabını kapat
  ⚠️ Para iadesi işle
  ⚠️ Payout bloke et
  ⚠️ Anlaşmazlık çöz

ASLA YAPAMAZ:
  ❌ Ödeme API'sine doğrudan para hareketi
  ❌ Audit log sil veya değiştir
  ❌ Başka tenant'ın verisine eriş
  ❌ Admin şifresini değiştir
  ❌ Sistem konfigürasyonunu değiştir
```
