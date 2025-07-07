# Opian Core - Customer Relationship Management System

## Overview

Opian Core is a modern, full-stack customer relationship management application built with React, TypeScript, and Express. The application provides comprehensive client management, document handling, appointment scheduling, and calendar functionality. It follows a clean architecture pattern with a clear separation between frontend and backend components.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **File Handling**: Multer for file uploads
- **Session Management**: Express sessions with PostgreSQL storage
- **Development**: Vite for development server and HMR

## Key Components

### Database Schema
The application uses three main entities:
- **Clients**: Core customer information including name, email, company, status, and value
- **Documents**: File attachments linked to clients with metadata
- **Appointments**: Scheduled meetings with clients including time, type, and status

### API Structure
RESTful API endpoints organized by resource:
- `/api/clients` - Client CRUD operations
- `/api/documents` - Document upload and management
- `/api/appointments` - Appointment scheduling and management
- `/api/stats` - Dashboard statistics

### Storage Layer
Abstracted storage interface (`IStorage`) with PostgreSQL database implementation. The interface supports:
- Client management operations with persistent storage
- Document handling with file metadata and database relations
- Appointment scheduling and tracking with client associations
- Statistics aggregation from real database data
- Automatic database seeding with sample data for development

## Data Flow

1. **Client Request**: React components make API calls using TanStack Query
2. **API Layer**: Express routes handle requests and validate data using Zod schemas
3. **Storage Layer**: Abstracted storage interface processes business logic
4. **Database**: Drizzle ORM manages PostgreSQL interactions
5. **Response**: Data flows back through the same layers to update the UI

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form state management
- **zod**: Runtime type validation
- **multer**: File upload handling

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **wouter**: Lightweight routing

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React application to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations handle schema changes

### Environment Configuration
- **Development**: Uses Vite dev server with HMR and proxy
- **Production**: Serves static files from Express with bundled backend
- **Database**: Requires `DATABASE_URL` environment variable

### File Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── migrations/      # Database migrations
└── dist/           # Build output
```

## Changelog

```
Changelog:
- July 07, 2025. Initial setup - Complete CRM system with client management, document handling, and appointment scheduling
- July 07, 2025. Enhanced dashboard - Added sophisticated UI with gradient cards, enhanced client activity display, performance insights, and modern visual design
- July 07, 2025. Database integration - Migrated from in-memory storage to PostgreSQL with Drizzle ORM, added database relations, and automatic seeding
- July 07, 2025. Authentication system - Added complete user authentication with login/register pages, protected routes, user-specific data filtering, and PostgreSQL session management
- July 07, 2025. Rebranding - Renamed application from "CRM Hub" to "Opian Core"
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```