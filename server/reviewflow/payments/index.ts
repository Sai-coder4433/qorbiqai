import { IPaymentGatewayProvider } from './types.ts';
import { RazorpayProvider } from './razorpay.provider.ts';
import { CashfreeProvider } from './cashfree.provider.ts';

export * from './types.ts';
export * from './razorpay.provider.ts';
export * from './cashfree.provider.ts';

class PaymentGatewayRegistry {
  private static instance: PaymentGatewayRegistry;
  private providers: Map<string, IPaymentGatewayProvider> = new Map();

  private constructor() {
    this.register(new RazorpayProvider());
    this.register(new CashfreeProvider());
  }

  public static getInstance(): PaymentGatewayRegistry {
    if (!PaymentGatewayRegistry.instance) {
      PaymentGatewayRegistry.instance = new PaymentGatewayRegistry();
    }
    return PaymentGatewayRegistry.instance;
  }

  public register(provider: IPaymentGatewayProvider) {
    this.providers.set(provider.name.toUpperCase(), provider);
  }

  public getProvider(name?: string): IPaymentGatewayProvider {
    // If specific name requested, use it
    if (name) {
      const p = this.providers.get(name.toUpperCase());
      if (p) return p;
    }

    // Determine from environment
    const envGateway = (process.env.PAYMENT_GATEWAY || '').toUpperCase();
    if (envGateway && this.providers.has(envGateway)) {
      return this.providers.get(envGateway)!;
    }

    // If Cashfree App ID is configured, prefer Cashfree
    if (process.env.CASHFREE_APP_ID) {
      const cf = this.providers.get('CASHFREE');
      if (cf) return cf;
    }

    // Fallback to Razorpay if registered
    const rzp = this.providers.get('RAZORPAY');
    if (rzp) return rzp;

    // Or first registered provider
    const first = Array.from(this.providers.values())[0];
    if (first) return first;

    throw new Error('No payment gateway provider is registered.');
  }

  public getActiveGatewayName(): 'RAZORPAY' | 'CASHFREE' {
    return this.getProvider().name;
  }
}

export const paymentGatewayRegistry = PaymentGatewayRegistry.getInstance();
export const paymentProvider = paymentGatewayRegistry.getProvider();
