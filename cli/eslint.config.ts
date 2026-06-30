import antfu from "@antfu/eslint-config"

export default antfu(
  {
    type: "lib",
    stylistic: {
      quotes: "double",
    },
    typescript: {
      tsconfigPath: "tsconfig.json",
    },
    rules: {
      "ts/no-redeclare": "off",
      "ts/consistent-type-imports": "off",
      "no-console": ["error", { allow: ["log", "warn", "error"] }],
      "import/no-named-default": "off",
      "jsdoc/require-returns-check": "off",
    },
    ignores: [
      "docs/superpowers/**",
      "dist/**",
    ],
  },
)
