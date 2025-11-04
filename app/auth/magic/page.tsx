/**
 * QualifyFirst - Magic Auth Callback Page
 *
 * Handles the redirect from Magic email links, exchanges the Magic DID token
 * for a Supabase session, and forwards the user to the appropriate page.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { getMagicClient } from '../../lib/magic/client';
import { supabase } from '../../lib/supabase';

export default function MagicCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const magicCredential = searchParams?.get('magic_credential');
  const returnTo = searchParams?.get('returnTo');

  const [status, setStatus] = useState<'verifying' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your magic link...');

  useEffect(() => {
    let cancelled = false;

    const verifyMagicLink = async () => {
      if (!magicCredential) {
        setStatus('error');
        setMessage('Missing Magic credential. Please request a new login link.');
        return;
      }

      try {
        setStatus('verifying');
        setMessage('Verifying your magic link...');

        const magic = await getMagicClient();

        if (!magic) {
          throw new Error(
            'Magic publishable key is missing. Add NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY to your environment.',
          );
        }

        const didToken = await magic.auth.loginWithCredential(magicCredential);

        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'magic',
          token: didToken,
        });

        if (error) {
          throw error;
        }

        if (cancelled) {
          return;
        }

        if (returnTo === 'profile-complete') {
          router.replace('/profile/save-profile');
          return;
        }

        if (returnTo) {
          const normalized = returnTo.startsWith('/') ? returnTo : `/${returnTo}`;
          router.replace(normalized);
          return;
        }

        router.replace('/dashboard');
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error('Magic auth callback error:', err);
        const fallback =
          err instanceof Error
            ? err.message
            : 'Unable to verify the magic link. Please request a new one.';

        setStatus('error');
        setMessage(fallback);
      }
    };

    verifyMagicLink();

    return () => {
      cancelled = true;
    };
  }, [magicCredential, returnTo, router]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Verifying your magic link...</h2>
          <p className="text-gray-600">
            Hang tight while we confirm your login with Magic. You&apos;ll be redirected in a moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Magic link verification failed</h2>
        <p className="text-red-600 mb-4">{message}</p>
        <Link
          href="/login"
          className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Return to login
        </Link>
        <p className="text-sm text-gray-500 mt-4">
          Still stuck? Request another Magic link and double-check you&apos;re opening it on the same device.
        </p>
      </div>
    </div>
  );
}
