export const dynamic = "force-dynamic";
export const revalidate = 0;

import "@/ui/styles/globals.css";
import { Inter } from "next/font/google";
import { Providers } from "@/features/shared/components/providers";
import { cn } from "@/core/utils/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Developer Connect - Connect with Top Developers",
  description: "Find and hire the best developers for your projects",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
