import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import authService from '@/api/services/authService';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Invalid verification link');
        setIsVerifying(false);
        return;
      }

      try {
        await authService.verifyEmail(token);
        setIsVerified(true);
        toast.success('Email verified successfully!');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to verify email');
        toast.error('Failed to verify email');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token]);

  if (isVerifying) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-dark-900 mb-4">Verifying Email</h1>
          <p className="text-dark-500">Please wait while we verify your email address...</p>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-dark-900 mb-4">Email Verified!</h1>
          <p className="text-dark-500 mb-8">
            Your email has been successfully verified. You can now access all features of your account.
          </p>
          <Link
            to="/login"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-dark-900 mb-4">Verification Failed</h1>
        <p className="text-dark-500 mb-2">
          {error || 'The verification link is invalid or has expired.'}
        </p>
        <p className="text-dark-500 mb-8 text-sm">
          Please try registering again or contact support for assistance.
        </p>
        <Link
          to="/register"
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Create New Account
        </Link>
      </div>
    </div>
  );
}