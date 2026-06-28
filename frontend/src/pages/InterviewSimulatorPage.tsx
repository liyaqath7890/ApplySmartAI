// Legacy public route — redirect to the app version
import { Navigate } from 'react-router-dom';
export default function InterviewSimulatorPage() {
  return <Navigate to="/app/interview-preparation" replace />;
}
