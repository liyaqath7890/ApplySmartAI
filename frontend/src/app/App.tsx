import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import AppLayout from '@/layouts/AppLayout';

// Route definitions
import { publicRoutes } from '@/routes/publicRoutes';
import { protectedRoutes } from '@/routes/protectedRoutes';
import { authRoutes } from '@/routes/authRoutes';
import { appRoutes } from '@/routes/appRoutes';

// Fallback pages
import NotFoundPage from '@/shared/components/NotFoundPage';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      {/* Public routes with main layout */}
      <Route path="/" element={<MainLayout />}>
        {publicRoutes.map((route) => (
          <Route 
            key={route.path} 
            path={route.path} 
            element={
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              }>
                {route.element}
              </Suspense>
            }
          />
        ))}
      </Route>

      {/* Auth routes with auth layout */}
      <Route path="/" element={<AuthLayout />}>
        {authRoutes.map((route) => (
          <Route 
            key={route.path} 
            path={route.path} 
            element={
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              }>
                {route.element}
              </Suspense>
            }
          />
        ))}
      </Route>

      {/* App routes (for authenticated users) */}
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        {appRoutes.map((route) => (
          <Route 
            key={route.path} 
            path={route.path} 
            element={
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              }>
                {route.element}
              </Suspense>
            }
          />
        ))}
      </Route>

      {/* Legacy protected routes (redirect to /app) */}
      {protectedRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<Navigate to={`/app/${route.path}`} replace />}
        />
      ))}

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;