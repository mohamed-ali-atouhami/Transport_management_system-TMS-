import { InviteUserForm } from "@/components/admin/forms/invite-user-form";
import { AssignUserRoleForm } from "@/components/admin/forms/assign-user-role-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { TableColumn } from "@/components/admin/tables/Table";
import TableSearch from "@/components/admin/tables/TableSearch";
import Pagination from "@/components/admin/tables/Pagination";
import { Prisma } from "@prisma/client";
import { UsersTable } from "@/components/admin/tables/UsersTable";

type User = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  role: "ADMIN" | "DRIVER" | "CLIENT";
  phone: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
  driverProfile: any;
  clientProfile: any;
};

const getColumns = (): TableColumn[] => [
  {
    header: "User",
    accessor: "name",              // Changed to "name" to match Prisma field
    sortable: true,                 // ✅ Now sortable by name (A-Z or Z-A)
  },
  {
    header: "Email",
    accessor: "email",
    className: "hidden md:table-cell",
    sortable: true,                 // ✅ Now sortable by email (A-Z or Z-A)
  },
  {
    header: "Username",
    accessor: "username",
    className: "hidden lg:table-cell",
    sortable: true,                 // ✅ Optional: Sort by username too
  },
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
        { value: "CLIENT", label: "Client" },
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
  {
    header: "Actions",
    accessor: "actions",
  },
];


interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function UsersPage({ searchParams }: Props) {
  try {
    await requireRole("admin");
  } catch (error) {
    redirect("/onboarding");
  }

  const resolvedParams = await searchParams;
  const { page, search, role, status, sort, order, ...queryparams } = resolvedParams;
  const pageNumber = page ? Number(page) : 1;

  // Build query conditions
  const query: Prisma.UserWhereInput = {};

  if (search) {
    query.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role && role !== "ALL") {
    query.role = role as "ADMIN" | "DRIVER" | "CLIENT";
  }

  if (status && status !== "ALL") {
    query.isActive = status === "ACTIVE";
  }

  // Handle sorting
  const sortColumn = sort || "createdAt";
  const sortOrder = order || "desc";
  let orderBy: any = { createdAt: "desc" };

  if (sortColumn === "name") {
    orderBy = { name: sortOrder };
  } else if (sortColumn === "email") {
    orderBy = { email: sortOrder };
  } else if (sortColumn === "username") {
    orderBy = { username: sortOrder };
  } else if (sortColumn === "createdAt") {
    orderBy = { createdAt: sortOrder };
  }

  // Fetch users
  const [usersData, count] = await Promise.all([
    prisma.user.findMany({
      where: query,
      include: {
        driverProfile: true,
        clientProfile: true,
      },
      take: ITEMS_PER_PAGE,
      skip: (pageNumber - 1) * ITEMS_PER_PAGE,
      orderBy,
    }),
    prisma.user.count({
      where: query,
    }),
  ]);

  const serializedUsers = usersData as User[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Manage users, roles, and permissions</p>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">All Users</TabsTrigger>
          <TabsTrigger value="invite">Invite User</TabsTrigger>
          <TabsTrigger value="assign">Assign Role</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          {/* Table */}
          <div className="bg-white p-4 rounded-md flex-1">
            {/* top */}
            <div className="flex justify-between items-center mb-4">
              <h1 className="hidden md:block text-lg font-semibold">All Users</h1>
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <TableSearch placeholder="Search by name, email, or username..." />
              </div>
            </div>
            {/* list */}
            <UsersTable
              users={serializedUsers}
              columns={getColumns()}
            />
            {/* pagination */}
            <Pagination page={pageNumber} totalCount={count} />
          </div>
        </TabsContent>
        <TabsContent value="invite" className="space-y-4">
          <InviteUserForm />
        </TabsContent>
        <TabsContent value="assign" className="space-y-4">
          <AssignUserRoleForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
