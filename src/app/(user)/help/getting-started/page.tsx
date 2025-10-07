import { Metadata } from "next";
import { UserLayout } from "@/features/shared/components/user-layout";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { 
  Rocket, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Search, 
  MessageCircle,
  FileText,
  Clock,
  Star,
  Shield
} from "lucide-react";

export const metadata: Metadata = {
  title: "Getting Started - Help Center",
  description: "Complete guide to hiring freelancers and managing projects on our platform",
};

export default async function GettingStartedPage() {
  const user = await getServerSessionUser();

  const steps = [
    {
      id: 1,
      title: "Create Your Account",
      description: "Sign up and complete your profile to get started",
      icon: Users,
      details: [
        "Choose your role (Client or Freelancer)",
        "Complete your profile information",
        "Verify your email address",
        "Set up your payment preferences"
      ]
    },
    {
      id: 2,
      title: "Post Your Project",
      description: "Create a detailed project brief to attract top talent",
      icon: FileText,
      details: [
        "Write a clear project description",
        "Set your budget and timeline",
        "Define project requirements",
        "Add relevant skills and categories"
      ]
    },
    {
      id: 3,
      title: "Review Proposals",
      description: "Evaluate freelancer proposals and portfolios",
      icon: Search,
      details: [
        "Review freelancer profiles and ratings",
        "Check portfolio samples and reviews",
        "Compare proposals and pricing",
        "Ask questions to clarify details"
      ]
    },
    {
      id: 4,
      title: "Hire & Collaborate",
      description: "Select the best freelancer and start working together",
      icon: MessageCircle,
      details: [
        "Make your selection and send offer",
        "Set up project milestones",
        "Use our messaging system for communication",
        "Track progress and provide feedback"
      ]
    }
  ];

  const tips = [
    {
      title: "Be Specific",
      description: "The more detailed your project description, the better proposals you'll receive",
      icon: CheckCircle
    },
    {
      title: "Set Realistic Budgets",
      description: "Research market rates to set competitive but fair pricing",
      icon: Star
    },
    {
      title: "Communicate Clearly",
      description: "Regular communication ensures project success and client satisfaction",
      icon: MessageCircle
    },
    {
      title: "Use Milestones",
      description: "Break large projects into smaller, manageable milestones",
      icon: Clock
    }
  ];

  return (
    <UserLayout user={user}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <Rocket className="w-8 h-8 text-gray-700" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
              Getting Started
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Complete guide to hiring freelancers and managing projects on our platform. 
            Learn the fundamentals of working with talented freelancers.
          </p>
        </div>

        {/* Steps Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            How to Get Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <Card key={step.id} className="border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-8 h-8 text-gray-700" />
                    </div>
                    <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                      {step.id}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {step.description}
                    </p>
                    <ul className="text-left space-y-2">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Pro Tips for Success
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tips.map((tip, index) => {
              const IconComponent = tip.icon;
              return (
                <Card key={index} className="border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {tip.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {tip.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Security & Trust Section */}
        <div className="mb-16">
          <Card className="border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-gray-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Secure & Trusted Platform
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                Your projects and payments are protected with our secure escrow system, 
                dispute resolution, and 24/7 customer support.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Dispute Resolution</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Quality Guarantee</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of clients who have successfully completed projects with our talented freelancers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-black text-white hover:bg-black/90 px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 group">
              <span className="flex items-center gap-2">
                Start Your First Project
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Button>
            <Button variant="outline" className="border-2 border-gray-300 hover:border-gray-400 px-8 py-3 rounded-lg transition-all duration-300">
              Browse Freelancers
            </Button>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
