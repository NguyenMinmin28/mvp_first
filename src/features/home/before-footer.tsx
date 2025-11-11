"use client";

import Link from "next/link";

export default function BeforeFooter() {
  return (
    <section className="w-full py-8 md:py-12 lg:py-16 bg-white -mt-8 sm:-mt-10 lg:-mt-12">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="relative max-w-6xl xl:max-w-7xl mx-auto overflow-visible">
          {/* Quote Mark and Image Container */}
          <div className="relative" style={{ height: '120px', marginBottom: '-60px' }}>
            {/* Large Quotation Mark - Top Left */}
            <div className="absolute top-0 left-0 opacity-60 z-0" style={{ lineHeight: 0, margin: 0, padding: 0 }}>
              <span className="text-9xl md:text-[10rem] lg:text-[14rem] xl:text-[16rem] font-serif text-gray-300 leading-none select-none block" style={{ margin: 0, padding: 0, lineHeight: 1, verticalAlign: 'top' }}>
                &ldquo;
              </span>
            </div>
          </div>

          {/* Decorative Image - Top Right */}
          <div className="absolute top-0 right-0 opacity-60 z-0 hidden lg:block" style={{ transform: 'translateY(-3rem) translateX(2rem)' }}>
            <img
              src="/images/home/beforefooter.png"
              alt="Connection illustration"
              className="w-[10.67rem] lg:w-[13.33rem] xl:w-[16rem] h-auto"
              style={{ margin: 0, padding: 0, display: 'block' }}
            />
          </div>

          {/* Main Content */}
          <div className="relative pb-8 pt-8 md:pt-10 lg:pt-12" style={{ transform: 'translateY(-1em)' }}>
            {/* Main Quote */}
            <div className="flex flex-col items-center" style={{ marginBottom: 0, position: 'relative', zIndex: 1 }}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-black font-serif text-center" style={{ lineHeight: '1.2', marginBottom: 0, marginTop: 0 }}>
                Work isn't about control.
              </h2>
              <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-black font-serif text-center" style={{ lineHeight: '1.2', marginTop: '0.5rem', marginBottom: 0 }}>
                It's about connection.
              </h2>
            </div>

            {/* Supporting Paragraph and Button - Centered */}
            <div className="flex flex-col items-center mt-6 md:mt-8" style={{ position: 'relative', zIndex: 1 }}>
              <p className="text-base md:text-lg lg:text-xl text-gray-700 mb-6 md:mb-8 max-w-3xl xl:max-w-4xl font-sans text-center">
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
      </div>
    </section>
  );
}

