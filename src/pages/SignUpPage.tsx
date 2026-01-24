import React from 'react';
import { Link } from 'react-router-dom';
import { SignUp } from '@clerk/clerk-react';
import { TrendingUp, ArrowLeft } from 'lucide-react';

const SignUpPage: React.FC = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-bg-animated relative overflow-hidden">
        {/* Background patterns */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <Link to="/" className="flex items-center space-x-3 mb-12">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">StockPredict</span>
          </Link>
          
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Start Your Journey to
            <span className="block text-purple-300">Smarter Investing</span>
          </h1>
          
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Join thousands of investors using advanced algorithms to predict stock prices and make informed decisions.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              'Access to 250+ Indian stocks',
              'Advanced price predictions',
              'Interactive charts & analytics',
              'Real-time market insights',
            ].map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-blue-100">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center justify-center space-x-2 mb-8 lg:hidden">
            <div className="p-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-dark-800">StockPredict</span>
          </Link>

          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center text-dark-500 hover:text-primary-600 transition-colors duration-200 mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back to Home</span>
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-dark-800 mb-2">Create Your Account</h2>
            <p className="text-dark-500">Start predicting stock prices today</p>
          </div>

          {/* Clerk SignUp */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-dark-100">
            <SignUp 
              redirectUrl="/dashboard"
              appearance={{
                elements: {
                  formButtonPrimary: 'btn-primary w-full py-3 rounded-xl',
                  card: 'shadow-none border-0',
                  headerTitle: 'text-xl font-bold text-dark-800',
                  headerSubtitle: 'text-dark-500',
                  socialButtonsBlockButton: 'border-dark-200 hover:bg-dark-50 rounded-xl',
                  formFieldLabel: 'text-dark-600 font-medium',
                  formFieldInput: 'bg-dark-50 border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500',
                  footerActionLink: 'text-primary-600 hover:text-primary-700',
                  identityPreviewText: 'text-dark-700',
                  identityPreviewIcon: 'text-dark-500',
                }
              }}
            />
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-dark-500">
            Already have an account?{' '}
            <Link to="/sign-in" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;

