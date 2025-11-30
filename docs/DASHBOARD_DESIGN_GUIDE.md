# Transport Management System - Admin Dashboard Design Guide

## Design Inspiration & Layout Structure

### Typical TMS Admin Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo | Search | Notifications | User Profile      │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                   │
│ Sidebar  │  Main Content Area                               │
│          │                                                   │
│ • Users  │  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│ • Vehicles│ │ Stats   │ │ Stats   │ │ Stats   │          │
│ • Trips  │  │ Card    │ │ Card    │ │ Card    │          │
│ • Shipments│ └─────────┘ └─────────┘ └─────────┘          │
│ • Expenses│                                                   │
│ • Reports │  ┌─────────────────────────────────────┐        │
│ • Settings│  │  Data Table / List View             │        │
│           │  │  (Users, Vehicles, Trips, etc.)      │        │
│           │  └─────────────────────────────────────┘        │
└──────────┴──────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. **Header/Navigation Bar**
- **Left:** Logo + App Name
- **Center:** Global search bar
- **Right:** Notifications bell + User profile dropdown (UserButton from Clerk)
- **Height:** ~64px
- **Background:** White with subtle border-bottom

### 2. **Sidebar Navigation**
- **Width:** ~240px (collapsible to ~64px)
- **Items:** Icon + Label
- **Active state:** Highlighted background + left border
- **Groups:** 
  - Main (Users, Vehicles, Trips, Shipments)
  - Secondary (Expenses, Reports)
  - Settings (Settings, Profile)

### 3. **Main Content Area**
- **Stats Cards (Top Row):**
  - Total Users, Active Vehicles, Pending Shipments, Monthly Revenue
  - Each card: Icon + Number + Label + Trend indicator
- **Data Tables:**
  - Search/Filter bar at top
  - Sortable columns
  - Pagination at bottom
  - Action buttons (Edit, Delete, View Details)

### 4. **Color Scheme**
- **Primary:** Dark gray/black (#1a1a1a) for buttons and accents
- **Background:** Light gray (#f8f9fa) for page background
- **Cards:** White (#ffffff) with subtle shadow
- **Borders:** Light gray (#e5e7eb)
- **Status Colors:**
  - Active: Green
  - Pending: Yellow/Orange
  - Inactive: Gray
  - Error: Red

## shadcn/ui Components to Install

### Essential Components (Install First):
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add separator
```

### Layout Components:
```bash
npx shadcn@latest add sheet  # For mobile sidebar
npx shadcn@latest add tabs   # For tabbed views
npx shadcn@latest add sidebar # For main navigation (if available)
```

### Form Components:
```bash
npx shadcn@latest add form
npx shadcn@latest add label
npx shadcn@latest add textarea
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
```

### Feedback Components:
```bash
npx shadcn@latest add toast      # For notifications
npx shadcn@latest add alert      # For error/success messages
npx shadcn@latest add skeleton   # For loading states
```

## Dashboard Sections

### 1. **Users Management Page** (`/admin/users`)
- **Stats Cards:**
  - Total Users
  - Active Users
  - New Users (This Month)
  - Pending Invitations
- **Table Columns:**
  - Name, Email, Role, Status, Created Date, Actions
- **Actions:**
  - Invite User (button)
  - Assign Role (button)
  - Edit, Deactivate, Delete (dropdown per row)

### 2. **Vehicles Management Page** (`/admin/vehicles`)
- **Stats Cards:**
  - Total Vehicles
  - Active Vehicles
  - In Maintenance
  - Available Now
- **Table Columns:**
  - Plate Number, Type, Brand, Model, Status, Last Service, Actions
- **Actions:**
  - Add Vehicle (button)
  - Edit, Change Status, View History (dropdown per row)

### 3. **Trips Management Page** (`/admin/trips`)
- **Stats Cards:**
  - Total Trips
  - Ongoing Trips
  - Completed (This Month)
  - Cancelled
- **Table Columns:**
  - Trip ID, Driver, Vehicle, Route, Status, Date, Actions
- **Actions:**
  - Create Trip (button)
  - View Details, Update Status, Cancel (dropdown per row)

### 4. **Shipments Management Page** (`/admin/shipments`)
- **Stats Cards:**
  - Total Shipments
  - Pending
  - In Transit
  - Delivered (This Month)
- **Table Columns:**
  - Tracking #, Client, Description, Status, Pickup Date, Delivery Date, Actions
- **Actions:**
  - Create Shipment (button)
  - Assign to Trip, Update Status, View Details (dropdown per row)

## Design References

### Similar Dashboards to Study:
1. **Fleet Management Systems** (Fleetio, Samsara)
   - Vehicle tracking, driver management, trip logs
2. **Logistics Platforms** (Flexport, ShipBob)
   - Shipment tracking, status management
3. **Admin Templates:**
   - shadcn/ui examples
   - Tailwind Admin templates
   - Vercel dashboard examples

### Key UI Patterns:
- **Cards with Stats:** Large number, small label, trend indicator
- **Data Tables:** Sortable, filterable, paginated
- **Action Buttons:** Primary (create), Secondary (edit), Destructive (delete)
- **Status Badges:** Color-coded (green/yellow/red/gray)
- **Empty States:** Friendly message when no data
- **Loading States:** Skeleton loaders

## Implementation Order

1. **Install shadcn components** (start with essential ones)
2. **Create Dashboard Layout** (Header + Sidebar + Main content)
3. **Build Stats Cards** component (reusable)
4. **Build Data Table** component (reusable with sorting/filtering)
5. **Create Users Management page** (first CRUD page)
6. **Replicate pattern** for other entities (Vehicles, Trips, etc.)

## Next Steps

1. Run the shadcn install commands above
2. Create the dashboard layout structure
3. Build reusable components (StatsCard, DataTable)
4. Start with Users Management page as the first CRUD implementation

