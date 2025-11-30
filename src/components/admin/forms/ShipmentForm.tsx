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
import { shipmentSchema, ShipmentSchema } from "@/lib/FormValidationSchema";
import { toast } from "sonner";
import { useActionState, useEffect, useTransition } from "react";
import { createShipment, updateShipment } from "@/lib/actions/shipment-management";
import { useRouter } from "next/navigation";

type RelatedData = {
  clients?: { id: string; companyName: string; user: { name: string; email: string } }[];
  trips?: { id: string; departure: string; destination: string; dateStart: Date }[];
};

export default function ShipmentForm({
  type,
  data,
  setOpen,
  relatedData,
  onSuccess,
}: {
  type: "create" | "edit";
  data?: ShipmentSchema | null;
  setOpen: (open: boolean) => void;
  relatedData?: RelatedData;
  onSuccess?: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      id: data?.id || "",
      tripId: data?.tripId || null,
      clientId: data?.clientId || "",
      trackingNumber: data?.trackingNumber || "",
      description: data?.description || "",
      weight: data?.weight || null,
      volume: data?.volume || null,
      price: data?.price || 0,
      pickupAddress: data?.pickupAddress || "",
      deliveryAddress: data?.deliveryAddress || "",
      priority: data?.priority || "NORMAL",
      status: data?.status || "PENDING",
      pickupDate: data?.pickupDate || null,
      deliveryDate: data?.deliveryDate || null,
    },
  });

  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(type === "create" ? createShipment : updateShipment, {
    success: false,
    error: false,
  });
  const router = useRouter();

  useEffect(() => {
    if (state?.success === true) {
      toast.success(`Shipment ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } else if (state?.error) {
      toast.error(state.error || `Failed to ${type === "create" ? "create" : "update"} shipment`);
      console.error("Form action error:", state.error);
    }
  }, [state, type, router, setOpen, onSuccess]);

  async function onSubmit(values: ShipmentSchema) {
    try {
      startTransition(() => {
        formAction(values);
      });
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An unexpected error occurred");
    }
  }

  const clients = relatedData?.clients || [];
  const trips = relatedData?.trips || [];

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
            name="clientId"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Client *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName} ({client.user.name})
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
            name="tripId"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Trip (Optional)</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trip" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No Trip</SelectItem>
                    {trips.map((trip) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.departure} → {trip.destination} ({new Date(trip.dateStart).toLocaleDateString("en-US")})
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
            name="trackingNumber"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Tracking Number *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., SHIP-2024-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Price *</FormLabel>
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
          name="description"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the shipment contents"
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 100.5"
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
            name="volume"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Volume (m³)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 2.5"
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
          name="pickupAddress"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Pickup Address *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Full pickup address"
                  rows={2}
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

        <FormField
          control={form.control}
          name="deliveryAddress"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Delivery Address *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Full delivery address"
                  rows={2}
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "NORMAL"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "PENDING"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ASSIGNED">Assigned</SelectItem>
                    <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
            name="pickupDate"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Pickup Date & Time</FormLabel>
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

          <FormField
            control={form.control}
            name="deliveryDate"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Delivery Date & Time</FormLabel>
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
            {isPending ? (type === "create" ? "Creating..." : "Updating...") : type === "create" ? "Create Shipment" : "Update Shipment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

