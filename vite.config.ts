import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { isSecretSupabaseKey } from './src/lib/secretKeys';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Safety net: refuse to start or build if any browser-exposed (VITE_*) variable
  // holds a Supabase secret or service-role key. Vite would otherwise embed it
  // in the JavaScript sent to every visitor.
  const exposed = loadEnv(mode, '.', 'VITE_');
  const leaked = Object.entries(exposed).filter(([, value]) => isSecretSupabaseKey(value));
  if (leaked.length > 0) {
    throw new Error(
      `Refusing to run: ${leaked.map(([name]) => name).join(', ')} contains a Supabase ` +
        'secret or service-role key. Remove it from your .env files and use the publishable key. ' +
        'Treat the exposed key as compromised and rotate it in the Supabase dashboard.',
    );
  }

  return {
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
  };
});
