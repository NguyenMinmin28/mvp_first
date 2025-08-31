import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";

export default async function IdeaStakePage() {
  const user = await getServerSessionUser();
  
  return (
    <UserLayout user={user}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/help" className="text-gray-600 hover:text-black">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-black">Idea Stake Program</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-3xl font-bold text-black mb-6">Idea Stake Program</h2>
          
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> December 2024
          </p>

          <div className="space-y-8">
            <section>
              <h3 className="text-xl font-semibold text-black mb-4">What is Idea Stake?</h3>
              <p className="text-gray-700 mb-4">
                The Idea Stake program is our innovative approach to project development where developers can invest their time and expertise in exchange for equity or revenue sharing in promising projects.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">How It Works</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-black mb-2">For Clients</h4>
                  <p className="text-gray-700 mb-2">
                    If you have a great idea but limited budget, you can offer developers:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Equity in your company or project</li>
                    <li>Revenue sharing from the final product</li>
                    <li>Combination of reduced payment + equity</li>
                    <li>Future profit sharing arrangements</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-black mb-2">For Developers</h4>
                  <p className="text-gray-700 mb-2">
                    You can choose to work on projects that offer:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Equity stakes in promising startups</li>
                    <li>Revenue sharing from successful products</li>
                    <li>Long-term partnership opportunities</li>
                    <li>Portfolio diversification</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">Benefits</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-black mb-2">For Startups & Entrepreneurs</h4>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Access to top-tier development talent</li>
                    <li>Reduced upfront development costs</li>
                    <li>Aligned incentives with developers</li>
                    <li>Long-term partnership potential</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-black mb-2">For Developers</h4>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Potential for significant returns</li>
                    <li>Ownership in innovative projects</li>
                    <li>Diversified income streams</li>
                    <li>Portfolio building opportunities</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">Getting Started</h3>
              <p className="text-gray-700 mb-4">
                To participate in the Idea Stake program:
              </p>
              <ol className="list-decimal pl-6 text-gray-700 space-y-2">
                <li>Submit your project idea with detailed business plan</li>
                <li>Specify the equity or revenue sharing terms</li>
                <li>Our team will review and approve qualified projects</li>
                <li>Developers can browse and apply for stake opportunities</li>
                <li>We facilitate the agreement and ensure fair terms</li>
              </ol>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">Legal Framework</h3>
              <p className="text-gray-700 mb-4">
                All Idea Stake agreements are legally binding and include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Clear equity distribution terms</li>
                <li>Revenue sharing percentages</li>
                <li>Vesting schedules and conditions</li>
                <li>Dispute resolution procedures</li>
                <li>Exit strategy provisions</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">Contact Us</h3>
              <p className="text-gray-700 mb-4">
                Interested in the Idea Stake program? Contact our team at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> ideastake@clevrs.com<br/>
                  <strong>Phone:</strong> +1 (555) 123-4567<br/>
                  <strong>Office Hours:</strong> Monday - Friday, 9 AM - 6 PM EST
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
