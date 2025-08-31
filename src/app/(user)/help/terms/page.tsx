import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";

export default async function TermsPage() {
  const user = await getServerSessionUser();
  return (
    <UserLayout user={user}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/help" className="text-gray-600 hover:text-black">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-black">Terms of Service</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-3xl font-bold text-black mb-6">Terms of Service</h2>
          
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> December 2024
          </p>

          <div className="space-y-8">
            <section>
              <h3 className="text-xl font-semibold text-black mb-4">1. Acceptance of Terms</h3>
              <p className="text-gray-700 mb-4">
                By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">2. Use License</h3>
              <p className="text-gray-700 mb-4">
                Permission is granted to temporarily download one copy of the materials (information or software) on Developer Connect's website for personal, non-commercial transitory viewing only.
              </p>
              <p className="text-gray-700 mb-4">This is the grant of a license, not a transfer of title, and under this license you may not:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>modify or copy the materials;</li>
                <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial);</li>
                <li>attempt to decompile or reverse engineer any software contained on Developer Connect's website;</li>
                <li>remove any copyright or other proprietary notations from the materials;</li>
                <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">3. Disclaimer</h3>
              <p className="text-gray-700 mb-4">
                The materials on Developer Connect's website are provided on an 'as is' basis. Developer Connect makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">4. Limitations</h3>
              <p className="text-gray-700 mb-4">
                In no event shall Developer Connect or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Developer Connect's website, even if Developer Connect or a Developer Connect authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">5. Accuracy of Materials</h3>
              <p className="text-gray-700 mb-4">
                The materials appearing on Developer Connect's website could include technical, typographical, or photographic errors. Developer Connect does not warrant that any of the materials on its website are accurate, complete or current. Developer Connect may make changes to the materials contained on its website at any time without notice.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">6. Links</h3>
              <p className="text-gray-700 mb-4">
                Developer Connect has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Developer Connect of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">7. Modifications</h3>
              <p className="text-gray-700 mb-4">
                Developer Connect may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these Terms of Service.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">8. Governing Law</h3>
              <p className="text-gray-700 mb-4">
                These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
              </p>
            </section>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
