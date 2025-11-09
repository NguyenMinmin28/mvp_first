export default function Together() {
  return (
    <section className="w-full py-12 md:py-16 m-0">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 md:gap-16">
          <div>
            <h2 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Together,
              <br />
              Let’s Create What’s Next
            </h2>
            <a
              href="/"
              className="mt-8 inline-flex items-center justify-center rounded-md bg-black text-white px-5 py-3 text-base font-semibold shadow-sm hover:bg-black/90"
            >
              Get Started
            </a>
          </div>
          <div className="flex md:justify-end">
            <img
              src="/images/about/logo.png"
              alt="Clevrs Logo"
              className="w-52 h-52 md:w-[520px] md:h-[520px] object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}


