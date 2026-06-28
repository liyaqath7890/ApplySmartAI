// Legacy route — redirect to the app version
import { Navigate } from 'react-router-dom';
export default function JobDiscoveryPage() {
  return <Navigate to="/app/job-discovery" replace />;
}
