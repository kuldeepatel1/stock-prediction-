import React from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { TrendingUp, BarChart3, Shield, Zap, ArrowRight, Sparkles, ChevronRight } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'Advanced Predictions',
      description: 'Advanced machine learning algorithms analyze market trends and predict future stock prices with high accuracy.',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50'
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Interactive Charts',
      description: 'Visualize historical data and future predictions with beautiful, interactive charts and comprehensive analytics.',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with Clerk authentication ensures your data is protected and accessible only to you.',
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50'
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Real-time Data',
      description: 'Access up-to-date market information and get instant predictions for over 250 top Indian stocks.',
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-50'
    },
  ];

  const stats = [
    { value: '140+', label: 'Stocks Tracked' },
    { value: '5+', label: 'Years of Data' },
    { value: '99.9%', label: 'Uptime' },
    { value: '50K+', label: 'Active Users' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-bg-animated">
        {/* Background patterns */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 animate-fade-in">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-sm text-white/90">Stock Price Prediction</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-slide-up">
              Stock Market Price
              <span className="block bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                Prediction System
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Harness advanced algorithms to predict stock prices and make informed investment decisions.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <SignedOut>
                <Link
                  to="/sign-up"
                  className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-blue-900 text-lg font-semibold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center">
                    Register Now
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </span>
                </Link>
                <Link
                  to="/sign-in"
                  className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20"
                >
                  Sign In
                </Link>
              </SignedOut>
              
              <SignedIn>
                <Link
                  to="/dashboard"
                  className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-blue-900 text-lg font-semibold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  <span className="relative flex items-center">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </span>
                </Link>
              </SignedIn>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-blue-200">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Zap className="h-4 w-4" />
              <span>Why Choose Us</span>
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4">
              Powerful Features for
              <span className="text-gradient"> Smart Investing</span>
            </h2>
            <p className="text-xl text-dark-500 max-w-2xl mx-auto">
              Cutting-edge technology meets user-friendly design to deliver the most accurate stock predictions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card group p-6 bg-white rounded-2xl shadow-card border border-dark-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-500"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.bgGradient} rounded-xl flex items-center justify-center mb-4 ${feature.gradient} group-hover:scale-110 transition-transform duration-300`}>
                  {React.cloneElement(feature.icon, { className: `h-7 w-7 text-white` })}
                </div>
                <h3 className="text-xl font-bold text-dark-800 mb-3 group-hover:text-primary-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-dark-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-b from-white to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-dark-500 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Sign Up', desc: 'Create your free account in seconds' },
              { step: '02', title: 'Select Stock', desc: 'Choose from 250+ Indian stocks' },
              { step: '03', title: 'Get Predictions', desc: 'View price forecasts' },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/30 transform hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold text-dark-800 mb-2">{item.title}</h3>
                <p className="text-dark-500">{item.desc}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary-300 to-accent-300">
                    <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 text-primary-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-accent-600 to-primary-600"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%)] bg-[length:20px_20px]"></div>
        
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Predicting?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of investors who trust our predictions to make smarter investment decisions.
            </p>
          </div>
          
          <SignedOut>
            <Link
              to="/sign-up"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-900 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 group"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </SignedOut>
          
          <p className="mt-6 text-sm text-blue-200">
            No credit card required • Free to try • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">StockPredict</span>
            </div>
            <p className="text-dark-400 text-sm">
              © {new Date().getFullYear()} StockPredict. All rights reserved.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-dark-800 text-center md:text-left">
            <p className="text-xs text-dark-500">
              Disclaimer: Stock predictions are for informational purposes only. Past performance does not guarantee future results. Please consult with financial advisors before making investment decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

