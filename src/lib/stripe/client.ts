import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

/**
 * Get Stripe instance for client-side usage
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(publishableKey, {
      locale: 'ja',
    });
  }

  return stripePromise;
}

/**
 * Stripe appearance configuration for Elements
 */
export const stripeAppearance = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#ff0080',
    colorBackground: '#1a1a27',
    colorText: '#f0f0f5',
    colorDanger: '#ef4444',
    fontFamily: '"DM Sans", sans-serif',
    fontSizeBase: '16px',
    borderRadius: '8px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      backgroundColor: '#0a0a0f',
      border: '1px solid #2a2a3d',
    },
    '.Input:focus': {
      borderColor: '#00ffff',
      boxShadow: '0 0 0 1px rgba(0, 255, 255, 0.3)',
    },
    '.Label': {
      color: '#a0a0b0',
    },
    '.Error': {
      color: '#ef4444',
    },
  },
};
