import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Fail instead of silently moving to another port if 5173 is taken.
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
