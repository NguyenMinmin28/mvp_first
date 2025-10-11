import { SiteConfig } from "@/core/types";

import { env } from "@/core/config/env.mjs";

export const siteConfig: SiteConfig = {
  name: "Clevrs",
  author: "Clevrs Team",
  description:
    "Connect directly with skilled freelancers worldwide. No middlemen, no commissions. Post your project and get matched with the perfect developer in minutes.",
  keywords: ["freelancers", "developers", "projects", "direct connection", "no commission"],
  url: {
    base: env.NEXT_PUBLIC_APP_URL,
    author: "https://clevrs.com",
  },
  links: {
    github: "https://github.com/clevrs/developer-connect",
  },
  ogImage: `${env.NEXT_PUBLIC_APP_URL}/images/home/herobanner2.png`,
};
