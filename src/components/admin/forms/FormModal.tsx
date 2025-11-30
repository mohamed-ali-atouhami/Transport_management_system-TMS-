"use client";

import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React, { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Loader, Plus, Trash2, Edit } from "lucide-react";
import { deleteTrip } from "@/lib/actions/trip-management";
import { deleteVehicle } from "@/lib/actions/vehicle-management";
import { deleteShipment } from "@/lib/actions/shipment-management";
import { deleteUser } from "@/lib/actions/user-management";
import { deleteExpense } from "@/lib/actions/expense-management";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FormContainerProps } from "./FormContainer";
import { Button } from "@/components/ui/button";

const TripForm = dynamic(() => import("./TripForm"), {
  ssr: false,
  loading: () => (
    <span className="text-center flex justify-center items-center">
      <Loader className="w-8 h-8 animate-spin" />
    </span>
  ),
});

const TripCreationWizard = dynamic(() => import("./TripCreationWizard"), {
  ssr: false,
  loading: () => (
    <span className="text-center flex justify-center items-center">
      <Loader className="w-8 h-8 animate-spin" />
    </span>
  ),
});

const VehicleForm = dynamic(() => import("./VehicleForm"), {
  ssr: false,
  loading: () => (
    <span className="text-center flex justify-center items-center">
      <Loader className="w-8 h-8 animate-spin" />
    </span>
  ),
});

const UserForm = dynamic(() => import("./UserForm"), {
  ssr: false,
  loading: () => (
    <span className="text-center flex justify-center items-center">
      <Loader className="w-8 h-8 animate-spin" />
    </span>
  ),
});

const ShipmentForm = dynamic(() => import("./ShipmentForm"), {
  ssr: false,
  loading: () => (
    <span className="text-center flex justify-center items-center">
      <Loader className="w-8 h-8 animate-spin" />
    </span>
  ),
});

const ExpenseForm = dynamic(() => import("./ExpenseForm"), {
  ssr: false,
  loading: () => (
    <span className="text-center flex justify-center items-center">
      <Loader className="w-8 h-8 animate-spin" />
    </span>
  ),
});

type RelatedData = {
  drivers?: { id: string; name: string; email: string; licenseNumber: string }[];
  vehicles?: { id: string; label: string; plateNumber: string; brand: string; model: string; type: string }[];
  clients?: { id: string; companyName: string; user: { name: string; email: string } }[];
  trips?: { id: string; departure: string; destination: string; dateStart: Date }[];
};

const formMap: Record<
  string,
  React.ComponentType<{
    type: "create" | "edit" | "change-status";
    data?: Record<string, unknown> | null;
    setOpen: (open: boolean) => void;
    relatedData?: RelatedData;
    onSuccess?: () => void;
  }>
> = {
  trips: TripForm as React.ComponentType<{
    type: "create" | "edit" | "change-status";
    data?: Record<string, unknown> | null;
    setOpen: (open: boolean) => void;
    relatedData?: RelatedData;
  }>,
  vehicles: VehicleForm as React.ComponentType<{
    type: "create" | "edit" | "change-status";
    data?: Record<string, unknown> | null;
    setOpen: (open: boolean) => void;
    relatedData?: RelatedData;
  }>,
  users: UserForm as React.ComponentType<{
    type: "create" | "edit" | "change-status";
    data?: Record<string, unknown> | null;
    setOpen: (open: boolean) => void;
    relatedData?: RelatedData;
  }>,
  shipments: ShipmentForm as React.ComponentType<{
    type: "create" | "edit" | "change-status";
    data?: Record<string, unknown> | null;
    setOpen: (open: boolean) => void;
    relatedData?: RelatedData;
  }>,
  expenses: ExpenseForm as React.ComponentType<{
    type: "create" | "edit" | "change-status";
    data?: Record<string, unknown> | null;
    setOpen: (open: boolean) => void;
    relatedData?: RelatedData;
  }>,
};

type DeleteFunction = (formData: FormData) => Promise<boolean>;

const deleteMap: Partial<Record<"trips" | "users" | "vehicles" | "shipments" | "expenses", DeleteFunction>> = {
  trips: deleteTrip,
  vehicles: deleteVehicle,
  shipments: deleteShipment,
  users: deleteUser,
  expenses: deleteExpense,
};

export default function FormModal({ table, type, data, id, relatedData, onSuccess }: FormContainerProps & { relatedData?: RelatedData; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const Form = () => {
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
      const formData = new FormData();
      if (id) {
        formData.append("id", String(id));
      }

      startTransition(async () => {
        const deleteAction = deleteMap[table];
        if (!deleteAction) {
          toast.error(`Delete action not implemented for ${table}`);
          return;
        }
        const success = await deleteAction(formData);
        if (success) {
          toast.success(`${table} deleted successfully!`);
          setOpen(false);
          if (onSuccess) {
            onSuccess();
          } else {
            router.refresh();
          }
        } else {
          toast.error(`Failed to delete ${table}!`);
        }
      });
    };

    return type === "delete" && id ? (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
             <span className="text-red-500 font-medium">Delete</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the {table} from our servers.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isPending ? "Deleting..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ) : type === "create" || type === "edit" ? (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={table === "trips" && type === "create" ? "max-w-5xl max-h-[95vh] overflow-y-auto" : "max-w-3xl max-h-[90vh] overflow-y-auto"}>
          {table === "trips" && type === "create" ? (
            // Use wizard for trip creation
            <>
              <DialogHeader>
                <DialogTitle></DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              <TripCreationWizard
                setOpen={setOpen}
                onSuccess={() => {
                  if (onSuccess) {
                    onSuccess();
                  } else {
                    router.refresh();
                  }
                }}
              />
            </>
          ) : (
            // Use regular form for editing or other tables
            <>
              <DialogHeader>
                <DialogTitle>{type === "create" ? "Create" : "Edit"} {table.slice(0, -1)}</DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              {React.createElement(formMap[table], {
                type,
                data,
                setOpen,
                relatedData: relatedData,
                onSuccess: onSuccess,
              })}
            </>
          )}
        </DialogContent>
      </Dialog>
    ) : null;
  };
  return (
    <>
      {type !== "delete" && (
        <>
          {type === "create" ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className=" h-4 w-4" />
              Create {table.slice(0, -1)}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </>
      )}
      <Form />
    </>
  );
}

