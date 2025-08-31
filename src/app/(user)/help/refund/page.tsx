import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";

export default async function RefundPage() {
  const user = await getServerSessionUser();
  
  return (
    <UserLayout user={user}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/help" className="text-gray-600 hover:text-black">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-black">Refund Policy</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-3xl font-bold text-black mb-6">Refund Policy</h2>
          
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> December 2024
          </p>

          <div className="space-y-8">
            <section>
              <h3 className="text-xl font-semibold text-black mb-4">1. Subscription Refunds</h3>
              <p className="text-gray-700 mb-4">
                We offer a 30-day money-back guarantee for all subscription plans. If you're not satisfied with our service within the first 30 days of your subscription, you can request a full refund.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">2. How to Request a Refund</h3>
              <p className="text-gray-700 mb-4">
                To request a refund, please contact our support team at support@clevrs.com with your account details and reason for the refund request.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">3. Processing Time</h3>
              <p className="text-gray-700 mb-4">
                Refunds are typically processed within 5-10 business days and will be credited back to your original payment method.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-black mb-4">4. Non-Refundable Items</h3>
              <p className="text-gray-700 mb-4">
                The following items are non-refundable:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Subscriptions after the 30-day guarantee period</li>
                <li>Any services that have been fully utilized</li>
                <li>Custom development work that has been completed</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
