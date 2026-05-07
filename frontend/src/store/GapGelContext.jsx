import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { toast } from "sonner";
import {
  seedMerchants,
  seedCouriers,
  seedCustomers,
  DELIVERY_FEE,
  COURIER_FEE_PER_DELIVERY,
  AUTO_CANCEL_MS,
  REASSIGN_MS,
} from "@/data/seed";
import {
  canTransition,
  canAdminOverride,
  isSelfDeliveryMerchant,
  ORDER_STATES,
} from "@/lib/orderMachine";

const GapGelContext = createContext(null);

const initialState = {
  role: "customer", // customer | merchant | courier | admin
  currentCustomerId: seedCustomers[0].id,
  currentMerchantId: seedMerchants[0].id,
  currentCourierId: seedCouriers[0].id,
  merchants: seedMerchants,
  couriers: seedCouriers,
  customers: seedCustomers,
  cart: { merchantId: null, items: [] }, // items: [{productId, qty}]
  orders: [],
  orderSeq: 1000,
};

const STORAGE_KEY = "gapgel-state-v1";

function loadInitial() {
  try {
    const raw =
      typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;
    if (!raw) return initialState;
    const saved = JSON.parse(raw);
    // Defensive defaults for older shapes
    const orders = Array.isArray(saved.orders)
      ? saved.orders.map((o) => ({
          otp: o.otp || String(Math.floor(1000 + Math.random() * 9000)),
          otpVerified: !!o.otpVerified,
          rating: o.rating ?? null,
          refund: o.refund ?? null,
          substitution: o.substitution ?? null,
          acceptedAt: o.acceptedAt ?? null,
          assignedAt: o.assignedAt ?? null,
          cancelReason: o.cancelReason ?? null,
          history: o.history ?? [],
          ...o,
        }))
      : [];
    return {
      ...initialState,
      ...saved,
      orders,
      // Always preserve the seed-driven shape if missing
      merchants: saved.merchants ?? initialState.merchants,
      couriers: saved.couriers ?? initialState.couriers,
      customers: saved.customers ?? initialState.customers,
      cart: saved.cart ?? initialState.cart,
    };
  } catch {
    return initialState;
  }
}

function reducer(state, action) {
  switch (action.type) {
    case "RESET_DEMO":
      return initialState;
    case "REORDER_FROM_ORDER": {
      const { merchantId, items } = action;
      return { ...state, cart: { merchantId, items } };
    }
    case "SET_ROLE":
      return { ...state, role: action.role };
    case "SET_CURRENT_MERCHANT":
      return { ...state, currentMerchantId: action.id };
    case "SET_CURRENT_COURIER":
      return { ...state, currentCourierId: action.id };

    case "CART_ADD": {
      const { merchantId, productId } = action;
      // Reset cart if switching merchant
      if (state.cart.merchantId && state.cart.merchantId !== merchantId) {
        return {
          ...state,
          cart: { merchantId, items: [{ productId, qty: 1 }] },
        };
      }
      const existing = state.cart.items.find((i) => i.productId === productId);
      const items = existing
        ? state.cart.items.map((i) =>
            i.productId === productId ? { ...i, qty: i.qty + 1 } : i,
          )
        : [...state.cart.items, { productId, qty: 1 }];
      return { ...state, cart: { merchantId, items } };
    }
    case "CART_DEC": {
      const items = state.cart.items
        .map((i) =>
          i.productId === action.productId ? { ...i, qty: i.qty - 1 } : i,
        )
        .filter((i) => i.qty > 0);
      const merchantId = items.length ? state.cart.merchantId : null;
      return { ...state, cart: { merchantId, items } };
    }
    case "CART_REMOVE": {
      const items = state.cart.items.filter(
        (i) => i.productId !== action.productId,
      );
      const merchantId = items.length ? state.cart.merchantId : null;
      return { ...state, cart: { merchantId, items } };
    }
    case "CART_CLEAR":
      return { ...state, cart: { merchantId: null, items: [] } };

    case "ORDER_CREATE": {
      const id = `GG-${state.orderSeq + 1}`;
      const otp = String(Math.floor(1000 + Math.random() * 9000));
      const order = {
        id,
        status: "created",
        items: action.items,
        subtotal: action.subtotal,
        deliveryFee: action.deliveryFee,
        total: action.total,
        customerId: state.currentCustomerId,
        merchantId: action.merchantId,
        courierId: null,
        selfDelivery: action.selfDelivery,
        otp,
        otpVerified: false,
        rating: null,
        refund: null,
        substitution: null,
        acceptedAt: null,
        assignedAt: null,
        cancelReason: null,
        createdAt: new Date().toISOString(),
        history: [{ status: "created", at: new Date().toISOString() }],
      };
      return {
        ...state,
        orderSeq: state.orderSeq + 1,
        orders: [order, ...state.orders],
        cart: { merchantId: null, items: [] },
      };
    }

    case "ORDER_TRANSITION": {
      const { orderId, to } = action;
      const orders = state.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (!canTransition(o.status, to)) return o;
        const next = {
          ...o,
          status: to,
          history: [...o.history, { status: to, at: new Date().toISOString() }],
        };
        if (to === "accepted") next.acceptedAt = new Date().toISOString();
        if (to === "delivered") next.deliveredAt = new Date().toISOString();
        return next;
      });
      return { ...state, orders };
    }

    case "ORDER_ASSIGN_COURIER": {
      const { orderId, courierId } = action;
      const orders = state.orders.map((o) =>
        o.id === orderId
          ? { ...o, courierId, assignedAt: new Date().toISOString() }
          : o,
      );
      const couriers = state.couriers.map((c) =>
        c.id === courierId ? { ...c, status: "busy" } : c,
      );
      return { ...state, orders, couriers };
    }

    case "COURIER_FREE": {
      const couriers = state.couriers.map((c) =>
        c.id === action.courierId ? { ...c, status: "idle" } : c,
      );
      return { ...state, couriers };
    }

    case "ADMIN_FORCE_STATUS": {
      const { orderId, to } = action;
      const orders = state.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (!canAdminOverride(o.status, to)) return o;
        return {
          ...o,
          status: to,
          history: [
            ...o.history,
            { status: to, at: new Date().toISOString(), by: "admin" },
          ],
        };
      });
      return { ...state, orders };
    }

    case "ADMIN_FORCE_ASSIGN": {
      const { orderId, courierId } = action;
      // Free previous courier if any
      const prev = state.orders.find((o) => o.id === orderId)?.courierId;
      let couriers = state.couriers;
      if (prev) {
        couriers = couriers.map((c) =>
          c.id === prev ? { ...c, status: "idle" } : c,
        );
      }
      if (courierId) {
        couriers = couriers.map((c) =>
          c.id === courierId ? { ...c, status: "busy" } : c,
        );
      }
      const orders = state.orders.map((o) =>
        o.id === orderId ? { ...o, courierId: courierId || null } : o,
      );
      return { ...state, orders, couriers };
    }

    case "ORDER_CANCEL": {
      const { orderId, reason } = action;
      const order = state.orders.find((o) => o.id === orderId);
      if (!order || order.status === "delivered" || order.status === "cancelled")
        return state;
      const orders = state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "cancelled",
              cancelReason: reason || "cancelled",
              refund: { amount: o.total, note: reason || "cancelled", at: new Date().toISOString() },
              history: [
                ...o.history,
                { status: "cancelled", at: new Date().toISOString(), reason },
              ],
            }
          : o,
      );
      // Free courier if assigned
      let couriers = state.couriers;
      if (order.courierId) {
        couriers = couriers.map((c) =>
          c.id === order.courierId ? { ...c, status: "idle" } : c,
        );
      }
      return { ...state, orders, couriers };
    }

    case "ORDER_REASSIGN": {
      const { orderId, fromCourierId, toCourierId } = action;
      const orders = state.orders.map((o) =>
        o.id === orderId
          ? { ...o, courierId: toCourierId, assignedAt: new Date().toISOString() }
          : o,
      );
      const couriers = state.couriers.map((c) => {
        if (c.id === fromCourierId) return { ...c, status: "idle" };
        if (c.id === toCourierId) return { ...c, status: "busy" };
        return c;
      });
      return { ...state, orders, couriers };
    }

    case "SUBMIT_RATING": {
      const { orderId, rating } = action;
      const orders = state.orders.map((o) =>
        o.id === orderId
          ? { ...o, rating: { ...rating, at: new Date().toISOString() } }
          : o,
      );
      return { ...state, orders };
    }

    case "OFFER_SUBSTITUTION": {
      const { orderId, message } = action;
      const orders = state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              substitution: { message, accepted: null, at: new Date().toISOString() },
            }
          : o,
      );
      return { ...state, orders };
    }

    case "RESPOND_SUBSTITUTION": {
      const { orderId, accepted } = action;
      const orders = state.orders.map((o) =>
        o.id === orderId
          ? { ...o, substitution: { ...o.substitution, accepted, respondedAt: new Date().toISOString() } }
          : o,
      );
      return { ...state, orders };
    }

    case "APPLY_REFUND": {
      const { orderId, amount, note } = action;
      const orders = state.orders.map((o) => {
        if (o.id !== orderId) return o;
        const prev = o.refund?.amount || 0;
        return {
          ...o,
          refund: {
            amount: +(prev + amount).toFixed(2),
            note: note || o.refund?.note || "",
            at: new Date().toISOString(),
          },
        };
      });
      return { ...state, orders };
    }

    case "VERIFY_OTP": {
      const { orderId } = action;
      const orders = state.orders.map((o) =>
        o.id === orderId ? { ...o, otpVerified: true } : o,
      );
      return { ...state, orders };
    }

    case "ADD_PRODUCT": {
      const { merchantId, product } = action;
      const merchants = state.merchants.map((m) =>
        m.id === merchantId ? { ...m, products: [...m.products, product] } : m,
      );
      return { ...state, merchants };
    }

    case "UPDATE_PRODUCT": {
      const { merchantId, productId, patch } = action;
      const merchants = state.merchants.map((m) =>
        m.id === merchantId
          ? {
              ...m,
              products: m.products.map((p) =>
                p.id === productId ? { ...p, ...patch } : p,
              ),
            }
          : m,
      );
      return { ...state, merchants };
    }

    case "DELETE_PRODUCT": {
      const { merchantId, productId } = action;
      const merchants = state.merchants.map((m) =>
        m.id === merchantId
          ? { ...m, products: m.products.filter((p) => p.id !== productId) }
          : m,
      );
      return { ...state, merchants };
    }

    case "BULK_ADD_PRODUCTS": {
      const { merchantId, products } = action;
      const merchants = state.merchants.map((m) =>
        m.id === merchantId
          ? { ...m, products: [...m.products, ...products] }
          : m,
      );
      return { ...state, merchants };
    }

    default:
      return state;
  }
}

export function GapGelProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  // Persist to localStorage whenever core state changes
  useEffect(() => {
    try {
      const payload = {
        role: state.role,
        currentCustomerId: state.currentCustomerId,
        currentMerchantId: state.currentMerchantId,
        currentCourierId: state.currentCourierId,
        merchants: state.merchants,
        couriers: state.couriers,
        customers: state.customers,
        cart: state.cart,
        orders: state.orders,
        orderSeq: state.orderSeq,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota errors */
    }
  }, [state]);

  const findMerchant = useCallback(
    (id) => state.merchants.find((m) => m.id === id),
    [state.merchants],
  );
  const findCourier = useCallback(
    (id) => state.couriers.find((c) => c.id === id),
    [state.couriers],
  );
  const findCustomer = useCallback(
    (id) => state.customers.find((c) => c.id === id),
    [state.customers],
  );
  const findProduct = useCallback(
    (merchantId, productId) => {
      const m = findMerchant(merchantId);
      return m?.products.find((p) => p.id === productId);
    },
    [findMerchant],
  );

  // --- Actions ---
  const setRole = (role) => dispatch({ type: "SET_ROLE", role });
  const setCurrentMerchant = (id) =>
    dispatch({ type: "SET_CURRENT_MERCHANT", id });
  const setCurrentCourier = (id) =>
    dispatch({ type: "SET_CURRENT_COURIER", id });

  const cartAdd = (merchantId, productId) => {
    if (state.cart.merchantId && state.cart.merchantId !== merchantId) {
      toast.info("Sepet değişti — farklı mağaza");
    }
    dispatch({ type: "CART_ADD", merchantId, productId });
  };
  const cartDec = (productId) => dispatch({ type: "CART_DEC", productId });
  const cartRemove = (productId) =>
    dispatch({ type: "CART_REMOVE", productId });
  const cartClear = () => dispatch({ type: "CART_CLEAR" });

  const placeOrder = () => {
    if (!state.cart.merchantId || state.cart.items.length === 0) return null;
    const merchant = findMerchant(state.cart.merchantId);
    const items = state.cart.items.map((i) => {
      const p = findProduct(state.cart.merchantId, i.productId);
      return {
        productId: p.id,
        name: p.name,
        price: p.price,
        qty: i.qty,
        lineTotal: +(p.price * i.qty).toFixed(2),
      };
    });
    const subtotal = +items.reduce((a, b) => a + b.lineTotal, 0).toFixed(2);
    const deliveryFee = DELIVERY_FEE;
    const total = +(subtotal + deliveryFee).toFixed(2);
    const orderId = `GG-${state.orderSeq + 1}`;
    dispatch({
      type: "ORDER_CREATE",
      items,
      subtotal,
      deliveryFee,
      total,
      merchantId: merchant.id,
      selfDelivery: isSelfDeliveryMerchant(merchant),
    });
    return orderId;
  };

  const payOrder = (orderId) => {
    // created -> paid
    dispatch({ type: "ORDER_TRANSITION", orderId, to: "paid" });
    // Fire merchant toast asynchronously
    setTimeout(() => {
      toast.success("Yeni ödenmiş sipariş alındı!", {
        description: `Sipariş ${orderId} mağaza onayını bekliyor.`,
      });
    }, 50);
  };

  const merchantAccept = (orderId) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    if (order.status !== "paid") {
      toast.error("Kabul edilemez — önce ödeme alınmalı");
      return;
    }
    dispatch({ type: "ORDER_TRANSITION", orderId, to: "accepted" });
  };
  const merchantReject = (orderId) => {
    dispatch({
      type: "ORDER_CANCEL",
      orderId,
      reason: "mağaza reddetti",
    });
    toast.error("Sipariş reddedildi — iade yapıldı");
  };
  const merchantStartPreparing = (orderId) =>
    dispatch({ type: "ORDER_TRANSITION", orderId, to: "preparing" });

  const merchantMarkReady = (orderId) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    // Transition to ready first
    dispatch({ type: "ORDER_TRANSITION", orderId, to: "ready" });
    // Auto-dispatch (only for non-self-delivery)
    if (!order.selfDelivery) {
      const idle = state.couriers.find((c) => c.status === "idle");
      if (idle) {
        dispatch({
          type: "ORDER_ASSIGN_COURIER",
          orderId,
          courierId: idle.id,
        });
        toast.success(`Otomatik atandı: ${idle.name}`);
      } else {
        toast.warning("Boştaki kurye yok — yönetici atama yapmalı");
      }
    } else {
      toast.info("Mağaza teslim eder — kurye gerekmez");
    }
  };

  const courierPickup = (orderId) => {
    // ready -> out_for_delivery
    dispatch({ type: "ORDER_TRANSITION", orderId, to: "out_for_delivery" });
  };
  const courierDeliver = (orderId) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    if (!order.otpVerified) {
      toast.error("Önce müşteri OTP kodunu doğrulayın");
      return;
    }
    dispatch({ type: "ORDER_TRANSITION", orderId, to: "delivered" });
    if (order.courierId) {
      dispatch({ type: "COURIER_FREE", courierId: order.courierId });
    }
  };

  const verifyOtp = (orderId) => {
    dispatch({ type: "VERIFY_OTP", orderId });
  };

  // Merchant self-delivery handlers (water/gas)
  const merchantSelfDispatch = (orderId) =>
    dispatch({ type: "ORDER_TRANSITION", orderId, to: "out_for_delivery" });
  const merchantSelfDeliver = (orderId) =>
    dispatch({ type: "ORDER_TRANSITION", orderId, to: "delivered" });

  // Admin controls
  const adminForceStatus = (orderId, to) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    dispatch({ type: "ADMIN_FORCE_STATUS", orderId, to });
    // Free courier if admin moves to delivered
    if (to === "delivered" && order.courierId) {
      dispatch({ type: "COURIER_FREE", courierId: order.courierId });
    }
    toast.success(`Yönetici güncelledi → ${to}`);
  };
  const adminForceAssign = (orderId, courierId) => {
    dispatch({ type: "ADMIN_FORCE_ASSIGN", orderId, courierId });
    toast.success(
      courierId ? "Yönetici kurye atadı" : "Yönetici kurye kaldırdı",
    );
  };

  const adminApplyRefund = (orderId, amount, note) => {
    dispatch({ type: "APPLY_REFUND", orderId, amount, note });
    toast.success(`$${amount.toFixed(2)} iade edildi`);
  };

  const cancelOrder = (orderId, reason) => {
    dispatch({ type: "ORDER_CANCEL", orderId, reason });
  };

  // Customer / merchant rating + substitution + OTP flow
  const submitRating = (orderId, rating) =>
    dispatch({ type: "SUBMIT_RATING", orderId, rating });
  const offerSubstitution = (orderId, message) => {
    dispatch({ type: "OFFER_SUBSTITUTION", orderId, message });
    toast.success("Değişiklik önerisi müşteriye gönderildi");
  };
  const respondSubstitution = (orderId, accepted) => {
    dispatch({ type: "RESPOND_SUBSTITUTION", orderId, accepted });
    toast.success(accepted ? "Değişiklik kabul edildi" : "Değişiklik reddedildi");
  };

  // Product CRUD
  const _slug = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 24);
  const _hueFor = (mid) =>
    ({ m1: 140, m2: 210, m3: 25 }[mid] || Math.floor(Math.random() * 360));
  const _imgFor = (name, mid) => {
    const hue = _hueFor(mid);
    const initials = name
      .replace(/\(.*\)/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    const h2 = (hue + 40) % 360;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0' stop-color='hsl(${hue},85%,88%)'/><stop offset='1' stop-color='hsl(${h2},75%,72%)'/></linearGradient></defs><rect width='200' height='200' fill='url(#g)'/><circle cx='100' cy='92' r='46' fill='white' fill-opacity='0.55'/><text x='100' y='104' font-family='Plus Jakarta Sans, sans-serif' font-size='44' font-weight='800' fill='hsl(${hue},70%,28%)' text-anchor='middle'>${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };
  const addProduct = (merchantId, { name, price, image }) => {
    const id = `p-${merchantId}-${_slug(name)}-${Date.now().toString(36).slice(-4)}`;
    dispatch({
      type: "ADD_PRODUCT",
      merchantId,
      product: {
        id,
        name,
        price,
        image: image || _imgFor(name, merchantId),
      },
    });
  };
  const updateProduct = (merchantId, productId, patch) =>
    dispatch({ type: "UPDATE_PRODUCT", merchantId, productId, patch });
  const deleteProduct = (merchantId, productId) =>
    dispatch({ type: "DELETE_PRODUCT", merchantId, productId });
  const bulkAddProducts = (merchantId, rows) => {
    const products = rows.map((r, idx) => ({
      id: `p-${merchantId}-${_slug(r.name)}-${Date.now().toString(36)}-${idx}`,
      name: r.name,
      price: r.price,
      image: _imgFor(r.name, merchantId),
    }));
    dispatch({ type: "BULK_ADD_PRODUCTS", merchantId, products });
  };

  // ---- Auto-timers (merchant-accept timeout & courier-abandonment reassign) ----
  const timersRef = useRef([]);
  useEffect(() => {
    // Clear previous timers
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];

    state.orders.forEach((o) => {
      // Auto-cancel paid orders not accepted within window
      if (o.status === "paid") {
        const elapsed = Date.now() - new Date(o.createdAt).getTime();
        const rem = AUTO_CANCEL_MS - elapsed;
        if (rem <= 0) {
          dispatch({
            type: "ORDER_CANCEL",
            orderId: o.id,
            reason: "mağaza yanıt vermedi",
          });
          setTimeout(
            () =>
              toast.error(
                `${o.id} otomatik iptal edildi — mağaza yanıt vermedi`,
              ),
            10,
          );
        } else {
          const t = setTimeout(() => {
            dispatch({
              type: "ORDER_CANCEL",
              orderId: o.id,
              reason: "mağaza yanıt vermedi",
            });
            toast.error(
              `${o.id} otomatik iptal edildi — mağaza yanıt vermedi`,
            );
          }, rem);
          timersRef.current.push(t);
        }
      }
      // Reassign if courier doesn't pick up within window
      if (
        o.status === "ready" &&
        o.courierId &&
        o.assignedAt &&
        !o.selfDelivery
      ) {
        const elapsed = Date.now() - new Date(o.assignedAt).getTime();
        const rem = REASSIGN_MS - elapsed;
        const tryReassign = () => {
          // pick another idle courier different from current
          const other = state.couriers.find(
            (c) => c.status === "idle" && c.id !== o.courierId,
          );
          if (other) {
            dispatch({
              type: "ORDER_REASSIGN",
              orderId: o.id,
              fromCourierId: o.courierId,
              toCourierId: other.id,
            });
            toast.warning(`${o.id} yeniden atandı → ${other.name} (zaman aşımı)`);
          } else {
            toast.warning(`Yedek kurye yok — ${o.id} hâlâ bekliyor`);
          }
        };
        if (rem <= 0) {
          tryReassign();
        } else {
          const t = setTimeout(tryReassign, rem);
          timersRef.current.push(t);
        }
      }
    });

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.orders, state.couriers]);

  // ---- Earnings & metrics helpers ----
  const courierEarnings = useCallback(
    (courierId) => {
      const delivered = state.orders.filter(
        (o) => o.courierId === courierId && o.status === "delivered",
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 6);
      const todayCount = delivered.filter(
        (o) => new Date(o.deliveredAt || o.createdAt) >= today,
      ).length;
      const weekCount = delivered.filter(
        (o) => new Date(o.deliveredAt || o.createdAt) >= weekAgo,
      ).length;
      return {
        feePerDelivery: COURIER_FEE_PER_DELIVERY,
        deliveries: delivered.length,
        todayDeliveries: todayCount,
        weekDeliveries: weekCount,
        today: +(todayCount * COURIER_FEE_PER_DELIVERY).toFixed(2),
        week: +(weekCount * COURIER_FEE_PER_DELIVERY).toFixed(2),
        lifetime: +(delivered.length * COURIER_FEE_PER_DELIVERY).toFixed(2),
      };
    },
    [state.orders],
  );

  const merchantConfirmationRate = useCallback(
    (merchantId) => {
      const ms = state.orders.filter((o) => o.merchantId === merchantId);
      const accepted = ms.filter((o) =>
        ["accepted", "preparing", "ready", "out_for_delivery", "delivered"].includes(
          o.status,
        ),
      ).length;
      const decided = ms.filter(
        (o) => o.status !== "created" && o.status !== "paid",
      ).length;
      const rate = decided === 0 ? null : Math.round((accepted / decided) * 100);
      return { total: ms.length, accepted, decided, rate };
    },
    [state.orders],
  );

  // Per-merchant ratings summary
  const merchantRatings = useCallback(
    (merchantId) => {
      const rated = state.orders.filter(
        (o) => o.merchantId === merchantId && o.rating?.merchantStars,
      );
      const stars = rated.map((o) => o.rating.merchantStars);
      const avg =
        stars.length === 0
          ? null
          : +(stars.reduce((a, b) => a + b, 0) / stars.length).toFixed(2);
      return {
        avg,
        count: rated.length,
        reviews: rated
          .slice()
          .sort(
            (a, b) =>
              new Date(b.rating.at).getTime() - new Date(a.rating.at).getTime(),
          )
          .map((o) => ({
            orderId: o.id,
            stars: o.rating.merchantStars,
            comment: o.rating.merchantComment,
            customer: state.customers.find((c) => c.id === o.customerId)?.name,
            at: o.rating.at,
          })),
      };
    },
    [state.orders, state.customers],
  );

  // Reorder from a previous (delivered) order
  const reorderFromOrder = useCallback(
    (orderId) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return false;
      const merchant = state.merchants.find((m) => m.id === order.merchantId);
      if (!merchant) {
        toast.error("Mağaza artık mevcut değil");
        return false;
      }
      const valid = [];
      const skipped = [];
      for (const item of order.items) {
        const stillExists = merchant.products.find(
          (p) => p.id === item.productId,
        );
        if (stillExists) valid.push({ productId: item.productId, qty: item.qty });
        else skipped.push(item.name);
      }
      if (valid.length === 0) {
        toast.error("Bu siparişteki ürünler artık mevcut değil");
        return false;
      }
      dispatch({
        type: "REORDER_FROM_ORDER",
        merchantId: order.merchantId,
        items: valid,
      });
      if (skipped.length > 0) {
        toast.warning(`${skipped.length} ürün atlandı (artık mevcut değil)`);
      } else {
        toast.success("Ürünler sepete eklendi");
      }
      return true;
    },
    [state.orders, state.merchants],
  );

  const resetDemo = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    dispatch({ type: "RESET_DEMO" });
    toast.success("Demo sıfırlandı — başlangıç verisi yüklendi");
  }, []);

  // ---- Derived: visible orders per role ----
  const visibleOrders = useMemo(() => {
    if (state.role === "customer") {
      return state.orders.filter(
        (o) => o.customerId === state.currentCustomerId,
      );
    }
    if (state.role === "merchant") {
      return state.orders.filter(
        (o) => o.merchantId === state.currentMerchantId,
      );
    }
    if (state.role === "courier") {
      return state.orders.filter(
        (o) => o.courierId === state.currentCourierId,
      );
    }
    return state.orders;
  }, [
    state.orders,
    state.role,
    state.currentCustomerId,
    state.currentMerchantId,
    state.currentCourierId,
  ]);

  const cartCount = useMemo(
    () => state.cart.items.reduce((a, b) => a + b.qty, 0),
    [state.cart.items],
  );

  const value = {
    state,
    ORDER_STATES,
    findMerchant,
    findCourier,
    findCustomer,
    findProduct,
    setRole,
    setCurrentMerchant,
    setCurrentCourier,
    cartAdd,
    cartDec,
    cartRemove,
    cartClear,
    placeOrder,
    payOrder,
    merchantAccept,
    merchantReject,
    merchantStartPreparing,
    merchantMarkReady,
    merchantSelfDispatch,
    merchantSelfDeliver,
    courierPickup,
    courierDeliver,
    verifyOtp,
    adminForceStatus,
    adminForceAssign,
    adminApplyRefund,
    cancelOrder,
    submitRating,
    offerSubstitution,
    respondSubstitution,
    addProduct,
    updateProduct,
    deleteProduct,
    bulkAddProducts,
    courierEarnings,
    merchantConfirmationRate,
    merchantRatings,
    reorderFromOrder,
    resetDemo,
    visibleOrders,
    cartCount,
  };

  return (
    <GapGelContext.Provider value={value}>{children}</GapGelContext.Provider>
  );
}

export function useGapGel() {
  const ctx = useContext(GapGelContext);
  if (!ctx) throw new Error("useGapGel must be used inside GapGelProvider");
  return ctx;
}
