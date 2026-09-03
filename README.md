# Zenith Pranavi (zped.org)

> Premium 1-on-1 Online Tutoring Platform — Where Every Child Reaches Their Zenith

[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-purple)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com)
[![License](https://img.shields.io/badge/License-Private-red)]()

## 🏗️ Architecture

```
React 19 + Vite 6 (Frontend)
├── React Router v7 (SPA Routing)
├── React Helmet Async (SEO)
├── Lucide React (Icons)
├── DOMPurify (XSS Protection)
└── Vitest (Testing)

Supabase (Backend)
├── PostgreSQL (Database)
├── Row Level Security (Authorization)
├── Auth (Google OAuth + Email/Password)
└── Realtime (Live Updates)

Vercel (Deployment)
├── Serverless Functions (Email API)
├── Edge Network (CDN)
└── Security Headers (CSP, HSTS, etc.)
```

## ✨ Features

### Core Platform
- **1-on-1 Session Booking** — Book tutoring sessions with subject/time/tutor selection
- **Google Meet Integration** — Auto-provision meeting links for virtual sessions
- **Multi-curriculum Support** — GCSE, A-Level, IB, CBSE, IGCSE, and more
- **SEN Specialist Support** — Autism, ADHD, dyslexia-trained tutors

### User Experience
- **React Router SPA** — Smooth client-side navigation with proper URL routing
- **Light/Dark Theme** — System-aware with manual toggle
- **Responsive Design** — Mobile-first, works on all devices
- **Lazy Loading** — Code-split pages for fast initial load
- **Offline Detection** — Banner notification when connectivity is lost
- **Error Boundaries** — Graceful error recovery without app crashes
- **404 Page** — Beautiful branded not-found page

### Security & Resilience
- **Input Sanitization** — DOMPurify-based XSS prevention on all inputs
- **Rate Limiting** — Client-side protection against abuse
- **Database Resilience** — Automatic retry with exponential backoff
- **Circuit Breaker** — Prevents cascading failures
- **Row Level Security** — PostgreSQL policies for data isolation
- **Security Headers** — CSP, HSTS, X-Frame-Options, etc.
- **PKCE Auth Flow** — Secure OAuth implementation

### Admin Portal
- **Dashboard Analytics** — Revenue, bookings, conversion metrics
- **Calendar View** — Visual booking calendar
- **Audit Logging** — Full trail of admin actions
- **Bulk Operations** — Multi-select booking management
- **CSV Export** — Data export capability
- **Google Calendar Sync** — One-click calendar integration

### Content
- **ZP Learn** — Educational articles with interactive reading experience
- **SEO Optimized** — JSON-LD structured data, Open Graph, Twitter Cards
- **FAQ Section** — Accordion-style frequently asked questions

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🗄️ Database Setup

1. Create a [Supabase](https://supabase.com) project
2. Run `schema.sql` in the SQL Editor
3. Run `audit-logs-migration.sql` for audit logging
4. Run `enhanced-schema.sql` for reviews, notifications, progress tracking
5. Enable Google OAuth in Authentication → Providers

## 📧 Email Setup

See [EMAIL_SETUP.md](./EMAIL_SETUP.md) for Resend configuration.

## 🧪 Testing

```bash
npm test          # Watch mode
npm run test:run  # Single run
npm run test:coverage  # With coverage report
```

## 🛡️ Security

- All user inputs are sanitized with DOMPurify
- Database operations use parameterized queries via Supabase
- Row Level Security policies enforce data isolation
- Admin emails are whitelisted server-side
- OAuth uses PKCE flow for maximum security
- Security headers configured in `vercel.json`

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ErrorBoundary    # Error recovery
│   ├── NotFound         # 404 page
│   ├── OfflineBanner    # Connectivity indicator
│   ├── LoadingSpinner   # Reusable loader
│   └── ...              # Feature components
├── context/             # React contexts
│   ├── AuthContext       # Authentication state
│   └── ThemeContext      # Theme management
├── lib/                 # Utilities & services
│   ├── database.js       # Resilient DB operations
│   ├── resilience.js     # Retry & circuit breaker
│   ├── sanitize.js       # Input validation & XSS
│   ├── auditLog.js       # Admin action logging
│   ├── supabase.js       # Supabase client
│   └── email.js          # Email dispatcher
├── styles/              # CSS
├── test/                # Test files
├── App.jsx              # Root with React Router
└── main.jsx             # Entry point
```

## 🌐 Deployment

Deployed on Vercel with automatic CI/CD from the `main` branch.

---

Built with ❤️ by the Zenith Pranavi team — [zped.org](https://zped.org)
