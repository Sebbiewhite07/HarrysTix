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

- **Multiple Pre-Order System Implemented** (July 07, 2025): Enhanced pre-order functionality for maximum flexibility:
  - Removed weekly pre-order restriction - users can now pre-order from multiple events
  - Harry's Club section displays ALL available pre-order events in grid format
  - Backend logic updated to allow one pre-order per event (instead of one per week)
  - Individual pre-order status tracking for each event
  - Improved UI with event-specific pre-order buttons and status indicators

- **Event Status System Simplified** (July 07, 2025): Replaced complex drop time scheduling with simple status system:
  - Add Event modal now uses Draft/Live status selector instead of drop time field
  - Simplified event management - no more complex scheduling requirements
  - Database schema updated to make dropTime field optional (legacy support)
  - Backend API updated to handle status-based event creation
  - Admin workflow streamlined for easier event management

- **Admin Dashboard Enhanced** (July 07, 2025): Added complete admin functionality including:
  - Add Event modal with comprehensive event creation form
  - Upload Tickets modal supporting email:password format
  - Real-time event management with live data from PostgreSQL
  - Backend API endpoints for event creation and ticket upload
  - Database schema updated to support ticket credentials field

- **Ticket Purchase System** (July 07, 2025): Implemented complete ticketing flow:
  - Ticket purchase modal with quantity selection and member pricing
  - Real-time availability checking and purchase processing
  - User authentication checks and session management
  - Dashboard integration showing user's purchased tickets

- **Database Migration** (July 07, 2025): Successfully migrated from Supabase to PostgreSQL:
  - Removed all Supabase dependencies
  - Implemented Drizzle ORM with proper schema definitions
  - Session-based authentication replacing Supabase auth
  - All data now stored securely in PostgreSQL database

## Changelog

- July 07, 2025: Project migration to Replit with PostgreSQL integration
- July 07, 2025: Admin panel and ticket upload functionality implemented