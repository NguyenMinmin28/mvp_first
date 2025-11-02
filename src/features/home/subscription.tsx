"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/components/tooltip";
import { ImgWithShimmer } from "@/ui/components/image-with-shimmer";

function SolidCalendarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm13 9H4v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8ZM5 7a1 1 0 0 0-1 1v1h16V8a1 1 0 0 0-1-1H5Z" />
    </svg>
  );
}

function SolidClockIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm1 5a1 1 0 1 0-2 0v5c0 .266.106.52.293.707l3 3a1 1 0 1 0 1.414-1.414L13 10.586V7Z" />
    </svg>
  );
}

function HollowClockIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="#ffffff"
        stroke="#000000"
        strokeWidth="2"
      />
      <path
        d="M12 7v5l3 3"
        fill="none"
        stroke="#000000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SolidEarningIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 18a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm0-5a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm0-5a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Z" />
    </svg>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#6D6D6D] text-white shrink-0">
        <Check className="w-2.5 h-2.5" />
      </span>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <span className="leading-relaxed whitespace-nowrap truncate cursor-help">
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </li>
  );
}

function PlanCard({
  name,
  price,
  period,
  features,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
}) {
  return (
    <div className="rounded-2xl border bg-white/70 p-3 md:p-4 flex flex-col h-full">
      <div className="mb-3">
        <h3 className="font-semibold text-sm md:text-base text-left">{name}</h3>
        <div className="mt-1.5 mx-1 h-px bg-[#DEE0E2]"></div>
      </div>
      <div className="mb-3 md:mb-4">
        <span className="text-2xl md:text-3xl font-bold">{price}</span>
        <span className="ml-2 text-sm text-gray-600">/{period}</span>
      </div>
      <Link
        href="/pricing"
        className="h-10 inline-flex items-center justify-center rounded-full bg-black text-white px-5 text-sm hover:bg-gray-800 hover:scale-105 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
      >
        {name === "Free Plan"
          ? "Current Plan"
          : name === "Plus Plan"
            ? "Upgrade to Plus"
            : "Choose your plan"}
      </Link>
      <div className="mt-3 md:mt-4 rounded-xl bg-[#FAFAFA] p-3">
        <p className="font-semibold mb-2 text-sm">Service Include:</p>
        <ul className="space-y-1.5 text-sm text-gray-700">
          {features.map((f, i) => (
            <FeatureItem key={i} text={f} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function BenefitCard() {
  return (
    <div className="w-full h-full max-w-full rounded-2xl border bg-white/70 p-3 md:p-4 flex flex-col">
      <h3 className="font-semibold text-sm md:text-base mb-3">Benefits</h3>
      <ul className="space-y-3 text-gray-800">
        <li className="flex items-start gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center">
            <ImgWithShimmer
              src="/images/home/calendar.jpg"
              alt="calendar"
              aspectRatio="1/1"
              className="w-5 h-5 object-contain"
              containerClassName="w-5 h-5"
            />
          </span>
          <p className="font-medium text-sm">
            Post projects anytime and connect instantly
          </p>
        </li>
        <li className="flex items-start gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center">
            <HollowClockIcon className="w-5 h-5" />
          </span>
          <p className="font-medium text-sm">
            Flexible contracts with direct agreements
          </p>
        </li>
        <li className="flex items-start gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center">
            <ImgWithShimmer
              src="/images/home/pay.png"
              alt="earnings"
              aspectRatio="1/1"
              className="w-5 h-5 object-contain"
              containerClassName="w-5 h-5"
            />
          </span>
          <p className="font-medium text-sm">Keep 100% earnings, zero commission</p>
        </li>
      </ul>
      <Link 
        href="/pricing" 
        className="inline-block mt-auto underline-animated text-sm hover:text-black transition-all duration-200 cursor-pointer"
      >
        See terms
      </Link>
    </div>
  );
}

export default function Subscription() {
  return (
    <TooltipProvider>
      <section className="w-full py-2 md:py-3">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
            Subscription for clients
          </h2>
          {/* 3 Equal Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <PlanCard
              name="Free Plan"
              price="$0"
              period="monthly"
              features={[
                "25 connects total",
                "Post unlimited projects",
                "Contact developers with connects",
                "Get notified when freelancers show interest",
              ]}
            />
            <PlanCard
              name="Plus Plan"
              price="$19.95"
              period="monthly"
              features={[
                "Unlimited connects",
                "Unlimited projects",
                "Contact developers with connects",
                "Get notified when freelancers show interest",
              ]}
            />
            <BenefitCard />
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}
