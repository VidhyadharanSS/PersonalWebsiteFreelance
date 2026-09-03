# Zenith Pranavi Tutoring Platform

React 19 and Vite frontend with a self-hosted Express API, MySQL 8 database, local email/password authentication, optional Google OAuth, booking management, reviews, notifications, student progress, and admin audit logging.

## Requirements

- Node.js 22.12 or newer
- MySQL 8.0 or newer

## Local Setup

```bash
npm install
cp .env.example .env
```

Create the database and user as a MySQL administrator:

```sql
CREATE DATABASE IF NOT EXISTS zped_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'zped_user'@'localhost' IDENTIFIED BY 'replace_this_password';
GRANT ALL PRIVILEGES ON zped_db.* TO 'zped_user'@'localhost';
FLUSH PRIVILEGES;
```

Set the same password in `.env`, then import the canonical schema:

```bash
mysql -u zped_user -p zped_db < schema.sql
npm run dev
```

The development app and API are available at `http://localhost:3000`.

For a persistent local deployment using Docker:

```bash
docker compose up -d --build
docker compose ps
```

Both services use `restart: unless-stopped`; MySQL data is stored in a named volume.

## Google Sign-In

Create an OAuth 2.0 Client ID of type **Web application** in Google Cloud Console. Add the exact authorized redirect URI matching your deployment:

```text
http://localhost:3000/api/auth/callback
```

For production, use `https://your-domain.example/api/auth/callback` and set `SITE_URL` to `https://your-domain.example`. Put the generated values in `.env` as `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`, then restart with `docker compose up -d --build`. The Google control is shown only when all required server configuration is present.

Promote an existing account to administrator when needed:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## Production

Build and run the application on the Linux host that can reach MySQL:

```bash
npm run build
npm start
```

Run `npm start` under systemd or another process supervisor and place nginx or Caddy in front for TLS. Set `SITE_URL` and `GOOGLE_REDIRECT_URI` to the public HTTPS URL and generate `JWT_SECRET` with `openssl rand -hex 32`.

Do not deploy this configuration to Vercel while `DB_HOST=localhost`: Vercel functions run remotely and cannot access MySQL on the local Linux machine.

## Validation

```bash
npm run test:run
npm run build
```

## Data Migration

The old provider schemas are intentionally removed. Export existing users and application rows from Supabase or Catalyst before decommissioning it, transform IDs to UUID strings where necessary, and import in this order: `users`, `tutors`, `bookings`, `enquiries`, `session_reviews`, `notifications`, `student_progress`, `audit_logs`.

Passwords cannot be exported from hosted auth providers. Existing users must use password reset after their user records are imported, or sign in through Google to link by email.