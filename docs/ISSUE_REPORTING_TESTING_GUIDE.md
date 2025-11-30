# Issue Reporting Testing Guide

This guide will help you test the complete issue reporting functionality that was just implemented.

## Prerequisites

1. **Database Setup**: Ensure the database is synced (already done with `prisma db push`)
2. **User Accounts**: You need at least:
   - One **Admin** user
   - One **Driver** user (with assigned trips)
   - At least one **Trip** assigned to the driver (can be PLANNED or ONGOING status)

## Testing Checklist

### Part 1: Driver Portal - Reporting Issues

#### Test 1: Access Issue Report Form
1. **Login as a Driver**
   - Navigate to `/driver` (driver dashboard)
   - You should see the "Report Issue" card on the dashboard

2. **Verify Form Visibility**
   - If driver has an active trip (ONGOING or next PLANNED), the form should be visible
   - If no active trip, you should see: "No active trip to report issues for"

#### Test 2: Report an Issue (Basic Flow)
1. **Fill out the form:**
   - **Issue Type**: Select one (e.g., "Vehicle Breakdown")
   - **Severity**: Select one (e.g., "High")
   - **Description**: Enter a description (e.g., "Engine overheating during trip")

2. **Submit the issue:**
   - Click "Submit Report"
   - You should see a success toast: "Issue reported successfully"
   - Form should reset (fields cleared)

3. **Verify in Database:**
   - Check the database `Issue` table
   - The issue should be created with:
     - `status = "OPEN"`
     - `type = "VEHICLE_BREAKDOWN"` (or your selected type)
     - `severity = "HIGH"` (or your selected severity)
     - `description` matching what you entered
     - `tripId` matching the current trip
     - `driverId` matching the logged-in driver

#### Test 3: Report Different Issue Types
Test each issue type:
- ✅ Vehicle Breakdown
- ✅ Accident
- ✅ Delay
- ✅ Shipment Problem
- ✅ Other

#### Test 4: Report Different Severities
Test each severity level:
- ✅ Low
- ✅ Normal
- ✅ High
- ✅ Urgent

#### Test 5: Validation
1. **Empty Description:**
   - Try submitting with empty description
   - Should show error: "Please provide trip and issue details"
   - Submit button should be disabled

2. **No Active Trip:**
   - If driver has no active trip, form should show disabled state
   - Should display: "No active trip to report issues for"

#### Test 6: Issue Report from Trip Detail Page
1. **Navigate to Trip Detail:**
   - Go to `/list/trips/[tripId]` (where tripId is a trip assigned to the driver)
   - You should see the "Report Issue" form on the trip detail page

2. **Report Issue:**
   - Fill out and submit an issue
   - Verify it's created correctly

---

### Part 2: Admin Portal - Viewing and Managing Issues

#### Test 7: Access Issues Page
1. **Login as Admin**
   - Navigate to `/list/issues`
   - You should see the Issues Management page

2. **Verify Page Elements:**
   - ✅ Page title: "Issue Management"
   - ✅ Stats cards at the top (Total, Open, In Progress, Resolved)
   - ✅ Search bar
   - ✅ Issues table with columns

#### Test 8: View Issues List
1. **Check Stats Cards:**
   - Total Issues should match the count of issues in database
   - Open Issues should show count of issues with status "OPEN"
   - In Progress should show count of issues with status "IN_PROGRESS"
   - Resolved should show count of issues with status "RESOLVED"

2. **Verify Table Display:**
   - Each row should show:
     - Issue Type (with icon)
     - Severity badge (color-coded)
     - Status badge (color-coded)
     - Description (truncated if long)
     - Trip route (departure → destination, clickable link)
     - Driver name and email
     - Reported date/time
     - Actions dropdown

#### Test 9: Search Functionality
1. **Search by Description:**
   - Enter part of an issue description in search bar
   - Table should filter to show matching issues

2. **Search by Trip Route:**
   - Enter a departure or destination city name
   - Should filter issues for trips matching that route

3. **Search by Driver:**
   - Enter driver name or email
   - Should filter issues for that driver

#### Test 10: Filter by Type
1. **Select Issue Type Filter:**
   - Use the "Type" dropdown in table header
   - Select "Vehicle Breakdown"
   - Table should show only Vehicle Breakdown issues

2. **Test Other Types:**
   - Test each type filter (Accident, Delay, Shipment Problem, Other)
   - Verify correct filtering

#### Test 11: Filter by Severity
1. **Select Severity Filter:**
   - Use the "Severity" dropdown
   - Select "High"
   - Table should show only High severity issues

2. **Test Other Severities:**
   - Test Low, Normal, High, Urgent
   - Verify correct filtering

#### Test 12: Filter by Status
1. **Select Status Filter:**
   - Use the "Status" dropdown
   - Select "Open"
   - Table should show only Open issues

2. **Test Other Statuses:**
   - Test Open, In Progress, Resolved, Closed
   - Verify correct filtering

#### Test 13: Update Issue Status - Open → In Progress
1. **Open Actions Menu:**
   - Click the three dots (⋯) on an Open issue
   - Select "Mark as In Progress"

2. **Verify:**
   - Success toast: "Issue marked as IN_PROGRESS"
   - Page should reload
   - Issue status badge should change to "IN_PROGRESS"
   - Stats cards should update (Open count decreases, In Progress increases)

#### Test 14: Update Issue Status - In Progress → Resolved
1. **Open Actions Menu:**
   - Click the three dots on an In Progress issue
   - Select "Mark as Resolved"

2. **Resolution Dialog:**
   - Dialog should open asking for resolution notes
   - Enter resolution (e.g., "Replaced engine coolant, issue resolved")
   - Click "Confirm"

3. **Verify:**
   - Success toast: "Issue marked as RESOLVED"
   - Dialog closes
   - Issue status changes to "RESOLVED"
   - `resolvedAt` timestamp should be set in database
   - Resolution notes should be saved

#### Test 15: Update Issue Status - Resolved → Closed
1. **Open Actions Menu:**
   - Click the three dots on a Resolved issue
   - Select "Close Issue"

2. **Verify:**
   - Success toast: "Issue marked as CLOSED"
   - Issue status changes to "CLOSED"
   - Stats cards update

#### Test 16: Reopen Closed Issue
1. **Open Actions Menu:**
   - Click the three dots on a Closed issue
   - Select "Reopen Issue"

2. **Verify:**
   - Success toast: "Issue marked as OPEN"
   - Issue status changes back to "OPEN"
   - Resolution notes should be cleared (or kept, depending on implementation)

#### Test 17: Pagination
1. **Create Multiple Issues:**
   - Report more than 10 issues (or whatever ITEMS_PER_PAGE is set to)

2. **Test Pagination:**
   - Navigate to page 2
   - Verify different issues are shown
   - Test page navigation controls

#### Test 18: Click Trip Link
1. **Click Trip Route:**
   - Click on the trip route link (departure → destination) in any issue row
   - Should navigate to `/list/trips/[tripId]`
   - Should show the trip detail page

---

### Part 3: Integration Testing

#### Test 19: End-to-End Flow
1. **Driver reports issue:**
   - Login as driver
   - Report an issue with type "Accident", severity "URGENT"

2. **Admin views issue:**
   - Login as admin
   - Navigate to `/list/issues`
   - Issue should appear in the list
   - Stats should update (Total +1, Open +1)

3. **Admin updates status:**
   - Mark as "In Progress"
   - Add resolution notes
   - Mark as "Resolved"

4. **Verify final state:**
   - Issue should show as "RESOLVED"
   - Resolution notes should be visible
   - Stats should reflect resolved count

#### Test 20: Multiple Issues from Same Trip
1. **Report multiple issues for same trip:**
   - As driver, report 2-3 different issues for the same trip

2. **Verify in admin panel:**
   - All issues should appear
   - All should link to the same trip
   - All should show the same driver

#### Test 21: Issues from Different Drivers
1. **Report issues from different drivers:**
   - Login as different drivers
   - Each reports an issue

2. **Verify in admin panel:**
   - All issues should appear
   - Each should show correct driver information
   - Filter by driver name should work

---

## Expected Database State

After testing, your `Issue` table should have records like:

```sql
SELECT 
  id,
  type,
  severity,
  status,
  description,
  "tripId",
  "driverId",
  "createdAt",
  "resolvedAt",
  resolution
FROM "Issue"
ORDER BY "createdAt" DESC;
```

## Common Issues & Troubleshooting

### Issue: "No active trip to report issues for"
**Solution:** 
- Ensure driver has at least one trip assigned
- Trip should be in PLANNED or ONGOING status
- Check that `driverId` in Trip matches the driver's profile

### Issue: "You can only report issues for your own trips"
**Solution:**
- Driver can only report issues for trips assigned to them
- Verify trip assignment in database

### Issue: Stats cards show incorrect counts
**Solution:**
- Check that filters are not applied
- Verify database queries in `src/app/(dashboard)/list/issues/page.tsx`

### Issue: Status update not working
**Solution:**
- Check browser console for errors
- Verify server action `updateIssueStatus` is being called
- Check database permissions

### Issue: Resolution dialog not appearing
**Solution:**
- Check that dialog state is managed correctly
- Verify `IssueActions` component is rendering

---

## Test Data Examples

### Sample Issue Reports:

1. **Vehicle Breakdown (High Severity)**
   - Type: Vehicle Breakdown
   - Severity: High
   - Description: "Engine started overheating 30 minutes into the trip. Temperature gauge showing 220°F. Pulled over immediately."

2. **Delay (Normal Severity)**
   - Type: Delay
   - Severity: Normal
   - Description: "Traffic jam on highway due to accident. Estimated delay: 45 minutes."

3. **Shipment Problem (Urgent Severity)**
   - Type: Shipment Problem
   - Severity: Urgent
   - Description: "One shipment package appears damaged. Client needs to be notified immediately."

4. **Accident (Urgent Severity)**
   - Type: Accident
   - Severity: Urgent
   - Description: "Minor collision with another vehicle. No injuries, but vehicle damage to front bumper."

---

## Success Criteria

✅ Drivers can report issues from dashboard and trip detail pages
✅ Issues are saved to database with correct data
✅ Admin can view all issues in a table
✅ Admin can filter issues by type, severity, and status
✅ Admin can search issues by description, trip route, or driver
✅ Admin can update issue status through workflow
✅ Resolution notes can be added when resolving/closing issues
✅ Stats cards accurately reflect issue counts
✅ Navigation links work correctly
✅ All validation works as expected

---

## Next Steps After Testing

Once all tests pass:
1. ✅ Issue reporting is fully functional
2. ✅ Milestone 6 is complete
3. 🎯 Ready to move to Milestone 7 (Notifications & Emails)

---

## Quick Test Script

For a quick smoke test, run through these 5 steps:

1. **Driver Login** → Report one issue → ✅ Success
2. **Admin Login** → Go to `/list/issues` → ✅ Issue appears
3. **Admin** → Filter by "Open" → ✅ Only open issues shown
4. **Admin** → Mark issue as "In Progress" → ✅ Status updates
5. **Admin** → Mark as "Resolved" (add notes) → ✅ Issue resolved

If all 5 steps work, the core functionality is operational! 🎉

