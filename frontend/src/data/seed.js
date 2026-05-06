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

const productImg = (q) =>
  `https://source.unsplash.com/featured/400x400?${encodeURIComponent(q)}`;

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
        image: productImg("red apples"),
      },
      {
        id: "p-m1-2",
        name: "Fresh Milk (1L)",
        price: 2.2,
        image: productImg("milk bottle"),
      },
      {
        id: "p-m1-3",
        name: "Sourdough Bread",
        price: 4.0,
        image: productImg("sourdough bread"),
      },
      {
        id: "p-m1-4",
        name: "Free-Range Eggs (x12)",
        price: 5.5,
        image: productImg("fresh eggs"),
      },
      {
        id: "p-m1-5",
        name: "Ripe Bananas (1kg)",
        price: 1.8,
        image: productImg("bananas"),
      },
      {
        id: "p-m1-6",
        name: "Tomatoes (1kg)",
        price: 2.6,
        image: productImg("tomatoes"),
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
        image: productImg("water bottle 5 liters"),
      },
      {
        id: "p-m2-2",
        name: "10L Still Water",
        price: 3.5,
        image: productImg("water gallon"),
      },
      {
        id: "p-m2-3",
        name: "19L Dispenser",
        price: 8.0,
        image: productImg("water dispenser"),
      },
      {
        id: "p-m2-4",
        name: "Sparkling 1.5L",
        price: 1.5,
        image: productImg("sparkling water"),
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
        image: productImg("gas cylinder small"),
      },
      {
        id: "p-m3-2",
        name: "Medium Tank (12kg)",
        price: 25,
        image: productImg("gas cylinder"),
      },
      {
        id: "p-m3-3",
        name: "Large Tank (25kg)",
        price: 40,
        image: productImg("large gas tank"),
      },
      {
        id: "p-m3-4",
        name: "Refill Service",
        price: 10,
        image: productImg("propane refill"),
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
