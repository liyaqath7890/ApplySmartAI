import React, { useState, useEffect, useCallback } from 'react';
import { Mic, SkipForward, Send, Square, Clock, Lightbulb, ChevronRight } from 'lucide-react';
import { Button, Badge } from './ui';
import { useInterviewPrepStore } from '@/store';
import toast from 'react-hot-toast';

interface InterviewSimulatorProps {
  onComplete?: (sessionId: string) => void;
}

export default function InterviewSimulator({ onComplete }: InterviewSimulatorProps) {
  const { activeSession, submitAnswer, nextQuestion, endSession } = useInterviewPrepStore();
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const session = activeSession;
  const currentQuestion = session?.questions[session.currentIndex];
  const isLastQuestion = session ? session.currentIndex >= session.questions.length - 1 : false;
  const progress = session ? ((session.currentIndex + 1) / session.questions.length) * 100 : 0;

  useEffect(() => {
    if (!session?.isActive) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [session?.isActive, session?.sessionId]);

  useEffect(() => {
    setAnswer('');
    setShowHint(false);
    setElapsed(0);
  }, [session?.currentIndex]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSubmit = useCallback(() => {
    if (!answer.trim()) {
      toast.error('Please enter an answer or skip the question');
      return;
    }
    submitAnswer(answer);
    if (isLastQuestion) {
      const result = endSession();
      toast.success(`Session complete! Score: ${result?.overallScore ?? 0}%`);
      onComplete?.(result?.id ?? '');
    } else {
      nextQuestion();
      toast.success('Answer submitted');
    }
  }, [answer, isLastQuestion, submitAnswer, nextQuestion, endSession, onComplete]);

  const handleSkip = useCallback(() => {
    submitAnswer('', true);
    if (isLastQuestion) {
      const result = endSession();
      toast.success(`Session complete! Score: ${result?.overallScore ?? 0}%`);
      onComplete?.(result?.id ?? '');
    } else {
      nextQuestion();
    }
  }, [isLastQuestion, submitAnswer, nextQuestion, endSession, onComplete]);

  const handleEndEarly = () => {
    const result = endSession();
    toast.success(`Session ended. Score: ${result?.overallScore ?? 0}%`);
    onComplete?.(result?.id ?? '');
  };

  if (!session?.isActive || !currentQuestion) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold">{session.categoryName}</h3>
            <p className="text-sm text-primary-100">
              Question {session.currentIndex + 1} of {session.questions.length}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            {formatTime(elapsed)}
          </div>
        </div>
        <div className="w-full bg-primary-400/30 rounded-full h-2">
          <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={currentQuestion.type === 'behavioral' ? 'info' : 'primary'}>
            {currentQuestion.type.replace('_', ' ')}
          </Badge>
          <Badge variant="default">{currentQuestion.difficulty}</Badge>
        </div>

        <p className="text-lg font-medium text-gray-900">{currentQuestion.question}</p>

        {currentQuestion.hint && (
          <div>
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <Lightbulb className="h-4 w-4" />
              {showHint ? 'Hide hint' : 'Show hint'}
            </button>
            {showHint && (
              <p className="mt-2 text-sm text-gray-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                {currentQuestion.hint}
              </p>
            )}
          </div>
        )}

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here... Use STAR method for behavioral questions."
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSubmit} className="flex items-center gap-2">
            {isLastQuestion ? (
              <>
                <Square className="h-4 w-4" />
                Finish Interview
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit & Next
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleSkip} className="flex items-center gap-2">
            <SkipForward className="h-4 w-4" />
            Skip
          </Button>
          <Button variant="ghost" onClick={handleEndEarly}>
            End Session
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
          <Mic className="h-4 w-4" />
          Tip: Speak your answer aloud before typing for better practice
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}
