# FlashFusion AI Development Platform

## Overview

FlashFusion is a comprehensive AI-powered development platform that enables users to create full-stack applications, generate content, and deploy projects through an intelligent multi-agent orchestration system. The platform serves as a unified interface for 60+ AI tools spanning code generation, content creation, deployment automation, and business intelligence.

**Core Purpose**: Transform ideas into production-ready applications through advanced AI orchestration, providing creators, developers, and businesses with an all-in-one platform for building, deploying, and managing digital products.

**Tech Stack**:
- Frontend: React 18+ with TypeScript, Vite 5.4 build system
- Styling: Tailwind CSS with custom FlashFusion design system
- UI Components: Radix UI primitives with shadcn/ui patterns
- Backend: Supabase (PostgreSQL database, authentication, real-time subscriptions)
- Deployment: Replit (primary), multi-platform support
- Testing: Vitest with React Testing Library, Playwright for E2E

## Recent Changes

**November 15, 2025 - Migrated from Vercel to Replit**:
- Configured Vite dev server to bind to 0.0.0.0:5000 for Replit compatibility
- Updated workflow to serve the app on Replit's webview port
- Downgraded Vite from 6.3.5 to 5.4.11 to resolve dependency conflicts
- Removed @vitejs/plugin-legacy to eliminate peer dependency issues
- Adjusted @radix-ui/react-tabs to compatible version ^1.1.0
- Environment variables configured through Replit Secrets (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- Successfully verified app launches without errors
- **Deployment Configuration Added**:
  - Build command: `npm run build` (compiles production-ready static files)
  - Run command: `npm start` (serves built files via `serve` on port 5000)
  - Deployment target: Autoscale (stateless web application)
  - Added `serve` package for production static file serving
  - Port mapping: Internal 5000 → External 80 for public access

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Component-Based Design with Intelligent Loading**:
- React component architecture with lazy loading and code splitting
- Three-tier system detection (Full/Lite/Emergency mode) based on device capabilities
- Progressive Web App (PWA) support with offline capabilities
- Custom hooks for state management (`useAuthentication`, `useAppInitialization`, `usePerformanceMonitoring`)

**Design System**:
- Custom CSS variable system (`--ff-*` prefix) for consistent theming
- Typography: Sora (headings/labels), Inter (body text), JetBrains Mono (code)
- Color palette: Primary Orange (#FF7B00), Secondary Cyan (#00B4D8), Accent Magenta (#E91E63)
- Animation classes (`ff-fade-in-up`, `ff-hover-glow`, `ff-stagger-fade`)
- Responsive design with mobile-first approach

**Routing & Navigation**:
- URL-based routing with browser history integration
- Authentication-gated application access with modal system
- Deep linking support for specific tools and pages
- Navigation state synchronization across tabs via localStorage

**Performance Optimization**:
- React.memo for expensive components
- Intelligent component preloading
- Memory management with automatic cleanup
- Real-time Core Web Vitals monitoring (LCP, FID, CLS, FCP, TTFB)
- Performance budgets with automated enforcement

### Backend Architecture

**Supabase Integration**:
- PostgreSQL database with real-time subscriptions
- Row Level Security (RLS) policies for data protection
- Supabase Auth for user management (email/password, OAuth with Google/GitHub)
- Edge Functions for serverless API endpoints

**Database Schema** (from migration files):
- `user_profiles`: Extended user data and preferences
- `user_sessions`: Active session tracking
- `email_verification_tokens`: Email verification workflow
- `password_reset_tokens`: Password reset management
- Auto-triggers for profile creation on user signup

**API Structure**:
- RESTful endpoints via Supabase Edge Functions
- Authentication routes (`/api/auth/*`)
- AI service endpoints (`/ai/generate`, `/ai/models`)
- Integration endpoints for third-party services

### Authentication & Authorization

**Multi-Provider Authentication**:
- Email/password with verification flow
- Social OAuth (Google, GitHub) via Supabase Auth
- Demo mode fallback for testing without credentials
- Session management with token refresh
- Remember me functionality with persistent sessions

**Security Mechanisms**:
- JWT-based authentication tokens
- CAPTCHA verification for signup
- Rate limiting on authentication endpoints
- Secure password reset workflow
- Email verification requirements

### State Management

**Custom Hooks Pattern**:
- `useAuthentication`: User state, login/logout, profile management
- `useAppInitialization`: System detection, performance metrics, critical dependency validation
- `usePerformanceMonitoring`: Real-time performance tracking and optimization recommendations
- Context providers for global state (AuthProvider)

**State Synchronization**:
- Cross-tab communication via localStorage events
- URL parameter detection with caching
- Browser history integration for navigation state

### Error Handling & Recovery

**Multi-Layer Error Boundaries**:
- `CriticalErrorBoundary`: Top-level catastrophic error handling
- `SimpleErrorBoundary`: Component-level error isolation
- `TimeoutErrorBoundary`: Long-running operation protection
- `EmergencyMode`: Fallback UI for critical system failures

**Error Classification & Recovery**:
- Automatic error classification (network, auth, data, unknown)
- Exponential backoff retry logic
- User-friendly error messages with recovery options
- System health monitoring and diagnostics

### Performance & Monitoring

**Client-Side Monitoring**:
- Real-time Core Web Vitals tracking
- Memory usage monitoring with automatic cleanup
- Performance budget enforcement (JS: 200KB, CSS: 50KB, Images: 300KB)
- Cache hit rate optimization (94%+ target)

**Production Monitoring** (optional integrations):
- Sentry for error tracking and alerting
- Google Analytics for user behavior
- Custom performance dashboard with trending analysis

### Content & AI Systems

**Multi-Model AI Service**:
- Integration with 5+ AI models (GPT-4, Claude, Gemini, CodeLlama, Mistral)
- Intelligent model selection based on task type
- Cost estimation and optimization
- Fallback system for model availability

**60+ AI Tools Organization**:
- Code Generation (15 tools): Full-stack builders, API generators, database schema creators
- Code Analysis (12 tools): Security scanning, performance optimization, code review
- Deployment (8 tools): Multi-platform deployment, CI/CD automation
- Collaboration (10 tools): Real-time editing, team coordination
- Optimization (15 tools): Performance tuning, bundle analysis

### Deployment & Infrastructure

**Multi-Platform Deployment Support**:
- Vercel (primary, optimized configuration)
- Netlify, AWS, Google Cloud, Azure support
- Automated CI/CD via GitHub Actions
- Environment-specific configurations (development, staging, production)

**Build System**:
- Vite for fast development and optimized production builds
- Code splitting and lazy loading
- Asset optimization (images, fonts, CSS)
- TypeScript compilation with strict mode

### Accessibility & UX

**WCAG 2.1 AA Compliance**:
- Semantic HTML with proper ARIA labels
- Keyboard navigation support
- Screen reader optimization
- Focus management with visible focus rings
- Color contrast requirements met

**Responsive Design**:
- Mobile-first CSS approach
- Breakpoint system (sm, md, lg, xl, 2xl)
- Touch-optimized interactions
- Progressive enhancement strategy

## External Dependencies

### Core Services (Required)

**Supabase** - Database, Authentication, Real-time:
- PostgreSQL database with real-time subscriptions
- Supabase Auth for user management
- Row Level Security policies
- Edge Functions for serverless APIs
- Required environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### AI Services (Core Platform Features)

**OpenAI** - Primary AI capabilities:
- GPT-4 Turbo for code generation and content creation
- Required for 60+ AI tools functionality
- Environment variable: `OPENAI_API_KEY`

**Anthropic Claude** - Alternative AI provider:
- Backup/alternative to OpenAI
- Cost optimization through model selection
- Environment variable: `ANTHROPIC_API_KEY`

**Google AI (Gemini)** - Additional AI capabilities:
- Multimodal AI features
- Generous free tier
- Environment variable: `GOOGLE_AI_API_KEY`

**Hugging Face** - Open source models:
- Community models and specialized tools
- Environment variable: `HUGGINGFACE_API_KEY`

### Monitoring & Analytics (Optional)

**Sentry** - Error tracking and monitoring:
- Called via `initSentry()` in App.tsx
- Production error alerting
- Environment variable: `VITE_SENTRY_DSN`

**Google Analytics** - User behavior tracking:
- Analytics component integration
- Conversion tracking
- Environment variable: `VITE_GA_MEASUREMENT_ID`

### UI Component Libraries

**Radix UI** - Accessible component primitives:
- 25+ component packages (@radix-ui/react-*)
- Accordion, Dialog, Dropdown, Popover, Tooltip, etc.
- Foundation for custom component system

**shadcn/ui** - Component patterns:
- Pre-built accessible components
- Tailwind CSS integration
- Customizable design system

### Development & Testing Tools

**Vite** - Build tool and dev server:
- Fast HMR (Hot Module Replacement)
- Optimized production builds
- Plugin ecosystem (@vitejs/plugin-react)

**Vitest** - Unit testing framework:
- React Testing Library integration
- Component and hook testing
- Environment: jsdom

**Playwright** - End-to-end testing:
- Cross-browser testing
- User workflow validation

**TypeScript** - Type safety:
- Strict mode enabled
- Type definitions for all dependencies

### Payment & Monetization (Optional)

**Stripe** - Payment processing:
- Subscription management (Free, Pro $29/month, Enterprise $99/month)
- Automated billing and invoicing
- Environment variables: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`

### Third-Party Integrations

**OAuth Providers**:
- Google OAuth for authentication
- GitHub OAuth for authentication
- Configuration via Supabase Auth settings

**Content Platforms** (Print-on-Demand suite):
- Etsy, Amazon, Shopify integration
- Printful, RedBubble, Society6 support
- API credentials required per platform

**Communication**:
- Discord integration for community management
- Webhook support for automated notifications

### Development Dependencies

**Code Quality**:
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type checking

**Build & Bundle**:
- Vite plugins (react, swc)
- PostCSS for CSS processing
- Tailwind CSS for utility-first styling

**Testing**:
- @testing-library/react
- @testing-library/jest-dom
- @playwright/test

**Type Definitions**:
- @types/react
- @types/node
- Various @types packages for dependencies