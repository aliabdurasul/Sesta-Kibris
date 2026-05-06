import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
} from "react";
import { toast } from "sonner";
import {
  seedMerchants,
  seedCouriers,
  seedCustomers,
  DELIVERY_FEE,
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

function reducer(state, action) {
  switch (action.type) {
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
        return {
          ...o,
          status: to,
          history: [...o.history, { status: to, at: new Date().toISOString() }],
        };
      });
      return { ...state, orders };
    }

    case "ORDER_ASSIGN_COURIER": {
      const { orderId, courierId } = action;
      const orders = state.orders.map((o) =>
        o.id === orderId ? { ...o, courierId } : o,
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

    default:
      return state;
  }
}

export function GapGelProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

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
      toast.info("Cart replaced — different merchant");
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
      toast.success("New paid order received!", {
        description: `Order ${orderId} is awaiting merchant acceptance.`,
      });
    }, 50);
  };

  const merchantAccept = (orderId) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    if (order.status !== "paid") {
      toast.error("Cannot accept — order must be paid first");
      return;
    }
    dispatch({ type: "ORDER_TRANSITION", orderId, to: "accepted" });
  };
  const merchantReject = (orderId) => {
    // Reject → revert to created (not in linear chain; admin-style override downgrade, kept demo-simple)
    dispatch({
      type: "ADMIN_FORCE_STATUS",
      orderId,
      to: "created",
    });
    toast.error("Order rejected by merchant");
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
        toast.success(`Auto-dispatched to ${idle.name}`);
      } else {
        toast.warning("No idle courier — admin must assign");
      }
    } else {
      toast.info("Self-delivery merchant — courier not needed");
    }
  };

  const courierPickup = (orderId) => {
    // ready -> out_for_delivery
    dispatch({ type: "ORDER_TRANSITION", orderId, to: "out_for_delivery" });
  };
  const courierDeliver = (orderId) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    dispatch({ type: "ORDER_TRANSITION", orderId, to: "delivered" });
    if (order.courierId) {
      dispatch({ type: "COURIER_FREE", courierId: order.courierId });
    }
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
    toast.success(`Admin override → ${to}`);
  };
  const adminForceAssign = (orderId, courierId) => {
    dispatch({ type: "ADMIN_FORCE_ASSIGN", orderId, courierId });
    toast.success(
      courierId ? "Admin assigned courier" : "Admin cleared courier",
    );
  };

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
    adminForceStatus,
    adminForceAssign,
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
