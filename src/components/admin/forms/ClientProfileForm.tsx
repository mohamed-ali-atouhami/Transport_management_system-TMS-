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
import { Textarea } from "@/components/ui/textarea";
import { clientProfileSchema, ClientProfileSchema } from "@/lib/FormValidationSchema";
import { toast } from "sonner";
import { useActionState, useEffect, useTransition } from "react";
import { updateClientProfile } from "@/lib/actions/profile-management";
import { useRouter } from "next/navigation";

export default function ClientProfileForm({
  data,
  setOpen,
  onSuccess,
}: {
  data: ClientProfileSchema;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      id: data?.id || "",
      userId: data?.userId || "",
      companyName: data?.companyName || "",
      address: data?.address || "",
      vatNumber: data?.vatNumber || "",
    },
  });

  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(updateClientProfile, {
    success: false,
    error: false,
  });
  const router = useRouter();

  useEffect(() => {
    if (state?.success === true) {
      toast.success("Client profile updated successfully!");
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } else if (state?.error) {
      toast.error(state.error || "Failed to update client profile");
      console.error("Form action error:", state.error);
    }
  }, [state, router, setOpen, onSuccess]);

  async function onSubmit(values: ClientProfileSchema) {
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
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter company address"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vatNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>VAT Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter VAT number" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

