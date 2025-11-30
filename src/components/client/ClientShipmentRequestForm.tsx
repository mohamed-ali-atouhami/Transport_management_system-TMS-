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
import { clientShipmentRequestSchema, ClientShipmentRequestSchema } from "@/lib/FormValidationSchema";
import { toast } from "sonner";
import { useActionState, useEffect, useTransition } from "react";
import { requestShipment } from "@/lib/actions/shipment-management";
import { useRouter } from "next/navigation";

export default function ClientShipmentRequestForm({
  setOpen,
  onSuccess,
}: {
  setOpen?: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(clientShipmentRequestSchema),
    defaultValues: {
      description: "",
      weight: null,
      volume: null,
      pickupAddress: "",
      deliveryAddress: "",
      priority: "NORMAL" as const,
      pickupDate: null,
    },
  });

  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(requestShipment, {
    success: false,
    error: false,
  });
  const router = useRouter();

  useEffect(() => {
    if (state?.success === true) {
      toast.success("Shipment request submitted successfully! You will receive a tracking number once it's assigned to a trip.");
      form.reset();
      if (setOpen) {
        setOpen(false);
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } else if (state?.error) {
      toast.error(state.error || "Failed to submit shipment request");
      console.error("Form action error:", state.error);
    }
  }, [state, router, setOpen, onSuccess, form]);

  async function onSubmit(values: ClientShipmentRequestSchema) {
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
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what you're shipping..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg) - Optional</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter weight in kg"
                    name={field.name}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    value={field.value != null ? String(field.value) : ""}
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>Volume (m³) - Optional</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter volume in m³"
                    name={field.name}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    value={field.value != null ? String(field.value) : ""}
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pickup Address *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter full pickup address"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deliveryAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Address *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter full delivery address"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            name="pickupDate"
            render={({ field }) => {
              const { value, onChange, ...rest } = field;
              return (
                <FormItem>
                  <FormLabel>Preferred Pickup Date - Optional</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...rest}
                      value={value instanceof Date ? new Date(value).toISOString().slice(0, 16) : ""}
                      onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your shipment request will be reviewed by our team. 
            You'll receive a tracking number and pricing information once it's assigned to a trip.
          </p>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          {setOpen && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

