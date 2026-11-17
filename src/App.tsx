import { RouterProvider } from 'react-router/dom';
import AuthProvider from './features/auth/AuthProvider';
import { supabaseConfig } from './lib/supabase';
import ConfigErrorPage from './pages/ConfigErrorPage';
import { router } from './routes/router';

export default function App() {
  // Refuse to run with missing or unsafe Supabase settings.
  if (!supabaseConfig.ok) return <ConfigErrorPage problem={supabaseConfig.problem} />;

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
