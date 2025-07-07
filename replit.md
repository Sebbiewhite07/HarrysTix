# Harry's Tix - Event Ticketing Platform

## Overview

Harry's Tix is a modern event ticketing platform designed specifically for student events in London. The application provides a premium ticketing experience with membership tiers, exclusive events, and a sleek neon-themed UI. Built with React, Express, and PostgreSQL, it offers both public and member-exclusive ticket sales with administrative capabilities.

## System Architecture

The application follows a full-stack monorepo architecture with clear separation between frontend, backend, and shared components:

- **Frontend**: React with TypeScript, using Vite for development and bundling
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Supabase Auth integration
- **Styling**: Tailwind CSS with custom neon theme and shadcn/ui components
- **State Management**: React Context API with custom hooks

## Key Components

### Frontend Architecture
- **React Router**: Client-side routing for SPA navigation
- **Authentication Context**: Centralized auth state management with Supabase integration
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

1. **User Authentication**: Supabase handles auth, with user profiles stored in custom database tables
2. **Event Management**: Events are managed through the admin interface with real-time availability tracking
3. **Ticket Purchasing**: Multi-tier pricing system with member discounts and purchase limits
4. **State Management**: React Context provides global state for authentication and user data

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for Neon database
- **drizzle-orm**: Type-safe ORM for database operations
- **@supabase/supabase-js**: Authentication and user management
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire stack
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundling for production

### Integrations
- **Neon Database**: Serverless PostgreSQL hosting
- **Supabase**: Authentication backend and user management
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

## Changelog

Changelog:
- July 07, 2025. Initial setup