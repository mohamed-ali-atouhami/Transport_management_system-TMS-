"use client";

import { useState } from "react";
import { assignUserRole } from "@/lib/actions/user-management";

type UserRole = "ADMIN" | "DRIVER" | "CLIENT";

export function AssignUserRoleForm() {
  const [role, setRole] = useState<UserRole>("DRIVER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const identifier = (formData.get("identifier") as string)?.trim();

    const payload: any = {
      identifier,
      role,
    };
    if (role === "DRIVER") {
      payload.licenseNumber = (formData.get("licenseNumber") as string)?.trim();
      if (!payload.licenseNumber) {
        setMessage({ type: "error", text: "License number is required for driver role" });
        setIsSubmitting(false);
        return;
      }
      const exp = formData.get("experienceYears") as string;
      payload.experienceYears = exp ? parseInt(exp) : undefined;
    }
    if (role === "CLIENT") {
      payload.companyName = (formData.get("companyName") as string)?.trim();
      payload.address = (formData.get("address") as string)?.trim();
      payload.vatNumber = (formData.get("vatNumber") as string)?.trim() || undefined;
      if (!payload.companyName || !payload.address) {
        setMessage({ type: "error", text: "Company name and address are required for client role" });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const res = await assignUserRole(payload);
      if (res.success) {
        setMessage({ type: "success", text: res.message });
        form.reset();
      } else {
        setMessage({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to assign role" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6">Assign Role to Existing User</h2>

      {message && (
        <div
          className={`mb-4 p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
            User identifier (email or username) *
          </label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-xs text-gray-500 mt-1">Enter the Clerk email or username of the user.</p>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="ADMIN">Admin</option>
            <option value="DRIVER">Driver</option>
            <option value="CLIENT">Client</option>
          </select>
        </div>

        {role === "DRIVER" && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium text-gray-700">Driver Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  License Number *
                </label>
                <input
                  type="text"
                  id="licenseNumber"
                  name="licenseNumber"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  id="experienceYears"
                  name="experienceYears"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
          </div>
        )}

        {role === "CLIENT" && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium text-gray-700">Client Information</h3>
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                id="address"
                name="address"
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700 mb-1">
                VAT Number (Optional)
              </label>
              <input
                type="text"
                id="vatNumber"
                name="vatNumber"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Assign Role"}
          </button>
        </div>
      </form>
    </div>
  );
}


