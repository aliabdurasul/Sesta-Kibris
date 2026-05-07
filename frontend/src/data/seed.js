// Seed data for the GapGel demo.
// All data is in-memory; resets on page refresh.

export const MERCHANT_IMAGES = {
  market:
    "https://images.unsplash.com/photo-1547515975-998cfefd2301?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGdyb2NlcmllcyUyMHByb2R1Y2UlMjBtYXJrZXR8ZW58MHx8fHwxNzc4MDk1OTk2fDA&ixlib=rb-4.1.0&q=85",
  water:
    "https://images.unsplash.com/photo-1774557937035-1c049df69d07?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHx3YXRlciUyMGJvdHRsZXMlMjBkZWxpdmVyeXxlbnwwfHx8fDE3NzgwOTU5OTZ8MA&ixlib=rb-4.1.0&q=85",
  gas: "https://images.unsplash.com/photo-1772266870513-a72c931af033?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwxfHxnYXMlMjBjeWxpbmRlciUyMHRhbmt8ZW58MHx8fHwxNzc4MDk1OTk2fDA&ixlib=rb-4.1.0&q=85",
};

export const EMPTY_IMAGES = {
  cart: "https://images.pexels.com/photos/32872494/pexels-photo-32872494.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  orders:
    "https://images.unsplash.com/photo-1762341114268-38fbe97e355d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzN8MHwxfHNlYXJjaHwxfHxjbGlwYm9hcmQlMjBvbiUyMGRlc2t8ZW58MHx8fHwxNzc4MDk2MDAyfDA&ixlib=rb-4.1.0&q=85",
  courier:
    "https://images.unsplash.com/photo-1770927423939-bae721171237?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODR8MHwxfHNlYXJjaHwxfHxkZWxpdmVyeSUyMGNvdXJpZXIlMjBzY29vdGVyfGVufDB8fHx8MTc3ODA5NTk5Nnww&ixlib=rb-4.1.0&q=85",
};

// Reliable, deterministic SVG gradient tile (no network call, never broken).
function productImg(label, hue = 258) {
  const h2 = (hue + 40) % 360;
  const initials = label
    .replace(/\(.*\)/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0' stop-color='hsl(${hue},85%,88%)'/>
        <stop offset='1' stop-color='hsl(${h2},75%,72%)'/>
      </linearGradient>
    </defs>
    <rect width='200' height='200' fill='url(#g)'/>
    <circle cx='100' cy='92' r='46' fill='white' fill-opacity='0.55'/>
    <text x='100' y='104' font-family='Plus Jakarta Sans, sans-serif' font-size='44' font-weight='800' fill='hsl(${hue},70%,28%)' text-anchor='middle'>${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const seedMerchants = [
  {
    id: "m1",
    name: "Fresh Market",
    type: "market",
    deliveryMode: "platform_only",
    approvalStatus: "approved",
    rating: 4.8,
    delivery: "15–25 dk",
    image: MERCHANT_IMAGES.market,
    tagline: "Günlük market alışverişi & taze ürünler",
    address: "Market Sokak 12",
    products: [
      {
        id: "p-m1-1",
        name: "Kırmızı Elma (1kg)",
        price: 3.5,
        image: productImg("Kırmızı Elma", 10),
      },
      {
        id: "p-m1-2",
        name: "Taze Süt (1L)",
        price: 2.2,
        image: productImg("Taze Süt", 200),
      },
      {
        id: "p-m1-3",
        name: "Ekşi Mayalı Ekmek",
        price: 4.0,
        image: productImg("Ekmek", 32),
      },
      {
        id: "p-m1-4",
        name: "Köy Yumurtası (12'li)",
        price: 5.5,
        image: productImg("Yumurta", 45),
      },
      {
        id: "p-m1-5",
        name: "Olgun Muz (1kg)",
        price: 1.8,
        image: productImg("Muz", 50),
      },
      {
        id: "p-m1-6",
        name: "Domates (1kg)",
        price: 2.6,
        image: productImg("Domates", 0),
      },
    ],
    featured: true,
  },
  {
    id: "m2",
    name: "Aqua Express",
    type: "water",
    deliveryMode: "merchant_only",
    approvalStatus: "approved",
    rating: 4.6,
    delivery: "20–35 dk",
    image: MERCHANT_IMAGES.water,
    tagline: "Damacana ve şişe su, hızlı teslimat",
    address: "Aqua Plaza 3B",
    products: [
      {
        id: "p-m2-1",
        name: "5L Şişe Su",
        price: 2.0,
        image: productImg("5L Su", 200),
      },
      {
        id: "p-m2-2",
        name: "10L Şişe Su",
        price: 3.5,
        image: productImg("10L Su", 210),
      },
      {
        id: "p-m2-3",
        name: "19L Damacana",
        price: 8.0,
        image: productImg("19L Damacana", 220),
      },
      {
        id: "p-m2-4",
        name: "Maden Suyu 1.5L",
        price: 1.5,
        image: productImg("Maden", 190),
      },
    ],
    featured: true,
  },
  {
    id: "m3",
    name: "GasGo",
    type: "gas",
    deliveryMode: "hybrid",
    approvalStatus: "approved",
    rating: 4.7,
    delivery: "30–45 dk",
    image: MERCHANT_IMAGES.gas,
    tagline: "Tüp dolumu ve değişimi",
    address: "Sanayi Yolu 7",
    products: [
      {
        id: "p-m3-1",
        name: "Küçük Tüp (5kg)",
        price: 15,
        image: productImg("Küçük Tüp", 20),
      },
      {
        id: "p-m3-2",
        name: "Orta Tüp (12kg)",
        price: 25,
        image: productImg("Orta Tüp", 30),
      },
      {
        id: "p-m3-3",
        name: "Büyük Tüp (25kg)",
        price: 40,
        image: productImg("Büyük Tüp", 15),
      },
      {
        id: "p-m3-4",
        name: "Tüp Dolum Hizmeti",
        price: 10,
        image: productImg("Dolum", 40),
      },
    ],
    featured: false,
  },
];

export const seedCouriers = [
  { id: "co1", name: "Ali Yılmaz", status: "idle", vehicle: "Motosiklet" },
  { id: "co2", name: "Maya Çelik", status: "idle", vehicle: "Elektrikli Bisiklet" },
  { id: "co3", name: "Rauf Patel", status: "idle", vehicle: "Motosiklet" },
];

export const seedCustomers = [
  {
    id: "u1",
    name: "Demo Kullanıcı",
    address: "Atatürk Caddesi 221, Daire 4",
    phone: "+90 392 555 0191",
  },
];

export const TYPE_LABELS = { market: "Market", water: "Su", gas: "Tüp" };
export const DELIVERY_MODE_LABELS = {
  platform_only: "Platform kurye",
  merchant_only: "Mağaza teslim",
  hybrid: "Hibrit",
};
export const APPROVAL_LABELS = {
  approved: "Onaylı",
  pending: "Beklemede",
  suspended: "Askıda",
};
export const STOCK_LABELS = {
  in_stock: "Stokta",
  out_of_stock: "Tükendi",
  hidden: "Gizli",
};
export const STATUS_LABELS = {
  created: "Oluşturuldu",
  paid: "Ödendi",
  accepted: "Kabul Edildi",
  preparing: "Hazırlanıyor",
  ready: "Hazır",
  out_for_delivery: "Yolda",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};
export const PROMO_CODES = { HADE10: { type: "percent", value: 10 } };

export const DELIVERY_FEE = 1.5;
export const COURIER_FEE_PER_DELIVERY = 2.0;
// Demo-fast operational windows. Real-world: 10min / 3min.
export const AUTO_CANCEL_MS = 30000; // merchant must accept paid order in 30s
export const REASSIGN_MS = 15000; // courier must pick up within 15s of being assigned
