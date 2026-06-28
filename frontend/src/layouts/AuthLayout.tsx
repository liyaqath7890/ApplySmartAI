import { Outlet, Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <Sparkles className="h-10 w-10 text-primary-600" />
            <span className="text-2xl font-bold text-dark-900">AI Job Agent</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Outlet />
        </div>

        {/* Footer links */}
        <div className="text-center mt-6">
          <p className="text-sm text-dark-600">
            By continuing, you agree to our{' '}
            <Link to="#" className="text-primary-600 hover:underline">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link to="#" className="text-primary-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}