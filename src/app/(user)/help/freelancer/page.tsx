// Cache help pages for 1 hour
export const revalidate = 3600;

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { ArrowLeft, User, Briefcase, DollarSign, Star, MessageCircle } from "lucide-react";
import Link from "next/link";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";

export default async function FreelancerHelpPage() {
  const user = await getServerSessionUser();
  const helpTopics = [
    {
      title: "Getting Started",
      description: "Complete your profile and start receiving project invitations",
      icon: User,
      href: "/help/freelancer/getting-started"
    },
    {
      title: "Project Management",
      description: "How to handle project assignments and deliver quality work",
      icon: Briefcase,
      href: "/help/freelancer/projects"
    },
    {
      title: "Earnings & Payments",
      description: "Understanding how you get paid and payment schedules",
      icon: DollarSign,
      href: "/help/freelancer/earnings"
    },
    {
      title: "Building Reputation",
      description: "Tips for getting good reviews and building your profile",
      icon: Star,
      href: "/help/freelancer/reputation"
    },
    {
      title: "Communication",
      description: "Best practices for communicating with clients",
      icon: MessageCircle,
      href: "/help/freelancer/communication"
    }
  ];

  return (
    <UserLayout user={user}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/help" className="text-gray-600 hover:text-black">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-black">Freelancer Help</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-4">
            Grow your freelance career
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about working as a freelancer on our platform. 
            From profile optimization to payment processing, we're here to help you succeed.
          </p>
        </div>

        {/* Help Topics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {helpTopics.map((topic) => {
            const IconComponent = topic.icon;
            return (
              <Card key={topic.title} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-6 h-6 text-green-600" />
                    <CardTitle className="text-lg">{topic.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{topic.description}</p>
                  <Link 
                    href={topic.href}
                    className="text-green-600 hover:text-green-800 font-medium"
                  >
                    Learn more →
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </UserLayout>
  );
}
