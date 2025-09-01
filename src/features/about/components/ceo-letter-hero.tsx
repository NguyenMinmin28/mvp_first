"use client";

import Image from "next/image";
import { Button } from "@/ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function CeoLetterHero() {
  return (
    <section className="relative bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Homepage
            </Button>
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 leading-tight">
              A Letter from Kash, Chief Executive Officer
            </h1>
          </div>
        </div>

        {/* Image - CEO */}
        <div className="mb-8 flex justify-center">
          <div className="max-w-4xl w-full">
            <Image
              src="/images/about/ceo.png"
              alt="Kash, Chief Executive Officer"
              width={800}
              height={500}
              className="object-cover w-full rounded-2xl shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
