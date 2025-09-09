"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Workspace() {
  const { status } = useSession();
  return (
    <section className="w-full py-10 md:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">Login to your workspace</h2>
            <p className="text-gray-700 mb-6 text-lg">
              Access projects, contracts, payments & connections in one place.
            </p>
            {status !== "authenticated" ? (
              <div className="flex items-center gap-6">
                <Link href="/auth/signin" className="inline-flex items-center h-12 px-6 rounded-xl bg-black text-white">
                  Login to your account
                </Link>
                <Link href="/auth/signup" className="underline text-gray-700">
                  Create an account
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/projects" className="inline-flex items-center h-12 px-6 rounded-xl bg-black text-white">
                  Go to my projects
                </Link>
                <Link href="/profile" className="underline text-gray-700">
                  Manage profile
                </Link>
              </div>
            )}
          </div>
          <div>
            <img src="/images/home/loginworkspace.png" alt="workspace" className="w-full h-auto rounded-xl object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}


