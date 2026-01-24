import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Check if the publishable key is properly configured
const isValidClerkKey =
  publishableKey &&
  publishableKey !== 'pk_test_your-clerk-key-here' &&
  publishableKey.startsWith('pk_');

if (!isValidClerkKey) {
  console.error('⚠️ Clerk Configuration Required');
  console.error('Please configure your Clerk publishable key:');
  console.error('1. Copy .env.example to .env.local');
  console.error('2. Replace the placeholder with your actual Clerk publishable key');
  console.error('3. Restart the development server');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Fallback component if Clerk is misconfigured
const ClerkConfigurationError = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
          <svg
            className="h-6 w-6 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Clerk Configuration Required
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          To use this application, you need to configure your Clerk publishable key.
        </p>
        <div className="text-left bg-gray-50 rounded-md p-4 mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Setup Steps:</h4>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>
              Copy <code className="bg-gray-200 px-1 rounded">.env.example</code> to{' '}
              <code className="bg-gray-200 px-1 rounded">.env.local</code>
            </li>
            <li>
              Get your publishable key from{' '}
              <a
                href="https://clerk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                Clerk Dashboard
              </a>
            </li>
            <li>
              Replace the placeholder in{' '}
              <code className="bg-gray-200 px-1 rounded">.env.local</code>
            </li>
            <li>Restart the development server</li>
          </ol>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {isValidClerkKey ? (
          <ClerkProvider publishableKey={publishableKey}>
            <App />
          </ClerkProvider>
        ) : (
          <ClerkConfigurationError />
        )}
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
