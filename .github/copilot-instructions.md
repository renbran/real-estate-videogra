# Real Estate Videography Booking System - AI Coding Instructions

## Project Overview
This is a React TypeScript application built with GitHub Spark for managing videography bookings at a real estate company. The system handles multi-category booking requests with intelligent optimization, role-based access control, and real-time scheduling.

## Architecture & Components

### Core Stack
- **Frontend**: React 18 + TypeScript + Vite + GitHub Spark framework
- **UI**: Radix UI primitives + Tailwind CSS + shadcn/ui components
- **State Management**: React hooks + GitHub Spark's `useKV` for data persistence
- **Forms**: React Hook Form + Zod validation
- **Icons**: Phosphor Icons
- **Charts**: Recharts for analytics dashboards

### Role-Based Architecture
The app uses a role-based dashboard system in `src/App.tsx`:
- `agent`: AgentDashboard - submit bookings, view own requests
- `manager`: ManagerDashboard - approve/optimize all bookings, analytics
- `videographer`: VideographerDashboard - view schedule, update status
- `admin`: Uses ManagerDashboard with extended permissions

### Data Flow
1. **Authentication**: Demo auth system in `src/lib/auth.ts` with predefined users
2. **Booking Lifecycle**: Submit → Pending → Approved/Declined → Scheduled → Completed
3. **Data Storage**: GitHub Spark's `useKV` hook for client-side persistence
4. **Notifications**: Sonner toast system + planned email integration

## Key Patterns & Conventions

### Component Structure
```
src/components/
├── auth/           # Authentication forms
├── booking/        # Multi-step booking forms
├── calendar/       # Calendar views and exports
├── dashboard/      # Role-specific dashboards
├── maps/           # Google Maps integration
├── navigation/     # Header and navigation
├── notifications/  # Toast and email systems  
└── ui/            # Reusable shadcn/ui components
```

### Type System (`src/lib/types.ts`)
- Comprehensive TypeScript types for all booking categories
- Union types for categorization: `ShootCategory`, `UserRole`, `BookingStatus`
- Category-specific interfaces extending base `BookingRequest`
- Use existing types - don't create new ones without checking first

### UI Component Patterns
- Use shadcn/ui base components from `src/components/ui/`
- Follow CVA (Class Variance Authority) pattern for component variants
- Consistent prop interfaces with `ComponentProps` extension
- Dark mode support with `next-themes`

### Form Handling
- Multi-step forms with category-specific fields (see `BookingForm.tsx`)
- React Hook Form + Zod validation throughout
- Conditional field rendering based on booking category
- Form state persistence across steps

### Data Persistence
- Use `useKV('bookings')` for booking storage
- Use `useKV('users')` for user data
- Follow GitHub Spark patterns for reactive data updates
- Demo data structure in types file for reference

## Development Workflows

### Commands
- `npm run dev` - Start development server (port 5000)
- `npm run build` - Production build with TypeScript checking
- `npm run lint` - ESLint with React hooks plugin
- `npm run preview` - Preview production build

### File Conventions
- Components use PascalCase filenames matching export name
- Hooks use camelCase with 'use' prefix
- Types and utilities in `src/lib/`
- Absolute imports with `@/` alias pointing to `src/`

### Styling
- Tailwind CSS with custom design system
- CSS variables for theming in `src/styles/theme.css`
- Responsive design with mobile-first approach
- Use `cn()` utility for conditional classes

## Integration Points

### Google Maps
- Address validation and geocoding setup in `src/lib/google-maps.ts`
- Map visualization components for route optimization
- Batch address validation for scheduling efficiency

### Notifications
- Toast notifications via Sonner
- Email preview system for transactional emails
- Notification center for in-app alerts

### Calendar System
- Export functionality for calendar applications
- Date utilities in `src/lib/date-utils.ts`
- Integration with booking scheduling logic

## Critical Implementation Notes

### Booking Priority Algorithm
The system uses a scoring algorithm considering:
- Agent tier (standard/premium/elite)
- Property value and complexity
- Geographic clustering for efficiency
- Deadline urgency and flexibility

### Security Considerations
- Input sanitization for all form fields
- Role-based component rendering
- Session management (currently demo mode)
- Rate limiting preparation for production

### Performance Patterns
- Lazy loading for dashboard components
- Optimistic UI updates with error boundaries
- Efficient re-renders with proper dependency arrays
- Component code splitting for large dashboards

## When Adding Features
1. Check existing types in `types.ts` before creating new ones
2. Follow the role-based access pattern in App.tsx
3. Use existing UI components before creating custom ones
4. Implement proper error boundaries for new major components
5. Add proper TypeScript types - avoid `any` or loose typing
6. Follow the multi-step form pattern for complex inputs
7. Use the established notification patterns for user feedback

## Testing Strategy
- Error boundary fallbacks in place (`ErrorFallback.tsx`)
- Form validation with clear user messaging
- Graceful handling of missing data/permissions
- Progressive enhancement for advanced features