import { Metadata } from "next";
import { UserLayout } from "@/features/shared/components/user-layout";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { 
  MessageCircle, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Phone,
  Mail,
  HelpCircle,
  FileText,
  AlertTriangle,
  Shield,
  Users,
  Star,
  Zap,
  Headphones
} from "lucide-react";

export const metadata: Metadata = {
  title: "Support - Help Center",
  description: "Get help from our support team - 24/7 assistance for all your questions and concerns",
};

export default async function SupportPage() {
  const user = await getServerSessionUser();

  const supportChannels = [
    {
      title: "Live Chat",
      description: "Get instant help from our support team",
      icon: MessageCircle,
      availability: "24/7",
      responseTime: "Under 5 minutes",
      features: [
        "Instant responses to your questions",
        "Real-time problem solving",
        "File sharing and screen sharing",
        "Chat history saved for reference"
      ],
      bestFor: "Quick questions, technical issues, account problems"
    },
    {
      title: "Email Support",
      description: "Send us detailed messages and get comprehensive responses",
      icon: Mail,
      availability: "24/7",
      responseTime: "Under 2 hours",
      features: [
        "Detailed explanations and solutions",
        "Attach files and screenshots",
        "Follow-up conversations",
        "Email notifications for responses"
      ],
      bestFor: "Complex issues, detailed questions, documentation requests"
    },
    {
      title: "Phone Support",
      description: "Speak directly with our support specialists",
      icon: Phone,
      availability: "Mon-Fri 9AM-6PM EST",
      responseTime: "Immediate",
      features: [
        "Direct voice communication",
        "Immediate problem resolution",
        "Personalized assistance",
        "Follow-up call scheduling"
      ],
      bestFor: "Urgent issues, complex problems, account security concerns"
    }
  ];

  const commonIssues = [
    {
      category: "Account & Billing",
      icon: Users,
      issues: [
        {
          title: "Account Setup",
          description: "Need help creating or verifying your account",
          solution: "Our team can guide you through the complete account setup process"
        },
        {
          title: "Payment Issues",
          description: "Problems with payments, refunds, or billing",
          solution: "We'll help resolve payment processing and billing questions"
        },
        {
          title: "Profile Management",
          description: "Updating profile information or settings",
          solution: "Get assistance with profile customization and privacy settings"
        }
      ]
    },
    {
      category: "Project Management",
      icon: FileText,
      issues: [
        {
          title: "Project Creation",
          description: "Help writing effective project briefs",
          solution: "Our experts can review and improve your project descriptions"
        },
        {
          title: "Freelancer Selection",
          description: "Choosing the right freelancer for your project",
          solution: "Get guidance on evaluating proposals and portfolios"
        },
        {
          title: "Project Communication",
          description: "Managing communication and feedback",
          solution: "Learn best practices for effective client-freelancer collaboration"
        }
      ]
    },
    {
      category: "Technical Support",
      icon: Zap,
      issues: [
        {
          title: "Platform Issues",
          description: "Problems with website functionality or features",
          solution: "We'll troubleshoot and resolve any technical problems"
        },
        {
          title: "File Uploads",
          description: "Issues with uploading or sharing files",
          solution: "Get help with file sharing, size limits, and format support"
        },
        {
          title: "Mobile App",
          description: "Problems with the mobile application",
          solution: "Technical support for mobile app issues and updates"
        }
      ]
    },
    {
      category: "Disputes & Resolution",
      icon: Shield,
      issues: [
        {
          title: "Dispute Resolution",
          description: "Mediating conflicts between clients and freelancers",
          solution: "Our dispute resolution team provides fair mediation services"
        },
        {
          title: "Quality Concerns",
          description: "Issues with delivered work quality",
          solution: "We'll help resolve quality disputes and ensure satisfaction"
        },
        {
          title: "Refund Requests",
          description: "Requesting refunds for unsatisfactory work",
          solution: "Get assistance with refund processes and policies"
        }
      ]
    }
  ];

  const supportStats = [
    {
      title: "Response Time",
      value: "< 5 min",
      description: "Average live chat response",
      icon: Clock
    },
    {
      title: "Satisfaction Rate",
      value: "98%",
      description: "Customer satisfaction score",
      icon: Star
    },
    {
      title: "Resolution Rate",
      value: "95%",
      description: "Issues resolved on first contact",
      icon: CheckCircle
    },
    {
      title: "Availability",
      value: "24/7",
      description: "Round-the-clock support",
      icon: Headphones
    }
  ];

  const faqItems = [
    {
      question: "How quickly will I get a response?",
      answer: "Live chat responses are typically under 5 minutes, email responses within 2 hours, and phone support is available during business hours for immediate assistance."
    },
    {
      question: "What information should I include when contacting support?",
      answer: "Please include your account email, project ID (if applicable), a clear description of the issue, and any relevant screenshots or error messages."
    },
    {
      question: "Can you help me write a better project brief?",
      answer: "Absolutely! Our support team can review your project description and provide suggestions to make it more attractive to freelancers and ensure better results."
    },
    {
      question: "What if I'm not satisfied with the work delivered?",
      answer: "We have a comprehensive dispute resolution process. Contact support immediately, and we'll work with you and the freelancer to find a fair solution."
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, we take security seriously. All communications are encrypted, and we follow strict privacy policies to protect your personal and financial information."
    }
  ];

  return (
    <UserLayout user={user}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-gray-700" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
              Support Center
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get help from our dedicated support team. We're here 24/7 to assist with all your questions, 
            concerns, and technical issues.
          </p>
        </div>

        {/* Support Stats */}
        <div className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {supportStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index} className="border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-6 h-6 text-gray-700" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      {stat.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {stat.description}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Support Channels */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            How to Get Help
          </h2>
          <div className="space-y-8">
            {supportChannels.map((channel, index) => {
              const IconComponent = channel.icon;
              return (
                <Card key={index} className="border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <IconComponent className="w-8 h-8 text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h3 className="text-2xl font-bold text-gray-900">
                            {channel.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {channel.availability}
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="w-4 h-4" />
                              {channel.responseTime}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-6 text-lg">
                          {channel.description}
                        </p>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Features
                            </h4>
                            <ul className="space-y-2">
                              {channel.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <HelpCircle className="w-4 h-4 text-blue-500" />
                              Best For
                            </h4>
                            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border-l-4 border-blue-300">
                              {channel.bestFor}
                            </p>
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

        {/* Common Issues */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Common Issues We Help With
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {commonIssues.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <Card key={index} className="border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-6 h-6 text-gray-700" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {category.category}
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {category.issues.map((issue, idx) => (
                        <div key={idx} className="border-l-4 border-gray-300 pl-4">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {issue.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {issue.description}
                          </p>
                          <p className="text-xs text-gray-500 italic">
                            {issue.solution}
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

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <Card key={index} className="border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed ml-8">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Need Help Right Now?
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Our support team is standing by to help you with any questions or issues. 
                Choose the contact method that works best for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-black text-white hover:bg-black/90 px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 group">
                  <span className="flex items-center gap-2">
                    Start Live Chat
                    <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  </span>
                </Button>
                <Button variant="outline" className="border-2 border-gray-300 hover:border-gray-400 px-8 py-3 rounded-lg transition-all duration-300 group">
                  <span className="flex items-center gap-2">
                    Send Email
                    <Mail className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  </span>
                </Button>
                <Button variant="outline" className="border-2 border-gray-300 hover:border-gray-400 px-8 py-3 rounded-lg transition-all duration-300 group">
                  <span className="flex items-center gap-2">
                    Call Support
                    <Phone className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserLayout>
  );
}
