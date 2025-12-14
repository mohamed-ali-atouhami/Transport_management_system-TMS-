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
import { expenseSchema, ExpenseSchema } from "@/lib/FormValidationSchema";
import { toast } from "sonner";
import { useActionState, useEffect, useTransition } from "react";
import { createExpense, updateExpense } from "@/lib/actions/expense-management";
import { useRouter } from "next/navigation";

type RelatedData = {
  trips?: { id: string; departure: string; destination: string; dateStart: Date }[];
  vehicles?: { id: string; plateNumber: string; brand: string; model: string; type: string }[];
};

export default function ExpenseForm({
  type,
  data,
  setOpen,
  relatedData,
  onSuccess,
}: {
  type: "create" | "edit";
  data?: ExpenseSchema | null;
  setOpen: (open: boolean) => void;
  relatedData?: RelatedData;
  onSuccess?: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      id: data?.id || "",
      tripId: data?.tripId || null,
      vehicleId: data?.vehicleId || null,
      type: data?.type || "FUEL",
      amount: data?.amount || 0,
      date: data?.date || new Date(),
      note: data?.note || "",
      receiptUrl: data?.receiptUrl || "",
    },
  });

  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(type === "create" ? createExpense : updateExpense, {
    success: false,
    error: false,
  });
  const router = useRouter();

  useEffect(() => {
    if (state?.success === true) {
      toast.success(`Expense ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } else if (state?.error) {
      toast.error(state.error || `Failed to ${type === "create" ? "create" : "update"} expense`);
      console.error("Form action error:", state.error);
    }
  }, [state, type, router, setOpen, onSuccess]);

  async function onSubmit(values: ExpenseSchema) {
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
          <input type="hidden" {...form.register("id")} value={data.id} />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expense Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select expense type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FUEL">Fuel</SelectItem>
                    <SelectItem value="TOLL">Toll</SelectItem>
                    <SelectItem value="REPAIR">Repair</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={typeof field.value === 'number' ? field.value : (typeof field.value === 'string' ? parseFloat(field.value) || 0 : 0)}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
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
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value && field.value instanceof Date && !isNaN(field.value.getTime()) 
                      ? field.value.toISOString().split("T")[0] 
                      : field.value && typeof field.value === 'string'
                      ? field.value
                      : ""}
                    onChange={(e) => {
                      const dateValue = e.target.value ? new Date(e.target.value) : new Date();
                      field.onChange(dateValue);
                    }}
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
            name="tripId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Trip (Optional)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a trip" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {relatedData?.trips?.map((trip) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.departure} → {trip.destination} ({new Date(trip.dateStart).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="vehicleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Related Vehicle (Optional)</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                value={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {relatedData?.vehicles?.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} - {vehicle.brand} {vehicle.model} ({vehicle.type})
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
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes..."
                  {...field}
                  value={field.value || ""}
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
            {isPending ? "Saving..." : type === "create" ? "Create Expense" : "Update Expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

