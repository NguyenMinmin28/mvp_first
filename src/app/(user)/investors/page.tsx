import Link from "next/link";
import { Button } from "@/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { UserLayout } from "@/features/shared/components/user-layout";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { BarChart3, DollarSign, Users, ArrowRight } from "lucide-react";

export default async function InvestorsPage() {
  const user = await getServerSessionUser();

  const highlights = [
    {
      icon: BarChart3,
      title: "Growth",
      desc: "Rapid user growth driven by AI matching and global reach.",
    },
    {
      icon: Users,
      title: "Network",
      desc: "Vetted developer community across 20+ countries.",
    },
    {
      icon: DollarSign,
      title: "Model",
      desc: "Recurring SaaS with transparent payments and 0% commission.",
    },
  ];

  return (
    <UserLayout user={user}>
      {/* Hero */}
      <section className="w-full border-b bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-extrabold">Investor Relations</h1>
          <p className="mt-3 text-gray-600 max-w-2xl">
            Building the trusted infrastructure for businesses to work directly with world‑class developers.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/newsroom">
              <Button variant="outline">Newsroom</Button>
            </Link>
            <Link href="#contact">
              <Button>Contact IR</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="w-full py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlights.map((h, i) => (
              <Card key={i} className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <h.icon className="w-6 h-6" />
                    <CardTitle className="text-base font-semibold">{h.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{h.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="w-full py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl md:text-2xl font-bold mb-6">Company Materials</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["One‑pager", "Pitch deck (preview)", "Vision & roadmap"].map((t, i) => (
              <Card key={i} className="border-2">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">{t}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href="#" className="inline-flex items-center text-sm font-medium underline">
                    View <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="w-full py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-xl md:text-2xl font-bold">Investor inquiries</h2>
          <p className="mt-2 text-gray-600">Reach our IR team at investors@clevrs.com</p>
        </div>
      </section>
    </UserLayout>
  );
}


