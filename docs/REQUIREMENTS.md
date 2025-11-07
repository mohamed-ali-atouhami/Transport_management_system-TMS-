# Transport Management System - Requirements Document

## Document Information
- **Project Name:** Transport Management System
- **Version:** 1.0
- **Date:** 2024
- **Status:** Initial Requirements

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Objectives](#system-objectives)
3. [Stakeholders](#stakeholders)
4. [Functional Requirements](#functional-requirements)
5. [Non-Functional Requirements](#non-functional-requirements)
6. [Data Models](#data-models)
7. [Use Case Specifications](#use-case-specifications)
8. [User Interface Requirements](#user-interface-requirements)
9. [Security Requirements](#security-requirements)
10. [Technical Requirements](#technical-requirements)
11. [Future Enhancements](#future-enhancements)

---

## 1. Project Overview

### 1.1 Purpose
The Transport Management System is a comprehensive solution designed to manage transportation operations, including vehicle fleet management, driver scheduling, trip planning, shipment tracking, and expense management. The system facilitates efficient coordination between administrators, drivers, and clients.

### 1.2 Scope
The system covers:
- User management (Admin, Driver, Client)
- Vehicle fleet management and maintenance tracking
- Trip planning and execution
- Shipment management and tracking
- Expense tracking and reporting
- Notification system
- Reporting and analytics

---

## 2. System Objectives

### 2.1 Primary Objectives
- **Efficiency:** Streamline transportation operations and reduce manual paperwork
- **Visibility:** Provide real-time tracking of vehicles, trips, and shipments
- **Cost Control:** Track and manage expenses effectively
- **Customer Service:** Enable clients to track shipments and receive notifications
- **Compliance:** Maintain records of vehicle maintenance and driver credentials

### 2.2 Success Criteria
- Reduce trip planning time by 50%
- Improve on-time delivery rate to 95%+
- Reduce paperwork by 80%
- Client satisfaction score above 4.5/5
- Real-time visibility into all active trips

---

## 3. Stakeholders

### 3.1 Primary Users
- **Admin:** System administrators managing all operations
- **Driver:** Vehicle operators executing trips
- **Client:** Customers requesting and tracking shipments

### 3.2 Secondary Stakeholders
- Fleet managers
- Accountants/Finance team
- Customer service representatives
- IT administrators

---

## 4. Functional Requirements

### 4.1 Admin Requirements

#### FR-ADM-001: User Management
- **Description:** Admin can create, view, update, and deactivate user accounts
- **Details:**
  - Create new users (Admin, Driver, Client)
  - View list of all users with filtering and search
  - Update user information (name, email, phone, role)
  - Activate/Deactivate user accounts
  - Reset user passwords
  - View user activity logs
- **Priority:** High

#### FR-ADM-002: Vehicle Management
- **Description:** Admin can manage vehicle fleet
- **Details:**
  - Add new vehicles with complete details (plate number, type, brand, model)
  - View all vehicles with status filter
  - Update vehicle information
  - Change vehicle status (active, in_maintenance, inactive)
  - View vehicle history (trips, maintenance records)
  - Track vehicle mileage and service dates
- **Priority:** High

#### FR-ADM-003: Driver Management
- **Description:** Admin can manage driver profiles
- **Details:**
  - Create driver profiles linked to user accounts
  - Manage driver license numbers and experience
  - Set driver status (active, inactive, suspended)
  - Assign drivers to vehicles
  - View driver performance metrics
  - Track driver schedules and availability
- **Priority:** High

#### FR-ADM-004: Trip Management
- **Description:** Admin can create and manage trips
- **Details:**
  - Create new trips with driver and vehicle assignment
  - Set departure and destination locations
  - Schedule trip dates (start and end)
  - Update trip status (planned, ongoing, completed, cancelled)
  - View all trips with filtering (status, date range, driver)
  - Cancel or modify trips
  - Assign multiple shipments to a trip
- **Priority:** High

#### FR-ADM-005: Expense Management
- **Description:** Admin can manage and track expenses
- **Details:**
  - Add expenses related to trips (fuel, toll, repair, other)
  - Add general expenses (vehicle maintenance, office expenses)
  - Categorize expenses by type
  - View expense reports with filtering
  - Export expense data for accounting
  - Link expenses to specific trips or vehicles
- **Priority:** Medium

#### FR-ADM-006: Reports and Analytics
- **Description:** Admin can generate comprehensive reports
- **Details:**
  - Trip reports (completed, ongoing, cancelled)
  - Revenue reports by client, date range, trip
  - Expense reports by category, vehicle, trip
  - Vehicle utilization reports
  - Driver performance reports
  - Client activity reports
  - Export reports to PDF/Excel
- **Priority:** Medium

#### FR-ADM-007: Shipment Management
- **Description:** Admin can manage shipments
- **Details:**
  - Create shipments linked to trips and clients
  - Assign shipments to trips
  - Update shipment status
  - Track shipment delivery progress
  - View all shipments with filtering
  - Generate shipping documents
- **Priority:** High

#### FR-ADM-008: Maintenance Management
- **Description:** Admin can manage vehicle maintenance
- **Details:**
  - Schedule maintenance for vehicles
  - Record maintenance history (service, repair, inspection)
  - Track maintenance costs
  - Set maintenance reminders
  - View maintenance calendar
- **Priority:** Medium

### 4.2 Driver Requirements

#### FR-DRV-001: View Assigned Trips
- **Description:** Driver can view trips assigned to them
- **Details:**
  - View list of upcoming trips
  - View trip details (route, shipments, client information)
  - Filter trips by status (planned, ongoing)
  - View trip schedule calendar
  - Receive notifications for new trip assignments
- **Priority:** High

#### FR-DRV-002: Update Trip Status
- **Description:** Driver can update the status of their trips
- **Details:**
  - Mark trip as started
  - Update trip progress (location updates optional)
  - Mark trip as completed
  - Report delays or issues
  - Update estimated arrival time
- **Priority:** High

#### FR-DRV-003: Report Issues
- **Description:** Driver can report problems during trips
- **Details:**
  - Report vehicle breakdowns
  - Report accidents or incidents
  - Report delays
  - Report shipment issues
  - Attach photos or documents if needed
- **Priority:** Medium

#### FR-DRV-004: Submit Expenses
- **Description:** Driver can submit expense claims
- **Details:**
  - Submit fuel expenses
  - Submit toll charges
  - Submit repair expenses
  - Upload receipts/photos
  - View expense submission history
- **Priority:** Medium

#### FR-DRV-005: View Schedule
- **Description:** Driver can view their work schedule
- **Details:**
  - View weekly/monthly schedule
  - View upcoming trips
  - View vehicle assignments
  - See availability status
- **Priority:** Medium

### 4.3 Client Requirements

#### FR-CLT-001: Request Shipment
- **Description:** Client can create shipment requests
- **Details:**
  - Fill shipment details (description, weight, volume, pickup/delivery addresses)
  - Request delivery date
  - View estimated pricing (if applicable)
  - Submit shipment request
  - Receive confirmation notification
- **Priority:** High

#### FR-CLT-002: Track Shipment
- **Description:** Client can track their shipments
- **Details:**
  - View shipment status in real-time
  - Track shipment location (if GPS enabled)
  - View assigned trip information
  - See estimated delivery time
  - View shipment history
  - Get tracking number for shipment
- **Priority:** High

#### FR-CLT-003: Receive Notifications
- **Description:** Client receives notifications about shipments
- **Details:**
  - Notifications when shipment is assigned to trip
  - Notifications when trip starts
  - Notifications when shipment is delivered
  - Notifications about delays
  - Email and in-app notifications
- **Priority:** High

#### FR-CLT-004: View Shipment History
- **Description:** Client can view past shipments
- **Details:**
  - View all past shipments
  - Filter by status, date range
  - View shipment details and invoices
  - Download shipping documents
- **Priority:** Medium

#### FR-CLT-005: Manage Profile
- **Description:** Client can manage their profile
- **Details:**
  - Update company information
  - Update contact details
  - Update address
  - Manage VAT number
- **Priority:** Low

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
- **NFR-PERF-001:** System should support at least 1000 concurrent users
- **NFR-PERF-002:** Page load time should be less than 2 seconds
- **NFR-PERF-003:** Database queries should execute in less than 500ms for standard operations
- **NFR-PERF-004:** Real-time updates should be delivered within 5 seconds
- **NFR-PERF-005:** System should handle at least 10,000 trips per month

### 5.2 Security Requirements
- **NFR-SEC-001:** All passwords must be encrypted using industry-standard hashing (bcrypt)
- **NFR-SEC-002:** User authentication required for all system access
- **NFR-SEC-003:** Role-based access control (RBAC) implementation
- **NFR-SEC-004:** HTTPS encryption for all data transmission
- **NFR-SEC-005:** Session timeout after 30 minutes of inactivity
- **NFR-SEC-006:** Audit logging for all critical operations
- **NFR-SEC-007:** Data backup daily with 30-day retention

### 5.3 Usability Requirements
- **NFR-USE-001:** System should be responsive (mobile, tablet, desktop)
- **NFR-USE-002:** Interface should be intuitive and require minimal training
- **NFR-USE-003:** Support for multiple languages (at minimum: English)
- **NFR-USE-004:** Accessibility compliance (WCAG 2.1 Level AA)

### 5.4 Reliability Requirements
- **NFR-REL-001:** System uptime should be 99.5%
- **NFR-REL-002:** Data loss prevention with transaction rollback
- **NFR-REL-003:** Error handling and user-friendly error messages
- **NFR-REL-004:** Automatic recovery from minor system failures

### 5.5 Scalability Requirements
- **NFR-SCAL-001:** System should scale horizontally
- **NFR-SCAL-002:** Database should support up to 1 million records
- **NFR-SCAL-003:** Architecture should support future feature additions

---

## 6. Data Models

### 6.1 User Entity
- **id** (PK): Unique identifier
- **name**: String (required, max 100 chars)
- **email**: String (required, unique, max 255 chars)
- **password**: String (hashed, required)
- **role**: Enum (admin, driver, client) - required
- **phone**: String (max 20 chars)
- **isActive**: Boolean (default: true)
- **createdAt**: DateTime (auto-generated)
- **updatedAt**: DateTime (auto-updated)
- **lastLogin**: DateTime (nullable)

### 6.2 DriverProfile Entity
- **id** (PK): Unique identifier
- **userId** (FK): Reference to User.id (unique, one-to-one)
- **licenseNumber**: String (required, max 50 chars)
- **experienceYears**: Integer (min: 0)
- **status**: Enum (active, inactive, suspended) - default: active
- **createdAt**: DateTime
- **updatedAt**: DateTime

### 6.3 ClientProfile Entity
- **id** (PK): Unique identifier
- **userId** (FK): Reference to User.id (unique, one-to-one)
- **companyName**: String (required, max 200 chars)
- **address**: Text (required)
- **VATNumber**: String (max 50 chars, nullable)
- **createdAt**: DateTime
- **updatedAt**: DateTime

### 6.4 Vehicle Entity
- **id** (PK): Unique identifier
- **plateNumber**: String (required, unique, max 20 chars)
- **type**: String (required, max 50 chars) - e.g., truck, van, car
- **brand**: String (required, max 50 chars)
- **model**: String (required, max 50 chars)
- **status**: Enum (active, in_maintenance, inactive) - default: active
- **mileage**: Integer (min: 0)
- **purchaseDate**: Date
- **lastServiceDate**: Date (nullable)
- **insuranceExpiry**: Date (nullable)
- **registrationExpiry**: Date (nullable)
- **fuelCapacity**: Decimal (nullable)
- **createdAt**: DateTime
- **updatedAt**: DateTime

### 6.5 Maintenance Entity
- **id** (PK): Unique identifier
- **vehicleId** (FK): Reference to Vehicle.id (required)
- **date**: Date (required)
- **cost**: Decimal (required, precision: 10, scale: 2)
- **description**: Text
- **type**: Enum (service, repair, inspection) - required
- **createdAt**: DateTime
- **updatedAt**: DateTime

### 6.6 Trip Entity
- **id** (PK): Unique identifier
- **driverId** (FK): Reference to DriverProfile.id (required)
- **vehicleId** (FK): Reference to Vehicle.id (required)
- **departure**: String (required, max 255 chars)
- **destination**: String (required, max 255 chars)
- **dateStart**: DateTime (required)
- **dateEnd**: DateTime (nullable)
- **estimatedDuration**: Integer (minutes, nullable)
- **actualDuration**: Integer (minutes, nullable)
- **distance**: Decimal (km, nullable)
- **status**: Enum (planned, ongoing, completed, cancelled) - default: planned
- **totalCost**: Decimal (precision: 10, scale: 2, default: 0)
- **notes**: Text (nullable)
- **createdAt**: DateTime
- **updatedAt**: DateTime

### 6.7 Shipment Entity
- **id** (PK): Unique identifier
- **tripId** (FK): Reference to Trip.id (nullable - can exist before trip assignment)
- **clientId** (FK): Reference to ClientProfile.id (required)
- **trackingNumber**: String (unique, auto-generated, max 50 chars)
- **description**: Text (required)
- **weight**: Decimal (kg, nullable)
- **volume**: Decimal (m³, nullable)
- **price**: Decimal (precision: 10, scale: 2, required)
- **pickupAddress**: Text (required)
- **deliveryAddress**: Text (required)
- **priority**: Enum (low, normal, high, urgent) - default: normal
- **status**: Enum (pending, assigned, in_transit, delivered, cancelled) - default: pending
- **pickupDate**: DateTime (nullable)
- **deliveryDate**: DateTime (nullable)
- **createdAt**: DateTime
- **updatedAt**: DateTime

### 6.8 Expense Entity
- **id** (PK): Unique identifier
- **tripId** (FK): Reference to Trip.id (nullable - for general expenses)
- **vehicleId** (FK): Reference to Vehicle.id (nullable)
- **type**: Enum (fuel, toll, repair, maintenance, other) - required
- **amount**: Decimal (precision: 10, scale: 2, required)
- **date**: Date (required)
- **note**: Text (nullable)
- **receipt**: String (file path, nullable)
- **createdBy** (FK): Reference to User.id (nullable)
- **createdAt**: DateTime
- **updatedAt**: DateTime

### 6.9 Notification Entity
- **id** (PK): Unique identifier
- **userId** (FK): Reference to User.id (required)
- **title**: String (required, max 200 chars)
- **message**: Text (required)
- **type**: Enum (system, trip_update, payment, shipment, general) - default: general
- **status**: Enum (read, unread) - default: unread
- **link**: String (URL, nullable)
- **createdAt**: DateTime

---

## 7. Use Case Specifications

### UC-001: Admin Creates Trip
- **Actor:** Admin
- **Precondition:** Admin is logged in, driver and vehicle are available
- **Main Flow:**
  1. Admin navigates to Trip Management
  2. Admin clicks "Create New Trip"
  3. Admin selects driver from available drivers
  4. Admin selects vehicle from available vehicles
  5. Admin enters departure and destination
  6. Admin sets start date and time
  7. Admin optionally sets end date and time
  8. Admin saves trip
  9. System creates trip with status "planned"
  10. System sends notification to assigned driver
- **Postcondition:** Trip is created and visible in system
- **Alternative Flow:** If driver/vehicle unavailable, system shows error

### UC-002: Driver Updates Trip Status
- **Actor:** Driver
- **Precondition:** Driver is logged in, has assigned trip
- **Main Flow:**
  1. Driver views assigned trips
  2. Driver selects a trip
  3. Driver updates status to "ongoing"
  4. System updates trip status
  5. System sends notification to admin and related clients
- **Postcondition:** Trip status updated, stakeholders notified

### UC-003: Client Requests Shipment
- **Actor:** Client
- **Precondition:** Client is logged in
- **Main Flow:**
  1. Client navigates to Shipment section
  2. Client clicks "Request Shipment"
  3. Client fills shipment form (description, weight, volume, addresses)
  4. Client sets delivery preference
  5. Client submits request
  6. System creates shipment with status "pending"
  7. System sends confirmation to client
  8. System notifies admin of new shipment request
- **Postcondition:** Shipment request created and pending assignment

### UC-004: Admin Assigns Shipment to Trip
- **Actor:** Admin
- **Precondition:** Shipment exists, trip exists or can be created
- **Main Flow:**
  1. Admin views pending shipments
  2. Admin selects a shipment
  3. Admin assigns to existing trip or creates new trip
  4. Admin confirms assignment
  5. System links shipment to trip
  6. System updates shipment status to "assigned"
  7. System sends notification to client
- **Postcondition:** Shipment assigned to trip, client notified

### UC-005: Track Shipment
- **Actor:** Client
- **Precondition:** Client has active shipments
- **Main Flow:**
  1. Client navigates to "My Shipments"
  2. Client selects a shipment
  3. System displays shipment status
  4. System displays associated trip information
  5. System displays trip status
  6. Client can see real-time updates
- **Postcondition:** Client views current shipment status

---

## 8. User Interface Requirements

### 8.1 Admin Dashboard
- Overview cards: Total trips, active vehicles, pending shipments, monthly revenue
- Recent activity feed
- Quick actions: Create trip, Add vehicle, View reports
- Charts: Trip status distribution, Monthly revenue trend

### 8.2 Driver Dashboard
- Upcoming trips list
- Today's schedule
- Quick status update buttons
- Pending expense submissions

### 8.3 Client Dashboard
- Active shipments list
- Tracking interface
- Recent notifications
- Shipment history

### 8.4 General UI Requirements
- Responsive design (mobile-first)
- Consistent navigation menu
- Search and filter functionality on all list views
- Pagination for large datasets
- Confirmation dialogs for critical actions
- Success/Error message notifications

---

## 9. Security Requirements

### 9.1 Authentication
- Email/Password authentication
- Password requirements: minimum 8 characters, at least one uppercase, one lowercase, one number
- Password reset functionality via email
- Session management with secure tokens

### 9.2 Authorization
- Role-based access control (RBAC)
- Admin: Full system access
- Driver: Limited to assigned trips and personal data
- Client: Limited to own shipments and profile

### 9.3 Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- SQL injection prevention
- XSS (Cross-Site Scripting) protection
- CSRF (Cross-Site Request Forgery) protection

### 9.4 Audit Trail
- Log all user actions (login, data modification, deletions)
- Log IP addresses and timestamps
- Maintain audit logs for compliance

---

## 10. Technical Requirements

### 10.1 Technology Stack Recommendations
- **Backend:** Node.js/Express, Python/Django, or Java/Spring Boot
- **Frontend:** React, Vue.js, or Angular
- **Database:** PostgreSQL or MySQL
- **Authentication:** JWT tokens
- **Real-time:** WebSockets (Socket.io or similar)
- **File Storage:** Local or cloud storage (AWS S3, etc.)

### 10.2 Integration Requirements
- Email service for notifications (SendGrid, AWS SES, etc.)
- SMS service (optional, for critical notifications)
- PDF generation for reports and invoices
- Export functionality (CSV, Excel, PDF)

### 10.3 Deployment Requirements
- Cloud-ready architecture
- Docker containerization support
- CI/CD pipeline capability
- Environment configuration management

---

## 11. Future Enhancements

### Phase 2 Features
- **GPS Tracking:** Real-time vehicle location tracking
- **Route Optimization:** Automatic route planning
- **Mobile Apps:** Native iOS and Android apps for drivers
- **Advanced Analytics:** Machine learning for demand forecasting
- **Invoice Management:** Automated invoicing and payment tracking
- **Document Management:** Upload and manage shipping documents
- **Multi-tenant Support:** Support for multiple organizations
- **API for Third-party Integration:** RESTful API for external systems
- **Automated Notifications:** Smart notification rules
- **Fuel Management:** Fuel consumption tracking and optimization

### Phase 3 Features
- **IoT Integration:** Sensor data from vehicles
- **Predictive Maintenance:** AI-powered maintenance scheduling
- **Driver Behavior Analytics:** Safety and performance metrics
- **Customer Portal:** Advanced self-service features
- **Multi-language Support:** Full internationalization
- **Advanced Reporting:** Custom report builder

---

## 12. Constraints and Assumptions

### 12.1 Constraints
- Budget limitations (to be defined)
- Timeline constraints (to be defined)
- Technology preferences (to be confirmed)
- Integration with existing systems (if any)

### 12.2 Assumptions
- Users have basic computer/device knowledge
- Internet connectivity available for all users
- Drivers have mobile devices (smartphone/tablet)
- Clients have email access
- Database will be maintained and backed up regularly

---

## 13. Glossary

- **Trip:** A journey from departure to destination with assigned driver and vehicle
- **Shipment:** Goods or items being transported from one location to another
- **Maintenance:** Scheduled or unscheduled vehicle service, repair, or inspection
- **Expense:** Cost incurred during operations (fuel, toll, repairs, etc.)
- **Tracking Number:** Unique identifier for a shipment
- **Status:** Current state of an entity (trip, shipment, vehicle, etc.)

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Manager | | | |
| Lead Developer | | | |
| Business Analyst | | | |
| Client Representative | | | |

---

**Document Version History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025 | | Initial requirements document |

---

*End of Requirements Document*

