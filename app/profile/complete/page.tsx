'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function CompleteContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Profile Complete!
          </h1>
          <p className="text-gray-600">
            Check your email: {email}
          </p>
        </div>

        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 mb-6 text-left">
          <h2 className="font-semibold text-gray-900 mb-2">Next steps:</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✓ Check your email for a magic link</li>
            <li>✓ Click the link to access your dashboard</li>
            <li>✓ View your matched surveys and start earning</li>
            <li>✓ Bookmark your dashboard for easy access</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Back to Home
          </Link>
          <p className="text-sm text-gray-500">
            Didn&apos;t get the email? Check your spam folder
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CompleteContent />
    </Suspense>
  );
}