"use client";

export default function HeroAbout() {
  return (
    <section className="w-full m-0 p-0 hero-banner-full-width">
      <div className="relative w-full h-[46vh] md:h-[60vh] lg:h-[70vh] overflow-hidden m-0 p-0">
        <img
          src="/images/about/heroabout.jpg"
          alt="About us hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute left-6 md:left-10 bottom-6 md:bottom-10">
          <h1 className="text-white text-4xl md:text-6xl font-extrabold tracking-tight">About us</h1>
        </div>
      </div>
    </section>
  );
}


