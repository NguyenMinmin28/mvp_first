export default function Principles() {
  return (
    <section className="w-full py-12 md:py-16">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 space-y-16">
        {/* Freedom First */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <img src="/images/about/freedom.jpg" alt="Freedom First" className="w-full h-64 md:h-80 object-cover rounded" />
          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold mb-3">Freedom First</h3>
            <p className="text-gray-700 leading-relaxed">
              We believe work should be open and limitless. That’s why we remove the middlemen, the unnecessary
              fees, and the restrictions that hold people back. What’s left is pure freedom—for clients to
              find talent without barriers, and for freelancers to earn fully and on their own terms.
            </p>
            <a href="#" className="mt-4 inline-block underline">Learn more</a>
          </div>
        </div>

        {/* Respect at the Core */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold mb-3">Respect at the Core</h3>
            <p className="text-gray-700 leading-relaxed">
              Every great partnership begins with respect. On our platform, fairness isn’t an add‑on—it’s the
              foundation. We’re creating a space where trust comes first, where both sides are valued equally,
              and where collaboration is driven by mutual appreciation, not exploitation.
            </p>
            <div className="mt-4 space-x-4">
              <a href="#" className="underline">How to use the Clevrs</a>
              <a href="#" className="underline">Subscriptions</a>
            </div>
          </div>
          <img src="/images/about/core.jpg" alt="Respect at the Core" className="w-full h-64 md:h-80 object-cover rounded" />
        </div>

        {/* Direct by Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <img src="/images/about/directdesign.png" alt="Direct by Design" className="w-full h-64 md:h-80 object-cover rounded" />
          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold mb-3">Direct by Design</h3>
            <p className="text-gray-700 leading-relaxed">
              We don’t believe in layers that complicate connections. Our platform is built to be clear,
              transparent, and direct—where clients and freelancers speak freely, agree openly, and work
              together without hidden obstacles. It’s simplicity with purpose, designed for real results.
            </p>
            <a href="#" className="mt-4 inline-block underline">Learn more</a>
          </div>
        </div>
      </div>
    </section>
  );
}


