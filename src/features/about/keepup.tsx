export default function KeepUp() {
  return (
    <section className="w-full py-12 md:py-16 m-0">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-10">Keep up with the latest</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {/* Stories That Matter */}
          <div>
            <div className="w-12 h-12 rounded bg-black/90 flex items-center justify-center mb-6">
              {/* Custom Megaphone icon (since not available in shared icons) */}
              <svg
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-white fill-none stroke-current"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 11v2"/>
                <path d="M7 9v6"/>
                <path d="M7 12l10-4v8l-10-4z"/>
                <path d="M3 13c0 3 1.5 5 4 5h2"/>
              </svg>
            </div>
            <h3 className="text-xl md:text-2xl font-bold">Stories That Matter</h3>
            <p className="text-gray-700 mt-3 leading-relaxed">
              Beyond announcements, this is where we share the progress, partnerships, and
              updates that show how we’re reshaping the future of work every day.
            </p>
            <a href="#" className="mt-4 inline-block underline">Go to Newsroom</a>
          </div>

          {/* Clevrs Blog */}
          <div>
            <div className="w-12 h-12 rounded bg-black/90 flex items-center justify-center mb-6">
              <img src="/images/about/blog.png" alt="Blog" className="w-6 h-6 object-contain invert" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold">Clevrs Blog</h3>
            <p className="text-gray-700 mt-3 leading-relaxed">
              Insights, stories, and tips on building direct connections, navigating freelance work, and
              discovering the future of collaboration.
            </p>
            <a href="#" className="mt-4 inline-block underline">Read our post</a>
          </div>

          {/* Why Invest in Clevrs */}
          <div>
            <div className="w-12 h-12 rounded bg-black/90 flex items-center justify-center mb-6">
              <img src="/images/about/invest.png" alt="Invest" className="w-6 h-6 object-contain invert" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold">Why Invest in Clevrs</h3>
            <p className="text-gray-700 mt-3 leading-relaxed">
              The future of freelancing is direct, transparent, and human. Learn why Clevrs is uniquely
              positioned to redefine the market and unlock value for millions worldwide.
            </p>
            <a href="#" className="mt-4 inline-block underline">Learn more</a>
          </div>
        </div>
      </div>
    </section>
  );
}


