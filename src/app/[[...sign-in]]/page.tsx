"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useUser } from "@clerk/nextjs";  
/*import Image from "next/image";*/
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
 const { isLoaded, isSignedIn, user } = useUser();
 /*console.log(user?.publicMetadata?.role);*/
 const router = useRouter();
 const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    // Check if user needs to change password
    const requiresPasswordChange = user?.publicMetadata?.requiresPasswordChange;
    if (requiresPasswordChange === true) {
      router.push("/change-password");
      return;
    }

    const role = user?.publicMetadata?.role;

    if (typeof role === "string" && role.length > 0) {
      router.push(`/${role.toLowerCase()}`);
      return;
    }
    router.push("/onboarding");
  }, [isLoaded, isSignedIn, user, router]);

  return (
    <div className="grid h-screen w-full flex-grow items-center bg-medaliSkyLight px-4 sm:justify-center">
      <SignIn.Root>
        <SignIn.Step
          name="start"
          className="w-full space-y-6 rounded-2xl bg-white px-4 py-10 shadow-md ring-1 ring-black/5 sm:w-96 sm:px-8"
        >
          <header className="text-center">
            {/* <Image
              className="mx-auto"
              src="/LogoSchool.png"
              alt="SchoolMed logo"
              width={70}
              height={70}
              priority
            /> */}
            <h1 className="mt-4 text-xl font-medium tracking-tight text-zinc-950">
              Sign in to TMS
            </h1>
          </header>

          <Clerk.GlobalError className="block text-sm text-red-400" />

          <div className="space-y-4">
            <Clerk.Field name="identifier" className="space-y-2">
              <Clerk.Label className="text-sm font-medium text-zinc-950">
                Username
              </Clerk.Label>
              <Clerk.Input
                type="text"
                required
                className="w-full rounded-md bg-white px-3.5 py-2 text-sm outline-none ring-1 ring-inset ring-zinc-300 hover:ring-zinc-400 focus:ring-[1.5px] focus:ring-zinc-950 data-[invalid]:ring-red-400"
              />
              <Clerk.FieldError className="block text-sm text-red-400" />
            </Clerk.Field>

            <Clerk.Field name="password" className="space-y-2">
              <Clerk.Label className="text-sm font-medium text-zinc-950">
                Password
              </Clerk.Label>
              <div className="relative">
                <Clerk.Input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full rounded-md bg-white px-3.5 py-2 pr-10 text-sm outline-none ring-1 ring-inset ring-zinc-300 hover:ring-zinc-400 focus:ring-[1.5px] focus:ring-zinc-950 data-[invalid]:ring-red-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 focus:outline-none focus:text-zinc-700 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Clerk.FieldError className="block text-sm text-red-400" />
            </Clerk.Field>
          </div>

          <SignIn.Action
            submit
            className="w-full rounded-md bg-zinc-950 px-3.5 py-1.5 text-center text-sm font-medium text-white shadow outline-none ring-1 ring-inset ring-zinc-950 hover:bg-zinc-800 focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-zinc-950 active:text-white/70"
          >
            Sign In
          </SignIn.Action>
        </SignIn.Step>
      </SignIn.Root>
    </div>
  );
}