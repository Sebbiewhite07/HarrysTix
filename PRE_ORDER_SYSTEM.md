
# Harry's Tix Pre-Order System Documentation

## Overview

The Harry's Tix pre-order system allows Harry's Club members to reserve tickets for upcoming events before they go on public sale. The system uses Stripe for secure payment method collection and processes payments only when tickets are confirmed available by administrators.

## System Architecture

### Core Components

1. **Frontend Components**
   - `PreOrderModal.tsx` - Basic pre-order form (legacy)
   - `PreOrderPaymentModal.tsx` - Advanced pre-order with Stripe payment method collection
   - `PreOrderCard.tsx` - Display individual pre-order status
   - `AdminPreOrderManagement.tsx` - Admin interface for managing pre-orders

2. **Backend Systems**
   - Pre-order API endpoints (`/api/pre-orders/*`)
   - Stripe integration for payment method storage
   - Webhook handling for payment confirmation
   - Scheduled processing system

3. **Database Schema**
   - Pre-orders table with status tracking
   - Integration with events, users, and tickets tables

## Pre-Order Flow

### Phase 1: Member Pre-Order Placement

#### User Experience
1. **Eligibility Check**: Only Harry's Club members can place pre-orders
2. **Event Selection**: Members can pre-order tickets for events with status "pre-order"
3. **Quantity Limits**: Each member can pre-order 1 ticket per event (configurable via `memberMaxPerUser`)
4. **Payment Method Setup**: Stripe SetupIntent collects payment method without charging

#### Technical Flow
```javascript
// 1. User initiates pre-order
POST /api/pre-orders
{
  eventId: "event-uuid",
  quantity: 1,
  paymentMethodId: "pm_stripe_id"
}

// 2. Backend validation
- Check user membership status
- Verify event availability for pre-order
- Ensure no duplicate pre-orders for same event
- Calculate total price using member pricing

// 3. Stripe customer setup
- Create/retrieve Stripe customer
- Attach payment method to customer
- Store customer and payment method IDs

// 4. Database record creation
- Create pre-order with status: "pending"
- Send confirmation email to user
```

### Phase 2: Administrative Review

#### Admin Dashboard Features
- View all pre-orders by event and status
- Filter by status: pending, approved, processing, paid, failed, cancelled
- Bulk operations for efficiency
- Individual pre-order management

#### Status Management
- **Pending**: Initial state after user submission
- **Approved**: Admin has approved for payment processing
- **Processing**: Payment is being processed by Stripe
- **Paid**: Payment successful, ticket created
- **Failed**: Payment failed, user notified
- **Cancelled**: User or admin cancelled the pre-order

### Phase 3: Payment Processing

#### Manual Fulfillment (Current Implementation)
```javascript
// Admin triggers payment processing
POST /api/admin/fulfill-pre-orders
{
  preOrderIds: ["pre-order-uuid-1", "pre-order-uuid-2"]
}

// Backend processes each pre-order
await stripe.paymentIntents.create({
  amount: totalPrice * 100, // Convert to pence
  currency: 'gbp',
  customer: stripeCustomerId,
  payment_method: paymentMethodId,
  off_session: true, // Charge without user present
  confirm: true,
  metadata: {
    preOrderId: preOrder.id,
    eventId: preOrder.eventId,
    userId: preOrder.userId
  }
});
```

#### Scheduled Processing (Tuesday 7PM)
- Manual trigger endpoint: `POST /api/admin/process-weekly-preorders`
- Processes all approved pre-orders automatically
- Handles payment confirmation via webhooks

## API Endpoints

### User Endpoints
```
GET    /api/pre-orders              # Get user's pre-orders
GET    /api/pre-orders/weekly       # Get current week's pre-order
POST   /api/pre-orders              # Create new pre-order
DELETE /api/pre-orders/:id          # Cancel pre-order
```

### Admin Endpoints
```
GET    /api/admin/pre-orders        # Get all pre-orders
PATCH  /api/admin/pre-orders/:id    # Update pre-order status
POST   /api/admin/fulfill-pre-orders # Process multiple pre-orders
POST   /api/admin/process-weekly-preorders # Manual weekly processing
```

### Stripe Endpoints
```
POST   /api/create-setup-intent     # Create payment method setup
POST   /webhook                     # Stripe webhook handler
```

## Payment Method Collection

### SetupIntent Flow
1. **Frontend**: `PreOrderPaymentModal` uses Stripe Elements
2. **Backend**: Creates SetupIntent for payment method collection
3. **Stripe**: Validates and stores payment method
4. **Database**: Links payment method to user and pre-order

```javascript
// Setup Intent creation
const setupIntent = await stripe.setupIntents.create({
  customer: stripeCustomerId,
  usage: 'off_session'
});

// Payment method attachment during pre-order
await stripe.paymentMethods.attach(paymentMethodId, {
  customer: stripeCustomerId
});
```

## Webhook Integration

### Supported Stripe Events

#### `payment_intent.succeeded`
- Updates pre-order status to "paid"
- Creates ticket record automatically
- Sends ticket confirmation email
- Links ticket to original pre-order

#### `payment_intent.payment_failed`
- Updates pre-order status to "failed"
- Logs failure reason
- Triggers user notification

```javascript
// Webhook handler example
case 'payment_intent.succeeded':
  const paymentIntent = event.data.object;
  const preOrderId = paymentIntent.metadata.preOrderId;
  
  // Create ticket for successful payment
  const ticket = await storage.createTicket({
    id: randomUUID(),
    eventId: preOrder.eventId,
    userId: preOrder.userId,
    quantity: preOrder.quantity,
    totalPrice: preOrder.totalPrice,
    confirmationCode: generateConfirmationCode(),
    status: 'confirmed'
  });
```

## Email Notifications

### Pre-Order Confirmation
- Sent immediately after pre-order placement
- Includes event details and next steps
- Template: Basic HTML email with Harry's Tix branding

### Payment Notifications
- Success: Ticket confirmation with download link
- Failure: Payment failure notice with retry instructions

## Security Features

### Payment Security
- No card details stored in application database
- Stripe handles all sensitive payment data
- Setup Intent prevents unauthorized charges
- Off-session payments for confirmed orders

### Access Control
- Member-only pre-order placement
- Admin-only processing capabilities
- User can only view/cancel their own pre-orders

## Current Limitations & Future Enhancements

### Current System
- Manual admin approval required
- Single payment method per pre-order
- Limited to 1 ticket per event per member
- Manual weekly processing trigger

### Planned Improvements
- Automatic approval based on availability
- Multiple payment method support
- Configurable quantity limits per event
- Automated scheduling for Tuesday 7PM processing
- Enhanced notification system
- Refund handling for cancelled events

## Database Schema

### Pre-Orders Table
```sql
CREATE TABLE pre_orders (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES user_profiles(id),
  event_id VARCHAR NOT NULL REFERENCES events(id),
  quantity INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  payment_method_id VARCHAR,
  stripe_customer_id VARCHAR,
  stripe_payment_intent_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  paid_at TIMESTAMP,
  failed_at TIMESTAMP
);
```

### Status Lifecycle
```
pending → approved → processing → paid/failed
    ↓         ↓          ↓
cancelled cancelled  cancelled (with refund)
```

## Testing the System

### Test Cards (Stripe Test Mode)
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Insufficient Funds**: 4000 0000 0000 9995

### Test Flow
1. Login as member account
2. Place pre-order for "pre-order" status event
3. Login as admin account
4. Approve and process pre-order
5. Verify ticket creation and email delivery

### Monitoring
- Check browser console for errors
- Monitor server logs for webhook events
- Verify Stripe dashboard for payment status
- Check email delivery in development mode

## Troubleshooting

### Common Issues
1. **"Payment method required"**: User needs to complete Stripe setup
2. **"Pre-order already exists"**: User tried to pre-order same event twice
3. **"Event not available"**: Event status is not "pre-order"
4. **Webhook failures**: Check Stripe webhook configuration

### Debug Commands
```bash
# Check user's pre-orders
curl -X GET http://localhost:5000/api/pre-orders -b cookies.txt

# Admin view all pre-orders
curl -X GET http://localhost:5000/api/admin/pre-orders -b admin_cookies.txt

# Process specific pre-order
curl -X POST http://localhost:5000/api/admin/fulfill-pre-orders \
  -H "Content-Type: application/json" \
  -b admin_cookies.txt \
  -d '{"preOrderIds":["pre-order-id"]}'
```

---

*Last Updated: January 2025*
*System Version: 2.0*
