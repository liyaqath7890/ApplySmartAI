import { Link } from 'react-router-dom';
import { Briefcase, MapPin, DollarSign, Clock, Search, Filter, Building2, Globe } from 'lucide-react';

export default function JobsPage() {
  return (
    <div>
      <div className="mb-8 text-center mt-12">
        <h1 className="text-3xl font-bold text-dark-900 mb-2">Find Your Dream Job</h1>
        <p className="text-dark-600 mb-6">
          Discover opportunities that match your skills and aspirations.
        </p>
        <Link to="/register" className="btn btn-primary px-8 py-3 text-lg">
          Sign up to search AI-matched jobs
        </Link>
      </div>
      
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <Globe className="h-12 w-12 text-dark-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-dark-900 mb-2">Authentication Required</h3>
        <p className="text-dark-500 mb-4">Please log in or create an account to view and search jobs.</p>
        <Link to="/login" className="text-primary-600 font-medium hover:underline">
          Log in to your account
        </Link>
      </div>
    </div>
  );
}