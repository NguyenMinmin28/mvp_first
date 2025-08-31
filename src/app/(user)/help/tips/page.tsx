import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";

export default async function TipsPage() {
  const user = await getServerSessionUser();
  
  return (
    <UserLayout user={user}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/help" className="text-gray-600 hover:text-black">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-black">Tips & Best Practices</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-3xl font-bold text-black mb-6">Tips & Best Practices</h2>
          
          <div className="space-y-8">
            <section>
              <h3 className="text-xl font-semibold text-black mb-4">For Clients</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-black mb-2">Writing Clear Project Descriptions</h4>
                  <p className="text-gray-700 mb-2">
                    Be specific about your project requirements, timeline, and budget. Include:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Detailed project scope and objectives</li>
                    <li>Technical requirements and specifications</li>
                    <li>Expected deliverables and milestones</li>
                    <li>Timeline and deadline expectations</li>
                    <li>Budget range and payment terms</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-black mb-2">Effective Communication</h4>
                  <p className="text-gray-700 mb-2">
                    Maintain clear and regular communication with your developer:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Provide timely feedback on deliverables</li>
                    <li>Be available for questions and clarifications</li>
                    <li>Use our platform's messaging system</li>
                    <li>Set up regular check-ins for progress updates</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">For Freelancers</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-black mb-2">Building a Strong Profile</h4>
                  <p className="text-gray-700 mb-2">
                    Create a compelling profile that stands out:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Showcase your best work with detailed descriptions</li>
                    <li>Highlight your technical skills and expertise</li>
                    <li>Include testimonials and references</li>
                    <li>Keep your availability and rates updated</li>
                    <li>Add a professional photo and bio</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-black mb-2">Delivering Quality Work</h4>
                  <p className="text-gray-700 mb-2">
                    Ensure client satisfaction and build your reputation:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Meet deadlines and communicate proactively</li>
                    <li>Provide regular progress updates</li>
                    <li>Ask clarifying questions when needed</li>
                    <li>Test your work thoroughly before delivery</li>
                    <li>Document your code and provide clear instructions</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">General Tips</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-black mb-2">Security Best Practices</h4>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Never share sensitive information in public messages</li>
                    <li>Use secure file sharing methods</li>
                    <li>Keep your account credentials safe</li>
                    <li>Enable two-factor authentication</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-black mb-2">Payment Security</h4>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Always use our secure payment system</li>
                    <li>Never pay outside the platform</li>
                    <li>Keep payment records and receipts</li>
                    <li>Report any suspicious activity immediately</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
