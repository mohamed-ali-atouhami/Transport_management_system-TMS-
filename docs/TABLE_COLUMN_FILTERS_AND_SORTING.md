# Table Column Filters and Sorting Guide

This guide explains how to add filtering and sorting capabilities to any column in your tables using the custom `Table` component.

## Table of Contents
- [Overview](#overview)
- [Column Configuration](#column-configuration)
- [Adding Filters](#adding-filters)
- [Adding Sorting](#adding-sorting)
- [Backend Implementation](#backend-implementation)
- [Examples](#examples)

## Overview

The `Table` component supports two main features for columns:
1. **Filtering**: Clickable dropdown menu with filter options
2. **Sorting**: Clickable dropdown menu with sort options (ascending, descending, clear)

When a column has either filter or sort enabled, the column header becomes clickable and shows a dropdown menu with the available options.

## Column Configuration

The `TableColumn` type is defined as:

```typescript
export type TableColumn = {
  header: string;              // Display name of the column
  accessor: string;            // Unique identifier for the column
  className?: string;          // Optional CSS classes (e.g., "hidden md:table-cell")
  filter?: ColumnFilter;        // Optional filter configuration
  sortable?: boolean;          // Optional sorting capability
};
```

## Adding Filters

To add filtering to a column, include a `filter` property with the following structure:

```typescript
filter: {
  type: "select",                    // Currently only "select" is supported
  paramKey?: string,                 // URL parameter name (defaults to accessor)
  defaultValue?: string,             // Default filter value (defaults to "ALL")
  options: [                         // Array of filter options
    { value: "ALL", label: "All Status" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
  ],
}
```

### Example: Adding a Status Filter

```typescript
const getColumns = (): TableColumn[] => [
  {
    header: "Status",
    accessor: "status",
    filter: {
      type: "select",
      paramKey: "status",           // URL param: ?status=ACTIVE
      defaultValue: "ALL",
      options: [
        { value: "ALL", label: "All Status" },
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
      ],
    },
  },
];
```

## Adding Sorting

To add sorting to a column, set `sortable: true`:

```typescript
{
  header: "Start Date",
  accessor: "dateStart",
  sortable: true,                   // Enables sorting
}
```

### Example: Adding Sortable Column

```typescript
const getColumns = (): TableColumn[] => [
  {
    header: "Created At",
    accessor: "createdAt",
    className: "hidden lg:table-cell",
    sortable: true,                  // Click header to sort ascending/descending
  },
];
```

## Backend Implementation

After adding filters or sorting to your columns, you need to handle the URL parameters in your page component.

### Handling Filters

1. **Read the filter parameter from searchParams**:
```typescript
const resolvedParams = await searchParams;
const { status, role, ...otherParams } = resolvedParams;
```

2. **Add filter to Prisma query**:
```typescript
const query: Prisma.UserWhereInput = {};

if (status && status !== "ALL") {
  query.status = status as "ACTIVE" | "INACTIVE";
}

if (role && role !== "ALL") {
  query.role = role as "ADMIN" | "DRIVER" | "CLIENT";
}
```

3. **Use the query in your Prisma findMany**:
```typescript
const users = await prisma.user.findMany({
  where: query,
  // ... other options
});
```

### Handling Sorting

1. **Read sort parameters from searchParams**:
```typescript
const sort = resolvedParams.sort || "createdAt";  // Default sort column
const order = resolvedParams.order || "desc";      // Default sort order
```

2. **Build orderBy object**:
```typescript
let orderBy: any = { createdAt: "desc" };  // Default

if (sort === "dateStart") {
  orderBy = { dateStart: order };
} else if (sort === "totalCost") {
  orderBy = { totalCost: order };
} else if (sort === "name") {
  orderBy = { name: order };
}
```

3. **Use orderBy in your Prisma findMany**:
```typescript
const trips = await prisma.trip.findMany({
  where: query,
  orderBy,  // Use the orderBy object
  // ... other options
});
```

## Examples

### Example 1: Status Filter Only

```typescript
const getColumns = (): TableColumn[] => [
  {
    header: "Status",
    accessor: "status",
    filter: {
      type: "select",
      paramKey: "status",
      defaultValue: "ALL",
      options: [
        { value: "ALL", label: "All Status" },
        { value: "PLANNED", label: "Planned" },
        { value: "ONGOING", label: "Ongoing" },
        { value: "COMPLETED", label: "Completed" },
        { value: "CANCELLED", label: "Cancelled" },
      ],
    },
  },
];
```

**Backend handling:**
```typescript
const { status } = resolvedParams;
const query: Prisma.TripWhereInput = {};

if (status && status !== "ALL") {
  query.status = status as "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";
}
```

### Example 2: Sortable Column Only

```typescript
const getColumns = (): TableColumn[] => [
  {
    header: "Start Date",
    accessor: "dateStart",
    className: "hidden lg:table-cell",
    sortable: true,
  },
];
```

**Backend handling:**
```typescript
const sort = resolvedParams.sort || "dateStart";
const order = resolvedParams.order || "desc";
let orderBy: any = { dateStart: order };

if (sort === "dateStart") {
  orderBy = { dateStart: order };
}
```

### Example 3: Both Filter and Sort

```typescript
const getColumns = (): TableColumn[] => [
  {
    header: "Role",
    accessor: "role",
    sortable: true,                    // Can sort by role
    filter: {                           // Can filter by role
      type: "select",
      paramKey: "role",
      defaultValue: "ALL",
      options: [
        { value: "ALL", label: "All Roles" },
        { value: "ADMIN", label: "Admin" },
        { value: "DRIVER", label: "Driver" },
        { value: "CLIENT", label: "Client" },
      ],
    },
  },
];
```

**Backend handling:**
```typescript
const { role, sort, order } = resolvedParams;
const query: Prisma.UserWhereInput = {};

// Handle filter
if (role && role !== "ALL") {
  query.role = role as "ADMIN" | "DRIVER" | "CLIENT";
}

// Handle sorting
const sortColumn = sort || "createdAt";
const sortOrder = order || "desc";
let orderBy: any = { createdAt: sortOrder };

if (sortColumn === "role") {
  orderBy = { role: sortOrder };
}
```

### Example 4: Multiple Filters

```typescript
const getColumns = (): TableColumn[] => [
  {
    header: "Role",
    accessor: "role",
    filter: {
      type: "select",
      paramKey: "role",
      defaultValue: "ALL",
      options: [
        { value: "ALL", label: "All Roles" },
        { value: "ADMIN", label: "Admin" },
        { value: "DRIVER", label: "Driver" },
      ],
    },
  },
  {
    header: "Status",
    accessor: "status",
    filter: {
      type: "select",
      paramKey: "status",
      defaultValue: "ALL",
      options: [
        { value: "ALL", label: "All Status" },
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
      ],
    },
  },
];
```

**Backend handling:**
```typescript
const { role, status } = resolvedParams;
const query: Prisma.UserWhereInput = {};

if (role && role !== "ALL") {
  query.role = role as "ADMIN" | "DRIVER" | "CLIENT";
}

if (status && status !== "ALL") {
  query.isActive = status === "ACTIVE";
}
```

## Complete Example: Trips Table

Here's a complete example from the trips page:

```typescript
// Column definition
const getColumns = (): TableColumn[] => [
  {
    header: "Route",
    accessor: "route",
  },
  {
    header: "Start Date",
    accessor: "dateStart",
    className: "hidden lg:table-cell",
    sortable: true,                    // Sortable
  },
  {
    header: "Status",
    accessor: "status",
    filter: {                          // Filterable
      type: "select",
      paramKey: "status",
      defaultValue: "ALL",
      options: [
        { value: "ALL", label: "All Status" },
        { value: "PLANNED", label: "Planned" },
        { value: "ONGOING", label: "Ongoing" },
        { value: "COMPLETED", label: "Completed" },
        { value: "CANCELLED", label: "Cancelled" },
      ],
    },
  },
];

// Backend implementation
export default async function TripsPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const { status, sort, order } = resolvedParams;
  
  const query: Prisma.TripWhereInput = {};
  
  // Handle filter
  if (status && status !== "ALL") {
    query.status = status as "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  }
  
  // Handle sorting
  const sortColumn = sort || "dateStart";
  const sortOrder = order || "desc";
  let orderBy: any = { dateStart: "desc" };
  
  if (sortColumn === "dateStart") {
    orderBy = { dateStart: sortOrder };
  }
  
  const trips = await prisma.trip.findMany({
    where: query,
    orderBy,
    // ... other options
  });
}
```

## Tips

1. **Always include "ALL" option**: The first option in your filter should be "ALL" to allow users to clear the filter.

2. **Use paramKey for clarity**: If your accessor doesn't match the URL parameter name, use `paramKey` to specify it explicitly.

3. **Handle defaults**: Always provide default values for filters and sorting in your backend code.

4. **Type safety**: Use TypeScript type assertions when setting filter values to ensure type safety.

5. **Reset pagination**: The Table component automatically resets to page 1 when filters or sorting change, but make sure your backend handles this correctly.

## UI Behavior

- **Clickable headers**: Columns with `filter` or `sortable` become clickable buttons
- **Visual indicators**: Sort icons (↑, ↓, ↕) show the current sort state
- **Dropdown menu**: Clicking opens a dropdown with:
  - Sort options (if `sortable: true`)
  - Filter options (if `filter` is defined)
- **Selected state**: Active filters show a checkmark (✓) in the dropdown
- **One-click filtering**: Filter options are directly clickable (no nested selects)

