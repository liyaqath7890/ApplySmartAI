import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewService, InterviewSession, InterviewQuestion } from '../api/services/interviewService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const InterviewSimulatorPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['interviewSessions'],
    queryFn: () => interviewService.getSessions(),
    enabled: isAuthenticated
  });

  const createSessionMutation = useMutation({
    mutationFn: interviewService.createSession,
    onSuccess: (data) => {
      setCurrentSession(data.session);
      setCurrentQuestionIndex(0);
      queryClient.invalidateQueries({ queryKey: ['interviewSessions'] });
      toast.success('Interview session created!');
    }
  });

  const submitAnswerMutation = useMutation({
    mutationFn: ({ sessionId, questionId, answer }: { sessionId: string; questionId: string; answer: string }) =>
      interviewService.submitAnswer(sessionId, questionId, answer),
    onSuccess: (data) => {
      setCurrentSession(prev => prev ? {
        ...prev,
        questions: prev.questions?.map(q => q.id === data.question.id ? data.question : q)
      } : null);
      if (data.nextQuestion) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
      toast.success('Answer submitted!');
    }
  });

  const handleStartInterview = () => {
    createSessionMutation.mutate({ interviewType: 'mixed', difficultyLevel: 'intermediate' });
  };

  const handleSubmitAnswer = () => {
    if (!currentSession || !currentSession.questions) return;
    const question = currentSession.questions[currentQuestionIndex];
    submitAnswerMutation.mutate({
      sessionId: currentSession.id,
      questionId: question.id,
      answer
    });
    setAnswer('');
  };

  if (!isAuthenticated) return <div>Please log in</div>;
  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">AI Interview Simulator</h1>
        <p className="text-gray-600">Practice your interview skills with AI-powered feedback</p>
      </div>

      {!currentSession ? (
        <div className="text-center">
          <div className="mb-8">
            <h2 className="text-xl mb-4">Start a New Interview</h2>
            <button
              onClick={handleStartInterview}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700"
            >
              Start Interview
            </button>
          </div>

          {sessionsData?.sessions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg mb-4">Previous Sessions</h3>
              <div className="space-y-4">
                {sessionsData.sessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{session.interviewType}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{session.overallScore.toFixed(1)}/10</p>
                        <p className={`text-sm ${
                          session.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {session.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentSession.questions && currentQuestionIndex < currentSession.questions.length && (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {currentSession.totalQuestions}
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">
                  {currentSession.questions[currentQuestionIndex].question}
                </h2>
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  currentSession.questions[currentQuestionIndex].questionType === 'technical' ? 'bg-purple-100 text-purple-800' :
                  currentSession.questions[currentQuestionIndex].questionType === 'behavioral' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {currentSession.questions[currentQuestionIndex].questionType}
                </span>
              </div>

              <div className="mb-6">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-40 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSubmitAnswer}
                disabled={submitAnswerMutation.isPending || !answer.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitAnswerMutation.isPending ? 'Submitting...' : 'Submit Answer'}
              </button>

              {currentSession.questions[currentQuestionIndex].feedback && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Feedback</h3>
                  <p className="text-gray-700">{currentSession.questions[currentQuestionIndex].feedback}</p>
                  <p className="mt-2 text-lg font-semibold">
                    Score: {currentSession.questions[currentQuestionIndex].score}/10
                  </p>
                </div>
              )}
            </>
          )}

          {currentSession.questions && currentQuestionIndex >= currentSession.questions.length && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Interview Complete!</h2>
              <p className="text-xl mb-2">Overall Score: {currentSession.overallScore.toFixed(1)}/10</p>
              <button
                onClick={() => setCurrentSession(null)}
                className="mt-6 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterviewSimulatorPage;
