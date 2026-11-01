declare module '@cashfreepayments/cashfree-js' {
  export interface CashfreeInitOptions {
    mode: 'sandbox' | 'production';
  }

  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    returnUrl?: string;
    redirectTarget?: '_self' | '_top' | '_blank';
  }

  export interface CashfreeSubscriptionCheckoutOptions {
    subsSessionId: string;
    redirectTarget?: '_self' | '_top' | '_blank';
  }

  export interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<any>;
    subscriptionsCheckout(options: CashfreeSubscriptionCheckoutOptions): Promise<any>;
  }

  export function load(options: CashfreeInitOptions): Promise<CashfreeInstance>;
}
