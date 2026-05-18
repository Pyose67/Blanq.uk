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

// Poll document.cookie until _shopify_y is present (set by useShopifyCookies async fetch)
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
  const sentRef = useRef<string | null>(null);

  // Re-runs when pathname changes OR when cookies become ready
  useEffect(() => {
    if (!cookiesReady) return;
    if (sentRef.current === pathname) return;
    sentRef.current = pathname;

    let pageType: string = AnalyticsPageType.page;
    if (pathname === "/") pageType = AnalyticsPageType.home;
    else if (pathname.startsWith("/product/")) pageType = AnalyticsPageType.product;
    else if (pathname.startsWith("/collections/")) pageType = AnalyticsPageType.collection;
    else if (pathname.startsWith("/policies/")) pageType = AnalyticsPageType.policy;

    (async () => {
      if (!shopIdRef.current) shopIdRef.current = await getShopId();
      if (!shopIdRef.current) return;
      await firePageView(shopIdRef.current, pageType);
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
