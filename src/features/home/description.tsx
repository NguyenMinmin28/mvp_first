"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Description() {
  const items: Array<{ key: string; title: string; desc: string; img: string }> = [
    { key: "commission", title: "0% Commission", desc: "Keep 100% earnings", img: "/images/home/commission.png" },
    { key: "connection", title: "Direct Connection", desc: "No middlemen", img: "/images/home/connection.png" },
    { key: "ai", title: "AI Match", desc: "Find best fast", img: "/images/home/ai.png" },
    { key: "freedom", title: "Mutual Freedom", desc: "Work with respect", img: "/images/home/freedom.png" },
    { key: "simplecontract", title: "Simple Contracts", desc: "Clear & secure", img: "/images/home/simplecontract.png" },
    { key: "globaltalent", title: "Global Talent", desc: "Hire worldwide", img: "/images/home/globaltalent.png" },
  ];

  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [cardVisibility, setCardVisibility] = useState<boolean[]>(new Array(6).fill(false));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Trigger cards animation with delay
            items.forEach((_, idx) => {
              setTimeout(() => {
                setCardVisibility(prev => {
                  const newVisibility = [...prev];
                  newVisibility[idx] = true;
                  return newVisibility;
                });
              }, idx * 150);
            });
          }
        });
      },
      { threshold: 0.15, rootMargin: '-50px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} className="w-full mt-8 md:mt-5 pt-8 md:pt-12 pb-12 md:pb-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className={`text-2xl md:text-3xl font-bold mb-6 transition-all duration-1000 transform ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          What Makes Us Different
        </h2>
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, idx) => (
            <div 
              key={it.key} 
              className={`rounded-xl bg-gray-50 p-5 flex hover:bg-gray-100 hover:shadow-lg transition-all duration-700 ease-out transform ${
                cardVisibility[idx] ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
              }`}
            >
              <div className="w-1/2 pr-4 flex flex-col justify-between">
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900">{it.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{it.desc}</p>
                </div>
                <div className="mt-2">
                  <Link href={`/how-clevrs-work#${it.key}`} className="text-xs rounded-full px-3 py-1 text-gray-700 bg-white inline-block hover:bg-gray-900 hover:text-white transition-colors duration-300">Details</Link>
                </div>
              </div>
              <div className="w-1/2 flex items-center justify-center">
                <img src={it.img} alt={it.key} className="w-20 h-20 object-contain transition-transform duration-500 hover:scale-110 hover:rotate-6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


