# 🌸 Zenith Pranavi — ZPed.in

**Where Every Child Reaches Their Zenith**

World-class online tutoring platform built with HTML, CSS, JavaScript and Supabase.

---

## 📁 Project Structure

```
ZenithPranavi/
├── index.html      → Complete HTML (Homepage + Dashboard + Modals)
├── styles.css      → Premium CSS (matching brand design)
├── config.js       → Supabase client init + pricing config
├── auth.js         → Authentication (signup, login, logout, sessions)
├── database.js     → Database operations (tutors, bookings, enquiries)
├── app.js          → Main controller (events, forms, animations)
├── schema.sql      → Complete SQL schema + RLS + sample data
└── README.md       → This file
```

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Run the SQL Schema
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your **ZPranavi** project
3. Navigate to **SQL Editor** → **New Query**
4. Paste the entire contents of `schema.sql`
5. Click **Run**

### Step 2: Configure Supabase (Already Done!)
Your credentials are already configured in `config.js`:
- **Project URL:** `https://oqxwvkytyczmldnrqjll.supabase.co`
- **Anon Key:** `sb_publishable_nU4ihs42_7R5L5F9Cb4Pew_J_0XYxhe`

### Step 3: Disable Email Confirmation (For Testing)
1. In Supabase Dashboard → **Authentication** → **Providers** → **Email**
2. Toggle OFF **"Confirm email"**
3. This allows instant signup without email verification

---

## 💰 Pricing Structure

| Level | Price | Tutors |
|-------|-------|--------|
| Year 1–6 (Foundation) | $13/hour | Lisa Thompson, Rachel Green |
| Year 7–10 (Intermediate) | $20/hour | James, Priya, Emma, Sophie |
| Year 11–12 (Advanced) | $27/hour | Dr. Sarah, Michael, Dr. Anil |
| Special Needs (Inclusive) | $27/hour | David Park |

---

## 🔒 Security (RLS Policies)

| Table | Operation | Access |
|-------|-----------|--------|
| `tutors` | SELECT | Public (anyone) |
| `bookings` | INSERT | Authenticated users only |
| `bookings` | SELECT | Own records only |
| `bookings` | UPDATE | Own records only |
| `enquiries` | INSERT | Public (contact form) |
| `enquiries` | SELECT | Admin only (service_role) |

---

## 🎯 User Flow

1. User visits site → sees Homepage with hero, features, pricing
2. Clicks "Get Started" or "Begin Your Journey"
3. Signs up with name + email + password
4. Auto-redirected to Dashboard
5. Views available tutors with ratings and pricing
6. Books a session (saved to `bookings` table as "pending")
7. Can view all their bookings in the table
8. Logout returns to homepage

---

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Fonts:** Cinzel, Playfair Display, Cormorant Garamond, Inter
- **CDN:** Supabase JS v2

---

© 2025 Zenith Pranavi Education (ZPed.in). All rights reserved.
