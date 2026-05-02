import * as React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storefrontApiRequest } from "@/lib/shopify";

// =====================================================================
// Types
// =====================================================================

export type CartItem = {
  id: string; // local id: variantId (stable, unique per merch)
  lineId: string | null; // Shopify cart line ID (null until synced)
  slug: string;
  variantId: string; // gid://shopify/ProductVariant/...
  name: string;
  image: string;
  size: string;
  colour: string;
  price: number;
  quantity: number;
};

export type AddItemInput = Omit<CartItem, "id" | "lineId" | "quantity"> & { quantity?: number };

// =====================================================================
// Storefront cart mutations
// =====================================================================

const CART_QUERY = `
  query cart($id: ID!) { cart(id: $id) { id totalQuantity checkoutUrl } }
`;

const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        lines(first: 100) {
          edges { node { id quantity merchandise { ... on ProductVariant { id } } } }
        }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_ADD_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 100) {
          edges { node { id quantity merchandise { ... on ProductVariant { id } } } }
        }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }
`;

function formatCheckoutUrl(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set("channel", "online_store");
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

function isCartNotFoundError(userErrors: { field: string[] | null; message: string }[]): boolean {
  return userErrors.some(
    (e) =>
      e.message.toLowerCase().includes("cart not found") ||
      e.message.toLowerCase().includes("does not exist"),
  );
}

// =====================================================================
// Zustand store
// =====================================================================

type CartState = {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  isOpen: boolean;
  isLoading: boolean;
  isSyncing: boolean;

  addItem: (input: AddItemInput) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  syncCart: () => Promise<void>;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,
      checkoutUrl: null,
      isOpen: false,
      isLoading: false,
      isSyncing: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      clear: () => set({ items: [], cartId: null, checkoutUrl: null }),

      addItem: async (input) => {
        const qty = input.quantity ?? 1;
        const { items, cartId } = get();
        const existing = items.find((i) => i.variantId === input.variantId);

        set({ isLoading: true, isOpen: true });
        try {
          if (!cartId) {
            const data = await storefrontApiRequest(CART_CREATE_MUTATION, {
              input: { lines: [{ quantity: qty, merchandiseId: input.variantId }] },
            });
            const errors = data?.data?.cartCreate?.userErrors ?? [];
            if (errors.length) {
              console.error("cartCreate failed", errors);
              return;
            }
            const cart = data?.data?.cartCreate?.cart;
            if (!cart?.checkoutUrl) return;
            const lineId = cart.lines.edges[0]?.node?.id ?? null;
            set({
              cartId: cart.id,
              checkoutUrl: formatCheckoutUrl(cart.checkoutUrl),
              items: [
                {
                  ...input,
                  id: input.variantId,
                  lineId,
                  quantity: qty,
                },
              ],
            });
          } else if (existing && existing.lineId) {
            const newQty = existing.quantity + qty;
            const data = await storefrontApiRequest(CART_LINES_UPDATE_MUTATION, {
              cartId,
              lines: [{ id: existing.lineId, quantity: newQty }],
            });
            const errors = data?.data?.cartLinesUpdate?.userErrors ?? [];
            if (isCartNotFoundError(errors)) {
              get().clear();
              return;
            }
            if (errors.length) {
              console.error("cartLinesUpdate failed", errors);
              return;
            }
            set({
              items: get().items.map((i) =>
                i.variantId === input.variantId ? { ...i, quantity: newQty } : i,
              ),
            });
          } else {
            const data = await storefrontApiRequest(CART_LINES_ADD_MUTATION, {
              cartId,
              lines: [{ quantity: qty, merchandiseId: input.variantId }],
            });
            const errors = data?.data?.cartLinesAdd?.userErrors ?? [];
            if (isCartNotFoundError(errors)) {
              get().clear();
              return;
            }
            if (errors.length) {
              console.error("cartLinesAdd failed", errors);
              return;
            }
            const cart = data?.data?.cartLinesAdd?.cart;
            const newLine = cart?.lines?.edges?.find(
              (l: any) => l.node.merchandise.id === input.variantId,
            );
            const checkoutUrl = cart?.checkoutUrl
              ? formatCheckoutUrl(cart.checkoutUrl)
              : get().checkoutUrl;
            set({
              checkoutUrl,
              items: [
                ...get().items,
                {
                  ...input,
                  id: input.variantId,
                  lineId: newLine?.node?.id ?? null,
                  quantity: qty,
                },
              ],
            });
          }
        } catch (e) {
          console.error("addItem error", e);
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (id, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(id);
          return;
        }
        const { items, cartId } = get();
        const item = items.find((i) => i.id === id);
        if (!item || !item.lineId || !cartId) return;

        set({ isLoading: true });
        try {
          const data = await storefrontApiRequest(CART_LINES_UPDATE_MUTATION, {
            cartId,
            lines: [{ id: item.lineId, quantity }],
          });
          const errors = data?.data?.cartLinesUpdate?.userErrors ?? [];
          if (isCartNotFoundError(errors)) {
            get().clear();
            return;
          }
          if (errors.length) {
            console.error("cartLinesUpdate failed", errors);
            return;
          }
          set({
            items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
          });
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (id) => {
        const { items, cartId } = get();
        const item = items.find((i) => i.id === id);
        if (!item || !item.lineId || !cartId) return;

        set({ isLoading: true });
        try {
          const data = await storefrontApiRequest(CART_LINES_REMOVE_MUTATION, {
            cartId,
            lineIds: [item.lineId],
          });
          const errors = data?.data?.cartLinesRemove?.userErrors ?? [];
          if (isCartNotFoundError(errors)) {
            get().clear();
            return;
          }
          if (errors.length) {
            console.error("cartLinesRemove failed", errors);
            return;
          }
          const next = get().items.filter((i) => i.id !== id);
          if (next.length === 0) {
            get().clear();
          } else {
            set({ items: next });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      syncCart: async () => {
        const { cartId, isSyncing } = get();
        if (!cartId || isSyncing) return;
        set({ isSyncing: true });
        try {
          const data = await storefrontApiRequest(CART_QUERY, { id: cartId });
          if (!data) return;
          const cart = (data as any)?.data?.cart;
          if (!cart || cart.totalQuantity === 0) {
            get().clear();
          } else if (cart.checkoutUrl) {
            set({ checkoutUrl: formatCheckoutUrl(cart.checkoutUrl) });
          }
        } catch (e) {
          console.error("syncCart error", e);
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: "blanq.cart.v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        items: s.items,
        cartId: s.cartId,
        checkoutUrl: s.checkoutUrl,
      }),
    },
  ),
);

// =====================================================================
// React hook adapter — preserves the legacy useCart() API surface
// =====================================================================

export function useCart() {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const isLoading = useCartStore((s) => s.isLoading);
  const checkoutUrl = useCartStore((s) => s.checkoutUrl);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const openCart = useCartStore((s) => s.openCart);
  const closeCart = useCartStore((s) => s.closeCart);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return {
    items,
    isOpen,
    isLoading,
    checkoutUrl,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    openCart,
    closeCart,
    subtotal,
    count,
  };
}

// Keep legacy export so __root.tsx import doesn't break — no-op provider.
export function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function formatGBP(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

// =====================================================================
// useCartSync — call once at app root
// =====================================================================

export function useCartSync() {
  const syncCart = useCartStore((s) => s.syncCart);
  React.useEffect(() => {
    syncCart();
    const onVis = () => {
      if (document.visibilityState === "visible") syncCart();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [syncCart]);
}
