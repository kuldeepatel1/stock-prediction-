import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import Home from './pages/Home';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load the Dashboard
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Compare = lazy(() => import('./pages/Compare'));
const Recognize = lazy(() => import('./pages/Recognize'));
const Personalize = lazy(() => import('./pages/Personalize'));

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
};

// Animated page wrapper component
const AnimatedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
    >
      {children}
    </motion.div>
  );
};

// Custom loading fallback
const PageLoader: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 border-4 border-primary-100 rounded-full mx-auto"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-primary-600 rounded-full border-t-transparent animate-spin mx-auto"></div>
        </div>
        <p className="text-dark-500 font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
};

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      <main className="pt-16">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <AnimatedPage>
                  <Home />
                </AnimatedPage>
              }
            />
            <Route
              path="/sign-in"
              element={
                <AnimatedPage>
                  <SignInPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/sign-up"
              element={
                <AnimatedPage>
                  <SignUpPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AnimatedPage>
                      <Dashboard />
                    </AnimatedPage>
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AnimatedPage>
                      <Favorites />
                    </AnimatedPage>
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/compare"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AnimatedPage>
                      <Compare />
                    </AnimatedPage>
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recognize"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AnimatedPage>
                      <Recognize />
                    </AnimatedPage>
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/personalize"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AnimatedPage>
                      <Personalize />
                    </AnimatedPage>
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;

