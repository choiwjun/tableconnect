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

  // Idempotency check: First verify the gift exists and hasn't been processed
  const { data: existingGift, error: fetchError } = await supabase
    .from('gifts')
    .select('id, status, paid_at')
    .eq('id', giftId)
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single();

  if (fetchError || !existingGift) {
    console.error(`Gift ${giftId} not found or payment intent mismatch`);
    return;
  }

  // Idempotency: Skip if already processed
  if (existingGift.status === 'completed' && existingGift.paid_at) {
    console.log(`Gift ${giftId} already processed (idempotency check)`);
    return;
  }

  // Update gift status to completed (only if pending and not yet paid)
  const { error, count } = await supabase
    .from('gifts')
    .update({
      status: 'completed',
      paid_at: new Date().toISOString(),
    })
    .eq('id', giftId)
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .eq('status', 'pending') // Only update if still pending
    .is('paid_at', null);    // Only update if not yet paid

  if (error) {
    console.error('Error updating gift status:', error);
    throw error;
  }

  if (count === 0) {
    console.log(`Gift ${giftId} was not updated (already processed or status changed)`);
    return;
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

  // Idempotency check: First verify the gift exists
  const { data: existingGift, error: fetchError } = await supabase
    .from('gifts')
    .select('id, status')
    .eq('id', giftId)
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single();

  if (fetchError || !existingGift) {
    console.error(`Gift ${giftId} not found or payment intent mismatch`);
    return;
  }

  // Idempotency: Skip if already completed or failed
  if (existingGift.status === 'completed' || existingGift.status === 'failed') {
    console.log(`Gift ${giftId} already in terminal state: ${existingGift.status} (idempotency check)`);
    return;
  }

  // Update gift status to failed (only if still pending)
  const { error, count } = await supabase
    .from('gifts')
    .update({
      status: 'failed',
    })
    .eq('id', giftId)
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .eq('status', 'pending'); // Only update if still pending

  if (error) {
    console.error('Error updating gift status to failed:', error);
    throw error;
  }

  if (count === 0) {
    console.log(`Gift ${giftId} was not updated (already processed)`);
    return;
  }

  console.log(`Gift ${giftId} payment failed`);
}
