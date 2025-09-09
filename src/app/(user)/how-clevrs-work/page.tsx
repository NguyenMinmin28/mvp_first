import Link from "next/link";
import { Button } from "@/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import {
  Rocket, Bot, Users, CheckCircle2, MessagesSquare,
  FileSignature, ShieldCheck, Wallet, Sparkles
} from "lucide-react";
import { UserLayout } from "@/features/shared/components/user-layout";
import { HashScrollOnLoad } from "@/features/shared/components/hash-scroll";
import { getServerSessionUser } from "@/features/auth/auth-server";

const BENEFITS = [
  { icon: ShieldCheck, label: "Vetted talent" },
  { icon: Wallet, label: "Transparent pricing" },
  { icon: MessagesSquare, label: "Direct chat" },
  { icon: Sparkles, label: "AI matching" },
];

const MAIN_STEPS = [
  { icon: Rocket, title: "Post your project", desc: "State goals & skills. Our AI tidies the brief." },
  { icon: Bot, title: "Get matched fast", desc: "Shortlist of vetted developers in minutes." },
  { icon: Users, title: "Choose & start", desc: "Chat, contract, kick off. Simple and clear." },
];

const CLIENT_FLOW = [
  "Create account & post",
  "Review shortlist",
  "Interview & select",
  "Sign simple contract",
  "Track & pay by milestones",
];

const FREELANCER_FLOW = [
  "Create profile",
  "Show up in AI matches",
  "Chat with clients",
  "Accept clear terms, 0% markup",
  "Deliver & grow reputation",
];

export default async function HowClevrsWorkPage() {
  const user = await getServerSessionUser();

  return (
    <UserLayout user={user}>
      <HashScrollOnLoad offset={120} />
      {/* HERO */}
      <section className="w-full bg-black text-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 items-center gap-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              How Clevrs Works
            </h1>
            <p className="mt-4 text-white/80">
              From idea to delivery — faster, fairer, more transparent.
            </p>

            {/* Benefits bar */}
            <div className="mt-6 flex flex-wrap gap-3">
              {BENEFITS.map((b, i) => (
                <span key={i} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
                  <b.icon className="h-4 w-4" /> {b.label}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                  Get Started
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/70 text-white bg-transparent hover:bg-white/10 hover:text-white focus-visible:ring-white/70"
                >
                  See Pricing
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/home/aidirect.png" alt="Clevrs" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* WHY DIFFERENT */}
      <section className="w-full py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Why Clevrs is different</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: "commission",
                title: "0% Commission",
                summary: "Keep 100% of what you earn.",
                bullets: [
                  "We don't take a cut from freelancers",
                  "Direct payments between client and freelancer",
                  "Transparent pricing for clients",
                ],
              },
              {
                id: "connection",
                title: "Direct Connection",
                summary: "Talk and work directly, no middlemen.",
                bullets: [
                  "Chat 1:1, share context, move fast",
                  "Decide who you want to work with",
                  "Build long‑term relationships",
                ],
              },
              {
                id: "ai",
                title: "AI Match",
                summary: "Find the right developer in minutes.",
                bullets: [
                  "Recommendations from skills and history",
                  "Signals from reviews and portfolio quality",
                  "Continuous learning to improve matches",
                ],
              },
              {
                id: "freedom",
                title: "Mutual Freedom",
                summary: "Work with respect on both sides.",
                bullets: [
                  "Clear expectations and communication",
                  "Opt‑in only — no spam invites",
                  "Easy handoff if priorities change",
                ],
              },
              {
                id: "simplecontract",
                title: "Simple Contracts",
                summary: "Clear terms, fast start.",
                bullets: [
                  "Lightweight templates you can customize",
                  "Keep IP/ownership straightforward",
                  "Milestones for predictable delivery",
                ],
              },
              {
                id: "globaltalent",
                title: "Global Talent",
                summary: "Hire worldwide with confidence.",
                bullets: [
                  "Vetted community across 20+ countries",
                  "Asynchronous collaboration friendly",
                  "Compliance guardrails where applicable",
                ],
              },
            ].map((b) => (
              <Card key={b.id} id={b.id} data-benefit-card className="border-2 scroll-mt-24 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">{b.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-3">{b.summary}</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {b.bullets.map((t, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-gray-700" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 3 BIG STEPS */}
      <section className="w-full py-16 md:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            3 steps to start
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MAIN_STEPS.map((s, idx) => (
              <Card key={idx} className="border-2 hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      <span className="mr-2 text-gray-400">0{idx + 1}.</span>{s.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TWO FLOWS */}
      <section className="w-full py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <FlowCard
            title="For Clients"
            ctaLabel="Start as Client"
            ctaHref="/auth/signup?portal=client"
            items={CLIENT_FLOW}
          />
          <FlowCard
            title="For Freelancers"
            icon={MessagesSquare}
            ctaLabel="Start as Freelancer"
            ctaHref="/auth/signup?portal=freelancer"
            items={FREELANCER_FLOW}
          />
        </div>
      </section>

      {/* TRUST / CTA */}
      <section className="w-full py-16 md:py-20">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <h3 className="text-2xl md:text-3xl font-extrabold">
            Ready to build faster with Clevrs?
          </h3>
          <p className="mt-3 text-gray-600">
            Post a project now — meet the right developer within hours.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/auth/signup">
              <Button size="lg">Create Free Account</Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">View Pricing</Button>
            </Link>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}

/** Sub-components (stateless, server-safe) */
function FlowCard({
  title,
  items,
  ctaLabel,
  ctaHref,
  icon: Icon = CheckCircle2,
}: {
  title: string;
  items: string[];
  ctaLabel: string;
  ctaHref: string;
  icon?: React.ComponentType<any>;
}) {
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Link href={ctaHref}>
            <Button className="w-full sm:w-auto">{ctaLabel}</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
