# Stripe Subscriptions Documentation - Harry's Tix

## Overview

Harry's Tix implements a comprehensive subscription billing system using Stripe for Harry's Club premium memberships. The system handles recurring monthly payments of £15, manages subscription lifecycles, and integrates coupon codes for promotional signups.

## Stripe Configuration

### Product & Pricing Structure
- **Product ID**: `prod_SeM3JRMEY3tu9B` (Harry's Club Membership)
- **Price ID**: `price_1Rj3LnAuY5cjaU0vyB5WSdlq`
- **Amount**: £15.00 GBP per month
- **Billing Cycle**: Monthly recurring
- **Currency**: GBP (British Pounds)

### Environment Variables
```
STRIPE_SECRET_KEY=sk_test_...          # Stripe secret key for API calls
VITE_STRIPE_PUBLIC_KEY=pk_test_...     # Stripe publishable key for frontend
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook endpoint secret
```

## Subscription Flow Architecture

### 1. Membership Application Process

#### Frontend Flow (`MembershipApplicationModal.tsx`)
```typescript
// User fills out membership application
const applicationData = {
  name: string,
  email: string,
  university: string,
  graduationYear: number,
  whyJoin: string,
  appliedCouponCode?: string  // Optional coupon code
}

// Submit application with payment method collection
POST /api/membership-applications-with-payment
```

#### Backend Processing (`routes.ts`)
1. **Create Stripe Customer**
   ```typescript
   const customer = await stripe.customers.create({
     email: userData.email,
     name: userData.name,
     metadata: { userId }
   });
   ```

2. **Create Setup Intent** (for payment method collection)
   ```typescript
   const setupIntent = await stripe.setupIntents.create({
     customer: customer.id,
     payment_method_types: ['card'],
     usage: 'off_session'
   });
   ```

3. **Store Application** in database with status `pending`
4. **Return client secret** for frontend payment method collection

### 2. Admin Approval Workflow

#### Admin Actions (`Admin.tsx`)
- View all pending membership applications
- Approve or reject applications
- Approved applications trigger subscription creation

#### Subscription Creation (`routes.ts`)
```typescript
// When admin approves application
PUT /api/membership-applications/:id

// If approved, create Stripe checkout session
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{
    price: 'price_1Rj3LnAuY5cjaU0vyB5WSdlq',
    quantity: 1
  }],
  customer: stripeCustomerId,
  success_url: `${domain}/membership/success`,
  cancel_url: `${domain}/membership/cancelled`
});
```

### 3. Subscription Management

#### Create Subscription (`/api/create-subscription`)
- Validates user doesn't have existing active subscription
- Creates Stripe checkout session with stored payment method
- Applies coupon codes if available
- Redirects to Stripe-hosted checkout

#### Cancel Subscription (`/api/cancel-subscription`)
- Sets subscription to cancel at period end
- Updates membership record with `cancelAtPeriodEnd: true`
- Preserves access until current billing period expires

#### Get Membership Status (`/api/membership`)
- Returns current subscription status
- Checks if membership is active and not expired
- Provides subscription details for frontend display

## Database Schema

### Memberships Table
```sql
CREATE TABLE memberships (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES user_profiles(id),
  stripe_customer_id VARCHAR,
  stripe_subscription_id VARCHAR,
  status VARCHAR NOT NULL, -- 'active', 'canceled', 'past_due', 'unpaid'
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### User Profiles Integration
```sql
-- Additional fields in user_profiles table
ALTER TABLE user_profiles ADD COLUMN is_member BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN membership_expiry TIMESTAMP;
ALTER TABLE user_profiles ADD COLUMN stripe_customer_id VARCHAR;
ALTER TABLE user_profiles ADD COLUMN applied_coupon_code VARCHAR;
```

## Webhook Event Handling

The system listens for Stripe webhook events at `/api/stripe-webhook` to maintain subscription state synchronization.

### Supported Events

#### `checkout.session.completed`
- **Trigger**: When user completes subscription checkout
- **Action**: 
  - Create membership record in database
  - Update user profile with `isMember: true`
  - Link Stripe customer and subscription IDs

```typescript
case 'checkout.session.completed':
  const session = event.data.object;
  if (session.mode === 'subscription') {
    const { userId, customerId, subscriptionId } = session;
    
    // Create membership record
    await storage.createMembership({
      id: randomUUID(),
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: 'active'
    });
    
    // Grant membership access
    await storage.updateUserProfile(userId, {
      isMember: true,
      stripeCustomerId: customerId
    });
  }
  break;
```

#### `invoice.paid`
- **Trigger**: Successful monthly subscription payment
- **Action**: 
  - Update membership status to `active`
  - Extend `currentPeriodEnd` date
  - Ensure continued access to member benefits

```typescript
case 'invoice.paid':
  const invoice = event.data.object;
  const membership = await storage.getUserMembershipByStripeId(invoice.subscription);
  
  await storage.updateMembership(membership.id, {
    status: 'active',
    currentPeriodEnd: new Date(invoice.period_end * 1000)
  });
  break;
```

#### `invoice.payment_failed`
- **Trigger**: Failed subscription payment
- **Action**: 
  - Update membership status to `past_due`
  - Maintain access during grace period
  - Trigger retry logic via Stripe

```typescript
case 'invoice.payment_failed':
  const failedInvoice = event.data.object;
  const membership = await storage.getUserMembershipByStripeId(failedInvoice.subscription);
  
  await storage.updateMembership(membership.id, {
    status: 'past_due'
  });
  break;
```

#### `customer.subscription.updated`
- **Trigger**: Subscription modifications (cancellation, reactivation)
- **Action**: 
  - Sync subscription status with database
  - Update cancellation flags
  - Maintain billing period information

```typescript
case 'customer.subscription.updated':
  const subscription = event.data.object;
  const membership = await storage.getUserMembershipByStripeId(subscription.id);
  
  await storage.updateMembership(membership.id, {
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000)
  });
  break;
```

#### `customer.subscription.deleted`
- **Trigger**: Subscription permanently cancelled
- **Action**: 
  - Update membership status to `canceled`
  - Remove member privileges from user profile
  - Set membership expiry to current date

```typescript
case 'customer.subscription.deleted':
  const deletedSubscription = event.data.object;
  const membership = await storage.getUserMembershipByStripeId(deletedSubscription.id);
  
  await storage.updateMembership(membership.id, {
    status: 'canceled'
  });
  
  await storage.updateUserProfile(membership.userId, {
    isMember: false,
    membershipExpiry: new Date()
  });
  break;
```

## Coupon System Integration

### Coupon Validation
```typescript
// Real-time coupon validation during application
POST /api/validate-coupon
{
  "code": "STUDENT50"
}

// Response
{
  "valid": true,
  "discount": {
    "type": "percent_off",
    "amount": 50,
    "duration": "once"
  }
}
```

### Coupon Application
- Coupons are stored in user profile during application
- Applied automatically during subscription creation
- Cleared after successful application to prevent reuse
- Supports percentage and fixed amount discounts

## Frontend Integration

### Membership Status Display (`Membership.tsx`)
```typescript
const { data: membershipData } = useQuery<MembershipResponse>({
  queryKey: ['/api/membership']
});

// Display subscription status
if (membershipData?.hasSubscription) {
  // Show active membership UI
  // Display cancellation options
  // Show billing information
} else {
  // Show subscription signup flow
  // Display pricing information
}
```

### Payment Method Collection
- Uses Stripe Elements for secure card collection
- Setup Intent flow for saving payment methods
- No immediate charge - payment occurs after admin approval

### Subscription Management
- One-click subscription creation
- Cancel at period end functionality
- Automatic redirect to Stripe-hosted checkout

## Security Considerations

### Payment Method Security
- Payment methods stored securely in Stripe
- No card details stored in application database
- Setup Intent flow prevents unauthorized charges

### Webhook Security
- Webhook signatures verified using `STRIPE_WEBHOOK_SECRET`
- Prevents replay attacks and unauthorized requests
- All webhook events logged for audit trail

### User Access Control
- Membership status verified on each request
- Database-driven access control for member features
- Automatic privilege revocation on cancellation

## Error Handling

### Payment Failures
- Automatic retry logic via Stripe
- Grace period for past due accounts
- Email notifications for failed payments
- Manual retry options in admin panel

### Webhook Failures
- Idempotent webhook processing
- Duplicate event detection
- Error logging and monitoring
- Manual reconciliation tools

### Application Errors
- Comprehensive error logging
- User-friendly error messages
- Automatic rollback on failures
- Admin notification system

## Testing Strategy

### Test Mode Configuration
- All Stripe operations in test mode during development
- Test card numbers for payment method testing
- Webhook testing using Stripe CLI
- Coupon code testing with test coupons

### Test Scenarios
1. **Successful Subscription Flow**
   - Application → Approval → Payment → Activation
2. **Payment Failures**
   - Invalid cards → Retry logic → Resolution
3. **Cancellation Flow**
   - Cancel → Period end → Access revocation
4. **Coupon Integration**
   - Valid codes → Discount application → Usage tracking

## Monitoring & Analytics

### Key Metrics
- Monthly Recurring Revenue (MRR)
- Subscription churn rate
- Payment failure rates
- Coupon usage statistics

### Logging
- All subscription events logged with timestamps
- Payment attempts and failures tracked
- Admin actions audited
- Webhook processing monitored

## Future Enhancements

### Planned Features
- Annual subscription options
- Multiple pricing tiers
- Prorated upgrades/downgrades
- Subscription pause/resume functionality

### Scalability Considerations
- Database indexing for subscription queries
- Webhook processing queue for high volume
- Caching layer for membership status
- Multi-currency support preparation

---

*Last Updated: January 9, 2025*
*Version: 1.0*