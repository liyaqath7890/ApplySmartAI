import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  Briefcase,
  FileText,
  Bot,
  MessageSquare,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Users,
  Globe,
  Zap,
  LayoutDashboard,
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const features = [
    {
      icon: FileText,
      title: 'AI Resume Analyzer',
      description: 'Get instant feedback on your resume with AI-powered analysis and improvement suggestions.',
      href: '/tools/resume-analyzer',
    },
    {
      icon: Bot,
      title: 'AI Career Coach',
      description: 'Receive personalized career advice, skill recommendations, and learning paths.',
      href: '/tools/career-coach',
    },
    {
      icon: MessageSquare,
      title: 'Interview Simulator',
      description: 'Practice with AI-powered mock interviews tailored to your target roles.',
      href: '/tools/interview-simulator',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Jobs Available' },
    { value: '5K+', label: 'Active Users' },
    { value: '500+', label: 'Companies' },
    { value: '95%', label: 'Success Rate' },
  ];

  const benefits = [
    'AI-powered job matching',
    'Personalized recommendations',
    'Resume optimization tips',
    'Mock interview practice',
    'Career path guidance',
    'Skill assessment tools',
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered Job Search Platform
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-dark-900 mb-6">
            Find Your Dream Job with{' '}
            <span className="text-primary-600">AI Intelligence</span>
          </h1>
          
          <p className="text-xl text-dark-600 max-w-2xl mx-auto mb-10">
            Revolutionizing job search with AI-powered matching, resume analysis, 
            and intelligent career guidance. Get hired faster with personalized insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {isAuthenticated ? (
              <Link to="/app/dashboard" className="btn btn-primary inline-flex items-center gap-2 text-lg px-8 py-3">
                <LayoutDashboard className="h-5 w-5" />
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary inline-flex items-center gap-2 text-lg px-8 py-3">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link to="/jobs" className="btn btn-outline inline-flex items-center gap-2 text-lg px-8 py-3">
                  <Briefcase className="h-5 w-5" />
                  Browse Jobs
                </Link>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-dark-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-dark-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4">
              AI-Powered Tools
            </h2>
            <p className="text-xl text-dark-600 max-w-2xl mx-auto">
              Leverage cutting-edge AI technology to enhance your job search and career development.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Link
                key={feature.title}
                to={feature.href}
                className="card hover:shadow-lg transition-shadow group"
              >
                <div className="h-14 w-14 rounded-xl bg-primary-100 flex items-center justify-center mb-6 group-hover:bg-primary-600 transition-colors">
                  <feature.icon className="h-7 w-7 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-dark-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-dark-600">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-6">
                Why Choose AI Job Agent?
              </h2>
              <p className="text-xl text-dark-600 mb-8">
                Our platform combines advanced AI technology with deep industry insights 
                to help you land your dream job faster than ever before.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-dark-700">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Link to="/register" className="btn btn-primary inline-flex items-center gap-2">
                  Start Your Journey
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <div className="text-center">
                  <Zap className="h-24 w-24 text-primary-600 mx-auto mb-4" />
                  <p className="text-primary-700 font-semibold text-lg">
                    AI-Powered Matching
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-primary-100 mb-10">
            Join thousands of professionals who have found their dream jobs with AI Job Agent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn bg-white text-primary-600 hover:bg-primary-50 inline-flex items-center gap-2 text-lg px-8 py-3">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/jobs" className="btn border-2 border-white text-white hover:bg-white/10 inline-flex items-center gap-2 text-lg px-8 py-3">
              <Briefcase className="h-5 w-5" />
              Explore Jobs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}