import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * `next/link` və `next/navigation`-ın dil-agah əvəzediciləri. `(site)` ağacındakı
 * bütün daxili keçidlər bunlardan istifadə etməlidir — əks halda EN/RU-da naviqasiya
 * cari dili itirib AZ-a düşər.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
