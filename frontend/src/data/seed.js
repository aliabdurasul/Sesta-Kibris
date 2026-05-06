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
    rating: 4.8,
    delivery: "15–25 min",
    image: MERCHANT_IMAGES.market,
    tagline: "Daily groceries & produce",
    address: "12 Market Street",
    products: [
      {
        id: "p-m1-1",
        name: "Red Apples (1kg)",
        price: 3.5,
        image: productImg("Red Apples", 10),
      },
      {
        id: "p-m1-2",
        name: "Fresh Milk (1L)",
        price: 2.2,
        image: productImg("Fresh Milk", 200),
      },
      {
        id: "p-m1-3",
        name: "Sourdough Bread",
        price: 4.0,
        image: productImg("Sourdough", 32),
      },
      {
        id: "p-m1-4",
        name: "Free-Range Eggs (x12)",
        price: 5.5,
        image: productImg("Eggs", 45),
      },
      {
        id: "p-m1-5",
        name: "Ripe Bananas (1kg)",
        price: 1.8,
        image: productImg("Bananas", 50),
      },
      {
        id: "p-m1-6",
        name: "Tomatoes (1kg)",
        price: 2.6,
        image: productImg("Tomatoes", 0),
      },
    ],
    featured: true,
  },
  {
    id: "m2",
    name: "Aqua Express",
    type: "water",
    rating: 4.6,
    delivery: "20–35 min",
    image: MERCHANT_IMAGES.water,
    tagline: "Bottled water delivered fast",
    address: "Aqua Plaza 3B",
    products: [
      {
        id: "p-m2-1",
        name: "5L Still Water",
        price: 2.0,
        image: productImg("5L Water", 200),
      },
      {
        id: "p-m2-2",
        name: "10L Still Water",
        price: 3.5,
        image: productImg("10L Water", 210),
      },
      {
        id: "p-m2-3",
        name: "19L Dispenser",
        price: 8.0,
        image: productImg("19L Dispenser", 220),
      },
      {
        id: "p-m2-4",
        name: "Sparkling 1.5L",
        price: 1.5,
        image: productImg("Sparkling", 190),
      },
    ],
    featured: true,
  },
  {
    id: "m3",
    name: "GasGo",
    type: "gas",
    rating: 4.7,
    delivery: "30–45 min",
    image: MERCHANT_IMAGES.gas,
    tagline: "Cylinder refills & swaps",
    address: "Industrial Rd 7",
    products: [
      {
        id: "p-m3-1",
        name: "Small Tank (5kg)",
        price: 15,
        image: productImg("Small Tank", 20),
      },
      {
        id: "p-m3-2",
        name: "Medium Tank (12kg)",
        price: 25,
        image: productImg("Medium Tank", 30),
      },
      {
        id: "p-m3-3",
        name: "Large Tank (25kg)",
        price: 40,
        image: productImg("Large Tank", 15),
      },
      {
        id: "p-m3-4",
        name: "Refill Service",
        price: 10,
        image: productImg("Refill", 40),
      },
    ],
    featured: false,
  },
];

export const seedCouriers = [
  { id: "co1", name: "Ali Yilmaz", status: "idle", vehicle: "Scooter" },
  { id: "co2", name: "Maya Chen", status: "idle", vehicle: "E-Bike" },
  { id: "co3", name: "Ravi Patel", status: "idle", vehicle: "Scooter" },
];

export const seedCustomers = [
  {
    id: "u1",
    name: "Demo User",
    address: "221B Baker Street, Apt 4",
    phone: "+1 555 0191",
  },
];

export const DELIVERY_FEE = 1.5;
export const COURIER_FEE_PER_DELIVERY = 2.0;
// Demo-fast operational windows. Real-world: 10min / 3min.
export const AUTO_CANCEL_MS = 30000; // merchant must accept paid order in 30s
export const REASSIGN_MS = 15000; // courier must pick up within 15s of being assigned
