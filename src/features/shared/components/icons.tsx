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
};

export const Icons: IconsType = icons;
