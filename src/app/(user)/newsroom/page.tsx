import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { CalendarDays, Megaphone, Newspaper, ArrowRight } from "lucide-react";
import { UserLayout } from "@/features/shared/components/user-layout";
import { getServerSessionUser } from "@/features/auth/auth-server";

export const metadata: Metadata = {
  title: "Clevrs Newsroom – Updates, Partnerships & Announcements",
  description: "Stay updated with the latest Clevrs news, product updates, partnerships, and company announcements. Discover how we're revolutionizing freelancing.",
};

export default async function NewsroomPage() {
  const user = await getServerSessionUser();

  const items = [
    {
      title: "Clevrs raises seed round to reimagine dev hiring",
      date: "Feb 2025",
      type: "Press Release",
      desc:
        "Funding will accelerate our AI matching, quality controls and global network expansion.",
    },
    {
      title: "Product update: IdeaSpark and 0% commission",
      date: "Jan 2025",
      type: "Product Update",
      desc:
        "We launched IdeaSpark for co‑creation and removed platform commissions to keep earnings fair.",
    },
    {
      title: "Clevrs partners with leading dev communities",
      date: "Dec 2024",
      type: "Partnerships",
      desc:
        "New partnerships expand our vetted talent pool across 20+ countries.",
    },
  ];

  return (
    <UserLayout user={user}>
      {/* Hero */}
      <section className="w-full border-b bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-12 md:py-16 flex items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <Megaphone className="w-4 h-4" />
              <span>Company News & Updates</span>
            </div>
            <h1 className="mt-2 text-3xl md:text-4xl font-extrabold">Newsroom</h1>
            <p className="mt-3 text-gray-600 max-w-2xl">
              The latest announcements, product updates, and resources about Clevrs.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/blog">
                <Button>Visit Blog</Button>
              </Link>
              <Link href="/about">
                <Button variant="outline">About Us</Button>
              </Link>
            </div>
          </div>
          <Newspaper className="w-24 h-24 text-gray-400 hidden md:block" />
        </div>
      </section>

      {/* Grid */}
      <section className="w-full py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((item, i) => (
              <Card key={i} className="border-2 hover:shadow-md transition-all">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <CalendarDays className="w-4 h-4" />
                    <span>{item.date}</span>
                    <span>•</span>
                    <span>{item.type}</span>
                  </div>
                  <p className="text-sm text-gray-700">{item.desc}</p>
                  <div className="mt-4">
                    <Link href="#" className="inline-flex items-center text-sm font-medium underline">
                      Read more <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Press contact */}
      <section className="w-full py-12 md:py-16 border-t bg-gray-50">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-xl md:text-2xl font-bold">Press inquiries</h2>
          <p className="mt-2 text-gray-600">Email our communications team: press@clevrs.com</p>
        </div>
      </section>
    </UserLayout>
  );
}


