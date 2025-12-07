# User Guide - Transport Management System

A comprehensive guide for using the Transport Management System.

---

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Admin Guide](#admin-guide)
3. [Driver Guide](#driver-guide)
4. [Client Guide](#client-guide)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### First Time Login

1. **Sign In:**
   - Go to the sign-in page
   - Enter your email and password
   - If you received a temporary password, you'll be prompted to change it

2. **Complete Profile:**
   - If you're a driver, ensure your profile is complete
   - If you're a client, ensure your company information is set

3. **Explore Dashboard:**
   - Each role has a customized dashboard
   - Check notifications for important updates

---

## 👨‍💼 Admin Guide

### Dashboard Overview

The admin dashboard provides:
- **Stats Cards:** Total users, active vehicles, pending shipments, monthly revenue
- **Recent Activity:** Latest trips and shipments
- **Quick Actions:** Common tasks (create trip, shipment, etc.)
- **Open Issues:** Issues requiring attention
- **Upcoming Trips:** Next scheduled trips

### Managing Users

1. **View Users:**
   - Go to **Users** in sidebar
   - View all registered users
   - Search and filter by role

2. **Create User:**
   - Click "Create User" button
   - Fill in user details
   - Assign role (Admin, Driver, or Client)
   - User will receive email with temporary password

3. **Edit User:**
   - Click "Actions" (three dots) on user row
   - Select "Edit"
   - Update information and save

4. **Assign Role:**
   - Use "Assign Role" form
   - Enter user email or username
   - Select new role
   - System will create appropriate profile

### Managing Trips

1. **Create Trip:**
   - Go to **Trips** → Click "Create Trip"
   - Use the trip creation wizard:
     - Step 1: Select driver and vehicle
     - Step 2: Enter route details (departure, destination)
     - Step 3: Set dates and duration
     - Step 4: Add cost and notes
   - Driver will be notified automatically

2. **Update Trip Status:**
   - Go to trip detail page
   - Click "Update Status"
   - Select new status (Planned → Ongoing → Completed)
   - Driver and admin will be notified

3. **Assign Shipments to Trip:**
   - Go to trip detail page
   - Click "Assign Shipments"
   - Select shipments to assign
   - Clients will be notified

### Managing Shipments

1. **Create Shipment:**
   - Go to **Shipments** → Click "Create Shipment"
   - Select client
   - Enter shipment details
   - Set price and addresses
   - Client will be notified

2. **Assign to Trip:**
   - Go to shipment detail page
   - Click "Assign to Trip"
   - Select trip
   - Client will be notified

3. **Update Status:**
   - Go to shipment detail page
   - Click "Update Status"
   - Select new status
   - Client will be notified

### Managing Vehicles

1. **Add Vehicle:**
   - Go to **Vehicles** → Click "Create Vehicle"
   - Enter vehicle details
   - Upload vehicle image
   - Set initial status

2. **Change Status:**
   - Go to vehicle detail page
   - Click "Change Status"
   - Select new status (Active, In Maintenance, Inactive)

### Managing Issues

1. **View Issues:**
   - Go to **Issues** in sidebar
   - Filter by status, severity, or type
   - View issue details

2. **Resolve Issue:**
   - Open issue detail page
   - Click "Update Status"
   - Select "Resolved" or "Closed"
   - Add resolution notes
   - Driver will be notified

---

## 🚗 Driver Guide

### Dashboard Overview

The driver dashboard shows:
- **Stats:** Total trips, active trips, completed trips, trips this month
- **Current Trip:** Your active trip (if any) or next planned trip
- **Upcoming Trips:** Your next scheduled trips
- **Recent Notifications:** Latest updates
- **Issue Reporting:** Report issues for current trip

### Managing Trips

1. **View Your Trips:**
   - Go to **Trips** in sidebar
   - View all your assigned trips
   - Filter by status

2. **Start Trip:**
   - On dashboard, find your planned trip
   - Click "Start Trip" button
   - Trip status changes to "Ongoing"
   - Admin will be notified

3. **Complete Trip:**
   - On dashboard, find your ongoing trip
   - Click "Complete Trip" button
   - Trip status changes to "Completed"
   - Admin will be notified

4. **Cancel Trip:**
   - Click "Cancel" button on trip card
   - Confirm cancellation
   - Admin will be notified

### Reporting Issues

1. **Report Issue:**
   - On dashboard, find "Report Issue" section
   - Select issue type (Vehicle Breakdown, Accident, Delay, etc.)
   - Select severity (Low, Normal, High, Urgent)
   - Enter description
   - Submit
   - Admin will be notified immediately

2. **View Issue Status:**
   - Go to trip detail page
   - View reported issues
   - See resolution when admin resolves

### Notifications

- **Bell Icon:** Click to see recent notifications
- **Notification Page:** View all notifications
- **Mark as Read:** Click notification or use "Mark as read" button
- **Navigate:** Click notification to go to related page

---

## 📦 Client Guide

### Dashboard Overview

The client dashboard shows:
- **Stats:** Total shipments, active shipments, delivered, shipments this month
- **Active Shipments:** Shipments in progress
- **Recent Shipments:** Latest shipment history
- **Recent Notifications:** Latest updates

### Requesting Shipments

1. **Request Shipment:**
   - On dashboard, click "Request Shipment" button
   - Fill in shipment form:
     - Description
     - Pickup address
     - Delivery address
     - Weight and volume (optional)
     - Priority level
     - Pickup date (optional)
   - Submit request
   - You'll receive confirmation notification

2. **Track Shipment:**
   - Go to **Shipments** in sidebar
   - View all your shipments
   - Click on shipment to see details
   - Track status updates

### Viewing Shipment History

1. **Recent Shipments:**
   - View on dashboard
   - Shows last 10 shipments

2. **All Shipments:**
   - Go to **Shipments** page
   - Filter by status
   - Search by tracking number

### Notifications

- You'll receive notifications for:
  - Shipment request received
  - Shipment assigned to trip
  - Shipment status updates
  - Shipment delivered

---

## 🔧 Common Tasks

### Changing Password

1. Click your profile icon (top right)
2. Select "Account Settings" or "Change Password"
3. Enter current password
4. Enter new password
5. Confirm new password
6. Save

### Viewing Notifications

1. **From Bell Icon:**
   - Click bell icon in header
   - See recent notifications
   - Click to view full details

2. **From Notifications Page:**
   - Click "Notifications" in sidebar
   - View all notifications
   - Filter by status or type
   - Mark as read or delete

### Searching

- **Global Search:** Use search bar in header
- **Table Search:** Use search box in list pages
- **Filters:** Use column filters in tables

### Viewing Details

- Click "View" button in any table
- Or click on the row (if clickable)
- See complete information
- Access related entities via quick links

---

## 🐛 Troubleshooting

### Can't Sign In

- **Check credentials:** Ensure email/password are correct
- **Reset password:** Use "Forgot Password" link
- **Contact admin:** If account is locked

### Notifications Not Showing

- **Refresh page:** Sometimes notifications need refresh
- **Check filters:** Ensure you're not filtering them out
- **Check bell icon:** Unread count should show

### Can't Update Trip Status

- **Check permissions:** Ensure you're the assigned driver
- **Check current status:** Some transitions aren't allowed
- **Contact admin:** If issue persists

### Image Not Uploading

- **Check file size:** Must be under 5MB
- **Check file type:** Must be JPG, PNG, or WebP
- **Check internet:** Ensure stable connection

### Page Not Loading

- **Refresh page:** Press F5 or Cmd+R
- **Clear cache:** Clear browser cache
- **Check internet:** Ensure stable connection
- **Contact support:** If issue persists

---

## 📞 Support

For additional help:
- Check documentation in `/docs` folder
- Contact your system administrator
- Review FAQ section (if available)

---

**Last Updated:** [Date]
**Version:** 1.0.0

