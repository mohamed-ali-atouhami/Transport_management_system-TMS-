"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-4 text-center text-gray-900">
      <SignedOut>
        <div className="space-y-4 rounded-xl bg-white p-10 shadow-lg">
          <h1 className="text-2xl font-semibold">Please sign in</h1>
          <p className="text-sm text-gray-600">
            You need to sign in before we can complete your account setup.
          </p>
          <SignInButton mode="modal">
            <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-800">
              Sign In
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="space-y-4 rounded-xl bg-white p-10 shadow-lg">
          <h1 className="text-2xl font-semibold">We’re almost ready</h1>
          <p className="text-sm text-gray-600">
            Your account is missing a role assignment. Please contact an administrator
            so they can update your profile. You will be redirected automatically once
            the role is set.
          </p>
        </div>
        <UserButton/>
      </SignedIn>
    </div>
  );
}

