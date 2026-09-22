'use client';

import { Component } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

/**
 * Next signals notFound() and redirect() by throwing. Those are control flow,
 * not failures: swallowing them leaves the framework unable to set the status,
 * so a missing page renders this boundary's fallback with HTTP 200 — a soft 404
 * that search engines happily index. They are identified by `digest`.
 */
const isNextControlFlow = (error) => {
  const digest = error?.digest;
  if (typeof digest === 'string'
      && (digest === 'NEXT_NOT_FOUND' || digest.startsWith('NEXT_REDIRECT'))) return true;
  const message = typeof error?.message === 'string' ? error.message : '';
  return message === 'NEXT_NOT_FOUND' || message.startsWith('NEXT_REDIRECT');
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Let notFound()/redirect() travel on to Next untouched.
    if (isNextControlFlow(error)) throw error;
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (isNextControlFlow(error)) throw error;
    console.error('Page Error Caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
    
    // Log to error tracking service if available
    // Only a code, never the error text (it can contain names or typed input).
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: 'render_error',
        fatal: false
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>Something went wrong</h2>
            <p className="text-gray-600 mb-6">
              We encountered an error while loading this page. This might be due to a network issue or a temporary server problem.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded text-left">
                <p className="text-sm font-mono text-red-800 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center px-4 py-2 bg-[#025545] text-white rounded-lg font-medium hover:bg-[#012f23] transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-6">
              If this problem persists, please try again later or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;








