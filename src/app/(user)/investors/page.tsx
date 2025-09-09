import Link from "next/link";
import { Button } from "@/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { UserLayout } from "@/features/shared/components/user-layout";
import { getServerSessionUser } from "@/features/auth/auth-server";
import { BarChart3, DollarSign, Users, ArrowRight, LineChart, Building2, PieChart } from "lucide-react";

export default async function InvestorsPage() {
  const user = await getServerSessionUser();

  const highlights = [
    { icon: BarChart3, title: "Growth", desc: "Strong MAU and project volume growth QoQ." },
    { icon: Users, title: "Network", desc: "Vetted community in 20+ countries and growing." },
    { icon: DollarSign, title: "Model", desc: "Recurring SaaS + usage with 0% commission." },
  ];

  const kpis = [
    { label: "GMV (TTM)", value: "$3.2M" },
    { label: "Match success", value: "92%" },
    { label: "Time‑to‑hire", value: "<48h" },
  ];

  const materials = [
    { title: "One‑pager", href: "#" },
    { title: "Pitch deck (preview)", href: "#" },
    { title: "Vision & roadmap", href: "#" },
  ];

  return (
    <UserLayout user={user}>
      {/* Hero */}
      <section className="w-full bg-gradient-to-br from-black via-black to-zinc-900 text-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-white/70 mb-3">
              <Building2 className="w-4 h-4" />
              <span>Investor Relations</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Backing a faster, fairer future of work</h1>
            <p className="mt-4 text-white/80 max-w-2xl">Clevrs is building the trusted infrastructure for businesses to work directly with world‑class developers — powered by AI matching, transparent pricing and 0% commission.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/newsroom"><Button className="bg-white text-black hover:bg-gray-100">Newsroom</Button></Link>
              <Link href="#contact"><Button variant="outline" className="border-white/30 text-white hover:bg-white/10">Contact IR</Button></Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {kpis.map((k, i) => (
              <Card key={i} className="bg-white/10 backdrop-blur border-white/20 text-white">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-extrabold">{k.value}</div>
                  <div className="text-xs mt-1 text-white/80">{k.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="w-full py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlights.map((h, i) => (
              <Card key={i} className="border-2 hover:shadow-lg transition-all">
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

      {/* Charts preview (static placeholders) */}
      <section className="w-full py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-2 lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2"><LineChart className="w-5 h-5" /><CardTitle className="text-base font-semibold">Growth trajectory</CardTitle></div>
              </CardHeader>
              <CardContent>
                <div className="h-44 rounded-md bg-gradient-to-r from-gray-100 to-gray-200" />
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-2"><PieChart className="w-5 h-5" /><CardTitle className="text-base font-semibold">Revenue mix</CardTitle></div>
              </CardHeader>
              <CardContent>
                <div className="h-44 rounded-md bg-gradient-to-br from-gray-100 to-gray-200" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Materials */}
      <section className="w-full py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-xl md:text-2xl font-bold mb-6">Company materials</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {materials.map((m, i) => (
              <Card key={i} className="border-2">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">{m.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={m.href} className="inline-flex items-center text-sm font-medium underline">View <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="w-full py-12 md:py-16 bg-black text-white">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold">Investor inquiries</h2>
              <p className="mt-2 text-white/80">Request the full deck, data room, and financials.</p>
            </div>
            <div className="flex md:justify-end gap-3">
              <Link href="mailto:investors@clevrs.com"><Button className="bg-white text-black hover:bg-gray-100">Email IR</Button></Link>
              <Link href="/newsroom"><Button variant="outline" className="border-white/30 text-white hover:bg-white/10">Newsroom</Button></Link>
            </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}


