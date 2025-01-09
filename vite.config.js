import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 3000, // Optional: Adjust the port if needed
  },
  build: {
    outDir: "dist", // Ensure this matches Vercel's output directory
  },
});
