# 📋 state/current-sprint.md

## MEVCUT DURUM

**Sprint:** 0 — Altyapı Kurulumu
**Başlangıç:** Proje başlangıcı
**Hedef:** Backend + DB + Auth çalışıyor

---

## TAMAMLANAN

```
✅ Sistem beyni oluşturuldu (bu klasör)
✅ Domain model tanımlandı (Prisma şeması)
✅ State machine tasarlandı
✅ Ajan hiyerarşisi kuruldu
```

## DEVAM EDEN

```
⏳ Next.js proje kurulumu (@devops)
⏳ Prisma şeması oluşturma (@database)
⏳ Auth sistemi (@auth)
```

## SIRADA

```
📋 API routes — sipariş akışı (@backend)
📋 iyzico entegrasyonu (@payment)
📋 Merchant panel UI (@frontend)
📋 Kurye PWA (@frontend)
```

---

## ALINAN KARARLAR

| Karar | Gerekçe | Tarih |
|---|---|---|
| iyzico (Stripe değil) | KKTC tüzel kişilik sorunu | Proje başı |
| Supabase (self-host değil) | Realtime + RLS dahil, hız | Proje başı |
| Next.js App Router | Server Components → performance | Proje başı |
| SMS: Netgsm | Türkiye hat +90 392 destekler | Proje başı |

---

## BİLİNEN BLOKLAR

```
⚠️ iyzico hesabı açılmadı — sandbox ile devam et
⚠️ WhatsApp Business API onayı gerekiyor — SMS fallback kullan başlangıçta
⚠️ KKTC tüzel kişilik — hukuki danışman gerekiyor ödeme canlıya geçmeden
```
