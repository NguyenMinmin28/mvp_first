export default function CompanyInfo() {
  return (
    <section className="w-full py-12 md:py-16">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-8">Company info</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
          {/* Built on Fairness */}
          <div>
            <img src="/images/about/fairness.png" alt="Built on Fairness" className="w-full h-64 md:h-80 object-cover rounded" />
            <h3 className="text-xl md:text-2xl font-bold mt-6">Built on Fairness</h3>
            <p className="text-gray-700 mt-3 leading-relaxed">
              Too often, freelancers lose earnings to endless cuts, while clients pay more without seeing the value.
              We’re changing that. By removing extra costs, we make sure freelancers keep what they earn and clients
              get the full benefit of their investment. Fairness is not a feature—it’s the rule.
            </p>
            <a href="#" className="mt-4 inline-block underline">Learn more</a>
          </div>

          {/* Future of Work, Simplified */}
          <div>
            <img src="/images/about/futureofwork.jpg" alt="Future of Work, Simplified" className="w-full h-64 md:h-80 object-cover rounded" />
            <h3 className="text-xl md:text-2xl font-bold mt-6">Future of Work, Simplified</h3>
            <p className="text-gray-700 mt-3 leading-relaxed">
              The world of work is evolving, but complexity shouldn’t be part of it. We’re building a future where
              opportunity is open, connections are easy, and success is shared. A place where technology enables freedom,
              not control—and where the way we work feels simple, fair, and human.
            </p>
            <a href="#" className="mt-4 inline-block underline">Learn more</a>
          </div>
        </div>
      </div>
    </section>
  );
}


