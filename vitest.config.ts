import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["lib/**/*.test.ts"],
        },
        resolve: {
          alias: { "@": path.resolve(__dirname, ".") },
        },
      },
      {
        test: {
          name: "component",
          environment: "jsdom",
          include: ["components/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
        resolve: {
          alias: { "@": path.resolve(__dirname, ".") },
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
