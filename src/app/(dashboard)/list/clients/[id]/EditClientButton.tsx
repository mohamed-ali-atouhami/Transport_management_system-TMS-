"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ClientProfileForm from "@/components/admin/forms/ClientProfileForm";
import { ClientProfileSchema } from "@/lib/FormValidationSchema";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useRouter } from "next/navigation";

interface EditClientButtonProps {
  clientData: ClientProfileSchema;
}

export default function EditClientButton({ clientData }: EditClientButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Client Profile</DialogTitle>
          </DialogHeader>
          <ClientProfileForm
            data={clientData}
            setOpen={setOpen}
            onSuccess={() => {
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

