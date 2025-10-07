import { Metadata } from "next";
import { UserLayout } from "@/features/shared/components/user-layout";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { 
  BookOpen, 
  ArrowRight, 
  CheckCircle, 
  FileText, 
  Target, 
  Clock,
  DollarSign,
  MessageSquare,
  Eye,
  ThumbsUp,
  AlertCircle,
  Lightbulb
} from "lucide-react";

export const metadata: Metadata = {
  title: "Best Practices - Help Center",
  description: "Learn how to write effective project briefs that attract top talent",
};

export default async function BestPracticesPage() {
  const user = await getServerSessionUser();

  const briefSections = [
    {
      title: "Project Overview",
      description: "Provide a clear, concise summary of what you need",
      icon: Eye,
      tips: [
        "Start with a compelling project title",
        "Write 2-3 sentences describing the main goal",
        "Mention the end result you're looking for",
        "Include any background context that's relevant"
      ],
      example: "I need a modern, responsive website for my consulting business. The site should showcase my services, include a contact form, and have a professional design that builds trust with potential clients."
    },
    {
      title: "Detailed Requirements",
      description: "Be specific about what you need delivered",
      icon: Target,
      tips: [
        "List all features and functionality needed",
        "Specify design preferences and style",
        "Include technical requirements",
        "Mention any integrations or third-party services"
      ],
      example: "The website needs: 5 main pages (Home, About, Services, Portfolio, Contact), mobile-responsive design, contact form with email notifications, integration with Google Analytics, and SEO optimization."
    },
    {
      title: "Timeline & Budget",
      description: "Set clear expectations for delivery and payment",
      icon: Clock,
      tips: [
        "Be realistic about project duration",
        "Include milestone deadlines if applicable",
        "Set a competitive but fair budget range",
        "Consider offering milestone-based payments"
      ],
      example: "I'd like the project completed within 4-6 weeks. My budget is $2,000-$3,000. I'm open to milestone-based payments: 30% upfront, 40% at design approval, 30% at final delivery."
    },
    {
      title: "Communication Preferences",
      description: "Establish how you'll work together",
      icon: MessageSquare,
      tips: [
        "Specify preferred communication methods",
        "Set expectations for response times",
        "Mention any regular check-in meetings",
        "Clarify who will be the main point of contact"
      ],
      example: "I prefer daily updates via our platform's messaging system. I'm available for video calls on weekdays between 2-4 PM EST. Please provide progress updates every 2-3 days."
    }
  ];

  const commonMistakes = [
    {
      title: "Vague Project Description",
      description: "Don't just say 'I need a website' - be specific about features, style, and goals",
      icon: AlertCircle,
      fix: "Include detailed requirements, design preferences, and expected outcomes"
    },
    {
      title: "Unrealistic Budget",
      description: "Setting a budget too low will attract inexperienced freelancers",
      icon: DollarSign,
      fix: "Research market rates and set a competitive budget that reflects the work's value"
    },
    {
      title: "No Timeline",
      description: "Without deadlines, projects can drag on indefinitely",
      icon: Clock,
      fix: "Set clear milestones and final deadline, with buffer time for revisions"
    },
    {
      title: "Poor Communication",
      description: "Not responding to questions or providing feedback delays projects",
      icon: MessageSquare,
      fix: "Respond within 24 hours and provide clear, constructive feedback"
    }
  ];

  const successTips = [
    {
      title: "Start with a Template",
      description: "Use our project brief templates to ensure you don't miss important details",
      icon: FileText
    },
    {
      title: "Include Visual References",
      description: "Share examples of designs, styles, or functionality you like",
      icon: Eye
    },
    {
      title: "Ask for Portfolios",
      description: "Review freelancer portfolios to ensure they have relevant experience",
      icon: ThumbsUp
    },
    {
      title: "Set Clear Milestones",
      description: "Break large projects into smaller, manageable phases",
      icon: Target
    }
  ];

  return (
    <UserLayout user={user}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-gray-700" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
              Best Practices
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Learn how to write effective project briefs that attract top talent and ensure project success. 
            Create clear, detailed briefs that get you the results you want.
          </p>
        </div>

        {/* Project Brief Sections */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Writing an Effective Project Brief
          </h2>
          <div className="space-y-8">
            {briefSections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <Card key={index} className="border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <IconComponent className="w-8 h-8 text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          {section.title}
                        </h3>
                        <p className="text-gray-600 mb-6 text-lg">
                          {section.description}
                        </p>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Key Tips
                            </h4>
                            <ul className="space-y-2">
                              {section.tips.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-yellow-500" />
                              Example
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-300">
                              <p className="text-sm text-gray-700 italic">
                                "{section.example}"
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Common Mistakes */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Common Mistakes to Avoid
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {commonMistakes.map((mistake, index) => {
              const IconComponent = mistake.icon;
              return (
                <Card key={index} className="border border-red-200 bg-red-50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {mistake.title}
                        </h3>
                        <p className="text-gray-600 mb-3 text-sm">
                          {mistake.description}
                        </p>
                        <div className="bg-white rounded-lg p-3 border border-red-200">
                          <p className="text-xs text-gray-700">
                            <strong>Fix:</strong> {mistake.fix}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Success Tips */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Pro Tips for Success
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {successTips.map((tip, index) => {
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

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Post Your Project?
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Use these best practices to create a compelling project brief that attracts top freelancers and ensures project success.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-black text-white hover:bg-black/90 px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 group">
                  <span className="flex items-center gap-2">
                    Post Your Project
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Button>
                <Button variant="outline" className="border-2 border-gray-300 hover:border-gray-400 px-8 py-3 rounded-lg transition-all duration-300">
                  View Project Templates
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserLayout>
  );
}
