import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  sendShopifyAnalytics,
  useShopifyCookies,
  getClientBrowserParameters,
  AnalyticsEventName,
  AnalyticsPageType,
} from "@shopify/hydrogen-react";
import {
  getShopId,
  SHOPIFY_STORE_PERMANENT_DOMAIN,
  SHOPIFY_STOREFRONT_TOKEN,
} from "@/lib/shopify";

const CURRENCY = "GBP" as const;
const LANGUAGE = "EN" as const;

function waitForCookies(maxMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();
    function check() {
      if (document.cookie.includes("_shopify_y=")) return resolve(true);
      if (Date.now() - start > maxMs) return resolve(false);
      setTimeout(check, 100);
    }
    check();
  });
}

function pathnameToPageType(path: string): string {
  if (path === "/") return AnalyticsPageType.home;
  if (path.startsWith("/product/")) return AnalyticsPageType.product;
  if (path.startsWith("/collections/")) return AnalyticsPageType.collection;
  if (path.startsWith("/policies/")) return AnalyticsPageType.policy;
  return AnalyticsPageType.page;
}

async function firePageView(shopId: string, pageType: string, extra?: object) {
  await sendShopifyAnalytics(
    {
      eventName: AnalyticsEventName.PAGE_VIEW,
      payload: {
        ...getClientBrowserParameters(),
        shopId,
        currency: CURRENCY,
        acceptedLanguage: LANGUAGE,
        shopifySalesChannel: "headless",
        pageType,
        hasUserConsent: true,
        ...extra,
      },
    },
    SHOPIFY_STORE_PERMANENT_DOMAIN,
  );
}

export function ShopifyAnalytics() {
  const cookiesReady = useShopifyCookies({
    hasUserConsent: true,
    storefrontAccessToken: SHOPIFY_STOREFRONT_TOKEN,
    fetchTrackingValues: true,
    checkoutDomain: SHOPIFY_STORE_PERMANENT_DOMAIN,
  });

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const shopIdRef = useRef<string | null>(null);
  const sentPaths = useRef<Set<string>>(new Set());
  // Queue paths visited before cookies were ready
  const pendingPaths = useRef<Set<string>>(new Set());

  // While cookies aren't ready, collect visited paths
  useEffect(() => {
    if (!cookiesReady) {
      pendingPaths.current.add(pathname);
    }
  }, [pathname, cookiesReady]);

  // Once cookies are ready, fire all pending paths + current path
  useEffect(() => {
    if (!cookiesReady) return;

    const toFire = new Set([...pendingPaths.current, pathname]);
    pendingPaths.current.clear();

    (async () => {
      if (!shopIdRef.current) shopIdRef.current = await getShopId();
      if (!shopIdRef.current) return;

      for (const path of toFire) {
        if (sentPaths.current.has(path)) continue;
        sentPaths.current.add(path);
        await firePageView(shopIdRef.current, pathnameToPageType(path));
      }
    })();
  }, [pathname, cookiesReady]);

  return null;
}

export function useProductViewAnalytics(
  productId: string,
  productTitle: string,
  price: string,
  productType: string,
) {
  const shopIdRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!(await waitForCookies())) return;
      if (!shopIdRef.current) shopIdRef.current = await getShopId();
      if (!shopIdRef.current) return;
      await firePageView(shopIdRef.current, AnalyticsPageType.product, {
        resourceId: productId,
        products: [
          {
            productGid: productId,
            name: productTitle,
            brand: "BLANQ",
            category: productType,
            price,
            quantity: 1,
          },
        ],
      });
    })();
  }, [productId]);
}

export function useCollectionViewAnalytics(handle: string, collectionId: string | undefined) {
  const shopIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!collectionId) return;
    (async () => {
      if (!(await waitForCookies())) return;
      if (!shopIdRef.current) shopIdRef.current = await getShopId();
      if (!shopIdRef.current) return;
      await firePageView(shopIdRef.current, AnalyticsPageType.collection, {
        resourceId: collectionId,
        collectionHandle: handle,
      });
    })();
  }, [collectionId, handle]);
}
