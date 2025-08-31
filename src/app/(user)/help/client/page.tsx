// Cache help pages for 1 hour
export const revalidate = 3600;

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { ArrowLeft, User, MessageCircle, CreditCard, Shield } from "lucide-react";
import Link from "next/link";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";

export default async function ClientHelpPage() {
  const user = await getServerSessionUser();
  const helpTopics = [
    {
      title: "Getting Started",
      description: "Learn how to create your first project and find the right developer",
      icon: User,
      href: "/help/client/getting-started"
    },
    {
      title: "Communication",
      description: "How to effectively communicate with your assigned developer",
      icon: MessageCircle,
      href: "/help/client/communication"
    },
    {
      title: "Payment & Billing",
      description: "Understanding our pricing and payment process",
      icon: CreditCard,
      href: "/help/client/payment"
    },
    {
      title: "Project Security",
      description: "How we protect your project and intellectual property",
      icon: Shield,
      href: "/help/client/security"
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
          <h1 className="text-2xl font-semibold text-black">Client Help</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-4">
            How can we help you?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about using our platform as a client. 
            From creating your first project to managing payments, we've got you covered.
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
                    <IconComponent className="w-6 h-6 text-blue-600" />
                    <CardTitle className="text-lg">{topic.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{topic.description}</p>
                  <Link 
                    href={topic.href}
                    className="text-blue-600 hover:text-blue-800 font-medium"
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
