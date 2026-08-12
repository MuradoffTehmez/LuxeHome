import {
  Building2,
  Camera,
  Hammer,
  Handshake,
  KeyRound,
  Landmark,
  Megaphone,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Xidmət ikonları.
 *
 * Admin paneldə xidmət üçün ikon adı mətn kimi saxlanılır. Burada yalnız
 * icazə verilən dəst xəritələnir — bilinməyən ad gəldikdə neytral ikona
 * qayıdılır, beləliklə istifadəçi girişi birbaşa komponent adına çevrilmir.
 */
const ICONS: Record<string, LucideIcon> = {
  Handshake,
  KeyRound,
  Landmark,
  Wallet,
  Hammer,
  Megaphone,
  Camera,
  Building2,
};

export const SERVICE_ICON_NAMES = Object.keys(ICONS);

export function ServiceIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Building2;
  return <Icon className={className} aria-hidden="true" />;
}
