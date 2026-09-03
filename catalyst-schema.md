# Zoho Catalyst Data Store — Table Setup Guide

## Overview

This document describes how to create the required tables in your Zoho Catalyst console.
Navigate to **Catalyst Console → Your Project → Data Store** and create each table below.

> **Note:** Catalyst auto-creates ROWID, CREATORID, CREATEDTIME, and MODIFIEDTIME columns.

---

## Table 1: Bookings

| Column Name     | Data Type | Max Length | Mandatory | Unique | Searchable |
|-----------------|-----------|-----------|-----------|--------|------------|
| user_id         | text      | 100       | Yes       | No     | Yes        |
| student_name    | text      | 200       | Yes       | No     | Yes        |
| student_email   | text      | 200       | No        | No     | Yes        |
| tutor_name      | text      | 200       | Yes       | No     | No         |
| subject         | text      | 200       | Yes       | No     | Yes        |
| booking_date    | text      | 50        | Yes       | No     | No         |
| booking_time    | text      | 50        | Yes       | No     | No         |
| price           | double    | -         | No        | No     | No         |
| status          | text      | 50        | Yes       | No     | Yes        |
| google_meet     | text      | 500       | No        | No     | No         |
| meet_link       | text      | 500       | No        | No     | No         |
| admin_notes     | text      | 2000      | No        | No     | No         |

---

## Table 2: Enquiries

| Column Name | Data Type | Max Length | Mandatory | Unique | Searchable |
|-------------|-----------|-----------|-----------|--------|------------|
| name        | text      | 200       | Yes       | No     | Yes        |
| email       | text      | 200       | Yes       | No     | Yes        |
| phone       | text      | 50        | No        | No     | No         |
| message     | text      | 5000      | Yes       | No     | No         |

---

## Table 3: SessionReviews

| Column Name  | Data Type | Max Length | Mandatory | Unique | Searchable |
|--------------|-----------|-----------|-----------|--------|------------|
| booking_id   | text      | 100       | Yes       | No     | Yes        |
| user_id      | text      | 100       | Yes       | No     | Yes        |
| rating       | int       | -         | Yes       | No     | No         |
| review_text  | text      | 5000      | No        | No     | No         |

---

## Table 4: Notifications

| Column Name | Data Type | Max Length | Mandatory | Unique | Searchable |
|-------------|-----------|-----------|-----------|--------|------------|
| user_id     | text      | 100       | Yes       | No     | Yes        |
| type        | text      | 50        | Yes       | No     | No         |
| title       | text      | 200       | Yes       | No     | No         |
| message     | text      | 2000      | Yes       | No     | No         |
| is_read     | text      | 10        | Yes       | No     | No         |

---

## Table 5: StudentProgress

| Column Name         | Data Type | Max Length | Mandatory | Unique | Searchable |
|---------------------|-----------|-----------|-----------|--------|------------|
| user_id             | text      | 100       | Yes       | No     | Yes        |
| subject             | text      | 200       | Yes       | No     | Yes        |
| sessions_completed  | int       | -         | No        | No     | No         |
| avg_rating          | double    | -         | No        | No     | No         |
| notes               | text      | 5000      | No        | No     | No         |

---

## Authentication Setup

1. Go to **Catalyst Console → Authentication**
2. Configure **Embedded Authentication** or **Hosted Authentication**
3. Enable **Public Signup** to allow students to register
4. Enable **Google Social Login**:
   - Go to **Social Logins → Google**
   - Add your Google OAuth Client ID and Secret
5. Configure **Email Templates** for sign-up and password reset emails
6. Add **Authorized Domains**: `zped.org`, `localhost`

---

## OAuth Setup (for External Hosting on Vercel)

If hosting on Vercel (not on Catalyst), you need OAuth tokens:

1. Go to [Zoho API Console](https://api-console.zoho.com/)
2. Register a **Server-based Application**:
   - **Client Name**: zped-tutoring
   - **Homepage URL**: `https://zped.org`
   - **Redirect URI**: `https://zped.org/api/auth/callback`
3. Note down `client_id` and `client_secret`
4. Generate a **Self Client** grant token with scopes:
   ```
   ZohoCatalyst.tables.rows.CREATE,ZohoCatalyst.tables.rows.READ,
   ZohoCatalyst.tables.rows.UPDATE,ZohoCatalyst.tables.rows.DELETE,
   ZohoCatalyst.projects.users.READ,ZohoCatalyst.projects.users.CREATE,
   ZohoCatalyst.zcql.CREATE,ZohoCatalyst.authentication.CREATE
   ```
5. Exchange grant token for access + refresh tokens
6. Store tokens in Vercel environment variables

---

## ZCQL Quick Reference

```sql
-- Get all pending bookings
SELECT * FROM Bookings WHERE status = 'pending' ORDER BY CREATEDTIME DESC

-- Get bookings for a specific user
SELECT * FROM Bookings WHERE user_id = '12345' ORDER BY CREATEDTIME DESC

-- Count bookings by status
SELECT status, COUNT(ROWID) FROM Bookings GROUP BY status

-- Search enquiries
SELECT * FROM Enquiries WHERE name LIKE '%john%' OR email LIKE '%john%'

-- Get unread notifications
SELECT * FROM Notifications WHERE user_id = '12345' AND is_read = 'false'
```

---

## Scopes & Permissions

Set table permissions in **Data Store → Table → Scopes and Permissions**:

| Table           | App Admin | App User (Read) | App User (Write) |
|-----------------|-----------|-----------------|-------------------|
| Bookings        | Full      | Own rows        | Insert only       |
| Enquiries       | Full      | No              | Insert only       |
| SessionReviews  | Full      | Own rows        | Insert only       |
| Notifications   | Full      | Own rows        | No                |
| StudentProgress | Full      | Own rows        | No                |
