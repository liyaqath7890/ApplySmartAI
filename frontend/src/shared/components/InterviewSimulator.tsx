import React, { useState, useEffect, useCallback } from 'react';
import { Mic, SkipForward, Send, Square, Clock, Lightbulb, ChevronRight, Sparkles } from 'lucide-react';
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

  const handleSubmit = useCallback(async () => {
    if (!answer.trim()) {
      toast.error('Please enter an answer or skip the question');
      return;
    }
    await submitAnswer(answer);
    if (isLastQuestion) {
      const result = await endSession();
      toast.success(`Session complete! Score: ${result?.overallScore ?? 0}%`);
      onComplete?.(result?.id ?? '');
    } else {
      nextQuestion();
      toast.success('Answer submitted');
    }
  }, [answer, isLastQuestion, submitAnswer, nextQuestion, endSession, onComplete]);

  const handleSkip = useCallback(async () => {
    await submitAnswer('', true);
    if (isLastQuestion) {
      const result = await endSession();
      toast.success(`Session complete! Score: ${result?.overallScore ?? 0}%`);
      onComplete?.(result?.id ?? '');
    } else {
      nextQuestion();
    }
  }, [isLastQuestion, submitAnswer, nextQuestion, endSession, onComplete]);

  const handleEndEarly = async () => {
    const result = await endSession();
    toast.success(`Session ended. Score: ${result?.overallScore ?? 0}%`);
    onComplete?.(result?.id ?? '');
  };

  if (!session?.isActive || !currentQuestion) {
    return null;
  }

  return (
    <div className="bg-app-card rounded-xl border border-app-border overflow-hidden shadow-2xl">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
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
        <div className="w-full bg-primary-450/30 rounded-full h-2">
          <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-app-card text-app-primary">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={currentQuestion.type === 'behavioral' ? 'info' : 'primary'}>
              {currentQuestion.type.replace('_', ' ')}
            </Badge>
            <Badge variant="default">{currentQuestion.difficulty}</Badge>
          </div>

          <p className="text-lg font-medium text-slate-200">{currentQuestion.question}</p>

          {currentQuestion.hint && (
            <div>
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
              >
                <Lightbulb className="h-4 w-4" />
                {showHint ? 'Hide hint' : 'Show hint'}
              </button>
              {showHint && (
                <p className="mt-2 text-sm text-slate-350 bg-slate-900/60 p-3 rounded-lg border border-app-border">
                  {currentQuestion.hint}
                </p>
              )}
            </div>
          )}

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here... Use STAR method (Situation, Task, Action, Result)."
            rows={6}
            className="w-full px-4 py-3 border border-app-border rounded-xl bg-app-bg text-slate-250 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none text-sm"
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

          <div className="flex items-center gap-2 text-xs text-app-secondary pt-2 border-t border-app-border">
            <Mic className="h-4 w-4 text-blue-400" />
            Tip: Speak your answer aloud before typing for better practice
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>

        {/* Dynamic STAR & Speech Assessment Panel */}
        <div className="lg:col-span-1 border border-app-border rounded-xl p-4 bg-slate-900/30 space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5 border-b border-app-border pb-2">
            <Sparkles className="h-4 w-4 text-amber-450" /> Live Speech Advisor
          </h4>

          {/* WPM & Volume pace indicators */}
          {(() => {
            const words = answer.split(/\s+/).filter(Boolean).length;
            const wpm = elapsed > 0 ? Math.round((words / elapsed) * 60) : 0;
            const hasNumbers = /\d+%|\d+\s*(?:percent|x|times)/i.test(answer);
            
            return (
              <div className="space-y-4 text-xs text-slate-350">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-app-bg border border-app-border">
                    <span className="text-[10px] text-app-secondary uppercase font-semibold">Speech Pace</span>
                    <p className="font-bold text-slate-200 mt-0.5">{wpm > 0 ? `${wpm} WPM` : '0 WPM'}</p>
                    <span className={`text-[9px] ${wpm === 0 ? 'text-app-secondary' : wpm < 100 ? 'text-amber-500' : wpm < 150 ? 'text-emerald-450' : 'text-rose-500'}`}>
                      {wpm === 0 ? 'Not speaking' : wpm < 100 ? 'Too slow' : wpm < 150 ? 'Pace: Excellent' : 'Too fast'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-app-bg border border-app-border">
                    <span className="text-[10px] text-app-secondary uppercase font-semibold">Volume level</span>
                    <p className="font-bold text-slate-200 mt-0.5">{words > 0 ? 'Normal' : 'Silent'}</p>
                    <span className="text-[9px] text-emerald-450">Clear metadata</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-app-border pt-3">
                  <span className="text-[10px] text-app-secondary uppercase font-bold tracking-wider">STAR Structure completeness</span>
                  <ul className="space-y-1.5 mt-1">
                    <li className="flex items-center gap-2">
                      <input type="checkbox" readOnly checked={words >= 5} className="rounded text-blue-500 focus:ring-0" />
                      <span className={words >= 5 ? 'text-slate-200 font-medium' : 'text-app-secondary'}>Situation (Context set)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <input type="checkbox" readOnly checked={words >= 20} className="rounded text-blue-500 focus:ring-0" />
                      <span className={words >= 20 ? 'text-slate-200 font-medium' : 'text-app-secondary'}>Task (Milestone set)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <input type="checkbox" readOnly checked={words >= 45} className="rounded text-blue-500 focus:ring-0" />
                      <span className={words >= 45 ? 'text-slate-200 font-medium' : 'text-app-secondary'}>Action (Detailed items)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <input type="checkbox" readOnly checked={hasNumbers} className="rounded text-blue-500 focus:ring-0" />
                      <span className={hasNumbers ? 'text-slate-200 font-medium' : 'text-app-secondary'}>Result (Quantified metric)</span>
                    </li>
                  </ul>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
