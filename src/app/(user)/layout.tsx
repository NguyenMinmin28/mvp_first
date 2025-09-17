export const dynamic = "force-dynamic";
export const revalidate = 0;

import "@/ui/styles/globals.css";
import { Inter } from "next/font/google";
import { Providers } from "@/features/shared/components/providers";
import { cn } from "@/core/utils/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: {
    default: "Clevrs",
    template: "%s | Clevrs",
  },
  description: "Connect directly with skilled freelancers worldwide. No middlemen, no commissions. Post your project and get matched with the perfect developer in minutes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
