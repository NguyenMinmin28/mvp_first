"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";

type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
};

const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic Plan",
    price: "$0",
    period: "/monthly",
    features: [
      "Monthly Post 1 project free.",
      "Contact up to 5 freelancer per project.",
      "Get notified when freelancers show interest",
    ],
    cta: "CHOOSE YOUR PLAN",
  },
  {
    id: "plus",
    name: "Plus Plan",
    price: "$19.95",
    period: "/monthly",
    features: [
      "Post up to 10 projects per month.",
      "Contact up to 10 freelancer per project",
      "Get notified when freelancers show interest",
    ],
    cta: "CHOOSE YOUR PLAN",
  },
  {
    id: "pro",
    name: "Pro  Plan",
    price: "$99.95",
    period: "/monthly",
    features: [
      "Unlimited project postings",
      "Unlimited contacts per project.",
      "Get notified when freelancers show interest",
    ],
    cta: "CHOOSE YOUR PLAN",
  },
];

export default function SimplePricingPage() {
  return (
    <section className="w-full py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold text-center mb-8">
          Upgrade your plan
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.id} className="border-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-4 border-t">
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-extrabold">{plan.price}</span>
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  </div>
                </div>

                <Button className="w-full h-12 text-sm font-semibold mt-2">
                  {plan.cta}
                </Button>

                <div className="mt-6 rounded-md border bg-gray-50">
                  <div className="px-4 py-3 font-semibold">Service Include:</div>
                  <ul className="px-4 pb-4 space-y-3 text-sm text-gray-700">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-gray-600" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}


