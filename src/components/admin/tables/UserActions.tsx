"use client";

import FormModal from "@/components/admin/forms/FormModal";
import { ChangeUserStatusDialog } from "@/components/admin/dialogs/change-user-status-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserX } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type User = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  role: "ADMIN" | "DRIVER" | "CLIENT";
  phone: string | null;
  image: string | null;
  isActive: boolean;
  driverProfile: any;
  clientProfile: any;
};

interface UserActionsProps {
  user: User;
}

export function UserActions({ user }: UserActionsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAction, setDeleteAction] = useState<"deactivate" | "activate">("deactivate");
  const router = useRouter();

  // Convert user to the format expected by UserForm
  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username || "",
    phone: user.phone || "",
    role: user.role,
    image: user.image || null,
    licenseNumber: user.driverProfile?.licenseNumber || "",
    experienceYears: user.driverProfile?.experienceYears || 0,
    companyName: user.clientProfile?.companyName || "",
    address: user.clientProfile?.address || "",
    vatNumber: user.clientProfile?.vatNumber || "",
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
            <FormModal 
              table="users" 
              type="edit" 
              data={userData} 
              id={user.id}
              onSuccess={() => {
                setDropdownOpen(false);
                router.refresh();
              }}
            />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setDeleteAction(user.isActive ? "deactivate" : "activate");
              setDeleteDialogOpen(true);
            }}
          >
            <UserX className="mr-2 h-4 w-4" />
            {user.isActive ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
            <FormModal 
              table="users" 
              type="delete" 
              id={user.id}
              onSuccess={() => {
                setDropdownOpen(false);
                router.refresh();
              }}
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangeUserStatusDialog
        user={user ? { id: user.id, name: user.name, isActive: user.isActive } : null}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDropdownOpen(false);
          }
        }}
        onSuccess={() => {
          setDropdownOpen(false);
          router.refresh();
        }}
        action={deleteAction}
      />
    </>
  );
}

