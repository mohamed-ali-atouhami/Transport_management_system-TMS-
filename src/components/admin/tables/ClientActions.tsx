"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ClientProfileForm from "@/components/admin/forms/ClientProfileForm";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, User } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientProfileSchema } from "@/lib/FormValidationSchema";

export type Client = {
  id: string;
  userId: string;
  companyName: string;
  address: string;
  vatNumber: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    image: string | null;
  };
};

interface ClientActionsProps {
  client: Client;
}

export function ClientActions({ client }: ClientActionsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const router = useRouter();

  // Convert client to the format expected by ClientProfileForm
  const clientData: ClientProfileSchema = {
    id: client.id,
    userId: client.userId,
    companyName: client.companyName,
    address: client.address,
    vatNumber: client.vatNumber,
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
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Client Profile</DialogTitle>
          </DialogHeader>
          <ClientProfileForm
            data={clientData}
            setOpen={setEditDialogOpen}
            onSuccess={() => {
              setDropdownOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

