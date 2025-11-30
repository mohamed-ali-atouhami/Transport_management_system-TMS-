"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DriverProfileForm from "@/components/admin/forms/DriverProfileForm";
import { DriverProfileSchema } from "@/lib/FormValidationSchema";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useRouter } from "next/navigation";

interface EditDriverButtonProps {
  driverData: DriverProfileSchema;
}

export default function EditDriverButton({ driverData }: EditDriverButtonProps) {
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
            <DialogTitle>Edit Driver Profile</DialogTitle>
          </DialogHeader>
          <DriverProfileForm
            data={driverData}
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

