"use client";

import Link from "next/link";
import { Calendar, Clock, Minus, Check } from "lucide-react";

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-white shrink-0">
        <Check className="w-3.5 h-3.5" />
      </span>
      <span className="leading-relaxed">{text}</span>
    </li>
  );
}

function PlanCard({ name, price, period, features }: { name: string; price: string; period: string; features: string[] }) {
  return (
    <div className="rounded-2xl border bg-white/70 p-6 flex flex-col">
      <h3 className="font-semibold text-lg mb-6">{name}</h3>
      <div className="mb-6">
        <span className="text-5xl font-bold">{price}</span>
        <span className="ml-2 text-sm text-gray-600">/{period}</span>
      </div>
      <Link href="/pricing" className="h-12 inline-flex items-center justify-center rounded-full bg-black text-white px-6">
        CHOOSE YOUR PLAN
      </Link>
      <div className="mt-6 rounded-xl bg-gray-50 p-4">
        <p className="font-semibold mb-3">Service Include:</p>
        <ul className="space-y-2 text-sm text-gray-700">
          {features.map((f, i) => (
            <FeatureItem key={i} text={f} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Subscription() {
  return (
    <section className="w-full py-10 md:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-4xl font-extrabold tracking-tight mb-8">Subscription for clients</h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <PlanCard
              name="Basic Plan"
              price="$0"
              period="monthly"
              features={[
                "Monthly Post 1 project free.",
                "Contact up to 5 freelancer per project.",
                "Get notified when freelancers show interest",
              ]}
            />
            <PlanCard
              name="Plus Plan"
              price="$19.95"
              period="monthly"
              features={[
                "Post up to 10 projects per month.",
                "Contact up to 10 freelancer per project",
                "Get notified when freelancers show interest",
              ]}
            />
            <PlanCard
              name="Pro Plan"
              price="$99.95"
              period="monthly"
              features={[
                "Unlimited project postings",
                "Unlimited contacts per project.",
                "Get notified when freelancers show interest",
              ]}
            />
          </div>
          <div className="rounded-2xl border bg-white/70 p-6">
            <h3 className="font-semibold text-xl mb-6">Benefits</h3>
            <ul className="space-y-6 text-gray-800">
              <li className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-gray-100"><Calendar className="w-5 h-5" /></span>
                <p className="font-medium">Post projects anytime and connect instantly</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-gray-100"><Clock className="w-5 h-5" /></span>
                <p className="font-medium">Flexible contracts with direct agreements</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-gray-100"><Minus className="w-5 h-5" /></span>
                <p className="font-medium">Keep 100% earnings, zero commission</p>
              </li>
            </ul>
            <Link href="/pricing" className="inline-block mt-8 underline">See terms</Link>
          </div>
        </div>
      </div>
    </section>
  );
}


