# User Management System - Complete Guide

## Overview
Complete user management system for Transport Management System, including user invitation, role assignment, CRUD operations, and automatic synchronization between Clerk and Prisma via webhooks.

## What Was Built

### 1. **User Management Interface** (`/list/users`)
- **User Listing** - Advanced data table with:
  - TanStack Table integration (sorting, filtering, pagination)
  - Search functionality (name, email, username)
  - Role and status filters
  - Action buttons (Edit, Deactivate, Delete)
- **Invite User Form** - Create new users with:
  - Name, email, username (optional), phone
  - Role selection (Admin, Driver, Client)
  - Role-specific fields (license number for drivers, company info for clients)
  - Automatic temporary password generation and email delivery
- **Assign Role Form** - Assign roles to existing Clerk users
- **Edit User Dialog** - Update user details including username, role, and profile fields
- **Delete/Deactivate Dialogs** - Soft delete (deactivate) or permanently delete users

### 2. **Consolidated User Management Actions** (`src/app/actions/user-management.ts`)
All user management operations consolidated into a single file:
- `getUsers()` - Fetch users with search, role, and status filters
- `getUser()` - Fetch single user details
- `inviteUser()` - Create new user with temporary password
- `updateUser()` - Update user details in Clerk and Prisma
- `deleteUser()` - Permanently delete user from Clerk and Prisma
- `deactivateUser()` - Soft delete (set `isActive: false`)
- `activateUser()` - Reactivate deactivated user
- `assignUserRole()` - Assign role to existing Clerk user

### 3. **Clerk Webhook System** (`src/app/api/webhook/clerk/route.ts`)
Automatic synchronization between Clerk and Prisma:
- **`user.created`** - Auto-creates Prisma User when Clerk user is created
- **`user.updated`** - Clears `requiresPasswordChange` flag when password is enabled, syncs role changes
- **`user.deleted`** - Soft deletes user in Prisma (sets `isActive: false`)

### 4. **Backfill Script** (`scripts/backfill-clerk-users.ts`)
One-time script to sync existing Clerk users into Prisma:
- Fetches all users from Clerk (handles pagination)
- Creates missing users in Prisma
- Preserves existing users (skips duplicates)
- Provides detailed summary report

### 5. **Change Password Page** (`/change-password`)
- Uses Clerk's UserProfile component for password changes
- Automatically redirects after password change
- Webhook automatically clears `requiresPasswordChange` flag

### 6. **Email System** (`src/lib/email.ts`)
- Sends welcome email with temporary password
- Uses Resend for email delivery

### 7. **Dashboard Components**
- **Sidebar** (`src/components/dashboard/sidebar.tsx`) - Role-based navigation:
  - Shows only relevant items per role (Admin, Driver, Client)
  - Dynamic dashboard links based on user role
  - Loading states and proper error handling
- **Header** (`src/components/dashboard/header.tsx`) - Search and user controls
- **Stats Cards** (`src/components/dashboard/stats-card.tsx`) - Reusable metric displays

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Clerk (required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk Webhook (required for automatic user sync)
CLERK_WEBHOOK_SECRET=whsec_... (from Clerk Dashboard → Webhooks)

# Resend (for email)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Transport Management System <noreply@yourdomain.com>

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (should already be set)
DATABASE_URL=postgresql://...
```

## Setup Steps

### 1. Get Resend API Key
1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Add to `.env.local` as `RESEND_API_KEY`

### 2. Configure Resend From Email
- Use a verified domain or Resend's test domain
- Add to `.env.local` as `RESEND_FROM_EMAIL`

### 3. Set App URL
- For development: `http://localhost:3000`
- For production: your actual domain

### 4. Set Up Clerk Webhook (Required for Automatic User Sync)
1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Your App → Webhooks
2. Click "+ Add Endpoint"
3. **Endpoint URL:**
   - For local dev (using ngrok): `https://your-ngrok-url.ngrok.io/api/webhook/clerk`
   - For production: `https://yourdomain.com/api/webhook/clerk`
4. **Description:** `TMS User Sync - Handles user.created, user.updated, user.deleted`
5. **Subscribe to Events:** Select ONLY these:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
   - ❌ Do NOT select session events (they cause failures)
6. Click "Create"
7. Copy the **Signing Secret** (starts with `whsec_...`)
8. Add to `.env.local` as `CLERK_WEBHOOK_SECRET`

### 5. Sync Existing Users (One-Time)
If you have existing users in Clerk that aren't in Prisma:
```bash
npm run backfill:users
```
This will sync all existing Clerk users into your Prisma database.

## How It Works

### Admin Flow - Invite User:
1. Admin goes to `/list/users` → "Invite User" tab
2. Fills out invite form with user details
3. System:
   - Creates user in Clerk with temp password
   - Sets `publicMetadata.role` and `requiresPasswordChange: true`
   - Creates user in Prisma database
   - Creates DriverProfile or ClientProfile if applicable
   - Sends email with temporary password

### Admin Flow - Manage Users:
1. Admin goes to `/list/users` → "All Users" tab
2. Can search, filter, and sort users
3. Actions available:
   - **Edit** - Update user details (name, email, username, phone, role, profile fields)
   - **Deactivate** - Soft delete (sets `isActive: false`, preserves data)
   - **Delete** - Permanently remove from Clerk and Prisma
   - **Activate** - Reactivate deactivated users

### User Flow - First Login:
1. User receives email with temporary password
2. User signs in with temp password
3. System detects `requiresPasswordChange: true` in metadata
4. User is redirected to `/change-password`
5. User changes password via Clerk's UserProfile component
6. **Webhook automatically clears** `requiresPasswordChange` flag when password is enabled
7. User is redirected to their role-specific dashboard

### Automatic User Sync (Webhook):
- **When Clerk user is created** → Webhook creates Prisma User automatically
- **When user password is enabled** → Webhook clears `requiresPasswordChange` flag
- **When user role is updated in Clerk** → Webhook syncs role to Prisma
- **When Clerk user is deleted** → Webhook soft deletes user in Prisma (`isActive: false`)

## Features

### ✅ Completed Features
1. **Automatic Password Change Detection** - Webhook automatically clears `requiresPasswordChange` flag when password is enabled
2. **Complete Webhook Sync** - Automatic synchronization for `user.created`, `user.updated`, and `user.deleted` events
3. **Backfill Script** - One-time script to sync existing Clerk users
4. **Username Support** - Users can sign in with username or email
5. **Role-Based Sidebar** - Navigation shows only relevant items per role
6. **Advanced User Table** - TanStack Table with search, sorting, filtering, pagination
7. **Consolidated Actions** - All user management operations in one file for maintainability

### 🔄 Future Enhancements
1. **Error Handling** - Add retry queue for email failures
2. **Bulk Operations** - Bulk invite, activate, or deactivate users
3. **User Import** - CSV/Excel import for bulk user creation
4. **Audit Logging** - Track all user management actions
5. **User Activity** - View user login history and activity logs

## Testing

### Test User Invitation:
1. Sign in as admin
2. Go to `/list/users` → "Invite User" tab
3. Fill out form and create a test user
4. Check email for temporary password
5. Sign in with new user
6. Should redirect to `/change-password`
7. Change password
8. Webhook should automatically clear `requiresPasswordChange` flag
9. Should redirect to appropriate dashboard

### Test User Management:
1. Sign in as admin
2. Go to `/list/users` → "All Users" tab
3. Test search functionality
4. Test role and status filters
5. Test sorting columns
6. Click "Edit" on a user - update details
7. Click "Deactivate" on a user - verify `isActive` becomes `false`
8. Click "Activate" on deactivated user - verify `isActive` becomes `true`
9. Click "Delete" on a user - verify user is removed from Clerk and Prisma

### Test Webhook Sync:
1. Create a user directly in Clerk Dashboard (not via invite form)
2. Set `publicMetadata.role = "driver"` or `"client"`
3. Check Prisma database - user should be automatically created
4. Update user's role in Clerk Dashboard
5. Check Prisma - role should be synced automatically
6. Delete user in Clerk Dashboard
7. Check Prisma - user should have `isActive: false`

### Test Backfill Script:
1. Ensure you have some users in Clerk that aren't in Prisma
2. Run: `npm run backfill:users`
3. Verify all users are synced to Prisma
4. Run again - should skip existing users

## Notes

### Database Schema:
- Clerk manages passwords, so we store `"clerk_managed"` in Prisma's password field
- Username field is optional and unique (for username-based sign-in)
- `isActive` flag is used for soft deletes (preserves data integrity)

### Security:
- The temporary password is generated with secure random characters (12 chars, mixed case, numbers, symbols)
- Webhook uses Svix signature verification for security
- All user management actions require admin role (server-side checks)

### User Sync:
- Webhook automatically syncs users created in Clerk Dashboard
- Backfill script is for one-time sync of existing users
- Role changes in Clerk are automatically synced to Prisma
- User deletions are soft deletes (data preserved)

### UI/UX:
- Email template is HTML and includes the temp password clearly
- UserProfile component from Clerk handles all password validation
- Sidebar navigation adapts based on user role
- Data table provides advanced filtering and sorting capabilities

### File Structure:
- All user management actions consolidated in `src/app/actions/user-management.ts`
- Webhook handler at `src/app/api/webhook/clerk/route.ts`
- Backfill script at `scripts/backfill-clerk-users.ts`
- User management UI at `src/app/(dashboard)/list/users/page.tsx`

