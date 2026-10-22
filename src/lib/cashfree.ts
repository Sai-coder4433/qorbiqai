/**
 * Cashfree Checkout & Subscriptions SDK Helper
 * Loads https://sdk.cashfree.com/js/v3/cashfree.js dynamically
 * and triggers hosted checkout with paymentSessionId or subscription redirect.
 */

declare global {
  interface Window {
    Cashfree?: any;
  }
}

let cashfreeInstancePromise: Promise<any> | null = null;

export function loadCashfreeScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Cashfree) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('[Cashfree] Failed to load cashfree.js from CDN');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export async function getCashfreeInstance(mode: 'sandbox' | 'production' = 'sandbox'): Promise<any> {
  if (cashfreeInstancePromise) {
    return cashfreeInstancePromise;
  }

  cashfreeInstancePromise = (async () => {
    // 1. Try ESM package first if available
    try {
      const { load } = await import('@cashfreepayments/cashfree-js');
      if (typeof load === 'function') {
        const cf = await load({ mode });
        if (cf) return cf;
      }
    } catch {
      // Fallback to script tag
    }

    // 2. Fallback to CDN script
    const loaded = await loadCashfreeScript();
    if (!loaded || !window.Cashfree) {
      throw new Error(
        'Cashfree JS SDK could not be loaded. Please check your internet connection or ad-blocker.'
      );
    }

    return window.Cashfree({ mode });
  })();

  return cashfreeInstancePromise;
}

export interface CashfreeCheckoutOptions {
  paymentSessionId: string;
  returnUrl?: string;
  mode?: 'sandbox' | 'production';
  redirectTarget?: '_self' | '_top' | '_blank';
}

export interface CashfreeCheckoutResult {
  error?: {
    message: string;
    code?: string;
  };
  redirect?: boolean;
  paymentDetails?: any;
}

/**
 * Triggers Cashfree Checkout modal/redirect using paymentSessionId
 */
export async function openCashfreeCheckout(
  options: CashfreeCheckoutOptions
): Promise<CashfreeCheckoutResult> {
  if (!options.paymentSessionId) {
    throw new Error('Missing paymentSessionId for Cashfree Checkout.');
  }

  const cashfree = await getCashfreeInstance(options.mode || 'sandbox');

  return new Promise((resolve, reject) => {
    try {
      cashfree.checkout({
        paymentSessionId: options.paymentSessionId,
        returnUrl: options.returnUrl,
        redirectTarget: options.redirectTarget || '_self'
      }).then((result: any) => {
        if (result?.error) {
          reject(new Error(result.error.message || 'Payment could not be completed.'));
        } else {
          resolve(result || { redirect: true });
        }
      }).catch((err: any) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Redirects customer to Cashfree Subscription mandate approval page
 */
export function redirectToCashfreeSubscription(authLink: string): void {
  if (!authLink) {
    throw new Error('Cashfree Subscription authorization link is missing.');
  }
  window.location.href = authLink;
}
