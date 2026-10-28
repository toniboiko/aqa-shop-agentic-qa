import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules", "test-results", "playwright-report"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["tests/**/*.ts", "pages/**/*.ts"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          property: "waitForTimeout",
          message: "Fixed pauses are forbidden. Use web-first assertions.",
        },
      ],
    },
  },
  {
    files: ["tests/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.name='page'][callee.property.name=/^(locator|getBy\\w+)$/]",
          message: "Raw locators are forbidden in specs. Use a Page Object.",
        },
        {
          selector:
            "CallExpression[callee.name='expect'][arguments.0.type='Literal']",
          message:
            "expect() on a literal checks nothing. Assert on a locator, page or real value.",
        },
      ],
    },
  },
);
