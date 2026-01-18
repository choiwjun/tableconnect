import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStripeServer } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  const stripe = getStripeServer();

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const giftId = paymentIntent.metadata?.gift_id;

  if (!giftId) {
    console.error('No gift_id in payment intent metadata');
    return;
  }

  const supabase = getSupabaseAdmin();

  // Update gift status to completed
  const { error } = await supabase
    .from('gifts')
    .update({
      status: 'completed',
      paid_at: new Date().toISOString(),
    })
    .eq('id', giftId)
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Error updating gift status:', error);
    throw error;
  }

  console.log(`Gift ${giftId} payment completed successfully`);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const giftId = paymentIntent.metadata?.gift_id;

  if (!giftId) {
    console.error('No gift_id in payment intent metadata');
    return;
  }

  const supabase = getSupabaseAdmin();

  // Update gift status to failed
  const { error } = await supabase
    .from('gifts')
    .update({
      status: 'failed',
    })
    .eq('id', giftId)
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Error updating gift status to failed:', error);
    throw error;
  }

  console.log(`Gift ${giftId} payment failed`);
}
