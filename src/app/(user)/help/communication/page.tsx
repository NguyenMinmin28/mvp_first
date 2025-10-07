import { Metadata } from "next";
import { UserLayout } from "@/features/shared/components/user-layout";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { 
  Users, 
  ArrowRight, 
  CheckCircle, 
  MessageCircle, 
  Clock, 
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  FileText,
  Video,
  Phone,
  Mail,
  Calendar,
  Star,
  Heart
} from "lucide-react";

export const metadata: Metadata = {
  title: "Communication - Help Center",
  description: "Tips for effective collaboration and communication with freelancers",
};

export default async function CommunicationPage() {
  const user = await getServerSessionUser();

  const communicationChannels = [
    {
      title: "Platform Messaging",
      description: "Use our built-in messaging system for all project-related communication",
      icon: MessageCircle,
      benefits: [
        "All messages are saved and searchable",
        "File sharing and image uploads",
        "Message history for reference",
        "Secure and private communication"
      ],
      bestPractices: [
        "Keep all project communication on the platform",
        "Use clear, descriptive message subjects",
        "Respond within 24 hours during business days",
        "Be professional and respectful in all messages"
      ]
    },
    {
      title: "Video Calls",
      description: "Schedule video meetings for complex discussions and project reviews",
      icon: Video,
      benefits: [
        "Face-to-face communication for clarity",
        "Screen sharing for demonstrations",
        "Real-time collaboration and feedback",
        "Build stronger working relationships"
      ],
      bestPractices: [
        "Schedule calls in advance with clear agenda",
        "Test your technology before the call",
        "Take notes and follow up with written summary",
        "Keep calls focused and time-bound"
      ]
    },
    {
      title: "Phone Calls",
      description: "Use phone calls for urgent matters or quick clarifications",
      icon: Phone,
      benefits: [
        "Immediate response for urgent issues",
        "Quick clarifications and questions",
        "Personal touch for relationship building",
        "Efficient for complex explanations"
      ],
      bestPractices: [
        "Respect time zones and business hours",
        "Follow up important calls with written summary",
        "Keep calls professional and focused",
        "Use sparingly for truly urgent matters"
      ]
    }
  ];

  const communicationTips = [
    {
      title: "Be Clear and Specific",
      description: "Provide detailed instructions and expectations to avoid misunderstandings",
      icon: FileText,
      examples: [
        "Instead of 'make it look better', say 'increase the font size to 16px and use a darker blue color'",
        "Instead of 'fix the bug', describe the exact issue and steps to reproduce it",
        "Instead of 'add more content', specify what type of content and where it should go"
      ]
    },
    {
      title: "Provide Constructive Feedback",
      description: "Give specific, actionable feedback that helps improve the work",
      icon: ThumbsUp,
      examples: [
        "Instead of 'I don't like it', explain what specifically doesn't work and why",
        "Instead of 'it's wrong', point out the specific issues and suggest improvements",
        "Instead of 'redo everything', identify what's good and what needs to change"
      ]
    },
    {
      title: "Set Clear Expectations",
      description: "Establish communication protocols and response times upfront",
      icon: Clock,
      examples: [
        "Agree on response time expectations (e.g., 24 hours for non-urgent messages)",
        "Set regular check-in schedules (e.g., weekly progress updates)",
        "Define what constitutes urgent vs. non-urgent communication"
      ]
    },
    {
      title: "Be Respectful and Professional",
      description: "Maintain a positive, professional tone in all communications",
      icon: Heart,
      examples: [
        "Use please and thank you in your messages",
        "Acknowledge good work and effort",
        "Address issues directly but respectfully",
        "Avoid personal attacks or emotional language"
      ]
    }
  ];

  const commonIssues = [
    {
      title: "Misunderstood Requirements",
      description: "When the freelancer delivers something different than expected",
      icon: AlertTriangle,
      solution: "Clarify requirements immediately, provide specific examples, and consider if the brief needs updating"
    },
    {
      title: "Delayed Responses",
      description: "When communication becomes slow or inconsistent",
      icon: Clock,
      solution: "Set clear response time expectations, use multiple communication channels, and escalate if necessary"
    },
    {
      title: "Scope Creep",
      description: "When project requirements expand beyond the original agreement",
      icon: FileText,
      solution: "Document all changes, update the project scope and budget, and get written agreement on modifications"
    },
    {
      title: "Quality Concerns",
      description: "When the delivered work doesn't meet your standards",
      icon: Star,
      solution: "Provide specific feedback, request revisions, and consider if additional guidance or resources are needed"
    }
  ];

  const relationshipBuilding = [
    {
      title: "Show Appreciation",
      description: "Acknowledge good work and effort regularly",
      icon: Star,
      tip: "A simple 'thank you' or 'great job' goes a long way in building positive relationships"
    },
    {
      title: "Be Patient",
      description: "Understand that quality work takes time",
      icon: Clock,
      tip: "Allow reasonable time for revisions and don't rush the creative process"
    },
    {
      title: "Provide Context",
      description: "Help freelancers understand your business and goals",
      icon: Lightbulb,
      tip: "Share background information that helps freelancers make better decisions"
    },
    {
      title: "Build Trust",
      description: "Be reliable, honest, and consistent in your communication",
      icon: Heart,
      tip: "Keep your promises, pay on time, and be transparent about your needs and constraints"
    }
  ];

  return (
    <UserLayout user={user}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-700" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
              Communication
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Build strong client-freelancer relationships through effective communication. 
            Learn how to collaborate successfully and maintain positive working relationships.
          </p>
        </div>

        {/* Communication Channels */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Communication Channels
          </h2>
          <div className="space-y-8">
            {communicationChannels.map((channel, index) => {
              const IconComponent = channel.icon;
              return (
                <Card key={index} className="border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <IconComponent className="w-8 h-8 text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          {channel.title}
                        </h3>
                        <p className="text-gray-600 mb-6 text-lg">
                          {channel.description}
                        </p>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Benefits
                            </h4>
                            <ul className="space-y-2">
                              {channel.benefits.map((benefit, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-yellow-500" />
                              Best Practices
                            </h4>
                            <ul className="space-y-2">
                              {channel.bestPractices.map((practice, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                                  <span>{practice}</span>
                                </li>
                              ))}
                            </ul>
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

        {/* Communication Tips */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Effective Communication Tips
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {communicationTips.map((tip, index) => {
              const IconComponent = tip.icon;
              return (
                <Card key={index} className="border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {tip.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {tip.description}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {tip.examples.map((example, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3 border-l-4 border-gray-300">
                          <p className="text-xs text-gray-700">
                            {example}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Common Issues */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Common Communication Issues
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {commonIssues.map((issue, index) => {
              const IconComponent = issue.icon;
              return (
                <Card key={index} className="border border-orange-200 bg-orange-50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {issue.title}
                        </h3>
                        <p className="text-gray-600 mb-3 text-sm">
                          {issue.description}
                        </p>
                        <div className="bg-white rounded-lg p-3 border border-orange-200">
                          <p className="text-xs text-gray-700">
                            <strong>Solution:</strong> {issue.solution}
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

        {/* Relationship Building */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Building Strong Relationships
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relationshipBuilding.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Card key={index} className="border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 mb-3 text-sm">
                          {item.description}
                        </p>
                        <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-gray-300">
                          <p className="text-xs text-gray-700 italic">
                            💡 {item.tip}
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

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Improve Your Communication?
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Apply these communication best practices to build stronger relationships with freelancers and achieve better project outcomes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-black text-white hover:bg-black/90 px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 group">
                  <span className="flex items-center gap-2">
                    Start a New Project
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Button>
                <Button variant="outline" className="border-2 border-gray-300 hover:border-gray-400 px-8 py-3 rounded-lg transition-all duration-300">
                  Browse Freelancers
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserLayout>
  );
}
