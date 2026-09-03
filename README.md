# 🎓 Zenith Pranavi — Premium Tutoring Platform

[![React 19](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-purple)](https://vitejs.dev)
[![Zoho Catalyst](https://img.shields.io/badge/Zoho_Catalyst-Data_Store-green)](https://catalyst.zoho.com)
[![License](https://img.shields.io/badge/License-Private-red)]()

## 🌟 Overview

A premium tutoring platform for **zped.org** with subject booking, admin management, session reviews, student progress tracking, and real-time notifications — powered by **Zoho Catalyst** for a resilient, always-on database.

### Tech Stack

| Layer          | Technology                                |
|----------------|-------------------------------------------|
| Frontend       | React 19 + Vite 6 + React Router 7       |
| Database       | Zoho Catalyst Data Store (Relational)     |
| Authentication | Zoho Catalyst Auth + OAuth 2.0            |
| Email          | Resend API (via Vercel serverless)        |
| Hosting        | Vercel / Zoho Catalyst Web Client Hosting |
| Security       | DOMPurify, CSP headers, rate limiting     |
| Testing        | Vitest + React Testing Library            |

## 🚀 Features

- ✅ **Subject Booking System** — students book tutoring sessions by year group
- ✅ **Admin Dashboard** — manage bookings, enquiries, and students with audit logging
- ✅ **Google Meet Integration** — admins assign Meet links to confirmed sessions
- ✅ **Email Notifications** — automatic emails for bookings, status updates, enquiries
- ✅ **Session Reviews** — students rate and review completed sessions
- ✅ **Student Progress Tracking** — per-subject progress reports
- ✅ **Notification System** — in-app notifications for booking updates
- ✅ **Dark/Light Mode** — theme toggle with system preference detection
- ✅ **SEO Optimized** — React Helmet Async for dynamic meta tags
- ✅ **Error Boundaries** — graceful crash recovery
- ✅ **Offline Detection** — real-time connectivity monitoring
- ✅ **Input Sanitization** — XSS protection via DOMPurify
- ✅ **Rate Limiting** — client-side form submission throttling
- ✅ **Circuit Breaker** — prevents cascade failures to database
- ✅ **Retry with Backoff** — automatic retry for transient errors
- ✅ **Audit Logging** — all admin actions tracked for accountability
- ✅ **Code Splitting** — lazy-loaded routes for optimal performance

## 📦 Installation

```bash
git clone https://github.com/your-repo/NodeStream.git
cd NodeStream
npm install
cp .env.example .env  # Fill in your Catalyst credentials
npm run dev
```

## 🔧 Zoho Catalyst Setup

### 1. Create a Catalyst Project

1. Go to [Zoho Catalyst Console](https://console.catalyst.zoho.com)
2. Create a new project
3. Note the **Project ID** and **ZAID** from General Settings

### 2. Create Data Store Tables

Follow the schema guide in **`catalyst-schema.md`** to create these tables:

- `Bookings` — tutoring session bookings
- `Enquiries` — contact form submissions
- `SessionReviews` — student session reviews
- `Notifications` — in-app notifications
- `StudentProgress` — per-subject progress tracking
- `AuditLogs` — admin action audit trail

### 3. Configure Authentication

1. Enable **Public Signup** in Authentication settings
2. Configure **Google Social Login** (optional)
3. Set **Authorized Domains**: your deployment domain

### 4. Set Environment Variables

```env
# Client-side (Vite)
VITE_CATALYST_PROJECT_ID=your_project_id
VITE_CATALYST_PROJECT_KEY=your_zaid
VITE_CATALYST_API_DOMAIN=https://api.catalyst.zoho.in

# Server-side (Vercel)
CATALYST_SERVER_TOKEN=your_oauth_access_token
CATALYST_PROJECT_ID=your_project_id
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
```

See `.env.example` for the full list.

## 🧪 Testing

```bash
npm test          # Run all tests
npm run test:ui   # Interactive test UI
npm run test:cov  # Coverage report
```

## 📂 Project Structure

```
NodeStream/
├── api/
│   ├── auth/
│   │   ├── signup.js          # User registration proxy
│   │   ├── signin.js          # User login proxy
│   │   ├── signout.js         # Session logout
│   │   ├── reset-password.js  # Password reset proxy
│   │   ├── google.js          # Google OAuth initiation
│   │   └── callback.js        # OAuth callback handler
│   └── send-email.js          # Resend email API
├── src/
│   ├── components/
│   │   ├── AdminPanel.jsx     # Admin dashboard
│   │   ├── AuthModal.jsx      # Login/signup modal
│   │   ├── Dashboard.jsx      # Student dashboard
│   │   ├── Homepage.jsx       # Landing page
│   │   ├── LearnPage.jsx      # Learning resources
│   │   └── ...
│   ├── context/
│   │   ├── AuthContext.jsx    # Catalyst authentication
│   │   └── ThemeContext.jsx   # Dark/light mode
│   ├── lib/
│   │   ├── catalyst.js        # Catalyst REST API client
│   │   ├── database.js        # Data Store operations
│   │   ├── resilience.js      # Retry, circuit breaker
│   │   ├── sanitize.js        # Input sanitization
│   │   ├── email.js           # Email helpers
│   │   └── auditLog.js        # Audit logging
│   ├── App.jsx                # Root app with routing
│   └── main.jsx               # Entry point
├── catalyst-schema.md          # Data Store setup guide
├── .env.example                # Environment variable template
└── vite.config.js              # Build configuration
```

## 🔒 Security

- **Input Sanitization** — DOMPurify strips XSS payloads
- **CSP Headers** — Content Security Policy restricts resource loading
- **HSTS** — Strict transport security enforced
- **Rate Limiting** — 3-second cooldown between form submissions
- **Parameterized Queries** — ZCQL prevents injection
- **OAuth 2.0** — Secure token-based authentication

## 🌍 Why Zoho Catalyst over Supabase?

| Concern         | Supabase Free          | Zoho Catalyst           |
|-----------------|------------------------|-------------------------|
| **Uptime**      | Pauses after inactivity| Always on, no pausing   |
| **Data Centers**| Limited                | 7 DCs (US, EU, IN, AU, CA, JP, SA) |
| **Auth**        | Email + OAuth          | Email + Google/Zoho + roles |
| **Ecosystem**   | Standalone             | Integrates with Zoho CRM, Mail, etc. |
| **Query Lang**  | SQL                    | ZCQL (SQL-like)         |
| **Cache**       | None                   | Built-in key-value cache|
| **Push Notifs** | None                   | Web + mobile            |
| **Free Credits**| Limited rows           | $250 wallet credits     |

## 📄 License

Private — © 2024 Zenith Pranavi. All rights reserved.
