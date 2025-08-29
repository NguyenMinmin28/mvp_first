import React from "react";
import { Command, Moon, SunMedium, Monitor } from "lucide-react";

export type IconKeys = keyof typeof icons;

type IconsType = {
  [key in IconKeys]: React.ElementType;
};

const icons = {
  logo: Command,
  sun: SunMedium,
  moon: Moon,
  monitor: Monitor,
  google: ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
      <path fill="#EA4335" d="M12 11v3.6h5.1c-.2 1.3-1.53 3.8-5.1 3.8-3.07 0-5.57-2.54-5.57-5.7S8.93 7 12 7c1.75 0 2.93.74 3.6 1.38l2.46-2.37C16.74 4.7 14.6 3.8 12 3.8 6.93 3.8 2.8 7.92 2.8 12.7S6.93 21.6 12 21.6c6.16 0 7.97-4.32 7.97-6.56 0-.44-.05-.73-.1-1.04H12z"/>
      <path fill="#34A853" d="M3.96 8.98l3 2.2C7.58 9.1 9.57 7.6 12 7.6c1.75 0 2.93.74 3.6 1.38l2.46-2.37C16.74 4.7 14.6 3.8 12 3.8 8.56 3.8 5.6 5.73 3.96 8.98z" opacity="0"/>
      <path fill="#FBBC05" d="M20.04 13.99c.13-.44.2-.91.2-1.39 0-.48-.07-.95-.2-1.39H12V14h8.04z"/>
      <path fill="#34A853" d="M12 21.6c2.7 0 4.97-.9 6.63-2.45l-2.9-2.27c-.78.53-1.8.9-3.73.9-2.87 0-5.3-1.93-6.17-4.53H3.88v2.85C5.7 19.13 8.9 21.6 12 21.6z"/>
      <path fill="#4285F4" d="M18.63 19.15C20.38 17.55 21.2 15.2 21.2 12.7c0-.5-.05-.98-.16-1.43H12V14h5.1c-.25 1.26-.95 2.33-2.08 3.1l3.61 2.05z"/>
    </svg>
  ),
};

export const Icons: IconsType = icons;
