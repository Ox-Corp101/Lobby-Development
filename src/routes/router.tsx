import { createBrowserRouter } from 'react-router';
import AppLayout from '../components/layout/AppLayout';
import SignInPage from '../features/auth/pages/SignInPage';
import SignUpPage from '../features/auth/pages/SignUpPage';
import ProfilePage from '../features/profile/pages/ProfilePage';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/sign-up', element: <SignUpPage /> },
      { path: '/sign-in', element: <SignInPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
