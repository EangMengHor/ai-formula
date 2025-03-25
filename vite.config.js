import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    outDir: "dist",
  },
  server: {
    historyApiFallback: true,  // Ensure fallback for React Router
  },
  preview: {
    port: 5000,  // Test locally before deploying
  },
});
