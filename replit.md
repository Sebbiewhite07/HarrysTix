# Harry's Tix - Event Ticketing Platform

## Overview

Harry's Tix is a modern event ticketing platform designed specifically for student events in London. The application provides a premium ticketing experience with membership tiers, exclusive events, and a sleek neon-themed UI. Built with React, Express, and PostgreSQL, it offers both public and member-exclusive ticket sales with administrative capabilities.

## System Architecture

The application follows a full-stack monorepo architecture with clear separation between frontend, backend, and shared components:

- **Frontend**: React with TypeScript, using Vite for development and bundling
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Custom session-based authentication
- **Styling**: Tailwind CSS with custom neon theme and shadcn/ui components
- **State Management**: React Context API with custom hooks

## Key Components

### Frontend Architecture
- **React Router**: Client-side routing for SPA navigation
- **Authentication Context**: Centralized auth state management with custom API integration
- **Component Library**: shadcn/ui components with custom neon styling
- **TypeScript**: Full type safety across the frontend
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Backend Architecture
- **Express Server**: RESTful API with middleware for logging and error handling
- **Drizzle ORM**: Type-safe database queries with PostgreSQL
- **Storage Layer**: Abstracted storage interface supporting both memory and database implementations
- **Environment Configuration**: Secure configuration management for database connections

### Database Schema
- **Users Table**: Core user information with username/password authentication
- **Membership System**: Boolean flags for member status and admin privileges
- **Scalable Design**: Schema designed to support additional features like events, tickets, and payments

### UI/UX Design
- **Neon Theme**: Custom purple/cyan gradient theme with optimized readability
- **Component System**: Consistent design patterns using shadcn/ui components
- **Accessibility**: Proper contrast ratios and keyboard navigation support
- **Animation**: Smooth transitions and hover effects for enhanced user experience

## Data Flow

1. **User Authentication**: Custom session-based auth with user profiles stored in PostgreSQL database
2. **Event Management**: Events are managed through the admin interface with real-time availability tracking
3. **Ticket Purchasing**: Multi-tier pricing system with member discounts and purchase limits
4. **State Management**: React Context provides global state for authentication and user data

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for Neon database
- **drizzle-orm**: Type-safe ORM for database operations
- **express-session**: Secure session-based authentication
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire stack
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundling for production

### Integrations
- **Neon Database**: Serverless PostgreSQL hosting
- **Custom Auth**: Session-based authentication with PostgreSQL storage
- **Replit**: Development environment with cartographer integration

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend development
- Express server with tsx for TypeScript execution
- Environment-based configuration for database connections

### Production Build
- Frontend: Vite builds static assets to `dist/public`
- Backend: ESBuild bundles server code to `dist/index.js`
- Single deployment artifact with static file serving

### Database Management
- Drizzle migrations stored in `./migrations`
- Schema defined in `shared/schema.ts` for type sharing
- Environment variable configuration for database URL

### Hosting Considerations
- Static frontend assets served by Express in production
- PostgreSQL database connection via environment variables
- Support for serverless deployment patterns

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **Complete End-to-End Pre-Order Fulfillment System** (July 07, 2025): Implemented full specification compliance:
  - Multiple pre-order support (users can pre-order unlimited events, one per event)
  - Stripe webhook handler for automatic ticket creation after payment success
  - Scheduled fulfillment system for Tuesday 7PM processing
  - Admin manual trigger for weekly pre-order processing
  - Complete payment flow from pre-order to ticket delivery
  - Status tracking across all stages: pending → approved → processing → paid/failed

- **Complete Stripe Pre-Order Payment System** (July 07, 2025): Implemented comprehensive payment integration:
  - Stripe SetupIntent flow for saving payment methods without immediate charging
  - PreOrderPaymentModal component with Stripe Elements integration
  - Admin pre-order management interface with bulk approval capabilities
  - Webhook handler for automatic ticket assignment after successful payments
  - Real-time payment processing with proper error handling and status tracking

- **Enhanced Admin Dashboard** (July 07, 2025): Added complete pre-order management capabilities:
  - Pre-Order Management tab with filtering and bulk operations
  - Individual pre-order approval and payment processing workflows
  - Status tracking across pending, approved, paid, failed, and cancelled states
  - Integration with Stripe for secure payment method collection and charging

- **Fixed Ticket Purchase System** (July 07, 2025): Resolved validation issues and completed implementation:
  - Fixed backend validation errors in ticket creation endpoint
  - Proper field mapping between frontend and backend APIs
  - Successful ticket generation with confirmation codes
  - Real-time purchase processing with member pricing support

- **Unlimited Pre-Order System** (July 07, 2025): Removed all restrictions for maximum flexibility:
  - Users can now pre-order unlimited events simultaneously
  - Only restriction: one pre-order per specific event (prevents duplicates)
  - Harry's Club section displays ALL available pre-order events
  - Individual pre-order status tracking for each event
  - Improved UI with event-specific pre-order buttons and status indicators

- **Database Migration** (July 07, 2025): Successfully migrated from Supabase to PostgreSQL:
  - Removed all Supabase dependencies
  - Implemented Drizzle ORM with proper schema definitions
  - Session-based authentication replacing Supabase auth
  - All data now stored securely in PostgreSQL database

## Changelog

- July 07, 2025: Project migration to Replit with PostgreSQL integration
- July 07, 2025: Admin panel and ticket upload functionality implemented