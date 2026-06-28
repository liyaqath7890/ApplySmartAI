import { useState } from 'react';
import {
  Bot,
  User,
  Send,
  Video,
  Clock,
  CheckCircle,
  Play,
  RotateCcw,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'interviewer';
  content: string;
}

const interviewQuestions = [
  "Tell me about yourself and your background.",
  "What are your greatest strengths?",
  "Describe a challenging project you worked on.",
  "How do you handle conflicts in a team?",
  "Where do you see yourself in 5 years?",
];

export default function InterviewSimulatorPage() {
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const startInterview = () => {
    setIsStarted(true);
    const firstQuestion: Message = {
      id: '1',
      role: 'interviewer',
      content: interviewQuestions[0],
    };
    setMessages([firstQuestion]);
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    if (currentQuestion < interviewQuestions.length - 1) {
      setIsTyping(true);
      setTimeout(() => {
        const nextQuestion: Message = {
          id: (Date.now() + 1).toString(),
          role: 'interviewer',
          content: interviewQuestions[currentQuestion + 1],
        };
        setMessages((prev) => [...prev, nextQuestion]);
        setCurrentQuestion((prev) => prev + 1);
        setIsTyping(false);
      }, 2000);
    }
  };

  const resetInterview = () => {
    setIsStarted(false);
    setMessages([]);
    setCurrentQuestion(0);
    setInput('');
  };

  if (!isStarted) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-900 mb-2">AI Interview Simulator</h1>
          <p className="text-dark-600">
            Practice your interview skills with AI-powered mock interviews
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Text Interview */}
          <div className="card">
            <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
              <Bot className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-dark-900 mb-2">Text Interview</h2>
            <p className="text-dark-600 mb-6">
              Practice with text-based questions and responses. Great for preparing 
              common interview answers and getting comfortable with the flow.
            </p>
            <button onClick={startInterview} className="btn btn-primary w-full">
              <Play className="h-4 w-4 mr-2" />
              Start Text Interview
            </button>
          </div>

          {/* Video Interview */}
          <div className="card">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
              <Video className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-dark-900 mb-2">Video Interview</h2>
            <p className="text-dark-600 mb-6">
              Simulate a real video interview experience. Practice your body language, 
              eye contact, and verbal communication skills.
            </p>
            <button onClick={startInterview} className="btn btn-primary w-full bg-green-600 hover:bg-green-700">
              <Video className="h-4 w-4 mr-2" />
              Start Video Interview
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="card">
            <Clock className="h-6 w-6 text-primary-600 mb-3" />
            <h3 className="font-semibold text-dark-900 mb-2">Real-time Feedback</h3>
            <p className="text-sm text-dark-500">
              Get instant feedback on your responses and suggestions for improvement.
            </p>
          </div>
          <div className="card">
            <CheckCircle className="h-6 w-6 text-green-600 mb-3" />
            <h3 className="font-semibold text-dark-900 mb-2">Common Questions</h3>
            <p className="text-sm text-dark-500">
              Practice with the most commonly asked interview questions in your field.
            </p>
          </div>
          <div className="card">
            <RotateCcw className="h-6 w-6 text-blue-600 mb-3" />
            <h3 className="font-semibold text-dark-900 mb-2">Unlimited Practice</h3>
            <p className="text-sm text-dark-500">
              Practice as many times as you want until you feel confident.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-900 mb-2">AI Interview Simulator</h1>
          <p className="text-dark-600">
            Question {currentQuestion + 1} of {interviewQuestions.length}
          </p>
        </div>
        <button onClick={resetInterview} className="btn btn-secondary">
          <RotateCcw className="h-4 w-4 mr-2" />
          End Interview
        </button>
      </div>

      <div className="card h-[500px] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-primary-100'
                    : 'bg-green-100'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="h-5 w-5 text-primary-600" />
                ) : (
                  <Bot className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div
                className={`max-w-[70%] p-4 rounded-xl ${
                  message.role === 'user'
                    ? 'bg-primary-50 text-dark-900'
                    : 'bg-green-50 text-dark-700'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Bot className="h-5 w-5 text-green-600" />
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <div className="flex gap-2">
                  <div className="h-2 w-2 bg-green-300 rounded-full animate-bounce" />
                  <div className="h-2 w-2 bg-green-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="h-2 w-2 bg-green-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t pt-4">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer..."
              className="input flex-1"
            />
            <button type="submit" className="btn btn-primary">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}