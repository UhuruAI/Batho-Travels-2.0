import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));
const sourcePath = (workspacePath) => path.join(root, workspacePath);

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["packages/**/*.test.ts"]
  },
  resolve: {
    alias: {
      "@batho/config": sourcePath("packages/config/src/index.ts"),
      "@batho/core": sourcePath("packages/core/src/index.ts"),
      "@batho/design-tokens": sourcePath("packages/design-tokens/src/index.ts"),
      "@batho/payments": sourcePath("packages/payments/src/index.ts"),
      "@batho/ui": sourcePath("packages/ui/src/index.ts")
    }
  }
});
