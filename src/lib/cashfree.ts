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
let cachedMode: string | null = null;

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

export async function getCashfreeInstance(mode: 'sandbox' | 'production' = 'production'): Promise<any> {
  if (cashfreeInstancePromise && cachedMode === mode) {
    return cashfreeInstancePromise;
  }
  cachedMode = mode;

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
  paymentSessionId?: string;
  subscriptionSessionId?: string;
  subsSessionId?: string;
  authLink?: string;
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
 * Triggers Cashfree Checkout modal/redirect for either One-Time orders or Recurring Subscriptions
 */
export async function openCashfreeCheckout(
  options: CashfreeCheckoutOptions
): Promise<CashfreeCheckoutResult> {
  const mode = options.mode || 'sandbox';

  // Recurring Subscriptions mandate flow
  if (options.subscriptionSessionId || options.subsSessionId) {
    return openCashfreeSubscriptionCheckout({
      subscriptionSessionId: options.subscriptionSessionId || options.subsSessionId,
      authLink: options.authLink,
      mode,
      redirectTarget: options.redirectTarget
    });
  }

  // If authorization link provided directly
  if (options.authLink && !options.paymentSessionId) {
    redirectToCashfreeSubscription(options.authLink);
    return { redirect: true };
  }

  if (!options.paymentSessionId) {
    throw new Error('Missing paymentSessionId for Cashfree Checkout.');
  }

  const cashfree = await getCashfreeInstance(mode);

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
 * Triggers Cashfree Subscriptions recurring mandate checkout modal/redirect
 */
export async function openCashfreeSubscriptionCheckout(
  options: {
    subscriptionSessionId?: string;
    subsSessionId?: string;
    authLink?: string;
    mode?: 'sandbox' | 'production';
    redirectTarget?: '_self' | '_top' | '_blank';
  }
): Promise<CashfreeCheckoutResult> {
  if (options.authLink) {
    redirectToCashfreeSubscription(options.authLink);
    return { redirect: true };
  }

  const subsSessionId = options.subscriptionSessionId || options.subsSessionId;
  if (!subsSessionId) {
    throw new Error('Missing subscription session ID for Cashfree Subscriptions.');
  }

  const cashfree = await getCashfreeInstance(options.mode || 'sandbox');

  return new Promise((resolve, reject) => {
    try {
      if (typeof cashfree.subscriptionsCheckout === 'function') {
        cashfree.subscriptionsCheckout({
          subsSessionId,
          redirectTarget: options.redirectTarget || '_self'
        }).then((result: any) => {
          if (result?.error) {
            reject(new Error(result.error.message || 'Subscription mandate checkout could not be completed.'));
          } else {
            resolve(result || { redirect: true });
          }
        }).catch((err: any) => {
          reject(err);
        });
      } else {
        // Fallback: Cashfree standard checkout or redirect
        cashfree.checkout({
          paymentSessionId: subsSessionId,
          redirectTarget: options.redirectTarget || '_self'
        }).then((result: any) => {
          if (result?.error) reject(new Error(result.error.message));
          else resolve(result || { redirect: true });
        }).catch((err: any) => reject(err));
      }
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
