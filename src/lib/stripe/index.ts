// Client-side exports
export { getStripe, stripeAppearance } from './client';

// Server-side exports (only import in server components/API routes)
export {
  getStripeServer,
  createPaymentIntent,
  retrievePaymentIntent,
  constructWebhookEvent,
} from './server';
