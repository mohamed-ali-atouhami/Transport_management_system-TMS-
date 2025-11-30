# Transport Management System – Development Roadmap

## 1. Glossary
- **MVP (Minimum Viable Product):** The smallest, fastest version of the product that delivers core value to users. It contains only the critical features required to solve the primary problem, allowing you to launch sooner, gather feedback, and iterate.
- **Milestone:** A checkpoint in your project that marks the completion of a meaningful chunk of work. Milestones help track progress, celebrate wins, and act as decision points before starting the next phase.

---

## 2. Recommended Fast Tech Stack

| Layer | Recommendation | Why it accelerates development |
|-------|----------------|--------------------------------|
| Frontend & Backend | **Next.js (React + Node.js)** | Single framework for UI and API routes; fast hot reload; SSR if needed. |
| Language | **TypeScript** | Autocomplete, type safety, fewer runtime bugs. |
| Auth | **Clerk** | Plug-and-play auth with hosted UI, MFA, and role management. |
| Database | **PostgreSQL (Docker for dev, hosted for prod)** | Local Docker for development; switch to managed Postgres (Supabase/Neon/Vercel Postgres) at launch. |
| ORM | **Prisma** | Rapid schema definition and migrations; great DX. |
| UI Library | **shadcn/ui + Tailwind CSS** | Modern, composable components with full design control. |
| State/Data Fetching | **React Query (+ Next.js Route Handlers/server actions)** | Declarative fetching, caching, and mutations without manual `useEffect` boilerplate. |
| Notifications/Emails | **Resend** | Streamlined transactional emails; generous free tier. |
| Deployment | **Vercel** | One-click deploy, previews, edge support. Pair with a hosted Postgres provider when ready. |

**Alternative (if you prefer Python):** Django + Django REST Framework + Django Admin + PostgreSQL + Tailwind. Fast scaffolding but requires more backend/frontend separation.

---

## 3. MVP Scope (First Release)
- User authentication & role-based access (Admin, Driver, Client)
- Admin: basic user/vehicle/trip/shipment management
- Driver: view assigned trips, update status
- Client: request shipment, track active shipments
- Basic dashboards showing key metrics
- Email notifications for critical events (trip assignment, shipment updates)

**Out of scope for MVP:** Advanced reporting, real-time map tracking, document management, complex analytics.

---

## 4. Roadmap & Milestones (16 Weeks for MVP)

> Assumes 8 hours/week. Each milestone ≈ 2 weeks (16 hrs). Adjust dates according to your start week.

### Milestone 0 – Project Kickoff (Week 0) ✅ *Completed Nov 7, 2025*
- Finalize tech stack and architecture.
- Set up project repo, issue tracker, and documentation (Notion/GitHub Projects).
- Deliverables: Stack decision, repo initialized, requirements docs stored.

### Milestone 1 – Foundations (Weeks 1-2) ✅ *Completed Nov 7, 2025*
- Initialize Next.js project with TypeScript.
- Spin up PostgreSQL locally via Docker (development).
- Install Prisma, Clerk, shadcn/ui, Tailwind, React Query.
- Configure base layout, routing, and protected routes.
- Deliverables: Running app with basic auth scaffolding, database connected locally.

### Milestone 2 – Auth & Roles (Weeks 3-4) ✅ *Completed*
- ✅ Configure Clerk (sign-in, sign-up, protected routes).
- ✅ Persist Clerk user info to local Postgres via Prisma.
- ✅ Implement RBAC guards (Admin/Driver/Client) - middleware + server-side checks.
- ✅ Create profile pages for each role (Admin, Driver, Client dashboards).
- ✅ Admin user invitation system with temporary passwords.
- ✅ Role assignment for existing users.
- ✅ Password change flow with webhook support.
- ✅ RBAC hardening with server-side role verification.
- ✅ **Clerk Webhook Implementation** - Complete user sync system:
  - ✅ `user.created` handler - Auto-creates Prisma User when Clerk user is created
  - ✅ `user.updated` handler - Clears `requiresPasswordChange` flag and syncs role changes
  - ✅ `user.deleted` handler - Soft deletes users (sets `isActive: false`)
- ✅ **Backfill Script** - Sync existing Clerk users into Prisma database
- ✅ **Username Support** - Added username field to User schema for username-based sign-in
- ✅ **Onboarding Page** - Fallback page for users without assigned roles
- **Deliverables:** Users can sign in/out; access is role-restricted and stored. Full user sync between Clerk and Prisma.

### Milestone 3 – Core Data Models (Weeks 5-6) ✅ *Completed Nov 7, 2025*
- Define Prisma schema (users, profiles, vehicles, trips, shipments, expenses, notifications).
- Generate migrations against local Docker Postgres.
- Seed development data.
- Deliverables: Database ready with initial seed data.

> **Progress update:** Milestones 0, 1, and 3 were completed together during the initial setup session, putting the project ahead of the original schedule.

### Milestone 4 – Admin Panels (Weeks 7-8) 🔄 *In Progress*
- ✅ **User Management CRUD** - Complete admin interface for user management:
  - ✅ User listing with TanStack Table (sorting, filtering, pagination, search)
  - ✅ View user details
  - ✅ Edit user (name, email, username, phone, role, profile fields)
  - ✅ Delete/Deactivate users (soft delete with `isActive` flag)
  - ✅ Activate deactivated users
  - ✅ Invite new users with temporary passwords
  - ✅ Assign roles to existing users
  - ✅ Consolidated all user management actions into `user-management.ts`
- ✅ **Dashboard UI** - Modern admin dashboard with shadcn/ui:
  - ✅ Sidebar navigation with role-based visibility
  - ✅ Header component with search and user button
  - ✅ Stats cards for dashboard metrics
  - ✅ Responsive layout for all dashboard pages
- ✅ **Route Structure** - Organized routes to match `routeAccessMap`:
  - ✅ User management moved to `/list/users` (matches routeAccessMap)
  - ✅ Sidebar navigation updated for all list routes
- ✅ **Vehicle Management CRUD** - Complete admin interface for vehicle management:
  - ✅ Vehicle listing with custom Table component
  - ✅ Create, edit, delete vehicles
  - ✅ Change vehicle status (Active, In Maintenance, Inactive)
  - ✅ Status filtering in table
  - ✅ Search functionality
  - ✅ Pagination support
- ✅ **Trip Management CRUD** - Complete admin interface for trip management:
  - ✅ Trip listing with custom Table component
  - ✅ Create, edit, delete trips
  - ✅ Change trip status (Planned, Ongoing, Completed, Cancelled)
  - ✅ Status filtering in table
  - ✅ Date sorting functionality
  - ✅ Search functionality
  - ✅ Pagination support
- ✅ **Custom Table Component** - Reusable table component with advanced features:
  - ✅ Clickable column headers with dropdown menus
  - ✅ Column filtering (direct dropdown menu items, no nested selects)
  - ✅ Column sorting (ascending, descending, clear sort)
  - ✅ Visual indicators for sort state (↑, ↓, ↕ icons)
  - ✅ URL-based state management (filters and sorting via query params)
  - ✅ Responsive design with proper spacing
  - ✅ First column padding for clickable headers
  - ✅ Smooth hover states and transitions
- ✅ **Project Structure Refactoring**:
  - ✅ Organized forms into `src/components/admin/forms/`
  - ✅ Organized tables into `src/components/admin/tables/`
  - ✅ Created reusable `FormModal` and `FormContainer` components
  - ✅ Created table-specific action components (TripActions, VehicleActions, UserActions)
  - ✅ Removed unused files and consolidated server actions
- ✅ **Bug Fixes & Improvements**:
  - ✅ Fixed hydration mismatch errors (toLocaleString with explicit "en-US" locale)
  - ✅ Fixed dialog closing issues (removed revalidatePath, added proper state management)
  - ✅ Fixed toast notifications not showing
  - ✅ Improved form state management with useActionState pattern
  - ✅ Fixed spacing between search bar and table
- ✅ **Documentation**:
  - ✅ Created comprehensive `TABLE_COLUMN_FILTERS_AND_SORTING.md` guide
  - ✅ Documented how to add filters and sorting to any column
- Admin UI for managing driver/client profiles (Next)
- Implement CRUD API routes via Next.js API or tRPC.
- Basic validation and error handling.
- **Deliverables:** Admin dashboard can manage users, vehicles, and trips. All CRUD operations complete with modern UI.

**Current Status:**
- ✅ User Management CRUD fully implemented
- ✅ Vehicle Management CRUD fully implemented
- ✅ Trip Management CRUD fully implemented
- ✅ Custom Table component with filters and sorting
- ✅ Webhook sync system complete (from Milestone 2)
- ✅ Backfill script ready for use
- ✅ Project structure organized and cleaned up
- 🔄 Next: Shipment Management CRUD or Driver/Client profile management

### Milestone 5 – Trip & Shipment Workflow (Weeks 9-10)
- Trip creation wizard (assign driver/vehicle).
- Shipment request form (client) and assignment (admin).
- Trip status transitions (planned → ongoing → completed).
- Deliverables: End-to-end trip and shipment flow operational.

### Milestone 6 – Driver & Client Portals (Weeks 11-12)
- Driver portal: upcoming trips, status updates, issue reporting.
- Client portal: shipment requests, tracking, history.
- Basic notifications list for both roles.
- **Entity Detail Pages (Dynamic Routes `[id]/page.tsx`):**
  - Trip detail page (`/list/trips/[id]`): Complete trip information, driver/vehicle cards, assigned shipments list, expenses list, route details, quick links to related entities.
  - Shipment detail page (`/list/shipments/[id]`): Full shipment tracking info, client details, assigned trip (if any), status timeline, pickup/delivery addresses, quick links to trip and client.
  - Driver detail page (`/list/drivers/[id]`): Driver profile card, assigned trips (current/upcoming), trip history, performance metrics, quick links to all trips.
  - Client detail page (`/list/clients/[id]`): Client profile card, shipment history, active shipments, total revenue, quick links to all shipments.
  - Vehicle detail page (`/list/vehicles/[id]`): Vehicle specifications, status and mileage, maintenance history, assigned trips, insurance/registration expiry dates, quick links to maintenance and trips.
  - Add "View" buttons/links in all list tables to navigate to detail pages.
  - Implement consistent detail page layout: left side (main content), right side (stats/quick links/actions).
- Deliverables: Role-specific dashboards live. Complete detail pages for all major entities with navigation from list views.

### Milestone 7 – Notifications & Emails (Weeks 13-14)
- In-app notification center (read/unread).
- Email triggers for critical events (trip assigned, status updates).
- Optional: Real-time updates using Supabase realtime.
- Deliverables: Users receive notifications across channels.

**Implementation Phases:**

#### Phase 1: Core Notification System (Foundation)
1. **Notification Server Actions** (`src/lib/actions/notification-management.ts`):
   - ✅ `createNotification()` - Create new notification for a user
   - ✅ `getNotifications()` - Fetch user's notifications with filters (status, type, pagination)
   - ✅ `getUnreadCount()` - Get count of unread notifications for current user
   - ✅ `markAsRead()` - Mark single notification as read
   - ✅ `markAllAsRead()` - Mark all user's notifications as read
   - ✅ `deleteNotification()` - Delete a notification
   - ✅ `getNotificationById()` - Get single notification details

2. **Notification Bell Component** (`src/components/dashboard/NotificationBell.tsx`):
   - Bell icon with unread count badge (red badge with number)
   - Dropdown menu showing recent 5-10 notifications
   - Each notification item shows:
     - Title and message preview
     - Time ago (e.g., "2 hours ago")
     - Unread indicator (blue dot)
     - "Mark as read" button
   - "View All Notifications" link at bottom
   - Click notification → navigate to related entity (if link exists)
   - Auto-refresh unread count periodically

3. **Update Header Component** (`src/components/dashboard/header.tsx`):
   - Add `NotificationBell` component next to `UserButton`
   - Ensure it's visible for all authenticated users

4. **Notifications Page** (`src/app/(dashboard)/notifications/page.tsx`):
   - Full list of all user's notifications (paginated)
   - Filters:
     - Status: All / Unread / Read
     - Type: All / SYSTEM / TRIP_UPDATE / SHIPMENT / PAYMENT / GENERAL
     - Date range picker (optional)
   - Group by date: Today, Yesterday, This Week, Older
   - Actions per notification:
     - Mark as read / unread
     - Delete notification
   - Bulk actions:
     - "Mark all as read" button
     - "Delete all read" button (optional)
   - Click notification → navigate to related entity (via `link` field)
   - Empty state when no notifications

5. **Update RecentNotifications Component** (`src/components/driver/RecentNotifications.tsx`):
   - Replace mock data with real notifications from database
   - Fetch notifications using `getNotifications()` server action
   - Show actual notification data with proper formatting
   - Update client dashboard to fetch real notifications

6. **Update Client Dashboard** (`src/app/(dashboard)/client/page.tsx`):
   - Replace mock notifications array with real data fetch
   - Use `getNotifications()` to get client's notifications

#### Phase 2: Notification Triggers (Automatic Creation)
Add automatic notification creation in existing server actions:

1. **Trip Management** (`src/lib/actions/trip-management.ts`):
   - ✅ When trip is created/assigned → Notify driver:
     - Type: `TRIP_UPDATE`
     - Title: "New Trip Assigned"
     - Message: "You have been assigned a new trip: {departure} → {destination}"
     - Link: `/list/trips/{tripId}`
   
   - ✅ When trip status changes → Notify driver and admin:
     - Type: `TRIP_UPDATE`
     - Title: "Trip Status Updated"
     - Message: "Trip {departure} → {destination} is now {status}"
     - Link: `/list/trips/{tripId}`

2. **Shipment Management** (`src/lib/actions/shipment-management.ts`):
   - ✅ When shipment is created → Notify client:
     - Type: `SHIPMENT`
     - Title: "Shipment Request Received"
     - Message: "Your shipment request {trackingNumber} has been received"
     - Link: `/list/shipments/{shipmentId}`
   
   - ✅ When shipment is assigned to trip → Notify client:
     - Type: `SHIPMENT`
     - Title: "Shipment Assigned"
     - Message: "Your shipment {trackingNumber} has been assigned to a trip"
     - Link: `/list/shipments/{shipmentId}`
   
   - ✅ When shipment status changes → Notify client:
     - Type: `SHIPMENT`
     - Title: "Shipment Status Updated"
     - Message: "Shipment {trackingNumber} is now {status}"
     - Link: `/list/shipments/{shipmentId}`
   
   - ✅ When shipment is delivered → Notify client:
     - Type: `SHIPMENT`
     - Title: "Shipment Delivered"
     - Message: "Your shipment {trackingNumber} has been delivered"
     - Link: `/list/shipments/{shipmentId}`

3. **Driver Actions** (`src/lib/actions/driver-actions.ts`):
   - ✅ When driver updates trip status → Notify admin:
     - Type: `TRIP_UPDATE`
     - Title: "Driver Updated Trip Status"
     - Message: "Driver {driverName} updated trip {departure} → {destination} to {status}"
     - Link: `/list/trips/{tripId}`

4. **Issue Management** (`src/lib/actions/issue-management.ts`):
   - ✅ When issue is reported → Notify admin:
     - Type: `SYSTEM`
     - Title: "New Issue Reported"
     - Message: "Driver {driverName} reported a {severity} issue: {type}"
     - Link: `/list/issues`
   
   - ✅ When issue is resolved → Notify driver:
     - Type: `SYSTEM`
     - Title: "Issue Resolved"
     - Message: "Your reported issue has been resolved"
     - Link: `/list/trips/{tripId}`

#### Phase 3: Email Notifications (Optional - Can be done later)
1. **Email Service Setup**:
   - Choose email provider (Resend recommended - free tier available)
   - Install SDK: `npm install resend`
   - Set up environment variables: `RESEND_API_KEY`
   - Create email templates directory: `src/lib/emails/templates/`

2. **Email Server Actions** (`src/lib/actions/email-notifications.ts`):
   - ✅ `sendTripAssignedEmail()` - Email driver when trip assigned
   - ✅ `sendTripStatusUpdateEmail()` - Email when trip status changes
   - ✅ `sendShipmentUpdateEmail()` - Email client on shipment updates
   - ✅ `sendIssueReportedEmail()` - Email admin when issue reported

3. **Email Templates** (HTML templates):
   - Trip assignment email template
   - Trip status update email template
   - Shipment update email template
   - Issue reported email template

4. **Integrate Email Triggers**:
   - Add email sending to notification creation functions
   - Only send emails for critical events (configurable)
   - Add user preference for email notifications (future enhancement)

#### Phase 4: Real-time Updates (Optional - Advanced)
1. **Supabase Realtime Setup** (if using Supabase):
   - Set up Supabase project
   - Enable realtime for `Notification` table
   - Create realtime subscription in client components
   - Update notification bell to listen for new notifications

2. **Alternative: Polling** (simpler approach):
   - Use `useInterval` hook to poll for new notifications
   - Poll every 30-60 seconds
   - Update unread count and notification list

**Testing Checklist:**
- [ ] Notification bell shows correct unread count
- [ ] Dropdown displays recent notifications
- [ ] Mark as read works from dropdown
- [ ] Notifications page displays all notifications
- [ ] Filters work correctly (status, type)
- [ ] Clicking notification navigates to related entity
- [ ] Notifications are created on relevant events (trip assigned, status changes, etc.)
- [ ] RecentNotifications component shows real data
- [ ] Email notifications send correctly (if implemented)
- [ ] Real-time updates work (if implemented)

**Files to Create:**
- `src/lib/actions/notification-management.ts`
- `src/components/dashboard/NotificationBell.tsx`
- `src/app/(dashboard)/notifications/page.tsx`
- `src/lib/actions/email-notifications.ts` (optional)
- `src/lib/emails/templates/` (optional)

**Files to Update:**
- `src/components/dashboard/header.tsx` - Add NotificationBell
- `src/components/driver/RecentNotifications.tsx` - Use real data
- `src/app/(dashboard)/driver/page.tsx` - Fetch real notifications
- `src/app/(dashboard)/client/page.tsx` - Fetch real notifications
- `src/lib/actions/trip-management.ts` - Add notification triggers
- `src/lib/actions/shipment-management.ts` - Add notification triggers
- `src/lib/actions/driver-actions.ts` - Add notification triggers
- `src/lib/actions/issue-management.ts` - Add notification triggers

### Milestone 8 – MVP Polish & Launch Prep (Weeks 15-16)
- QA testing, bug fixes, performance tuning.
- Write README, deployment runbook, and user guide.
- Deploy MVP to Vercel; set up managed PostgreSQL (Supabase/Neon/Vercel Postgres) with Prisma migrations.
- Deliverables: Production MVP running; documentation prepared.

---

## 5. Post-MVP Milestones (High-Level)
- **Milestone 9:** Advanced reporting & analytics (charts, exports).
- **Milestone 10:** Expense management enhancements (receipt uploads, approvals).
- **Milestone 11:** Real-time GPS tracking integration.
- **Milestone 12:** Mobile-friendly optimizations or dedicated app.
- **Milestone 13:** Automated billing/invoicing.

---

## 6. Weekly Rhythm (Suggested)
1. **Plan (30 min):** Review milestone tasks; pick focus for the week.
2. **Build (6–6.5 hrs):** Execute tasks in focused blocks.
3. **Review (1 hr):** Test features, update docs, note blockers.
4. **Reflect (30 min):** Track progress, adjust next week’s plan.

---

## 7. Tooling Checklist
- Project management: GitHub Projects / Notion board with milestones.
- Issue tracking: Create issues per milestone deliverable.
- Documentation: Keep `REQUIREMENTS.md`, `ROADMAP.md`, and `TIME_ESTIMATION.md` updated.
- CI/CD: Enable Vercel previews on pull requests for early feedback.

---

## 8. Next Actions
1. Review and confirm the tech stack choice.
2. Align roadmap timing with your calendar (add actual target dates).
3. Set up project management board with milestones and tasks.
4. Begin Milestone 0 deliverables.

---

*This roadmap focuses on speed-to-value while preserving a clean architecture for future growth. Adapt milestones based on feedback and evolving priorities.*


