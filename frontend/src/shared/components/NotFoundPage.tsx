import { Link } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <SearchX className="h-24 w-24 text-dark-300 mb-6" />
      <h1 className="text-6xl font-bold text-dark-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-dark-700 mb-4">
        Page Not Found
      </h2>
      <p className="text-dark-500 mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved. 
        Let's get you back on track.
      </p>
      <Link
        to="/"
        className="btn btn-primary inline-flex items-center gap-2"
      >
        <Home className="h-4 w-4" />
        Back to Home
      </Link>
    </div>
  );
}