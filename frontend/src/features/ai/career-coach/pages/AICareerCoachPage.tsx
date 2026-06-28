import { useState } from 'react';
import {
  Bot,
  Send,
  User,
  Sparkles,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hello! I'm your AI Career Coach. I'm here to help you navigate your career path, provide personalized advice, and answer any questions you might have. How can I assist you today?",
  },
];

const suggestedQuestions = [
  "How can I improve my resume?",
  "What skills should I learn for a career change?",
  "How do I negotiate a higher salary?",
  "What's the best way to prepare for interviews?",
];

export default function AICareerCoachPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "That's a great question! Based on your profile and career goals, I'd recommend focusing on building your technical skills while also developing your soft skills. Consider taking online courses and working on personal projects.",
        "I understand your concern. Let me share some insights that might help. First, make sure your resume highlights your achievements with quantifiable metrics. Second, tailor your applications to each specific role.",
        "Excellent thinking! Career growth often requires a combination of skill development, networking, and strategic job moves. Let's break this down into actionable steps.",
        "That's a common challenge many professionals face. Here are some strategies that have worked well for others in similar situations...",
      ];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-dark-900">AI Career Coach</h1>
            <p className="text-dark-600">Get personalized career advice powered by AI</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Chat Section */}
        <div className="md:col-span-2 card flex flex-col h-[600px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-primary-100'
                      : 'bg-green-100'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-primary-600" />
                  ) : (
                    <Bot className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] p-4 rounded-xl ${
                    message.role === 'user'
                      ? 'bg-primary-50 text-dark-900'
                      : 'bg-dark-50 text-dark-700'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-green-600" />
                </div>
                <div className="bg-dark-50 p-4 rounded-xl">
                  <div className="flex gap-2">
                    <div className="h-2 w-2 bg-dark-300 rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-dark-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="h-2 w-2 bg-dark-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your career..."
              className="input flex-1"
            />
            <button type="submit" className="btn btn-primary">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Suggested Questions */}
          <div className="card">
            <h3 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-600" />
              Suggested Questions
            </h3>
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(question)}
                  className="w-full text-left p-3 rounded-lg bg-dark-50 hover:bg-primary-50 hover:text-primary-700 transition-colors text-sm"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="card">
            <h3 className="font-semibold text-dark-900 mb-4">Career Tips</h3>
            <ul className="space-y-3 text-sm text-dark-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">•</span>
                Update your LinkedIn profile regularly
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">•</span>
                Network with professionals in your field
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">•</span>
                Set quarterly career goals
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">•</span>
                Continuously learn new skills
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}