# Copilot Instructions for Zakazivač

## Architecture Overview

This is a **Next.js 16.0.3 appointment booking system** with MongoDB, Google Calendar integration, and comprehensive WCAG 2.1 AAA accessibility implementation. The system features **three-tier role-based architecture** (Client/Provider/Admin) with specialized dashboards and complete admin management capabilities.

### Core Technology Stack
- **Frontend**: Next.js 16.0.3 (Turbopack), React 19.2.0, TypeScript, TailwindCSS v4, shadcn/ui
- **Backend**: Next.js API routes with NextAuth.js JWT strategy
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: NextAuth.js with Google OAuth + credentials (multi-role support)
- **Integrations**: Google Calendar API v3 with OAuth2 + automatic token refresh
- **API Docs**: OpenAPI 3.0 with CDN-hosted Swagger UI (static spec in `src/lib/swagger.ts`)
- **Accessibility**: Complete WCAG 2.1 AAA compliance with dynamic toolbar
- **Admin Panel**: Full user management, analytics, and system configuration

## Critical Patterns & Conventions

### 1. Authentication & Authorization
```typescript
// All protected API routes use this pattern:
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)
if (!session?.user?.roles?.includes('provider')) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Multi-role checking for admin features:
if (!session?.user?.roles?.includes('admin')) {
  return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
}
```

### 2. Database Models Architecture
- **ProviderProfile**: Contains `availabilitySettings` as Mixed field (moved from separate AvailabilityRule collection)
- **All provider queries**: MUST filter by `isActive: true` for public APIs
- **MongoDB connection**: Always use `connectDB()` before database operations

### 3. API Route Structure
```typescript
// Standard API route with Swagger docs:
/**
 * @swagger
 * /api/endpoint:
 *   get:
 *     tags: [Category]
 *     summary: Description
 */
export async function GET(request: NextRequest) {
  await connectDB()
  // Implementation
}
```

### 4. Google Calendar Integration
- **Service location**: `src/services/calendar/googleCalendarService.ts`
- **OAuth flow**: `/api/integrations/google/connect` → callback → store tokens
- **Booking sync**: Automatic event creation in provider's primary calendar
- **Conflict detection**: Uses `freebusy.query` to check existing events

### 5. Accessibility Implementation
- **Provider**: `AccessibilityProvider` wraps entire app in `src/components/Providers.tsx`
- **Components**: Use prefixed accessible components from `src/components/ui/Accessible*.tsx`
- **Styles**: WCAG compliance in `src/app/globals.css` with high contrast, reduced motion
- **Screen readers**: All interactive elements have proper ARIA attributes and labels

## Development Workflows

### Local Development
```bash
npm run dev     # Turbopack-enabled development server
npm run build   # Production build with type checking
npm run test    # Jest test suite (141 model tests + API tests)
npm run lint    # ESLint with Next.js rules

# Development URLs
# http://localhost:3000 - Main app
# http://localhost:3000/api-docs - Interactive Swagger UI
# http://localhost:3000/api-docs.html - Static API documentation
```

### API Documentation
- **OpenAPI spec**: Generated server-side at `/api/docs`
- **Swagger UI**: CDN-hosted (v5.10.5) to avoid React console errors
- **Authentication**: Use Bearer token from `next-auth.session-token` cookie
- **Testing**: All endpoints documented with request/response examples

### Database Setup
```bash
# MongoDB Atlas connection required
# Environment: MONGODB_URI=mongodb+srv://...
# Models auto-create indexes on first connection
```

### Google Calendar Setup
```bash
# Required environment variables:
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback
```

## Key File Locations

### Models (`src/models/`) - All have comprehensive test coverage
- **User.ts**: Multi-role authentication (client/provider/admin)
- **ProviderProfile.ts**: Business info + `availabilitySettings` (Mixed field)
- **Service.ts**: Provider services with pricing/duration validation
- **Booking.ts**: Appointments with Google Calendar sync status
- **Category.ts**: Service categories with slug auto-generation
- **ProviderGoogleIntegration.ts**: OAuth tokens with refresh handling

### API Routes (`src/app/api/`)
- **Providers**: Public listings filter by `isActive: true`
- **Provider profile**: Protected routes for profile management
- **Booking**: Slot generation + reservation system
- **Admin**: Stats, user management (requires admin role)
- **Auth**: Registration, verification, NextAuth integration
- **Integrations**: Google Calendar OAuth flow

### Services (`src/services/calendar/`)
- **googleCalendarService.ts**: Calendar API interactions
- **slotGeneration.ts**: Available time slot calculation

### Testing Infrastructure (`tests/`)
- **setupTests.ts**: MongoDB Memory Server configuration
- **utils/testHelpers.ts**: Mock factories for all models
- **utils/databaseUtils.ts**: Database cleanup and seeding
- **utils/nextAuthMock.ts**: NextAuth testing utilities
- **models/**: Complete unit tests (141 passing tests)
- **api/**: Integration tests (NextAuth mocking challenges)

### Accessibility (`src/components/ui/Accessible*.tsx`)
- **AccessibilityProvider.tsx**: App-wide a11y context + toolbar
- **AccessibleComponents.tsx**: Modal, Alert, Tabs with ARIA
- **AccessibleFormComponents.tsx**: Form fields with proper labeling
- **AccessibleFeedback.tsx**: Toast, Progress, Loading with screen reader support

## Critical Testing Patterns

### Model Testing (Industry Standard)
```typescript
// Always use this pattern for model tests
import DatabaseTestUtils from '../utils/databaseUtils'
import { createMockUser } from '../utils/testHelpers'

beforeEach(async () => {
  await DatabaseTestUtils.cleanDatabase() // Required for isolation
})

// Test validation thoroughly
it('should enforce required fields', async () => {
  const invalidData = createMockUser({ email: undefined })
  await expect(User.create(invalidData)).rejects.toThrow(/email.*required/)
})
```

### API Testing Challenges
- **NextAuth Issue**: `getServerSession` cannot access headers in test environment
- **Solution**: Mock `@/lib/adminAuth.requireAdminAuth` instead of NextAuth directly
- **Pattern**: Always mock MongoDB connection to prevent conflicts

### Test Data Factories
Use consistent mock factories from `tests/utils/testHelpers.ts`:
```typescript
const user = createMockUser({ roles: ['admin'] })
const provider = createMockProvider({ businessName: 'Test Business' })
const session = createMockSession(user)
```

## Common Gotchas

### 1. Provider Filtering
**ALWAYS** filter providers by `isActive: true` in public APIs:
```typescript
const providers = await ProviderProfile.find({ isActive: true }).populate('userId')
```

### 2. Availability Storage
Availability is stored in `ProviderProfile.availabilitySettings` (not separate collection):
```typescript
// Update availability
await ProviderProfile.findOneAndUpdate(
  { userId },
  { availabilitySettings: newAvailability }
)
```

### 3. Swagger Documentation
Use CDN-hosted Swagger UI (not React component) to avoid console errors:
```html
<!-- In public/api-docs.html -->
<script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
```

### 4. Accessibility Requirements
All new components MUST include:
- Proper ARIA attributes (`aria-label`, `aria-describedby`)
- Keyboard navigation support (`onKeyDown` handlers)
- Screen reader announcements (use `useAccessibility` hook)
- Focus management (especially in modals)

### 5. Authentication Flow
NextAuth session includes custom `roles` array:
```typescript
// Session type extension in src/lib/auth.ts
interface Session {
  user: {
    id: string
    roles: string[] // ['client'] or ['provider'] or both
  } & DefaultSession["user"]
}
```

## Testing & Debugging

### Jest Test Framework (Industry Standard Setup)
```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode for development
npm test -- tests/models/  # Run specific test suite
npm test -- --coverage     # Generate coverage report
```

#### **Test Structure & Patterns**
- **MongoDB Memory Server**: Isolated in-memory database for each test
- **Mock Factories**: Use `createMockUser()`, `createMockProvider()` from `tests/utils/testHelpers.ts`
- **Database Cleanup**: Automatic via `DatabaseTestUtils.cleanDatabase()` in `beforeEach`
- **Coverage Threshold**: 70% minimum configured in `jest.config.js`

#### **Model Tests (✅ 141/141 passing)**
```typescript
// Pattern for model testing
import DatabaseTestUtils from '../utils/databaseUtils'
import { createMockUser } from '../utils/testHelpers'

beforeEach(async () => {
  await DatabaseTestUtils.cleanDatabase() // Clean slate per test
})

it('should validate required fields', async () => {
  const userData = createMockUser({ email: undefined })
  await expect(User.create(userData)).rejects.toThrow()
})
```

#### **API Tests (NextAuth Mocking Challenges)**
- **Current Issue**: NextAuth `getServerSession` fails in test environment
- **Workaround**: Mock `@/lib/adminAuth` directly instead of NextAuth
```typescript
// Successful API test pattern
jest.mock('@/lib/adminAuth', () => ({
  requireAdminAuth: jest.fn(),
}))

const mockRequireAdminAuth = require('@/lib/adminAuth').requireAdminAuth
mockRequireAdminAuth.mockResolvedValue({ id: '123', roles: ['admin'] })
```

### API Testing (Manual)
- Use Swagger UI at `/api-docs` for interactive testing
- Import OpenAPI spec from `/api/docs` into Postman/Insomnia
- Check console for authentication errors in dev tools
- Use utility scripts: `node test-booking.js`, `node test-signup-api.js`

### Admin Setup & Testing  
- Create admin user: `node create-admin.js` (auto-connects to MongoDB)
- Admin dashboard: `/dashboard/admin` (requires admin role)
- User management, analytics, and system settings available

### Accessibility Testing
- Test keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Use screen reader (NVDA/JAWS) for announcements
- Verify high contrast mode and reduced motion preferences
- Check focus indicators on all interactive elements
- Dynamic accessibility toolbar appears in top-right corner

### Google Calendar Integration
- Test OAuth flow in incognito/private browsing
- Check token refresh handling for expired credentials (401 errors auto-retry)
- Verify calendar event creation after bookings
- Monitor API quota usage in Google Cloud Console

### Testing Documentation
- **`TESTING.md`**: Complete testing guide with patterns and examples
- **`README.md`**: Test section with coverage statistics and commands
- **`jest.config.js`**: Next.js optimized Jest configuration

### Utility Scripts & Admin Tools

### Setup & Testing Scripts
- **`create-admin.js`**: Create admin user with email `admin@zakazivac.app` and password `admin123`
- **`test-booking.js`**: Test booking API endpoints with session authentication
- **`test-signup-api.js`**: Test user registration and verification flows
- **`test-mailgun.js`**: Test email service integration

### Admin Panel Features (`/dashboard/admin`)
- **User Management**: View, edit, delete users; assign roles (client/provider/admin)
- **Provider Management**: Activate/deactivate providers, manage profiles
- **Category Management**: Create, edit, delete service categories
- **System Analytics**: User statistics, booking metrics, system health
- **Settings**: Global configuration, feature toggles

## Environment Setup

Essential environment variables:
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zakazivac

# Authentication  
NEXTAUTH_SECRET=generated-secret
NEXTAUTH_URL=http://localhost:3000

# Google Integration
GOOGLE_CLIENT_ID=your-oauth-client-id
GOOGLE_CLIENT_SECRET=your-oauth-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback

# Email Service (optional)
MAILGUN_API_KEY=your-mailgun-key
MAILGUN_DOMAIN=your-mailgun-domain
```