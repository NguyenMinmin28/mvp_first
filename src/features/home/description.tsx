"use client";
import Link from "next/link";

export default function Description() {
  const items: Array<{ key: string; title: string; desc: string; img: string }> = [
    { key: "commission", title: "0% Commission", desc: "Keep 100% earnings", img: "/images/home/commission.png" },
    { key: "connection", title: "Direct Connection", desc: "No middlemen", img: "/images/home/connection.png" },
    { key: "ai", title: "AI Match", desc: "Find best fast", img: "/images/home/ai.png" },
    { key: "freedom", title: "Mutual Freedom", desc: "Work with respect", img: "/images/home/freedom.png" },
    { key: "simplecontract", title: "Simple Contracts", desc: "Clear & secure", img: "/images/home/simplecontract.png" },
    { key: "globaltalent", title: "Global Talent", desc: "Hire worldwide", img: "/images/home/globaltalent.png" },
  ];

  return (
    <section className="w-full mt-8 md:mt-5 pt-16 md:pt-20 pb-12 md:pb-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">What Makes Us Different</h2>
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.key} className="rounded-xl border bg-gray-50 p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{it.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{it.desc}</p>
                </div>
                <img src={it.img} alt={it.key} className="w-16 h-16 object-contain" />
              </div>
              <div className="mt-4">
                <Link href={`/how-clevrs-work#${it.key}`} className="text-xs rounded-full border px-3 py-1 text-gray-700 bg-white inline-block">Details</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


