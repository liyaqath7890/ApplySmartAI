import { lazy } from 'react';

const LoginPage = lazy(() => import('@/features/authentication/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/authentication/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/features/authentication/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/authentication/pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/features/authentication/pages/VerifyEmailPage'));

export const authRoutes = [
  { path: 'login', element: <LoginPage /> },
  { path: 'register', element: <RegisterPage /> },
  { path: 'forgot-password', element: <ForgotPasswordPage /> },
  { path: 'reset-password/:token', element: <ResetPasswordPage /> },
  { path: 'verify-email/:token', element: <VerifyEmailPage /> },
];