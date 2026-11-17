import { createBrowserRouter } from 'react-router';
import AppLayout from '../components/layout/AppLayout';
import CheckEmailPage from '../features/auth/pages/CheckEmailPage';
import ConfirmEmailPage from '../features/auth/pages/ConfirmEmailPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage';
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
      { path: '/check-email', element: <CheckEmailPage /> },
      { path: '/auth/confirm', element: <ConfirmEmailPage /> },
      { path: '/sign-in', element: <SignInPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
