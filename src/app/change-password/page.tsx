"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserProfile } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearFlagAndContinue = async () => {
    try {
      setIsClearing(true);
      setError(null);
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: "dummy", newPassword: "dummy" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update status");
      }
      const role = user?.publicMetadata?.role;
      if (typeof role === "string" && role.length > 0) {
        router.push(`/${role.toLowerCase()}`);
      } else {
        router.push("/onboarding");
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="rounded-2xl bg-white p-8 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Change Your Password
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                You must change your temporary password before continuing. Use the form below to update your password.
              </p>
            </div>
            <UserButton />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <UserProfile
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0",
                },
              }}
            />
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={clearFlagAndContinue}
              disabled={isClearing}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isClearing ? "Continuing..." : "I changed my password, continue"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              After changing your password, you will be redirected to your dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

