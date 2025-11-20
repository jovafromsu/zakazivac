# Zakazivač - MVP Scheduling System

Modern appointment booking system built with Next.js, MongoDB, and Google Calendar integration.

## 🚀 Features

- **Multi-role Authentication** (Client, Provider & Admin)
- **Comprehensive Admin Panel** with user management and system analytics
- **Provider Profile Management** with business information and settings
- **Dynamic Provider Listings** with active/inactive status filtering
- **Service Management** with pricing and duration configuration
- **Availability Management** stored in provider profiles
- **Real-time Slot Generation** with Google Calendar sync
- **Booking System** with authentication protection
- **Google Calendar Integration** for automatic event synchronization
- **Professional API Documentation** with OpenAPI 3.0 specification
- **Interactive Swagger UI** hosted on CDN (no React dependencies)
- **Complete WCAG 2.1 AAA Accessibility** implementation
- **Responsive Design** with TailwindCSS and shadcn/ui

## 🛠 Tech Stack

- **Frontend:** Next.js 16.0.3 (Turbopack), TypeScript, TailwindCSS v4, shadcn/ui
- **Backend:** Next.js API Routes, NextAuth.js with JWT strategy
- **Database:** MongoDB Atlas with Mongoose ODM
- **Authentication:** NextAuth.js with credentials and Google OAuth
- **Integrations:** Google Calendar API v3 with OAuth2
- **API Documentation:** OpenAPI 3.0 with Swagger UI (CDN-based)
- **Validation:** Zod schemas for API endpoints
- **Accessibility:** Complete WCAG 2.1 AAA compliance system
- **UI Components:** Custom shadcn/ui with accessible components

## 📦 Installation

### Prerequisites

- Node.js 20+ (recommended)
- MongoDB Atlas account
- Google Cloud Console project

### 1. Clone & Install

```bash
git clone <your-repo>
cd zakazivac
npm install
```

### 2. Environment Setup

Copy the environment file and configure:

```bash
cp .env.example .env.local
```

### 3. MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Get connection string and add to `MONGODB_URI` in `.env.local`

### 4. Google Calendar API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API and Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/integrations/google/callback`
5. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`

### 5. NextAuth Configuration

Generate a secret for NextAuth:

```bash
openssl rand -base64 32
```

Add to `NEXTAUTH_SECRET` in `.env.local`

### 6. Run Development Server

```bash
npm run dev
```

**Key URLs:**
- **Main App:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/dashboard/admin
- **API Documentation:** http://localhost:3000/api-docs
- **Provider Dashboard:** http://localhost:3000/dashboard/provider
- **Client Dashboard:** http://localhost:3000/dashboard/client

**Default Admin Setup:**
1. Create a user account through the signup process
2. Manually add `"admin"` to the `roles` array in MongoDB
3. Or use the admin API endpoints to manage roles programmatically

## 🏗 Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── admin/             # Admin-only endpoints
│   │   │   ├── users/         # User management
│   │   │   ├── categories/    # Category management
│   │   │   └── stats/         # System analytics
│   │   ├── auth/              # Authentication endpoints
│   │   ├── booking/           # Booking management
│   │   ├── providers/         # Provider profiles
│   │   ├── services/          # Service management
│   │   ├── availability/      # Availability rules
│   │   └── integrations/      # Google Calendar integration
│   ├── auth/                  # Auth pages (signin/signup)
│   └── dashboard/             # Role-based dashboards
│       ├── admin/             # Admin panel (complete system management)
│       ├── provider/          # Provider dashboard
│       └── client/            # Client dashboard
├── components/
│   ├── ui/                    # UI component library
│   │   ├── Accessible*.tsx   # WCAG 2.1 AAA compliant components
│   │   └── *.tsx             # Standard UI components
│   ├── AdminUserModals.tsx    # Admin user management modals
│   └── AccessibilityProvider.tsx # App-wide accessibility context
├── models/                    # MongoDB models
│   ├── User.ts               # Multi-role user authentication
│   ├── ProviderProfile.ts    # Provider profiles (includes availabilitySettings)
│   ├── Service.ts            # Provider services
│   ├── Booking.ts            # Appointment bookings
│   └── ProviderGoogleIntegration.ts # Google Calendar tokens
├── services/
│   └── calendar/             # Google Calendar integration services
│       ├── googleCalendarService.ts # Calendar API interactions
│       └── slotGeneration.ts        # Availability slot calculation
├── lib/                      # Utilities and configurations
│   ├── adminAuth.ts          # Admin authentication middleware
│   ├── accessibility.ts     # Accessibility utilities
│   └── swagger.ts           # API documentation generator
└── styles/                   # Global styles and themes
```

### Key Directories

- **`src/app/api/admin/`** - Admin-only API endpoints with authentication middleware
- **`src/app/dashboard/admin/`** - Complete admin panel with user, category, and system management
- **`src/components/ui/Accessible*.tsx`** - WCAG 2.1 AAA compliant component implementations
- **`src/lib/adminAuth.ts`** - Admin role authentication and authorization middleware
- **`src/models/`** - MongoDB schemas with multi-role user system
- **`src/services/calendar/`** - Google Calendar integration and slot generation logic

### 🔥 Important Notes

- **Next.js 16.0.3** with Turbopack for fast development builds
- **MongoDB Atlas** required - local MongoDB not supported in current configuration
- **Google Calendar API** integration requires OAuth2 setup
- **Admin role** must be manually assigned initially through database
- **Accessibility** features are built-in and enabled by default
- **API Documentation** is auto-generated from OpenAPI specifications

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth.js handlers

### Providers
- `GET /api/providers` - List active providers
- `GET /api/providers/featured` - Get featured providers
- `GET /api/providers/search` - Search providers with filters
- `GET /api/providers/[id]` - Get individual provider (active only)
- `GET /api/provider/profile` - Get current user's provider profile
- `PUT /api/provider/profile` - Update provider profile

### Services
- `GET /api/services` - List services
- `POST /api/services` - Create service
- `PUT /api/services` - Update service

### Availability
- `GET /api/availability` - Get provider availability settings
- `PUT /api/availability` - Update availability settings (stored in ProviderProfile)

### Booking
- `GET /api/booking/slots` - Get available time slots
- `POST /api/booking` - Create booking
- `PATCH /api/booking/[id]` - Cancel booking
- `DELETE /api/booking/[id]` - Delete booking

### Google Integration
- `GET /api/integrations/google` - Get integration status
- `GET /api/integrations/google/connect` - Start OAuth flow
- `GET /api/integrations/google/callback` - OAuth callback

## 👤 User Roles

### Client
- Browse providers and services
- Book appointments
- View booking history
- Cancel bookings
- Client dashboard with statistics

### Provider
- Create and manage business profile
- Define services and pricing
- Set availability rules
- Connect Google Calendar
- View and manage bookings
- Dashboard with analytics
- Availability management

### Admin
- Complete system oversight and control
- User management (create, edit, delete users)
- Role management (assign/remove roles)
- Provider approval and management
- Category management
- System analytics and statistics
- API documentation access
- Advanced dashboard with real-time metrics

## 📱 Provider Dashboard Features

### Overview
- Today's appointments
- Weekly statistics
- Revenue tracking
- Google Calendar sync status

### Appointments
- View all bookings
- Filter by date/status
- Cancel appointments
- Mark as completed

### Services
- Create/edit services
- Set duration and pricing
- Enable/disable services

### Availability
- Set working hours per day
- Configure time slot intervals
- Bulk availability updates

### Integrations
- Google Calendar OAuth
- Automatic event synchronization
- Sync status monitoring

### Profile & Settings
- Business information and description
- Contact details (phone, email, address)

## 🛡️ Admin Dashboard Features

### User Management
- View all users with filters (role, verification status)
- Edit user information (name, email, verification)
- Assign and manage user roles (client, provider, admin)
- Safe user deletion with booking validation
- Search and pagination

### System Analytics
- Real-time user statistics
- Provider management metrics
- Category usage analytics
- System uptime monitoring
- Quick stats sidebar

### Category Management
- Create and organize service categories
- Enable/disable categories
- Bulk category operations

### Settings & Configuration
- System-wide settings management
- Integration configurations
- Security settings
- Backup and maintenance tools

### API Documentation
- Interactive Swagger UI access
- Endpoint testing interface
- Authentication token management
- Timezone configuration
- Profile active/inactive toggle
- Real-time frontend updates

## 🗄 Database Architecture

### MongoDB Collections

| Collection | Purpose | Key Features |
|-----------|---------|-------------|
| `users` | User accounts | Multi-role support (client/provider) |
| `providerprofiles` | Provider business data | Includes availabilitySettings (Mixed field) |
| `services` | Provider services | Pricing, duration, active status |
| `bookings` | Appointment records | Google Calendar sync status |
| `providergoogleintegrations` | OAuth tokens | Google Calendar API integration |

### Key Design Decisions

- **Availability Storage**: Moved from separate `AvailabilityRule` collection to `ProviderProfile.availabilitySettings` for better performance
- **Provider Filtering**: All public APIs filter by `isActive: true` for provider visibility control
- **Mixed Fields**: Used Mongoose Mixed type for flexible availability configuration

## 📄 API dokumentacija

### Swagger UI

Projekt koristi standardnu OpenAPI 3.0 specifikaciju sa CDN-hosted Swagger UI:

- **Development**: `http://localhost:3000/api-docs` ili `http://localhost:3000/api-docs.html`
- **Production**: `https://zakazivac.vercel.app/api-docs`

#### Kako pristupiti:

1. **Pokretanje servera**: `npm run dev`
2. **Otvaranje browser-a**: idite na `http://localhost:3000/api-docs`
3. **Direktan pristup**: statična HTML verzija na `/api-docs.html`

#### Tehnička implementacija:

- **CDN Swagger UI v5.10.5** - bez React dependency-ja
- **Statična OpenAPI spec** - optimizovano za performance
- **Nema console error-a** - stabilna implementacija
- **Server-side JSON** - `/api/docs` endpoint

#### Autentifikacija u Swagger UI:

Za testiranje zaštićenih endpoint-a:

1. **Login kroz aplikaciju**: `/auth/signin`
2. **Otvorite Developer Tools**: F12 → Application/Storage tab
3. **Kopirajte session token**: `next-auth.session-token` cookie vrednost
4. **U Swagger UI**: kliknite "Authorize" dugme (🔒)
5. **Unesite token**: `Bearer <token-value>`
6. **Testirajte endpoints**: koristite "Try it out" dugmića

> **Napomena**: Token se automatski dodaje u sve zaštićene request-e

### Dostupne funkcionalnosti:

- 📈 **Interactive API Explorer** - testiraj endpoints direktno u browser-u
- 🔐 **Authentication Support** - uključuje Bearer token autentifikaciju
- 📝 **Detaljne sheme** - kompletna dokumentacija za sve modele
- 🏷 **Organizovano po tagovima** - jasno grupisanje endpoint-a
- 🔍 **Request/Response primeri** - svi mogući scenariji dokumentovani

#### Organizacija dokumentacije:

| Tag | Opis | Endpoints | Status |
|-----|------|----------|--------|
| **Authentication** | Login, registracija | `/api/auth/*` | 🔄 Planned |
| **Providers** | Upravljanje provider profilima | `/api/providers/*`, `/api/provider/*` | ✅ Complete |
| **Services** | CRUD operacije za usluge | `/api/services/*` | ✅ Complete |
| **Bookings** | Rezervacije i termini | `/api/booking/*` | ✅ Complete |
| **Availability** | Raspored rada i dostupnost | `/api/availability`, `/api/slots` | ✅ Complete |
| **Integrations** | Google Calendar i druge integracije | `/api/integrations/*` | 🔄 Planned |

#### Kvalitet dokumentacije:

- **100% endpoint coverage** za implementirane funkcionalnosti
- **Request/Response examples** za sve endpoint-e
- **Authentication schemas** sa Bearer token podrškom
- **Error handling dokumentacija** sa HTTP status kodovima
- **Parameter validation** sa Zod schema opisima
- **Production-ready** specifikacija

### Raw OpenAPI JSON:

OpenAPI 3.0 specifikacija je dostupna na: `/api/docs`

```bash
# Dohvatanje kompletne specifikacije
curl http://localhost:3000/api/docs

# Formatiran prikaz (ako imate jq)
curl http://localhost:3000/api/docs | jq .

# Import u Postman/Insomnia/Thunder Client
# Koristite URL: http://localhost:3000/api/docs
```

#### External API tools:

- **Postman**: Import → Link → `http://localhost:3000/api/docs`
- **Insomnia**: Import/Export → From URL → `http://localhost:3000/api/docs`
- **VS Code Thunder Client**: New Request → Import → OpenAPI

### 🚀 Deployment dokumentacije

#### Development:
```bash
npm run dev
# API docs: http://localhost:3000/api-docs
# OpenAPI JSON: http://localhost:3000/api/docs
```

#### Production (Vercel):
- Swagger UI se automatski deploy-uje kao statičan HTML
- OpenAPI spec se generiše server-side
- Nema build dependency-ja ili kompleksnih konfiguracija
- CDN-hosted assets za brže loading

#### Customization:
- **OpenAPI spec**: `src/lib/swagger.ts` - dodavanje novih endpoint-a
- **HTML template**: `public/api-docs.html` - stilizovanje UI-ja
- **Swagger config**: opcije u HTML template-u

## 🔄 Google Calendar Integration

### Features
- **Automatic Sync** - Bookings create events in Google Calendar
- **Conflict Prevention** - Checks existing calendar events
- **Two-way Sync** - Respects existing calendar busy times
- **Token Refresh** - Automatic OAuth token renewal

### Setup Process
1. Provider connects Google account
2. System requests calendar permissions
3. Primary calendar is automatically selected
4. All future bookings sync automatically

## 🚀 Deployment

### AWS Deployment

The application is configured for AWS deployment:

1. **Frontend:** Deploy to AWS Amplify or Elastic Beanstalk
2. **Database:** MongoDB Atlas (cloud)
3. **File Storage:** AWS S3 (for future file uploads)

### Environment Variables for Production

```bash
MONGODB_URI=your-production-mongodb-uri
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/integrations/google/callback
```

## ♿ Accessibility Features

### WCAG 2.1 AAA Compliance
- **Screen Reader Support** with proper ARIA labels and descriptions
- **Keyboard Navigation** for all interactive elements
- **High Contrast Mode** support with proper color schemes
- **Reduced Motion** preferences respected
- **Focus Management** with visible indicators
- **Accessible Forms** with proper labeling and validation feedback
- **Modal Accessibility** with focus trapping and escape handling
- **Toast Notifications** with screen reader announcements

### Accessible Components
- `AccessibleModal` with proper focus management
- `AccessibleAlert` and `AccessibleToast` for feedback
- `AccessibleFormComponents` with enhanced labeling
- Custom ARIA implementations for complex interactions
- Semantic HTML structure throughout

### Testing & Validation
- Keyboard-only navigation testing
- Screen reader compatibility (NVDA, JAWS)
- Color contrast validation (WCAG AAA)
- Focus indicator visibility checks

## 🔐 Security Features

- **JWT Authentication** with NextAuth.js
- **Multi-role Access Control** (Client, Provider, Admin)
- **Input Validation** with Zod schemas
- **SQL Injection Protection** (MongoDB)
- **CSRF Protection** (NextAuth.js built-in)
- **Secure OAuth Flow** for Google integration
- **Admin-only API Protection** with authentication middleware
- **Session Management** with secure token handling

## 🧪 Testing

### Development
```bash
# Run development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### API Testing
- **Swagger UI:** http://localhost:3000/api-docs
- **Static API Docs:** http://localhost:3000/api-docs.html
- **OpenAPI Spec:** http://localhost:3000/api/docs

### Accessibility Testing
- Test keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Verify screen reader announcements
- Check high contrast mode compatibility
- Validate focus indicators on all interactive elements

### Admin Testing
1. Access admin panel: http://localhost:3000/dashboard/admin
2. Test user management features
3. Verify role assignment functionality
4. Test system analytics and statistics

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

### Development Guidelines

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/zakazivac.git
   cd zakazivac
   npm install
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Development Standards**
   - Follow TypeScript strict mode
   - Maintain WCAG 2.1 AAA accessibility standards
   - Add proper error handling and logging
   - Include API documentation for new endpoints
   - Test accessibility with keyboard navigation

4. **Commit and Push**
   ```bash
   git commit -m 'feat: add amazing feature with accessibility support'
   git push origin feature/amazing-feature
   ```

5. **Open Pull Request**
   - Include detailed description of changes
   - Reference any related issues
   - Ensure all tests pass
   - Verify accessibility compliance

## 📈 Project Status

### Current Version: MVP 1.0

✅ **Completed Features:**
- Multi-role authentication system (Client, Provider, Admin)
- Complete admin panel with user management
- Provider dashboard with Google Calendar integration
- Booking system with real-time slot generation
- WCAG 2.1 AAA accessibility implementation
- Professional API documentation with Swagger UI
- Responsive design with TailwindCSS v4

🚧 **In Development:**
- Advanced booking analytics
- Email notification system
- Mobile app API endpoints
- Advanced provider verification

🗺️ **Roadmap:**
- Payment integration (Stripe)
- Advanced reporting and analytics
- Multi-language support
- Mobile applications (React Native)
- Advanced calendar features

## 📞 Support

- **GitHub Issues:** For bug reports and feature requests
- **Documentation:** Check the `/docs` folder for detailed guides
- **API Testing:** Use Swagger UI at `/api-docs` for endpoint testing
- **Accessibility:** All components follow WCAG 2.1 AAA standards

For questions and support, please open an issue in the GitHub repository.