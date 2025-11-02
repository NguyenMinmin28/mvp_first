"use client";
import Link from "next/link";
import { ImgWithShimmer } from "@/ui/components/image-with-shimmer";

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
    <section className="w-full py-2 md:py-3">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">What Makes Us Different</h2>
        <div className="grid gap-2 md:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.key} className="rounded-xl bg-gray-50 p-3 flex">
              <div className="w-1/2 pr-2 flex flex-col justify-between">
                <div className="mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm md:text-base">{it.title}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{it.desc}</p>
                </div>
                <div className="mt-0.5">
                  <Link 
                    href={`/how-clevrs-work#${it.key}`} 
                    className="text-xs rounded-full px-2.5 py-0.5 text-gray-700 bg-white inline-block hover:bg-gray-100 hover:text-black hover:scale-105 transition-all duration-200 cursor-pointer"
                  >
                    Details
                  </Link>
                </div>
              </div>
              <div className="w-1/2 flex items-center justify-center">
                <ImgWithShimmer 
                  src={it.img} 
                  alt={it.key} 
                  aspectRatio="1/1"
                  className="w-20 h-20 object-contain" 
                  containerClassName="w-20 h-20"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


