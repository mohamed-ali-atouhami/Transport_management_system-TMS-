"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectValue, SelectTrigger, SelectItem } from "@/components/ui/select";
import ImageUpload from "@/components/ui/image-upload";
import { vehicleSchema, VehicleSchema } from "@/lib/FormValidationSchema";
import { toast } from "sonner";
import { useActionState, useEffect, useTransition } from "react";
import { createVehicle, updateVehicle } from "@/lib/actions/vehicle-management";
import { useRouter } from "next/navigation";

export default function VehicleForm({
  type,
  data,
  setOpen,
  onSuccess,
}: {
  type: "create" | "edit";
  data?: VehicleSchema | null;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      id: data?.id || "",
      plateNumber: data?.plateNumber || "",
      type: data?.type || "",
      brand: data?.brand || "",
      model: data?.model || "",
      status: data?.status || "ACTIVE",
      image: data?.image ?? null,
      mileage: data?.mileage || 0,
      purchaseDate: data?.purchaseDate || null,
      lastServiceDate: data?.lastServiceDate || null,
      capacityWeight: data?.capacityWeight || null,
      capacityVolume: data?.capacityVolume || null,
    },
  });

  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(type === "create" ? createVehicle : updateVehicle, {
    success: false,
    error: false,
  });
  const router = useRouter();

  useEffect(() => {
    if (state?.success === true) {
      toast.success(`Vehicle ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } else if (state?.error) {
      toast.error(state.error || `Failed to ${type === "create" ? "create" : "update"} vehicle`);
      console.error("Form action error:", state.error);
    }
  }, [state, type, router, setOpen, onSuccess]);

  async function onSubmit(values: VehicleSchema) {
    try {
      startTransition(() => {
        formAction(values);
      });
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An unexpected error occurred");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {data && (
          <FormField
            control={form.control}
            name="id"
            render={({ field }: { field: any }) => (
              <FormItem className="hidden">
                <FormControl>
                  <Input {...field} type="hidden" />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="plateNumber"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Plate Number *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ABC-1234"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <FormControl>
                  <Input placeholder="Truck, Van, Car" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Brand *</FormLabel>
                <FormControl>
                  <Input placeholder="Toyota, Ford, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Model *</FormLabel>
                <FormControl>
                  <Input placeholder="Model name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "ACTIVE"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="IN_MAINTENANCE">In Maintenance</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mileage"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Mileage (km)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Purchase Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={
                      field.value
                        ? field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : new Date(field.value).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      field.onChange(date);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastServiceDate"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Last Service Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={
                      field.value
                        ? field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : new Date(field.value).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      field.onChange(date);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="capacityWeight"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Capacity Weight (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacityVolume"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Capacity Volume (m³)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="image"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  folder="transport-management/vehicles"
                  label="Vehicle Image"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (type === "create" ? "Creating..." : "Updating...") : type === "create" ? "Create Vehicle" : "Update Vehicle"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

