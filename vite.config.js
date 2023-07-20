import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 30000,
    include: ["test/**/*"],
    exclude: [...configDefaults.exclude],
  },
});
