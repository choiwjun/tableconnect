import Stripe from 'stripe';

let stripe: Stripe | null = null;

/**
 * Get Stripe instance for server-side usage
 */
export function getStripeServer(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }

    stripe = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }

  return stripe;
}

/**
 * Create a payment intent for a gift
 */
export async function createPaymentIntent({
  amount,
  menuId,
  senderSessionId,
  receiverSessionId,
  merchantId,
}: {
  amount: number;
  menuId: string;
  senderSessionId: string;
  receiverSessionId: string;
  merchantId: string;
}) {
  const stripe = getStripeServer();

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'jpy',
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      menu_id: menuId,
      sender_session_id: senderSessionId,
      receiver_session_id: receiverSessionId,
      merchant_id: merchantId,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Retrieve a payment intent by ID
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  const stripe = getStripeServer();
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripeServer();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
