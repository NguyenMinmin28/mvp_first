import { CeoLetterHero } from "@/features/about/components";
import { Metadata } from "next";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";

export default async function CeoLetterPage() {
  const user = await getServerSessionUser();
  
  return (
    <UserLayout user={user}>
      <CeoLetterHero />
      
      {/* Letter Content */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-lg max-w-none text-justify">
              <p className="text-gray-700 font-bold text-lg mb-6">
                Aug 2025
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                Dear friends and partners,
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                At Clevrs, our mission is to reshape how people work together by removing the barriers that slow them down and the costs that hold them back.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                For too long, freelancers and clients have faced platforms with layers of complexity, endless fees, and unnecessary gatekeepers. We're offering a different model that gives freedom back to both sides.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                For freelancers, this means earning fully, owning their reputation, and building long-term relationships without having to compromise. For clients, it means finding the right partner quickly, directly, and with full transparency.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                The core value of Clevrs is respect — respect for time, respect for talent, and respect for the trust that both sides bring to the table.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                We're more than a marketplace; we're a commitment to fairness. Our platform is designed not just to connect people, but to empower them. By cutting out middlemen, we give freelancers career growth on their own terms and clients a straightforward path to bringing their ideas to life. This is collaboration in its purest form: human, direct, and built on trust.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                Looking forward, we're investing in tools and systems to make collaboration smarter, faster, and more rewarding — from intuitive project matching to community-driven insights. We're building a platform that evolves with the people who use it, with a vision not just to facilitate projects, but to help spark opportunities that can change lives.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                With innovation comes responsibility. As we scale, we're committed to building sustainably, protecting the interests of freelancers and clients, and creating a culture where fairness isn't just a feature — it's the foundation. The choices we make today will shape how millions of people experience work tomorrow, and we carry that responsibility with pride and care.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                The journey is just beginning. Every handshake, every conversation, and every project completed through Clevrs brings us closer to a world where work feels less like a transaction and more like a partnership. Together, we can reimagine what collaboration looks like — direct, fair, and truly human.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                With gratitude,<br />
                <strong>Kash</strong><br />
                <strong>Chief Executive Officer, Clevrs</strong>
              </p>
            </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}

export const metadata: Metadata = {
  title: "CEO Letter",
  description: "A message from our CEO",
};
