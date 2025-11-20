'use client';

import { useEffect } from 'react';

export default function ApiDocsPage() {
  useEffect(() => {
    // Redirect to static HTML version
    window.location.href = '/api-docs.html';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Redirecting to API documentation...</p>
        <p className="text-sm text-gray-500 mt-2">
          If not redirected, <a href="/api-docs.html" className="text-blue-600 underline">click here</a>
        </p>
      </div>
    </div>
  );
}