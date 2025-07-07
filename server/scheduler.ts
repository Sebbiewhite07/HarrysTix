import { storage } from './storage';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Scheduled fulfillment function for Tuesday 7PM
export async function processWeeklyPreOrders() {
  console.log('Starting weekly pre-order processing...');
  
  try {
    // Get all approved pre-orders
    const allPreOrders = await storage.getAllPreOrders();
    const approvedPreOrders = allPreOrders.filter(po => po.status === 'approved');
    
    console.log(`Found ${approvedPreOrders.length} approved pre-orders to process`);
    
    const results = [];
    
    for (const preOrder of approvedPreOrders) {
      try {
        if (!preOrder.stripeCustomerId || !preOrder.paymentMethodId) {
          console.error(`Pre-order ${preOrder.id} missing payment information`);
          await storage.updatePreOrderStatus(preOrder.id, "failed", {
            failedAt: new Date()
          });
          continue;
        }

        // Create PaymentIntent with stored payment method
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(parseFloat(preOrder.totalPrice) * 100),
          currency: 'gbp',
          customer: preOrder.stripeCustomerId,
          payment_method: preOrder.paymentMethodId,
          off_session: true,
          confirm: true,
          metadata: {
            preOrderId: preOrder.id,
            eventId: preOrder.eventId,
            userId: preOrder.userId
          }
        });

        // Update pre-order status to processing
        await storage.updatePreOrderStatus(preOrder.id, "processing", {
          stripePaymentIntentId: paymentIntent.id
        });

        results.push({
          preOrderId: preOrder.id,
          status: "processing",
          paymentIntentId: paymentIntent.id
        });

        console.log(`Pre-order ${preOrder.id} payment initiated`);
        
      } catch (error: any) {
        console.error(`Error processing pre-order ${preOrder.id}:`, error);
        
        // Mark as failed
        await storage.updatePreOrderStatus(preOrder.id, "failed", {
          failedAt: new Date()
        });

        results.push({
          preOrderId: preOrder.id,
          status: "failed",
          error: error.message
        });
      }
    }
    
    console.log('Weekly pre-order processing completed:', results);
    return results;
    
  } catch (error) {
    console.error('Error during weekly pre-order processing:', error);
    throw error;
  }
}

// Function to be called via cron job or admin endpoint
export async function scheduledFulfillment() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 2 = Tuesday
  const hour = now.getHours();
  
  // Only run on Tuesday (day 2) at 7PM (hour 19)
  if (day === 2 && hour === 19) {
    return await processWeeklyPreOrders();
  } else {
    console.log(`Scheduled fulfillment skipped - not Tuesday 7PM (current: ${now.toISOString()})`);
    return null;
  }
}