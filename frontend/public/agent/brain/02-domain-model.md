# 🧠 Brain 02 — Domain Model (Tam Prisma Şeması)

## ENTİTY İLİŞKİ HARİTASI

```
Platform
  └── Tenant (Market/Mağaza)
        ├── TenantConfig (komisyon, payout, WhatsApp)
        ├── TenantZone (teslimat bölgesi polygonları)
        ├── Product → ProductCategory
        ├── MerchantUser (owner/manager/staff)
        ├── Order ──────────────────────────────┐
        │     ├── OrderItem                     │
        │     ├── OrderStateLog                 │
        │     ├── DeliveryVerification (OTP)    │
        │     ├── PaymentTransaction            │
        │     ├── MerchantPayout               │
        │     ├── CourierPayout                │
        │     ├── OrderDispute                 │
        │     └── OrderRating                  │
        └── MerchantRating                     │
                                               │
  User (Customer)                              │
    ├── CustomerProfile                        │
    ├── Address (çoklu)                        │
    └── Order ──────────────────────────────────┘
                                               │
  CourierProfile                              │
    ├── CourierStats                           │
    ├── CourierShift                           │
    ├── CourierZone                            │
    └── Order ─────────────────────────────────┘
```

---

## TAM PRİSMA ŞEMASI

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ═══════════════════════════════════════
// CORE USER MODEL
// ═══════════════════════════════════════

model User {
  id            String    @id @default(cuid())
  phone         String    @unique
  email         String?   @unique
  name          String?
  avatarUrl     String?
  role          UserRole  @default(CUSTOMER)
  isVerified    Boolean   @default(false)
  isBlocked     Boolean   @default(false)
  blockedReason String?
  blockedAt     DateTime?
  locale        String    @default("tr")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastActiveAt  DateTime?

  // Relations
  profile        CustomerProfile?
  addresses      Address[]
  orders         Order[]
  merchantUsers  MerchantUser[]
  courierProfile CourierProfile?
  sessions       UserSession[]
  auditLogs      AuditLog[]

  @@index([phone])
  @@index([role])
  @@map("users")
}

model UserSession {
  id           String   @id @default(cuid())
  userId       String
  token        String   @unique
  deviceInfo   String?
  ipAddress    String?
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  revokedAt    DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@map("user_sessions")
}

model CustomerProfile {
  id              String  @id @default(cuid())
  userId          String  @unique
  totalOrders     Int     @default(0)
  totalSpent      Float   @default(0)
  avgOrderValue   Float   @default(0)
  loyaltyPoints   Int     @default(0)
  referralCode    String? @unique
  referredBy      String?
  acquisitionChannel String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("customer_profiles")
}

model Address {
  id            String   @id @default(cuid())
  userId        String
  label         String   // "Ev" | "İş" | "Okul" | "Diğer"
  fullAddress   String
  apartment     String?
  floor         String?
  buildingCode  String?
  district      String?
  city          String   @default("Lefkoşa")
  latitude      Float?
  longitude     Float?
  isDefault     Boolean  @default(false)
  deliveryNotes String?
  createdAt     DateTime @default(now())

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders Order[]

  @@index([userId])
  @@map("addresses")
}

// ═══════════════════════════════════════
// TENANT (MARKET)
// ═══════════════════════════════════════

model Tenant {
  id               String         @id @default(cuid())
  slug             String         @unique
  name             String
  description      String?
  category         TenantCategory @default(GROCERY)
  logoUrl          String?
  coverImageUrl    String?
  phone            String
  whatsappNumber   String?
  address          String
  district         String?
  city             String         @default("Lefkoşa")
  latitude         Float?
  longitude        Float?
  isActive         Boolean        @default(false)  // Admin onaylar
  isVerified       Boolean        @default(false)
  isAcceptingOrders Boolean       @default(true)
  avgPrepMinutes   Int            @default(15)
  minOrderAmount   Float          @default(50)
  maxDeliveryRadius Float         @default(5.0)   // km
  healthScore      Float          @default(100)   // 0-100
  suspendedUntil   DateTime?
  suspendedReason  String?
  totalOrders      Int            @default(0)
  avgRating        Float          @default(0)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  config         TenantConfig?
  zones          TenantZone[]
  products       Product[]
  categories     ProductCategory[]
  orders         Order[]
  merchantUsers  MerchantUser[]
  merchantPayouts MerchantPayout[]
  ratings        MerchantRating[]

  @@index([slug])
  @@index([isActive, city])
  @@map("tenants")
}

model TenantConfig {
  id                    String       @id @default(cuid())
  tenantId              String       @unique
  commissionRate        Float        @default(0.15)
  payoutSchedule        PayoutSchedule @default(SAME_DAY)
  autoConfirmOrders     Boolean      @default(false)
  notifOnNewOrder       Boolean      @default(true)
  notifChannel          NotifChannel @default(WHATSAPP)
  bankName              String?
  bankIban              String?      // Encrypted at application layer
  taxId                 String?
  taxOffice             String?
  legalName             String?
  onboardingCompletedAt DateTime?

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  @@map("tenant_configs")
}

model TenantZone {
  id         String @id @default(cuid())
  tenantId   String
  name       String
  polygon    Json   // GeoJSON polygon
  isActive   Boolean @default(true)
  extraFee   Float  @default(0)

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  @@map("tenant_zones")
}

model MerchantUser {
  id       String       @id @default(cuid())
  tenantId String
  userId   String
  role     MerchantRole @default(STAFF)
  isActive Boolean      @default(true)
  joinedAt DateTime     @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([tenantId, userId])
  @@map("merchant_users")
}

// ═══════════════════════════════════════
// PRODUCT
// ═══════════════════════════════════════

model ProductCategory {
  id        String    @id @default(cuid())
  tenantId  String
  name      String
  emoji     String?
  imageUrl  String?
  sortOrder Int       @default(0)
  isActive  Boolean   @default(true)

  tenant   Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  products Product[]

  @@index([tenantId])
  @@map("product_categories")
}

model Product {
  id           String   @id @default(cuid())
  tenantId     String
  categoryId   String?
  name         String
  description  String?
  imageUrl     String?
  price        Float
  comparePrice Float?   // Eski fiyat (üstü çizili gösterim)
  unit         String   @default("adet")
  barcode      String?
  stock        Int?     // null = sınırsız
  lowStockThreshold Int? // Bu altına düşünce uyarı
  isAvailable  Boolean  @default(true)
  isFeatured   Boolean  @default(false)
  sortOrder    Int      @default(0)
  totalSold    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  tenant     Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  category   ProductCategory? @relation(fields: [categoryId], references: [id])
  orderItems OrderItem[]

  @@index([tenantId, isAvailable])
  @@index([tenantId, categoryId])
  @@map("products")
}

// ═══════════════════════════════════════
// ORDER (Merkez Entity)
// ═══════════════════════════════════════

model Order {
  id               String        @id @default(cuid())
  orderNumber      String        @unique  // ORD-2024-00001
  idempotencyKey   String        @unique  // Çift sipariş koruması
  userId           String
  tenantId         String
  courierId        String?
  addressId        String

  status           OrderStatus   @default(PLACED)
  subtotal         Float
  deliveryFee      Float
  discount         Float         @default(0)
  promoCode        String?
  total            Float

  paymentStatus    PaymentStatus @default(PENDING)
  paymentMethod    String?

  prepTimeMinutes  Int?
  estimatedPickupAt  DateTime?
  estimatedDeliveryAt DateTime?
  deliveredAt      DateTime?

  specialInstructions String?
  cancellationReason  String?
  cancelledBy         String?    // user_id | "system" | "admin:id"
  cancelledAt         DateTime?

  // Partial delivery support
  hasPartialDelivery Boolean @default(false)

  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  // Relations
  user         User                  @relation(fields: [userId], references: [id])
  tenant       Tenant                @relation(fields: [tenantId], references: [id])
  courier      CourierProfile?       @relation(fields: [courierId], references: [id])
  address      Address               @relation(fields: [addressId], references: [id])
  items        OrderItem[]
  stateHistory OrderStateLog[]
  payment      PaymentTransaction?
  verification DeliveryVerification?
  dispute      OrderDispute?
  merchantPayout MerchantPayout?
  courierPayout  CourierPayout?
  rating       OrderRating?

  @@index([userId])
  @@index([tenantId, status])
  @@index([courierId, status])
  @@index([status, createdAt])
  @@map("orders")
}

model OrderItem {
  id                String  @id @default(cuid())
  orderId           String
  productId         String
  productName       String  // Snapshot — ürün silinse de korunur
  productImageUrl   String?
  quantity          Int
  unitPrice         Float   // Sipariş anı fiyatı (frozen)
  totalPrice        Float
  deliveredQuantity Int?    // null = tam, sayı = kısmi

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@map("order_items")
}

model OrderStateLog {
  id        String       @id @default(cuid())
  orderId   String
  fromState OrderStatus?
  toState   OrderStatus
  actor     String       // "system" | "admin:id" | "merchant:id" | "courier:id" | "customer:id"
  note      String?
  metadata  Json?
  createdAt DateTime     @default(now())

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@map("order_state_logs")
}

model DeliveryVerification {
  id                    String    @id @default(cuid())
  orderId               String    @unique
  pickupOtp             String    // bcrypt hashed
  deliveryOtp           String    // bcrypt hashed
  pickupVerifiedAt      DateTime?
  deliveryVerifiedAt    DateTime?
  pickupVerifiedBy      String?
  deliveryVerifiedBy    String?
  pickupFailedAttempts  Int       @default(0)
  deliveryFailedAttempts Int      @default(0)

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  @@map("delivery_verifications")
}

// ═══════════════════════════════════════
// PAYMENT
// ═══════════════════════════════════════

model PaymentTransaction {
  id              String        @id @default(cuid())
  orderId         String        @unique
  provider        String        // "iyzico" | "stripe"
  providerRef     String?       @unique
  amount          Float
  currency        String        @default("TRY")
  status          PaymentStatus
  failureReason   String?
  refundedAmount  Float         @default(0)
  metadata        Json?         // Raw provider response (audit)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  order          Order           @relation(fields: [orderId], references: [id])
  merchantPayout MerchantPayout?
  courierPayout  CourierPayout?

  @@index([status])
  @@map("payment_transactions")
}

model MerchantPayout {
  id             String       @id @default(cuid())
  tenantId       String
  orderId        String       @unique
  transactionId  String?      @unique
  grossAmount    Float
  commissionRate Float
  commissionAmt  Float
  netAmount      Float
  status         PayoutStatus @default(PENDING)
  scheduledFor   DateTime?
  processedAt    DateTime?
  reference      String?
  failureReason  String?

  tenant      Tenant              @relation(fields: [tenantId], references: [id])
  order       Order               @relation(fields: [orderId], references: [id])
  transaction PaymentTransaction? @relation(fields: [transactionId], references: [id])

  @@index([tenantId, status])
  @@map("merchant_payouts")
}

model CourierPayout {
  id            String       @id @default(cuid())
  courierId     String
  orderId       String       @unique
  transactionId String?      @unique
  amount        Float
  bonusAmount   Float        @default(0)
  status        PayoutStatus @default(PENDING)
  isBlocked     Boolean      @default(false)
  blockedReason String?
  processedAt   DateTime?

  courier     CourierProfile      @relation(fields: [courierId], references: [id])
  order       Order               @relation(fields: [orderId], references: [id])
  transaction PaymentTransaction? @relation(fields: [transactionId], references: [id])

  @@index([courierId, status])
  @@map("courier_payouts")
}

// ═══════════════════════════════════════
// COURIER
// ═══════════════════════════════════════

model CourierProfile {
  id              String      @id @default(cuid())
  userId          String      @unique
  studentId       String?
  university      String?
  nationalId      String?
  vehicleType     VehicleType
  vehiclePlate    String?
  vehicleImageUrl String?
  idImageUrl      String?
  depositAmount   Float       @default(0)
  depositPaid     Boolean     @default(false)
  isOnline        Boolean     @default(false)
  isApproved      Boolean     @default(false)
  isActive        Boolean     @default(true)
  suspendedUntil  DateTime?
  currentLat      Float?
  currentLng      Float?
  lastLocationAt  DateTime?
  createdAt       DateTime    @default(now())

  user    User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders  Order[]
  stats   CourierStats?
  shifts  CourierShift[]
  payouts CourierPayout[]
  ratings CourierRating[]
  zones   CourierZone[]

  @@map("courier_profiles")
}

model CourierStats {
  id                   String @id @default(cuid())
  courierId            String @unique
  totalDeliveries      Int    @default(0)
  completedDeliveries  Int    @default(0)
  cancelledDeliveries  Int    @default(0)
  abandonedDeliveries  Int    @default(0)
  avgRating            Float  @default(0)
  avgDeliveryMinutes   Float  @default(0)
  totalEarnings        Float  @default(0)
  weeklyEarnings       Float  @default(0)
  acceptanceRate       Float  @default(1.0)
  completionRate       Float  @default(1.0)
  reliabilityScore     Float  @default(100)  // 0-100, composite

  courier CourierProfile @relation(fields: [courierId], references: [id], onDelete: Cascade)
  @@map("courier_stats")
}

model CourierShift {
  id          String    @id @default(cuid())
  courierId   String
  startedAt   DateTime  @default(now())
  endedAt     DateTime?
  deliveries  Int       @default(0)
  earnings    Float     @default(0)
  distanceKm  Float     @default(0)

  courier CourierProfile @relation(fields: [courierId], references: [id], onDelete: Cascade)
  @@index([courierId])
  @@map("courier_shifts")
}

model CourierZone {
  id        String @id @default(cuid())
  courierId String
  zoneId    String // TenantZone referansı

  courier CourierProfile @relation(fields: [courierId], references: [id], onDelete: Cascade)
  @@unique([courierId, zoneId])
  @@map("courier_zones")
}

// ═══════════════════════════════════════
// RATINGS & DISPUTES
// ═══════════════════════════════════════

model OrderRating {
  id              String   @id @default(cuid())
  orderId         String   @unique
  userId          String
  merchantRating  Int?     // 1-5
  courierRating   Int?     // 1-5
  merchantComment String?
  courierComment  String?
  merchantTags    String[] // SLOW_PREP | WRONG_ITEMS | GREAT_PACKAGING
  courierTags     String[] // FAST | POLITE | LATE | UNPROFESSIONAL
  createdAt       DateTime @default(now())

  order Order @relation(fields: [orderId], references: [id])
  @@map("order_ratings")
}

model MerchantRating {
  id        String   @id @default(cuid())
  tenantId  String
  orderId   String
  rating    Float
  createdAt DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id])
  @@index([tenantId])
  @@map("merchant_ratings")
}

model CourierRating {
  id        String   @id @default(cuid())
  courierId String
  orderId   String
  rating    Float
  createdAt DateTime @default(now())

  courier CourierProfile @relation(fields: [courierId], references: [id])
  @@map("courier_ratings")
}

model OrderDispute {
  id           String        @id @default(cuid())
  orderId      String        @unique
  raisedBy     String
  reason       DisputeReason
  description  String
  evidence     String[]      // Image URLs
  status       DisputeStatus @default(OPEN)
  resolution   String?
  resolvedBy   String?
  refundAmount Float?
  createdAt    DateTime      @default(now())
  resolvedAt   DateTime?

  order Order @relation(fields: [orderId], references: [id])
  @@map("order_disputes")
}

// ═══════════════════════════════════════
// AUDIT & SYSTEM
// ═══════════════════════════════════════

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  action     String   // "ORDER_CANCEL" | "PAYOUT_PROCESS" | "USER_BLOCK"
  entityType String   // "Order" | "User" | "Tenant"
  entityId   String
  before     Json?
  after      Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])

  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
  @@map("audit_logs")
}

model SystemConfig {
  key       String @id
  value     String
  updatedAt DateTime @updatedAt
  updatedBy String?

  @@map("system_config")
}

// ═══════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════

enum UserRole { CUSTOMER MERCHANT COURIER ADMIN SUPER_ADMIN }
enum MerchantRole { OWNER MANAGER STAFF }
enum TenantCategory { GROCERY PRODUCE BUTCHER DAIRY DELI BAKERY PHARMACY OTHER }
enum VehicleType { BICYCLE SCOOTER MOTORCYCLE CAR FOOT }
enum PayoutSchedule { SAME_DAY T1 T7 MONTHLY }
enum NotifChannel { WHATSAPP SMS BOTH EMAIL }

enum OrderStatus {
  PLACED PAID CONFIRMED PREPARING READY
  ASSIGNED PICKED_UP IN_TRANSIT DELIVERED SETTLED
  CANCELLED REFUNDED DISPUTE_OPEN
}

enum PaymentStatus {
  PENDING AUTHORIZED CAPTURED FAILED REFUNDED PARTIALLY_REFUNDED
}

enum PayoutStatus { PENDING SCHEDULED PROCESSING COMPLETED FAILED BLOCKED }

enum DisputeReason {
  NOT_DELIVERED WRONG_ITEMS DAMAGED_ITEMS MISSING_ITEMS
  QUALITY_ISSUE LATE_DELIVERY COURIER_MISCONDUCT OTHER
}

enum DisputeStatus { OPEN UNDER_REVIEW RESOLVED_REFUND RESOLVED_NO_ACTION ESCALATED }
```
