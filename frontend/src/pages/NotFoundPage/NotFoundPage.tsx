import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <AlertTriangle size={64} className="text-accent-500 mb-6" />
      <h1 className="text-3xl font-bold text-primary-500 mb-2">Page Not Found</h1>
      <p className="text-neutral-600 mb-8 text-center max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary flex items-center">
        <Home size={16} className="mr-2" />
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;