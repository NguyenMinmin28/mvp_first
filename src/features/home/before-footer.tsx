"use client";

import Link from "next/link";

export default function BeforeFooter() {
  return (
    <section className="w-full py-2 md:py-3 bg-white -mt-8 sm:-mt-10 lg:-mt-12">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative max-w-5xl mx-auto overflow-visible">
          {/* Quote Mark and Image Container */}
          <div className="relative" style={{ height: '120px', marginBottom: '-60px' }}>
            {/* Large Quotation Mark - Top Left */}
            <div className="absolute top-0 left-0 opacity-60 z-0" style={{ lineHeight: 0, margin: 0, padding: 0 }}>
              <span className="text-9xl md:text-[10rem] lg:text-[14rem] font-serif text-gray-300 leading-none select-none block" style={{ margin: 0, padding: 0, lineHeight: 1, verticalAlign: 'top' }}>
                &ldquo;
              </span>
            </div>
          </div>

          {/* Image - Top Right - Outside container to avoid conflicts */}
          <img
            src="/images/home/beforefooter.png"
            alt="Connection illustration"
            className="absolute top-0 right-0 w-[4rem] md:w-[10.67rem] lg:w-[13.33rem] h-auto opacity-60 z-0"
            style={{ 
              transform: 'translateY(-3rem) translateX(-26rem)', 
              margin: 0, 
              padding: 0, 
              display: 'block' 
            }}
          />

          {/* Main Content */}
          <div className="relative pb-8 pt-8 md:pt-10 lg:pt-12" style={{ transform: 'translateY(-1em)' }}>
            {/* Main Quote - First line */}
            <div style={{ marginBottom: 0, position: 'relative', zIndex: 1 }}>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-black font-serif" style={{ lineHeight: '1.2', marginBottom: 0, marginTop: 0 }}>
                Work isn't about control.
              </h2>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-black font-serif" style={{ lineHeight: '1.2', marginTop: '0.5rem', marginBottom: 0 }}>
                It's about connection.
              </h2>
            </div>

            {/* Supporting Paragraph */}
            <p className="text-base text-gray-700 mb-6 md:mb-8 max-w-2xl font-sans" style={{ marginTop: '1rem', position: 'relative', zIndex: 1 }}>
              That's why Clevrs exists—to bring freedom and respect back to collaboration. Join us and shape the future of direct work.
            </p>

            {/* Call-to-Action Button */}
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-black text-white text-sm hover:bg-gray-800 hover:scale-105 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg font-sans"
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

