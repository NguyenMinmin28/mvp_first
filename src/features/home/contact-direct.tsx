"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function ContactDirect() {
  const { status } = useSession();
  return (
    <section className="w-full py-10 md:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <img src="/images/home/directconnet.png" alt="Contact Direct. No Middleman." className="w-full h-auto rounded-xl object-cover" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold tracking-tight mb-4">Contact Direct. No Middleman.</h3>
            <p className="text-gray-700 mb-6">
              Connect with freelancers and clients instantly—no agents, no hidden costs. Work together with 0% fees on both sides and keep every rupee you earn.
            </p>
            {status !== "authenticated" ? (
              <div className="flex items-center gap-6">
                <Link href="/auth/signin" className="inline-flex items-center h-10 px-5 rounded-xl bg-black text-white">Get Started</Link>
                <Link href="/auth/signin" className="underline text-sm text-gray-700">Already have an account? Sign in</Link>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <Link href="/projects" className="inline-flex items-center h-10 px-5 rounded-xl bg-black text-white">Go to Projects</Link>
                <Link href="/profile" className="underline text-sm text-gray-700">Manage Profile</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


