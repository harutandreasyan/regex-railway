import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5182, strictPort: true },
  build: { target: "es2022", assetsInlineLimit: 0 },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
