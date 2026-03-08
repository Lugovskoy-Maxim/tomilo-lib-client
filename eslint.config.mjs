import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import prettier from "eslint-config-prettier";

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
      ".prettierrc",
      ".prettierignore",
      ".prettierrc.mjs",
    ],
  },
  {
    // В ридере, карточках и внешних URL часто нужен нативный <img> (динамический src, no optimization)
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  prettier,
];

export default eslintConfig;
