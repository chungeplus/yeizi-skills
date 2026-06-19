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
    ignores: [
      "docs/superpowers/**",
      "dist/**",
    ],
  },
)
