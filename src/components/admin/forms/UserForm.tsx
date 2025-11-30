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
import { userSchema, UserSchema } from "@/lib/FormValidationSchema";
import { toast } from "sonner";
import { useActionState, useEffect, useTransition } from "react";
import { updateUser } from "@/lib/actions/user-management";
import { useRouter } from "next/navigation";

export default function UserForm({
  type,
  data,
  setOpen,
  onSuccess,
}: {
  type: "create" | "edit";
  data?: UserSchema | null;
  setOpen: (open: boolean) => void;
  relatedData?: any;
  onSuccess?: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      id: data?.id || "",
      name: data?.name || "",
      email: data?.email ?? "",
      username: data?.username || "",
      phone: data?.phone ?? "",
      role: data?.role || "DRIVER",
      image: data?.image ?? null,
      licenseNumber: data?.licenseNumber || "",
      experienceYears: data?.experienceYears ?? 0,
      companyName: data?.companyName || "",
      address: data?.address || "",
      vatNumber: data?.vatNumber ?? "",
    },
  });

  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(updateUser, {
    success: false,
    error: false,
  });
  const router = useRouter();

  useEffect(() => {
    if (state?.success === true) {
      toast.success("User updated successfully!");
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } else if (state?.error) {
      toast.error(state.error || "Failed to update user");
      console.error("Form action error:", state.error);
    }
  }, [state, router, setOpen, onSuccess]);

  async function onSubmit(values: UserSchema) {
    try {
      startTransition(() => {
        formAction(values);
      });
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An unexpected error occurred");
    }
  }

  const role = form.watch("role");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    {...field} 
                    value={field.value ?? ""}
                    placeholder="Optional"
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-gray-500 mt-1">
                  Optional. Leave empty if not needed.
                </p>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Optional - for username sign-in"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to remove username. Used for username/password sign-in.
                </p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input type="tel" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="role"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Role *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="DRIVER">Driver</SelectItem>
                  <SelectItem value="CLIENT">Client</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  folder="transport-management/users"
                  label="Profile Image"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {role === "DRIVER" && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium">Driver Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>License Number *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experienceYears"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {role === "CLIENT" && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium">Client Information</h3>
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vatNumber"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>VAT Number</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

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
            {isPending ? "Updating..." : "Update User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

