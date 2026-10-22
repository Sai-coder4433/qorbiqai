/**
 * Razorpay Checkout SDK Helper
 * Loads https://checkout.razorpay.com/v1/checkout.js dynamically
 * and opens checkout modal securely.
 * Server-verified cryptographic payments only (No simulated or mock bypasses).
 */

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('[Razorpay] Failed to load checkout.js from Razorpay CDN');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number; // in rupees from server
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  subscription_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature?: string;
}

export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions
): Promise<RazorpayPaymentSuccessResponse> {
  const loaded = await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    if (!loaded || !window.Razorpay) {
      reject(
        new Error(
          'Razorpay Checkout SDK could not be loaded from CDN. Please check your internet connection or ad-blocker.'
        )
      );
      return;
    }

    const checkoutConfig: any = {
      key: options.key,
      amount: Math.round(options.amount * 100), // in paise
      currency: options.currency || 'INR',
      name: options.name || 'ReviewFlow AI',
      description: options.description || 'ReviewFlow Unlimited Subscription',
      prefill: options.prefill || {},
      theme: options.theme || { color: '#2563eb' },
      handler: function (response: RazorpayPaymentSuccessResponse) {
        if (!response.razorpay_payment_id) {
          reject(new Error('Razorpay did not return a valid payment ID.'));
          return;
        }
        resolve(response);
      },
      modal: {
        ondismiss: function () {
          reject(new Error('PAYMENT_CANCELLED'));
        }
      }
    };

    if (options.order_id) {
      checkoutConfig.order_id = options.order_id;
    }
    if (options.subscription_id) {
      checkoutConfig.subscription_id = options.subscription_id;
    }

    try {
      const rzp = new window.Razorpay(checkoutConfig);

      rzp.on('payment.failed', function (response: any) {
        const errorDesc = response?.error?.description || response?.error?.reason || 'PAYMENT_FAILED';
        reject(new Error(errorDesc));
      });

      rzp.open();
    } catch (err: any) {
      reject(new Error(err.message || 'Failed to open Razorpay Checkout modal.'));
    }
  });
}
