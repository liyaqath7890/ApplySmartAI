import { Link } from 'react-router-dom';
import { ArrowLeft, Globe } from 'lucide-react';

export default function JobDetailPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/jobs" className="inline-flex items-center gap-2 text-dark-500 hover:text-dark-900 mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>
      
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200 mt-8">
        <Globe className="h-12 w-12 text-dark-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-dark-900 mb-2">Authentication Required</h3>
        <p className="text-dark-500 mb-6">Please log in or create an account to view full job details and apply.</p>
        <div className="flex justify-center gap-4">
          <Link to="/login" className="btn btn-outline px-6 py-2 border border-gray-300 rounded-lg">
            Log in
          </Link>
          <Link to="/register" className="btn btn-primary px-6 py-2 bg-primary-600 text-white rounded-lg">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}