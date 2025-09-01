"use client";

import Link from "next/link";

export default function CEOSection() {
  return (
    <section className="w-full">
      <div className="relative w-full h-[48vh] md:h-[60vh] lg:h-[70vh] overflow-hidden">
        <img
          src="/images/about/ceo.png"
          alt="CEO"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute left-6 md:left-10 top-8 md:top-16 max-w-xl">
          <h3 className="text-white text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            A word from our
            <br /> CEO
          </h3>
          <p className="text-white/90 text-base md:text-lg leading-relaxed mb-6">
            At Clevrs, we cut out middlemen and fees. What remains is freedom—clients connect directly,
            freelancers earn fully, and both build with respect. This isn’t just a platform—it’s a clear,
            human way to work: direct, fair, and simple.
          </p>
          <Link href="/ceo-letter" className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-black hover:bg-black hover:text-white border border-white transition-colors">
            Read letter
          </Link>
        </div>
      </div>
    </section>
  );
}


