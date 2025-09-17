"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { 
  Code, 
  Smartphone, 
  Database, 
  Cloud, 
  Palette,
  Search
} from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  price: string;
  features: string[];
  rating: number;
  jobsCount: number;
}

const services: Service[] = [
  {
    id: "web-development",
    title: "Web Development",
    description: "Custom websites and web applications built with modern technologies",
    icon: <Code className="w-8 h-8" />,
    price: "From $50/h",
    features: ["React", "Next.js", "Node.js", "TypeScript"],
    rating: 4.8,
    jobsCount: 156
  },
  {
    id: "mobile-development",
    title: "Mobile Development",
    description: "iOS and Android apps for your business needs",
    icon: <Smartphone className="w-8 h-8" />,
    price: "From $60/h",
    features: ["React Native", "Flutter", "Swift", "Kotlin"],
    rating: 4.6,
    jobsCount: 89
  },
  {
    id: "backend-development",
    title: "Backend Development",
    description: "Scalable server-side solutions and APIs",
    icon: <Database className="w-8 h-8" />,
    price: "From $45/h",
    features: ["Python", "Java", "Go", "Microservices"],
    rating: 4.7,
    jobsCount: 203
  },
  {
    id: "cloud-services",
    title: "Cloud Services",
    description: "Cloud infrastructure and deployment solutions",
    icon: <Cloud className="w-8 h-8" />,
    price: "From $55/h",
    features: ["AWS", "Azure", "Docker", "Kubernetes"],
    rating: 4.9,
    jobsCount: 67
  },
  {
    id: "ui-ux-design",
    title: "UI/UX Design",
    description: "Beautiful and user-friendly interface designs",
    icon: <Palette className="w-8 h-8" />,
    price: "From $40/h",
    features: ["Figma", "Adobe XD", "Prototyping", "User Research"],
    rating: 4.5,
    jobsCount: 124
  }
];

export function ServicesStrip() {
  return (
    <div className="mt-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Services</h2>
        <Button className="bg-black text-white hover:bg-black/90" asChild>
          <a href="/services">Browse more</a>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {services.map((service) => (
          <Card key={service.id} className="hover:shadow-md transition-shadow border border-gray-200 h-full">
            <CardContent className="p-5 h-full flex flex-col">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                  {service.icon}
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 text-center mb-2">{service.title}</h3>
              
              <p className="text-sm text-gray-600 text-center mb-4 line-clamp-3">
                {service.description}
              </p>

              <div className="flex items-center justify-between mt-4 text-sm">
                <div>
                  <div className="font-semibold leading-tight">{service.rating.toFixed(1)}</div>
                  <div className="mt-1 flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const ratingValue = Math.round(service.rating);
                      const filled = i < ratingValue;
                      return (
                        <span
                          key={i}
                          className={`text-[10px] ${filled ? "text-red-500" : "text-gray-300"} mr-0.5`}
                        >
                          ★
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="font-semibold">{service.jobsCount}</div>
                  <div className="text-xs text-gray-500">Job</div>
                </div>
                <div>
                  <div className="font-semibold">{service.price}</div>
                  <div className="text-xs text-gray-500">Rate</div>
                </div>
              </div>

              <Button className="w-full mt-auto border border-[#838383] bg-transparent hover:bg-gray-50 text-gray-900" variant="outline">
                Get in Touch
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ServicesStrip;
