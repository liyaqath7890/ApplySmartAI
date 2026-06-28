import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Eye, EyeOff, User, Sparkles, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '@/api/services/authService';
import { useAuthStore } from '@/store/authStore';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter'),
  confirmPassword: z.string(),
  role: z.enum(['candidate', 'recruiter']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'recruiter'>('candidate');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'candidate',
    },
  });

  const currentRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      const response = await authService.register(registerData);
      setAuth(response.user, response.token, response.refreshToken);
      toast.success('Account created successfully!');
      navigate('/app/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-dark-900">Create Account</h1>
          <p className="text-dark-500 mt-2">Join AI Job Agent today</p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => { setSelectedRole('candidate'); setValue('role', 'candidate'); }}
            className={`p-4 rounded-xl border-2 transition-all ${
              currentRole === 'candidate'
                ? 'border-primary-600 bg-primary-50'
                : 'border-dark-200 hover:border-dark-300'
            }`}
          >
            <User className={`h-6 w-6 mx-auto mb-2 ${
              currentRole === 'candidate' ? 'text-primary-600' : 'text-dark-400'
            }`} />
            <p className={`text-sm font-medium ${
              currentRole === 'candidate' ? 'text-primary-600' : 'text-dark-600'
            }`}>
              Candidate
            </p>
            <p className="text-xs text-dark-500 mt-1">Looking for jobs</p>
          </button>
          <button
            type="button"
            onClick={() => { setSelectedRole('recruiter'); setValue('role', 'recruiter'); }}
            className={`p-4 rounded-xl border-2 transition-all ${
              currentRole === 'recruiter'
                ? 'border-primary-600 bg-primary-50'
                : 'border-dark-200 hover:border-dark-300'
            }`}
          >
            <Briefcase className={`h-6 w-6 mx-auto mb-2 ${
              currentRole === 'recruiter' ? 'text-primary-600' : 'text-dark-400'
            }`} />
            <p className={`text-sm font-medium ${
              currentRole === 'recruiter' ? 'text-primary-600' : 'text-dark-600'
            }`}>
              Recruiter
            </p>
            <p className="text-xs text-dark-500 mt-1">Hiring talent</p>
          </button>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('role')} />
            
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
                  <input
                    {...register('firstName')}
                    type="text"
                    className="input pl-10"
                    placeholder="John"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Last Name
                </label>
                <input
                  {...register('lastName')}
                  type="text"
                  className="input"
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
                <input
                  {...register('email')}
                  type="email"
                  className="input pl-10"
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-dark-500">Already have an account?</span>
            </div>
          </div>

          {/* Login link */}
          <Link
            to="/login"
            className="btn btn-outline w-full mt-4"
          >
            Sign in
          </Link>
        </div>

        {/* Footer text */}
        <p className="text-center text-sm text-dark-500 mt-6">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-primary-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}