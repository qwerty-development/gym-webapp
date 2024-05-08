'use client'
import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { UserButton, useUser } from '@clerk/nextjs';

export default function Example() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <div className="bg-[#232623] min-h-screen flex flex-col justify-center items-center">
      <div className="mb-8">
        <img
          src="/images/logo.png"
          className="w-auto h-60"
        />
      </div>

      {/* Welcome back or Sign in message */}
      <SignedIn>
          <UserButton />
        <p className="text-white text-center mt-12 font-extrabold text-4xl mb-12">Welcome back {user?.fullName}!</p>
      </SignedIn>




      <SignedOut>
        <p className="text-white text-center font-extrabold text-4xl mb-12">Sign in or create an account</p>
      </SignedOut>

      {/* Sign In and Sign Up buttons */}
      <div className="flex flex-col gap-4">
        <SignedOut>
          <a
            href="/sign-in"
            className="rounded-md bg-[#36783a] px-10 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 focus-visible:outline focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          >
            Sign In
          </a>
          <a
            href="/sign-up"
            className="rounded-md bg-[#36783a] px-10 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 focus-visible:outline focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          >
            Sign Up
          </a>
        </SignedOut>

        <SignedIn>
          <a
            href="/users/dashboard"
            className="rounded-md bg-[#36783a] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 focus-visible:outline focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          >
            Go to dashboard!
          </a>
        </SignedIn>
      </div>

      {/* Content */}
    </div>
  );
}
