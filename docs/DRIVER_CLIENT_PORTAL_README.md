# Driver & Client Portal Implementation Guide

## Overview
This document outlines the implementation plan for enhancing the Driver and Client dashboards (portals) with comprehensive features for trip management, shipment tracking, and notifications.

---

## Table of Contents
1. [Prerequisites: Image Upload Setup](#prerequisites-image-upload-setup)
2. [Driver Portal Features](#driver-portal-features)
3. [Client Portal Features](#client-portal-features)
4. [Notifications System](#notifications-system)
5. [Implementation Steps](#implementation-steps)

---

## Prerequisites: Image Upload Setup

### Step 1: Add Image Fields to Database Schema

**Database Changes Required:**

#### A. Add `image` field to `User` model
```prisma
model User {
  id              String         @id @default(cuid())
  name            String
  email           String?         @unique
  username        String?        @unique
  password        String
  role            UserRole
  phone           String?
  image           String?        // NEW: Profile image URL from Cloudinary
  isActive        Boolean        @default(true)
  lastLogin       DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  // ... rest of fields
}
```

#### B. Add `image` field to `Vehicle` model
```prisma
model Vehicle {
  id              String        @id @default(cuid())
  plateNumber     String        @unique
  type            String
  brand           String
  model           String
  status          VehicleStatus @default(ACTIVE)
  image           String?       // NEW: Vehicle image URL from Cloudinary
  mileage         Int           @default(0)
  // ... rest of fields
}
```

### Step 2: Cloudinary Setup

**Why Cloudinary?**
- Free tier with generous limits
- Automatic image optimization and transformations
- CDN delivery for fast loading
- Easy integration with Next.js
- Built-in image resizing and cropping

**Installation:**
```bash
npm install next-cloudinary cloudinary
```

**Environment Variables (.env.local):**

Cloudinary recommends using the `CLOUDINARY_URL` format for server-side operations. However, for client-side image optimization with Next.js, we also need the cloud name separately.

```env
# Server-side: Cloudinary SDK automatically parses this URL
# Format: cloudinary://<api_key>:<api_secret>@<cloud_name>
CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name

# Client-side: Only cloud name (no secrets) for next/image optimization
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

**Why this approach?**
- `CLOUDINARY_URL`: Contains all credentials in one secure variable. The Cloudinary SDK automatically parses it. Never expose this to the client.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Only the cloud name (no secrets) is safe to expose to the client for image optimization with `next/image`.

**Configuration Steps:**
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret from dashboard
3. Construct your `CLOUDINARY_URL`:
   ```
   CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
   ```
   Example: `CLOUDINARY_URL=cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz@drifeicol`
4. Add both environment variables to `.env.local`
5. Create upload preset in Cloudinary dashboard (optional, for signed uploads)

**Implementation Files Needed:**
- `src/lib/cloudinary.ts` - Cloudinary configuration (uses `CLOUDINARY_URL`)
- `src/app/api/upload/route.ts` - API route for server-side uploads (uses `CLOUDINARY_URL`)
- `src/components/ui/image-upload.tsx` - Reusable image upload component
- Update `UserForm.tsx` - Add image upload field
- Update `VehicleForm.tsx` - Add image upload field

### Upload Preset Configuration

**Choose: SIGNED (Recommended for Production)**

**Why Signed?**
- ✅ **Security**: Only authenticated users can upload (prevents unauthorized uploads)
- ✅ **Control**: You can validate files server-side before upload
- ✅ **Production-ready**: Best practice for production applications
- ✅ **Rate limiting**: Can be enforced server-side
- ✅ **File validation**: Check file type, size, etc. before allowing upload

**Why NOT Unsigned?**
- ❌ **Security risk**: Anyone with the preset name can upload (even without authentication)
- ❌ **No validation**: Can't control what gets uploaded
- ❌ **Abuse potential**: Could be used to upload malicious files or spam

**How to Create Signed Preset:**
1. Go to Cloudinary Dashboard → Settings → Upload
2. Click "Add upload preset"
3. **Preset name**: `transport_management_uploads` (or your preferred name)
4. **Signing Mode**: Select **"Signed"** ✅ (Works perfectly in development too!)
5. **Folder**: `transport-management/` 
   - **⚠️ Important**: This is NOT a local folder in your Next.js project!
   - **What it does**: Creates a virtual folder path in Cloudinary's cloud storage
   - **How it works**: 
     - Images are stored in Cloudinary's cloud (not in your `public/` folder)
     - The folder is just a path prefix in Cloudinary: `transport-management/filename.jpg`
     - Example: User image → stored as `transport-management/users/user-123.jpg` in Cloudinary
   - **Why useful**: 
     - Organizes images in Cloudinary dashboard
     - Makes it easier to find/manage images later
     - You can use subfolders: `transport-management/users/` and `transport-management/vehicles/`
   - **Your Next.js `public/` folder**: Not used for Cloudinary uploads - images are in the cloud!
6. **Allowed formats** & **Max file size**: 
   - These settings might not be visible in all Cloudinary dashboards
   - **Don't worry!** We'll validate file types and sizes in our code instead (more secure)
7. **Transformation**: 
   - **Eager transformations**: `w_800,h_800,c_fill,g_auto,q_auto` (auto-resize to 800x800)
   - This creates optimized versions automatically
8. **Click "Save"** ✅

**Important Notes:**
- ✅ **Signed mode works perfectly in development** - Actually better to use it from the start!
- ✅ **File validation will be done in code** - We'll check file type (jpg, png, webp) and size (max 10MB) before upload
- ✅ **Folder is optional but recommended** - Helps organize your images

---

**Example Cloudinary Configuration (`src/lib/cloudinary.ts`):**
```typescript
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary SDK automatically reads CLOUDINARY_URL from environment
// No need to manually parse it!
cloudinary.config({
  // The SDK automatically extracts cloud_name, api_key, api_secret from CLOUDINARY_URL
});

export { cloudinary };

// Helper function to generate signed upload signature
export function generateUploadSignature(params: {
  folder?: string;
  publicId?: string;
  timestamp: number;
}) {
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'transport_management_uploads';
  
  // For signed uploads, we need to generate a signature
  // This will be done in the API route with authentication
  return cloudinary.utils.api_sign_request(
    {
      ...params,
      upload_preset: uploadPreset,
    },
    process.env.CLOUDINARY_API_SECRET || ''
  );
}
```

**For Client-Side Image Display:**
When using `next/image` with Cloudinary, use the public cloud name:
```typescript
// In components
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v1234567890/path/to/image.jpg`;
```

**Environment Variable to Add:**
```env
# Upload preset name (for signed uploads)
CLOUDINARY_UPLOAD_PRESET=transport_management_uploads
```

---

## Driver Portal Features

### Current State
- **Location:** `/driver` (dashboard page)
- **Status:** Placeholder page with minimal content

### Target Features

#### 1. **Upcoming Trips Section**
**Purpose:** Show driver their next 3-5 scheduled trips

**Components:**
- Card list of upcoming trips (PLANNED status)
- Each card shows:
  - Route (Departure → Destination)
  - Date and time
  - Assigned vehicle
  - Number of shipments
  - Quick action buttons: "View Details", "Start Trip"

**Example Layout:**
```
┌─────────────────────────────────────────┐
│  Upcoming Trips (3)                     │
├─────────────────────────────────────────┤
│  🚛 New York → Boston                    │
│  📅 Dec 15, 2024 at 8:00 AM            │
│  🚗 Vehicle: ABC-123                   │
│  📦 5 shipments                          │
│  [Start Trip] [View Details]            │
├─────────────────────────────────────────┤
│  🚛 Boston → Philadelphia               │
│  📅 Dec 16, 2024 at 9:00 AM            │
│  ...                                    │
└─────────────────────────────────────────┘
```

#### 2. **Current Trip Section** (if any)
**Purpose:** Display active trip with status update controls

**Components:**
- Large card showing current trip details
- Status badge (ONGOING)
- Real-time information:
  - Current location (if GPS enabled)
  - Progress indicator
  - Estimated arrival time
- Action buttons:
  - "Update Location"
  - "Mark as Completed"
  - "Report Issue"

**Example Layout:**
```
┌─────────────────────────────────────────┐
│  Current Trip                          │
│  Status: ONGOING 🟢                    │
├─────────────────────────────────────────┤
│  Route: New York → Boston               │
│  Started: Dec 15, 2024 at 8:00 AM     │
│  ETA: Dec 15, 2024 at 2:00 PM         │
│  Progress: ████████░░ 80%              │
│                                         │
│  [Update Location] [Complete Trip]     │
│  [Report Issue]                        │
└─────────────────────────────────────────┘
```

#### 3. **Quick Stats Cards**
**Purpose:** Show driver performance metrics

**Metrics:**
- Total trips this month
- Active trips
- Completed trips this month
- Total distance traveled (km)

#### 4. **Issue Reporting**
**Purpose:** Allow drivers to report problems during trips

**Form Fields:**
- Issue Type (dropdown):
  - Vehicle Breakdown
  - Accident
  - Delay
  - Shipment Problem
  - Other
- Description (textarea)
- Photo upload (optional)
- Submit button

**Implementation:**
- Create `IssueReportForm.tsx` component
- Create server action `reportIssue()` in `src/lib/actions/issue-management.ts`
- Store issues in database (may need new `Issue` model or use existing notification system)

#### 5. **Recent Notifications**
**Purpose:** Show latest 3-5 notifications

**Display:**
- Notification title
- Message preview
- Time ago
- Link to full notification or related entity

---

## Client Portal Features

### Current State
- **Location:** `/client` (dashboard page)
- **Status:** Basic stats cards and shipment request form (partially implemented)

### Target Features

#### 1. **Active Shipments Section**
**Purpose:** Show client their current shipments with tracking info

**Components:**
- List of active shipments (PENDING, ASSIGNED, IN_TRANSIT)
- Each shipment shows:
  - Tracking number
  - Status badge with timeline
  - Pickup → Delivery addresses
  - Assigned trip info (if assigned)
  - Driver contact (if in transit)
  - Estimated delivery time
  - "Track" button

**Example Layout:**
```
┌─────────────────────────────────────────┐
│  Active Shipments (2)                   │
├─────────────────────────────────────────┤
│  📦 SHIP-12345                          │
│  Status: IN_TRANSIT 🔄                  │
│  New York → Boston                      │
│  Driver: John Doe | 📞 +1-234-567-8900 │
│  ETA: Dec 15, 2024 at 2:00 PM         │
│  [Track] [View Details]                │
├─────────────────────────────────────────┤
│  📦 SHIP-12344                          │
│  Status: PENDING ⏳                     │
│  ...                                    │
└─────────────────────────────────────────┘
```

#### 2. **Enhanced Shipment Tracking**
**Purpose:** Detailed tracking view for individual shipments

**Components:**
- Status timeline (visual progress bar):
  - ✅ Pending
  - ✅ Assigned to Trip
  - 🔄 In Transit (current)
  - ⏳ Delivered
- Map view (if GPS enabled) showing:
  - Current vehicle location
  - Route path
  - Pickup and delivery points
- Real-time updates:
  - Last location update
  - Estimated arrival time
  - Driver information

#### 3. **Shipment History**
**Purpose:** View past shipments with filters

**Features:**
- List of all past shipments
- Filters:
  - Status (All, Delivered, Cancelled)
  - Date range picker
  - Search by tracking number
- Export options:
  - Export to PDF
  - Export to Excel/CSV
- Each shipment shows:
  - Tracking number
  - Status
  - Delivery date
  - Total price
  - "View Details" link
  - "Download Invoice" button (future feature)

#### 4. **Quick Stats Cards** (Already Implemented)
- Total Shipments ✅
- Pending ✅
- In Transit ✅
- Delivered ✅

#### 5. **Recent Shipments**
**Purpose:** Show last 5 shipments for quick access

**Display:**
- Compact list with tracking numbers
- Status badges
- Quick links to detail pages

---

## Notifications System

### Overview
Implement a notification center that displays in-app notifications for drivers and clients.

### Components Needed

#### 1. **Notification Bell Icon** (Header Component)
**Location:** `src/components/dashboard/header.tsx` or similar

**Features:**
- Bell icon with unread count badge
- Click opens dropdown with recent notifications
- "Mark as read" functionality
- Link to full notifications page

**Example:**
```
Header: [🔔 3] ← Badge shows unread count

Dropdown:
┌─────────────────────────────────────┐
│  Notifications (3 unread)            │
├─────────────────────────────────────┤
│  🔵 Trip Assigned                   │
│     New trip: NY → Boston           │
│     2 hours ago                      │
│  [Mark as read]                     │
├─────────────────────────────────────┤
│  🔵 Shipment Updated                │
│     SHIP-12345 is now In Transit     │
│     5 hours ago                      │
│  [Mark as read]                     │
├─────────────────────────────────────┤
│  ⚪ Shipment Delivered              │
│     SHIP-12344 has been delivered    │
│     1 day ago                        │
│                                     │
│  [View All Notifications →]          │
└─────────────────────────────────────┘
```

#### 2. **Notifications Page**
**Location:** `/notifications` or `/list/notifications`

**Features:**
- List all notifications (paginated)
- Filter by:
  - All / Unread / Read
  - Type (Trip Update, Shipment, System, etc.)
  - Date range
- Group by date (Today, Yesterday, This Week, Older)
- Actions:
  - Mark as read / unread
  - Mark all as read
  - Delete notification
- Click notification → navigate to related entity

**Example Layout:**
```
┌─────────────────────────────────────┐
│  Notifications                       │
│  [All] [Unread] [Read] [Mark All]  │
├─────────────────────────────────────┤
│  Today                              │
│  🔵 Trip Assigned → [Click to view]│
│  🔵 Shipment Updated → [Click]     │
│                                     │
│  Yesterday                          │
│  ⚪ Shipment Delivered → [Click]   │
│  ...                                │
└─────────────────────────────────────┘
```

#### 3. **Notification Types**
Based on `NotificationType` enum:
- **SYSTEM:** General system notifications
- **TRIP_UPDATE:** Trip status changes, assignments
- **SHIPMENT:** Shipment status updates, assignments
- **PAYMENT:** Payment-related (future)
- **GENERAL:** Other notifications

#### 4. **Server Actions Needed**
- `createNotification()` - Create new notification
- `getNotifications()` - Fetch user's notifications
- `markAsRead()` - Mark notification as read
- `markAllAsRead()` - Mark all as read
- `deleteNotification()` - Delete notification

---

## Implementation Steps

### Phase 1: Image Upload Setup (Prerequisites)
1. ✅ Install Cloudinary packages
2. ✅ Add image fields to Prisma schema (User, Vehicle)
3. ✅ Run migration: `npx prisma migrate dev --name add_image_fields`
4. ✅ Set up Cloudinary configuration
5. ✅ Create image upload API route
6. ✅ Create reusable ImageUpload component
7. ✅ Update UserForm to include image upload
8. ✅ Update VehicleForm to include image upload
9. ✅ Update detail pages to display images

### Phase 2: Driver Portal
1. ✅ Fetch driver's upcoming trips (PLANNED status)
2. ✅ Fetch driver's current trip (ONGOING status)
3. ✅ Create upcoming trips card component
4. ✅ Create current trip card component
5. ✅ Add status update buttons (Start Trip, Complete Trip)
6. ✅ Create issue reporting form
7. ✅ Add quick stats cards
8. ✅ Add recent notifications section
9. ✅ Update driver dashboard layout

### Phase 3: Client Portal
1. ✅ Fetch client's active shipments
2. ✅ Create active shipments list component
3. ✅ Enhance shipment tracking view
4. ✅ Create shipment history page with filters
5. ✅ Add export functionality (PDF/CSV)
6. ✅ Update client dashboard layout

### Phase 4: Notifications System
1. ✅ Create notification bell component (header)
2. ✅ Create notifications dropdown
3. ✅ Create notifications page
4. ✅ Implement notification server actions
5. ✅ Add notification creation triggers:
   - When trip is assigned to driver
   - When shipment status changes
   - When trip status changes
6. ✅ Add real-time updates (optional, using polling or WebSockets)

---

## Database Schema Updates

### Migration: Add Image Fields

**File:** `prisma/migrations/YYYYMMDDHHMMSS_add_image_fields/migration.sql`

```sql
-- Add image field to User table
ALTER TABLE "User" ADD COLUMN "image" TEXT;

-- Add image field to Vehicle table
ALTER TABLE "Vehicle" ADD COLUMN "image" TEXT;
```

**Prisma Schema Changes:**
```prisma
model User {
  // ... existing fields
  image           String?        // Profile image URL
  // ... rest of fields
}

model Vehicle {
  // ... existing fields
  image           String?        // Vehicle image URL
  // ... rest of fields
}
```

---

## File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── driver/
│   │   │   └── page.tsx                    # Driver dashboard (enhanced)
│   │   ├── client/
│   │   │   └── page.tsx                    # Client dashboard (enhanced)
│   │   └── notifications/
│   │       └── page.tsx                    # Notifications page
│   └── api/
│       ├── upload/
│       │   └── route.ts                    # Cloudinary upload endpoint
│       └── notifications/
│           └── route.ts                    # Notification API endpoints
├── components/
│   ├── driver/
│   │   ├── UpcomingTripsCard.tsx           # Upcoming trips list
│   │   ├── CurrentTripCard.tsx             # Active trip display
│   │   └── IssueReportForm.tsx             # Issue reporting form
│   ├── client/
│   │   ├── ActiveShipmentsList.tsx         # Active shipments
│   │   ├── ShipmentTrackingView.tsx        # Enhanced tracking
│   │   └── ShipmentHistory.tsx             # History with filters
│   ├── notifications/
│   │   ├── NotificationBell.tsx            # Bell icon component
│   │   ├── NotificationDropdown.tsx        # Dropdown menu
│   │   └── NotificationItem.tsx            # Single notification item
│   └── ui/
│       └── image-upload.tsx                 # Reusable image upload
└── lib/
    ├── cloudinary.ts                        # Cloudinary config
    └── actions/
        ├── notification-management.ts       # Notification CRUD
        └── issue-management.ts              # Issue reporting
```

---

## API Endpoints Needed

### Image Upload
- `POST /api/upload` - Upload image to Cloudinary
  - Body: FormData with image file
  - Returns: `{ url: string }` - Cloudinary image URL

### Notifications
- `GET /api/notifications` - Get user's notifications
  - Query params: `status?`, `type?`, `page?`
  - Returns: `{ notifications: Notification[], total: number }`
- `PATCH /api/notifications/[id]` - Mark as read/unread
- `DELETE /api/notifications/[id]` - Delete notification
- `POST /api/notifications/mark-all-read` - Mark all as read

---

## Notification Triggers

### When to Create Notifications

1. **Trip Assigned to Driver:**
   - Type: `TRIP_UPDATE`
   - Title: "New Trip Assigned"
   - Message: "You have been assigned a trip from {departure} to {destination}"
   - Link: `/list/trips/{tripId}`

2. **Trip Status Changed:**
   - Type: `TRIP_UPDATE`
   - Title: "Trip Status Updated"
   - Message: "Trip {tripId} status changed to {status}"
   - Link: `/list/trips/{tripId}`

3. **Shipment Assigned to Trip:**
   - Type: `SHIPMENT`
   - Title: "Shipment Assigned"
   - Message: "Your shipment {trackingNumber} has been assigned to a trip"
   - Link: `/list/shipments/{shipmentId}`

4. **Shipment Status Changed:**
   - Type: `SHIPMENT`
   - Title: "Shipment Status Updated"
   - Message: "Shipment {trackingNumber} is now {status}"
   - Link: `/list/shipments/{shipmentId}`

5. **Shipment Delivered:**
   - Type: `SHIPMENT`
   - Title: "Shipment Delivered"
   - Message: "Your shipment {trackingNumber} has been delivered"
   - Link: `/list/shipments/{shipmentId}`

---

## Testing Checklist

### Driver Portal
- [ ] Upcoming trips display correctly
- [ ] Current trip shows when driver has active trip
- [ ] "Start Trip" button changes status to ONGOING
- [ ] "Complete Trip" button changes status to COMPLETED
- [ ] Issue reporting form submits successfully
- [ ] Stats cards show correct data
- [ ] Notifications appear in recent section

### Client Portal
- [ ] Active shipments list displays correctly
- [ ] Shipment tracking shows correct status timeline
- [ ] Shipment history filters work
- [ ] Export functionality works (PDF/CSV)
- [ ] Stats cards show correct data
- [ ] Request shipment form works (already implemented)

### Notifications
- [ ] Bell icon shows unread count
- [ ] Dropdown displays recent notifications
- [ ] Mark as read works
- [ ] Notifications page displays all notifications
- [ ] Filters work correctly
- [ ] Clicking notification navigates to related entity
- [ ] Notifications created on relevant events

### Image Upload
- [ ] User can upload profile image
- [ ] Vehicle can upload image
- [ ] Images display in detail pages
- [ ] Images display in list tables (avatars)
- [ ] Image validation works (file type, size)
- [ ] Image deletion works (remove from Cloudinary)

---

## Next Steps

1. **Start with Image Upload Setup:**
   - Install Cloudinary
   - Update Prisma schema
   - Create migration
   - Set up upload components

2. **Then Implement Driver Portal:**
   - Build upcoming trips section
   - Add status update functionality
   - Create issue reporting

3. **Enhance Client Portal:**
   - Improve active shipments display
   - Add shipment history page

4. **Finally, Notifications:**
   - Build notification center
   - Add notification triggers
   - Test notification flow

---

## Notes

- **Image Storage:** Cloudinary provides free tier with 25GB storage and 25GB bandwidth/month
- **Notification Real-time:** For MVP, use polling (refresh every 30 seconds). For production, consider WebSockets or Server-Sent Events
- **Issue Reporting:** Can be stored as notifications with type "ISSUE" or create separate Issue model
- **Export Functionality:** Use libraries like `jspdf` for PDF and `xlsx` for Excel exports

---

*Last Updated: [Current Date]*

