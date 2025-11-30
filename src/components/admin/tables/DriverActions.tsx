"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusFormModal } from "@/components/admin/forms/StatusFormModal";
import DriverProfileForm from "@/components/admin/forms/DriverProfileForm";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Settings, User } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DriverProfileSchema } from "@/lib/FormValidationSchema";

export type Driver = {
  id: string;
  userId: string;
  licenseNumber: string;
  experienceYears: number;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    image: string | null;
  };
};

interface DriverActionsProps {
  driver: Driver;
}

export function DriverActions({ driver }: DriverActionsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const router = useRouter();

  // Convert driver to the format expected by DriverProfileForm
  const driverData: DriverProfileSchema = {
    id: driver.id,
    userId: driver.userId,
    licenseNumber: driver.licenseNumber,
    experienceYears: driver.experienceYears,
    status: driver.status,
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
          <DropdownMenuItem
            onClick={() => {
              setEditDialogOpen(true);
            }}
          >
            <User className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setStatusDialogOpen(true);
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            Change Status
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Driver Profile</DialogTitle>
          </DialogHeader>
          <DriverProfileForm
            data={driverData}
            setOpen={setEditDialogOpen}
            onSuccess={() => {
              setDropdownOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog - Using custom status modal for drivers */}
      <StatusFormModal
        table="drivers"
        id={driver.id}
        currentStatus={driver.status}
        displayInfo={`${driver.user.name} - ${driver.licenseNumber}`}
        open={statusDialogOpen}
        onOpenChange={(open) => {
          setStatusDialogOpen(open);
          if (!open) {
            setDropdownOpen(false);
          }
        }}
        onSuccess={() => {
          setDropdownOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}

