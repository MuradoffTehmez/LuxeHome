import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 native flat config ixrac edir; `FlatCompat` sarğısı
// onun plugin obyektini dövri JSON kimi seriallaşdırmağa çalışıb çökürdü.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // eslint-config-next 16 ilə gələn `react-hooks` v7 React Compiler qaydalarını
    // da açır. Layihə React Compiler işlətmir; `set-state-in-effect` hallarının
    // çoxu hydration-dan sonra localStorage/tema oxuyan qəsdən pattern-dir,
    // `purity` isə Server Component-də `Date.now()`-u tutur (orada render bir
    // dəfədir). Next 15-dəki qayda dəsti ilə paritet saxlanılır; refaktor ayrıca
    // issue-dadır.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
  globalIgnores([
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
  ]),
]);

export default eslintConfig;
