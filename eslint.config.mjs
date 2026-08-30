import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Avtomatik yaradılan fayllar
      "cloudflare-env.d.ts",
      ".open-next/**",
      // Kök və alt qovluqdakı worker-lərin (workers/*) wrangler build artefaktları
      ".wrangler/**",
      "**/.wrangler/**",
      // Lokal iş qovluqları. Git onları `tmp/.gitignore` və kök qaydası ilə buraxır,
      // amma ESLint flat config git-ignore oxumur — nəticədə `npm run lint` yerli
      // maşında OpenNext bundle-ının 1500-dən çox xətasını tökür və layihənin öz
      // xətaları həmin siyahıda itir. CI-də bu qovluqlar olmadığı üçün problem
      // yalnız lokal işdə görünürdü.
      "tmp/**",
      "archive-*/**",
    ],
  },
];

export default eslintConfig;
