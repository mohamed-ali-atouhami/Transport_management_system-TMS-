"use client";

import { useState } from "react";
import { deleteUser, deactivateUser, activateUser } from "@/lib/actions/user-management";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ChangeUserStatusDialogProps {
  user: { id: string; name: string; isActive: boolean } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  action: "delete" | "deactivate" | "activate";
}

export function ChangeUserStatusDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
  action,
}: ChangeUserStatusDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("id", user.id);

      let result: boolean;
      if (action === "delete") {
        result = await deleteUser(formData);
      } else if (action === "deactivate") {
        result = await deactivateUser(formData);
      } else {
        result = await activateUser(formData);
      }

      if (result) {
        toast.success(`User ${action === "delete" ? "deleted" : action === "deactivate" ? "deactivated" : "activated"} successfully!`);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(`Failed to ${action} user`);
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} user`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const getActionText = () => {
    switch (action) {
      case "delete":
        return {
          title: "Delete User",
          description: `Are you sure you want to permanently delete ${user.name}? This action cannot be undone and will remove the user from both Clerk and the database.`,
          confirmText: "Delete User",
          variant: "destructive" as const,
        };
      case "deactivate":
        return {
          title: "Deactivate User",
          description: `Are you sure you want to deactivate ${user.name}? They will not be able to sign in, but their data will be preserved.`,
          confirmText: "Deactivate",
          variant: "destructive" as const,
        };
      case "activate":
        return {
          title: "Activate User",
          description: `Are you sure you want to activate ${user.name}? They will be able to sign in again.`,
          confirmText: "Activate",
          variant: "default" as const,
        };
    }
  };

  const actionText = getActionText();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <DialogTitle>{actionText.title}</DialogTitle>
              <DialogDescription className="mt-2">
                {actionText.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={actionText.variant}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : actionText.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

