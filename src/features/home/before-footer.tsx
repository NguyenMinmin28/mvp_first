"use client";

import Link from "next/link";

export default function BeforeFooter() {
  return (
    <section className="w-full py-2 md:py-3 bg-white -mt-8 sm:-mt-10 lg:-mt-12">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative max-w-5xl mx-auto">
          {/* Large Quotation Mark - Top Left */}
          <div className="absolute top-0 left-0 -translate-y-2 -translate-x-4 md:-translate-x-6 opacity-60">
            <span className="text-6xl md:text-7xl lg:text-8xl font-serif text-gray-200 leading-none">
              "
            </span>
          </div>

          {/* Main Content */}
          <div className="relative pt-4 md:pt-6 pb-8" style={{ transform: 'translateY(-1em)' }}>
            {/* Main Quote - First line with inline image */}
            <div className="mb-4 md:mb-6">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-black leading-tight mb-4 flex items-center gap-2 flex-wrap">
                <span style={{ transform: 'translateY(-0.7em) translateX(0.4em)' }}>Work isn't about control.</span>
                <img
                  src="/images/home/beforefooter.png"
                  alt="Connection illustration"
                  className="inline-block w-48 md:w-64 lg:w-80 h-auto opacity-60"
                  style={{ transform: 'translateY(-0.7em)' }}
                />
              </h2>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-black leading-tight">
                It's about connection.
              </h2>
            </div>

            {/* Supporting Paragraph */}
            <p className="text-base text-gray-700 mb-6 md:mb-8 max-w-2xl">
              That's why Clevrs exists—to bring freedom and respect back to collaboration. Join us and shape the future of direct work.
            </p>

            {/* Call-to-Action Button */}
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-black text-white text-sm hover:bg-gray-800 hover:scale-105 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
            >
              {/* Globe Icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Explore Clevrs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

