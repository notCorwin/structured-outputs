import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // A relative base works both at the domain root and under a GitHub Pages project path.
  base: "./",
});
