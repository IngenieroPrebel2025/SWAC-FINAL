import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    ignores: [".next/**", "node_modules/**", "coverage/**"],
  },
  nextPlugin.flatConfig.coreWebVitals,
];
