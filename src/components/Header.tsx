import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { TrendingUp, LogIn, UserPlus, Menu, X, Star } from 'lucide-react';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Glassmorphism header */}
      <div className="glass-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative p-2 bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg group-hover:from-primary-500 group-hover:to-accent-500 transition-all duration-200">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold font-display text-dark-900 group-hover:text-primary-600 transition-colors duration-200">
                StockPredict
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              {/* When user is not signed in */}
              <SignedOut>
                <button
                  onClick={() => navigate('/sign-in')}
                  className="flex items-center space-x-2 px-4 py-2 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => navigate('/sign-up')}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:from-primary-500 hover:to-accent-500 transition-all duration-200 font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register</span>
                </button>
              </SignedOut>

              {/* When user is signed in */}
              <SignedIn>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/compare"
                  className="px-4 py-2 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
                >
                  Compare
                </Link>
                <Link
                  to="/recognize"
                  className="px-4 py-2 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
                >
                  Top Predictions
                </Link>
                <Link
                  to="/personalize"
                  className="px-4 py-2 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
                >
                  Personalize
                </Link>
                <Link
                  to="/favorites"
                  className="px-4 py-2 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium flex items-center space-x-2"
                >
                  <Star className="h-4 w-4" />
                  <span>Favorites</span>
                </Link>
                <div className="flex items-center space-x-3 ml-2 pl-4 border-l border-dark-200">
                  <div className="text-right hidden lg:block">
                    <span className="text-sm text-dark-600 font-medium block">Welcome back,</span>
                    <span className="text-sm font-semibold text-dark-900">{user?.firstName || 'User'}</span>
                  </div>
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9 ring-2 ring-primary-500/20 rounded-full"
                      }
                    }}
                  />
                </div>
              </SignedIn>
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-dark-200 bg-white/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-2">
              <SignedOut>
                <button
                  onClick={() => {
                    navigate('/sign-in');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-3 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/sign-up');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg font-semibold shadow-lg"
                >
                  <UserPlus className="h-5 w-5" />
                  <span>Register</span>
                </button>
              </SignedOut>

              <SignedIn>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/compare"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
                >
                  Compare
                </Link>
                <Link
                  to="/recognize"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
                >
                  Top Predictions
                </Link>
                <Link
                  to="/personalize"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
                >
                  Personalize
                </Link>
                <Link
                  to="/favorites"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
                >
                  Favorites
                </Link>
                <div className="px-4 py-3 text-dark-600">
                  <span className="text-sm">Welcome, </span>
                  <span className="font-semibold">{user?.firstName || 'User'}</span>
                </div>
              </SignedIn>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
