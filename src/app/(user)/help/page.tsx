// Cache help page for 1 hour
export const revalidate = 3600;

import { Card, CardContent } from "@/ui/components/card";
import { 
  User, 
  FileText, 
  RotateCcw, 
  DollarSign, 
  Lightbulb,
  HelpCircle
} from "lucide-react";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";

export default async function HelpPage() {
  const user = await getServerSessionUser();
  const helpCategories = [
    {
      title: "Client",
      icon: User,
      href: "/help/client"
    },
    {
      title: "Freelancer", 
      icon: User,
      href: "/help/freelancer"
    },
    {
      title: "Terms",
      icon: FileText,
      href: "/help/terms"
    },
    {
      title: "Refund Policy",
      icon: RotateCcw,
      href: "/help/refund"
    },
    {
      title: "Tips",
      icon: DollarSign,
      href: "/help/tips"
    },
    {
      title: "Idea stake",
      icon: Lightbulb,
      href: "/help/idea-stake"
    }
  ];

  return (
    <UserLayout user={user}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-black mb-4">
            Welcome to Support
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. 
            Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, 
            when an unknown printer took a galley of type and scrambled it to make a type specimen book.
          </p>
        </div>

        {/* Help Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {helpCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card 
                key={category.title}
                className="bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer border-0"
              >
                <CardContent className="p-6 text-center">
                  <IconComponent className="w-8 h-8 mx-auto mb-3 text-black" />
                  <p className="text-sm font-medium text-black">
                    {category.title}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </UserLayout>
  );
}
