# Harry's Tix - Premium Event Ticketing Platform

## Overview

Harry's Tix is a comprehensive event ticketing platform designed specifically for student events in London. The platform offers a premium ticketing experience with membership tiers, exclusive pre-order capabilities, and a modern neon-themed interface. Built with React, Express, and PostgreSQL, it provides both public ticket sales and exclusive member benefits.

## Product Requirements Document (PRD)

### 1. Product Vision

**Mission**: To provide London students with an exclusive, premium ticketing experience for the best events in the city.

**Target Audience**: University students and young professionals in London aged 18-25 seeking premium nightlife experiences.

**Value Proposition**: 
- Exclusive access to sold-out events through membership
- Member-only pricing and early access
- Curated, high-quality event selection
- Seamless, professional booking experience

### 2. Core Features

#### 2.1 User Authentication & Management
- **Custom Authentication System**: Session-based authentication with secure password handling
- **User Profiles**: Complete user management with profile information
- **Account Dashboard**: Personalized dashboard showing tickets, membership status, and account details

#### 2.2 Membership System (Harry's Club)
- **Two-Tier System**: Regular users and Harry's Club members
- **Membership Benefits**:
  - Exclusive pre-order access to events
  - Member-only pricing (typically lower than public prices)
  - Early access to ticket sales
  - Exclusive events and experiences
- **Application Process**: Users can apply for membership with admin approval required
- **Invite Code System**: Approved members receive unique invite codes for friends

#### 2.3 Event Management
- **Event Creation**: Admin interface for creating and managing events
- **Event Details**: Title, description, date, time, venue, pricing, and capacity
- **Dual Pricing**: Separate pricing for members and public users
- **Event Status**: Active/inactive event management
- **Ticket Upload**: Bulk ticket upload system for event organizers

#### 2.4 Ticket Purchase System
- **Dual Purchase Flows**:
  1. **Direct Purchase**: Immediate ticket buying with Stripe payment
  2. **Pre-Order System**: Member-exclusive advance ordering with approval workflow

##### Direct Purchase Flow:
1. User selects event and quantity
2. Real-time price calculation (member vs. public pricing)
3. Secure Stripe payment processing
4. Immediate ticket generation with confirmation code
5. Automatic email delivery with ticket details

##### Pre-Order Flow:
1. Members place pre-orders for upcoming events
2. Payment method saved securely via Stripe SetupIntent
3. Admin approval required for pre-order processing
4. Automated charging on approval with webhook handling
5. Ticket delivery after successful payment

#### 2.5 Payment Processing
- **Stripe Integration**: Complete payment processing with Elements UI
- **Secure Payment Methods**: Support for all major cards
- **Webhook System**: Automatic ticket creation on payment confirmation
- **Development Fallback**: Immediate ticket creation when webhooks unavailable
- **Payment Status Tracking**: Real-time payment monitoring and error handling

#### 2.6 Harry's Club Subscription System
- **Monthly Billing**: £15/month recurring subscription for premium membership
- **Stripe Integration**: Complete subscription lifecycle management
- **Payment Collection**: Secure payment method storage during application
- **Automatic Billing**: Recurring payments with webhook synchronization
- **Subscription Management**: Cancel, pause, and modify subscriptions
- **Coupon System**: Promotional discount codes for membership signups
- **Grace Period**: Maintained access during payment failures

#### 2.7 Email Notification System
- **Automated Emails**: Ticket confirmations, pre-order confirmations
- **Professional Templates**: HTML email templates with branding
- **Nodemailer Integration**: Reliable email delivery service
- **Email Types**:
  - Ticket confirmation with QR codes and event details
  - Pre-order placement confirmations
  - Membership application status updates
  - Subscription billing notifications

#### 2.8 Administrative Dashboard
- **Event Management**: Create, edit, and manage all events
- **User Management**: View and manage user accounts and memberships
- **Membership Applications**: Review and approve/reject membership requests
- **Pre-Order Management**: 
  - View all pre-orders with filtering capabilities
  - Bulk approval and processing workflows
  - Individual pre-order status management
- **Coupon Management**: Create, edit, and delete promotional discount codes
- **Subscription Oversight**: Monitor membership billing and subscription status
- **Analytics Dashboard**: 
  - User growth metrics
  - Revenue tracking
  - Event performance analytics
  - Membership statistics
  - Subscription and billing analytics

### 3. Technical Architecture

#### 3.1 Frontend (React)
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **State Management**: React Context API with custom hooks
- **UI Components**: Shadcn/ui with custom neon theme
- **Styling**: Tailwind CSS with purple/cyan gradient theme
- **Payment UI**: Stripe Elements for secure payment forms
- **Build Tool**: Vite for fast development and optimized builds

#### 3.2 Backend (Express.js)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with express-session
- **Payment Processing**: Stripe API integration
- **Email Service**: Nodemailer with SMTP support
- **API Design**: RESTful endpoints with proper error handling

#### 3.3 Database Schema
```sql
-- Core user management
user_profiles: User account information and membership status
membership_applications: Membership application tracking
memberships: Active subscription tracking with Stripe integration
invite_codes: Member invite system

-- Event and ticketing
events: Event details with dual pricing
tickets: Purchased tickets with confirmation codes
pre_orders: Member pre-order system with status tracking

-- Session management
sessions: Secure session storage
```

#### 3.4 External Services
- **Stripe**: Payment processing and webhook handling
- **PostgreSQL**: Primary database (Neon serverless)
- **Nodemailer**: Email delivery service
- **Replit**: Development and hosting environment

### 4. User Experience Design

#### 4.1 Design System
- **Theme**: Neon cyberpunk aesthetic with purple/cyan gradients
- **Typography**: Modern, clean fonts optimized for readability
- **Color Palette**:
  - Primary: Purple (#8B5CF6)
  - Secondary: Cyan (#06B6D4)
  - Accent: Gold (#F59E0B)
  - Background: Deep black with subtle gradients
- **Animations**: Smooth transitions, hover effects, and loading states
- **Responsive**: Mobile-first design with desktop optimization

#### 4.2 User Flows

##### New User Registration:
1. User creates account with email/password
2. Email verification (if implemented)
3. Optional membership application
4. Dashboard onboarding

##### Event Discovery:
1. Browse events on homepage
2. View detailed event information
3. See member vs. public pricing
4. Decision: immediate purchase or pre-order (if member)

##### Ticket Purchase:
1. Select quantity and pricing tier
2. Secure Stripe payment processing
3. Instant ticket generation
4. Email confirmation delivery
5. Ticket storage in user dashboard

##### Membership Journey:
1. Application submission with personal details
2. Admin review process
3. Approval/rejection notification
4. Invite code generation for approved members
5. Access to exclusive pre-order features

### 5. Business Requirements

#### 5.1 Revenue Model
- **Ticket Sales**: Commission or fixed fee per ticket
- **Membership Subscriptions**: £15/month recurring billing for Harry's Club
- **Premium Events**: Higher-value exclusive events for members
- **Promotional Partnerships**: Coupon-based marketing campaigns

#### 5.2 Operational Requirements
- **Event Capacity Management**: Real-time inventory tracking
- **Member Verification**: Manual approval process for quality control
- **Customer Support**: Ticket resend, refund handling, issue resolution
- **Fraud Prevention**: Secure payment processing and user verification

#### 5.3 Compliance & Security
- **Data Protection**: GDPR-compliant user data handling
- **Payment Security**: PCI-DSS compliance through Stripe
- **Session Security**: Secure cookie handling and CSRF protection
- **Email Security**: Anti-spam measures and opt-out capabilities

### 6. Performance Requirements

#### 6.1 System Performance
- **Response Time**: < 2 seconds for all page loads
- **Payment Processing**: < 5 seconds for transaction completion
- **Database Queries**: Optimized with proper indexing
- **Email Delivery**: < 30 seconds for confirmation emails

#### 6.2 Scalability
- **User Capacity**: Support for 10,000+ concurrent users
- **Event Volume**: Handle 100+ simultaneous events
- **Database Performance**: Efficient queries with connection pooling
- **CDN Integration**: Static asset optimization

### 7. Future Enhancements

#### 7.1 Phase 2 Features
- **Mobile App**: Native iOS/Android applications
- **Social Features**: Friend invitations, social sharing
- **Loyalty Program**: Points system for frequent attendees
- **Event Reviews**: Post-event feedback and ratings

#### 7.2 Advanced Features
- **AI Recommendations**: Personalized event suggestions
- **Group Bookings**: Coordinated group ticket purchases
- **Waitlist System**: Automatic notification for sold-out events
- **Integration APIs**: Third-party event discovery services

### 8. Development Status

#### 8.1 Completed Features ✅
- User authentication and account management
- Event creation and management system
- Direct ticket purchase with Stripe integration
- Pre-order system with approval workflow
- Membership application and management
- **Harry's Club subscription billing system** (£15/month recurring)
- **Comprehensive coupon system** with real-time validation
- **Complete Stripe webhook integration** for subscription lifecycle
- Admin dashboard with analytics
- **Coupon management interface** for promotional campaigns
- Email notification system
- Responsive neon-themed UI
- Database schema and migrations
- **Advanced payment method storage** during application process

#### 8.2 Current Capabilities
- **User Management**: Full registration, login, profile management
- **Event System**: Complete event CRUD with dual pricing
- **Payment Processing**: Direct purchase, pre-orders, and recurring subscriptions
- **Subscription Management**: Monthly billing, cancellation, grace periods
- **Coupon System**: Real-time validation, promotional discount application
- **Admin Tools**: Comprehensive interface with subscription and coupon management
- **Email System**: Automated confirmations and notifications
- **Membership**: Application process with Stripe payment collection
- **Webhook Processing**: Complete Stripe event handling for subscriptions

### 9. Technical Specifications

#### 9.1 Development Environment
- **Node.js**: v20.x with TypeScript
- **Package Manager**: npm with lock file versioning
- **Development Server**: Vite with HMR
- **Database**: PostgreSQL with Drizzle migrations
- **Environment**: Replit cloud development

#### 9.2 Production Deployment
- **Build Process**: Vite production build with asset optimization
- **Database**: Neon serverless PostgreSQL
- **Session Storage**: PostgreSQL-backed session store
- **Static Assets**: Served through Express in production
- **Environment Variables**: Secure secret management

### 10. Getting Started

#### 10.1 Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

#### 10.2 Required Environment Variables
```bash
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLIC_KEY=pk_...
SESSION_SECRET=your-session-secret

# Email Configuration (Optional - for production email delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### 10.3 Test Accounts
- **Admin**: admin@example.com / password123
- **Member**: member@example.com / password123
- **Regular User**: Create new account through registration

### 11. Recent Major Updates

#### 11.1 Harry's Club Subscription System (January 2025)
- **Complete Stripe Integration**: Monthly £15 subscription billing
- **Payment Collection**: Secure payment method storage during membership application
- **Subscription Lifecycle**: Full webhook handling for renewals, failures, and cancellations
- **Product Configuration**: Using Stripe Product ID `prod_SeM3JRMEY3tu9B`
- **Billing Management**: Automatic membership benefits activation/deactivation

#### 11.2 Advanced Coupon System (January 2025)
- **Real-time Validation**: Coupon codes validated against Stripe API
- **Promotional Discounts**: Support for percentage and fixed amount discounts
- **Admin Management**: Complete coupon CRUD interface
- **Stripe Integration**: Coupons properly applied to subscription checkout sessions
- **Usage Tracking**: Metadata tracking for coupon redemption analytics

#### 11.3 Enhanced Payment Architecture
- **Dual Payment Systems**: Direct purchases and subscription billing
- **Payment Method Security**: Stripe SetupIntent for secure storage
- **Webhook Reliability**: Complete event handling for all payment scenarios
- **Error Handling**: Graceful fallbacks for payment failures
- **Audit Trail**: Comprehensive logging for all payment activities

#### 11.4 Technical Documentation
- **Comprehensive API Documentation**: Complete Stripe subscription workflow documentation
- **Integration Guides**: Step-by-step setup instructions
- **Testing Procedures**: Validation methods for payment systems
- **Security Protocols**: Best practices for payment data handling

---

**Harry's Tix** - Bringing London's best events to students with style, exclusivity, and seamless subscription management.