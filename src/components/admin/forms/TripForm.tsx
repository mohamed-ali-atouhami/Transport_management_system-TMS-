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
import { Textarea } from "@/components/ui/textarea";
import { tripSchema, TripSchema } from "@/lib/FormValidationSchema";
import { toast } from "sonner";
import { useActionState, useEffect, useTransition } from "react";
import { createTrip, updateTrip } from "@/lib/actions/trip-management";
import { useRouter } from "next/navigation";

type RelatedData = {
  drivers?: { id: string; name: string; email: string; licenseNumber: string }[];
  vehicles?: { id: string; label: string; plateNumber: string; brand: string; model: string; type: string }[];
};

export default function TripForm({
  type,
  data,
  setOpen,
  relatedData,
  onSuccess,
}: {
  type: "create" | "edit";
  data?: TripSchema | null;
  setOpen: (open: boolean) => void;
  relatedData?: RelatedData;
  onSuccess?: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      id: data?.id || "",
      driverId: data?.driverId || "",
      vehicleId: data?.vehicleId || "",
      departure: data?.departure || "",
      destination: data?.destination || "",
      dateStart: data?.dateStart || new Date(),
      dateEnd: data?.dateEnd || null,
      estimatedDuration: data?.estimatedDuration || null,
      actualDuration: data?.actualDuration || null,
      distance: data?.distance || null,
      status: data?.status || undefined,
      totalCost: data?.totalCost || 0,
      notes: data?.notes || "",
    },
  });

  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(type === "create" ? createTrip : updateTrip, {
    success: false,
    error: false,
  });
  const router = useRouter();

  useEffect(() => {
    if (state?.success === true) {
      toast.success(`Trip ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } else if (state?.error) {
      toast.error(state.error || `Failed to ${type === "create" ? "create" : "update"} trip`);
      console.error("Form action error:", state.error);
    }
  }, [state, type, router, setOpen, onSuccess]);

  async function onSubmit(values: TripSchema) {
    try {
      startTransition(() => {
        formAction(values);
      });
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An unexpected error occurred");
    }
  }

  const drivers = relatedData?.drivers || [];
  const vehicles = relatedData?.vehicles || [];

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
            name="driverId"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Driver *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name} ({driver.licenseNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vehicleId"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Vehicle *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="departure"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Departure *</FormLabel>
                <FormControl>
                  <Input placeholder="Departure location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="destination"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Destination *</FormLabel>
                <FormControl>
                  <Input placeholder="Destination location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dateStart"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Start Date & Time *</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    value={
                      field.value
                        ? field.value instanceof Date
                          ? field.value.toISOString().slice(0, 16)
                          : new Date(field.value).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : new Date();
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
            name="dateEnd"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>End Date & Time</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    value={
                      field.value
                        ? field.value instanceof Date
                          ? field.value.toISOString().slice(0, 16)
                          : new Date(field.value).toISOString().slice(0, 16)
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
            name="estimatedDuration"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Estimated Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 120"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="distance"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Distance (km)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 150.5"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
            name="totalCost"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Total Cost</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about the trip"
                  rows={3}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
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
            {isPending ? (type === "create" ? "Creating..." : "Updating...") : type === "create" ? "Create Trip" : "Update Trip"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

