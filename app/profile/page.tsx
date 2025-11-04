/**
 * QualifyFirst - User Profile Creation Page
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getMagicClient } from '../lib/magic/client';
import { profileQuestions, ProfileAnswer } from '../lib/lib/questions';

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const [currentQuestion, setCurrentQuestion] = useState(-2); // Start at -2 for email, -1 for consent
  const [answers, setAnswers] = useState<ProfileAnswer>({});
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Warm the Magic SDK so we avoid race conditions when the user submits.
    getMagicClient().catch((sdkError) => {
      console.error('Failed to preload Magic SDK:', sdkError);
      if (isMounted) {
        setError((prev) =>
          prev
            ? prev
            : 'We could not load the Magic login SDK. Refresh the page and try again.',
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const urlError = searchParams?.get('error');
    if (urlError) {
      setError(`Error: ${urlError}`);
    }
  }, [searchParams]);

  const question = currentQuestion >= 0 ? profileQuestions[currentQuestion] : null;
  const progress = currentQuestion >= 0 ? ((currentQuestion + 1) / profileQuestions.length) * 100 : 0;

  const handleAnswer = (value: string | string[]) => {
    if (question) {
      setAnswers({ ...answers, [question.id]: value });
    }
  };

  const handleNext = () => {
    if (question && (!answers[question.id] || (Array.isArray(answers[question.id]) && (answers[question.id] as string[]).length === 0))) {
      setError('Please answer this question');
      return;
    }
    setError('');
    
    if (currentQuestion < profileQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentQuestion > -2) {
      setCurrentQuestion(currentQuestion - 1);
      setError('');
    }
  };

  const handleEmailSubmit = () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setError('');
    setCurrentQuestion(-1); // Go to consent screen
  };

  const handleConsentSubmit = () => {
    if (!gdprConsent) {
      setError('You must agree to the Privacy Policy to continue');
      return;
    }
    setError('');
    setCurrentQuestion(0); // Go to first question
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    console.log('Starting profile submission...', { email, answers });

    try {
      // Sign up the user
      // Store profile data temporarily in localStorage
      const profileData = {
        email,
        ...answers
      };
      console.log('Storing profile data temporarily:', profileData);
      localStorage.setItem('pendingProfile', JSON.stringify(profileData));

      console.log('Preparing Magic link for authentication...');

      const magic = await getMagicClient();

      if (!magic) {
        throw new Error(
          'Magic publishable key is missing. Add NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY to your environment.',
        );
      }

      const redirectUrl = new URL('/auth/magic', window.location.origin);
      redirectUrl.searchParams.set('returnTo', 'profile-complete');
      redirectUrl.searchParams.set('email', email);
      let loginPromise: Promise<unknown> | null = null;

      try {
        loginPromise = magic.auth.loginWithMagicLink({
          email,
          redirectURI: redirectUrl.toString(),
        });
      } catch (loginError) {
        throw loginError;
      }

      const pendingLoginPromise = loginPromise;

      if (!pendingLoginPromise) {
        throw new Error('Unable to start the Magic login request.');
      }

      console.log('Magic link requested successfully');

      setSubmittedEmail(email);

      pendingLoginPromise.catch((asyncError) => {
        console.error('Magic link request failed after submission:', asyncError);
        setSubmittedEmail(null);
        setError(
          `Error: ${
            asyncError instanceof Error
              ? asyncError.message
              : 'Failed to send the magic link. Please try again.'
          }`,
        );
      });
    } catch (err: unknown) {
      console.error('Profile submission error:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to save profile. Please try again.';
      setError(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMultiSelect = (option: string) => {
    if (!question) return;
    const current = (answers[question.id] as string[]) || [];
    const updated = current.includes(option)
      ? current.filter(item => item !== option)
      : [...current, option];
    handleAnswer(updated);
  };

  if (submittedEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile complete!</h1>
            <p className="text-gray-600">
              We sent a magic login link to{' '}
              <span className="font-semibold text-gray-900">{submittedEmail}</span>.
              Click it to finish activating your account.
            </p>
          </div>

          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">Next steps</h2>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li>Open the email on the same device you used to start this profile.</li>
              <li>Click the magic link so we can verify you with Magic and Supabase.</li>
              <li>We&apos;ll automatically save your profile and send you to the dashboard.</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          <div className="space-y-3 text-center">
            <button
              onClick={() => {
                setSubmittedEmail(null);
                setError('');
                setLoading(false);
              }}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Edit answers
            </button>
            <Link
              href="/"
              className="block w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Back to home
            </Link>
            <p className="text-sm text-gray-500">
              Didn&apos;t see an email? Double-check spam or request a new link from the{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700">
                login page
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Progress Bar */}
        {currentQuestion >= 0 && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestion + 1} of {profileQuestions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Email Screen */}
        {currentQuestion === -2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Let&apos;s get started!
            </h2>
            <p className="text-gray-600 mb-6">
              Enter your email. We&apos;ll send you a magic link to access your dashboard.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              onClick={handleEmailSubmit}
              className="w-full mt-4 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Start Profile
            </button>
          </div>
        )}

        {/* Consent Screen */}
        {currentQuestion === -1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Privacy & Consent
            </h2>
            <p className="text-gray-600 mb-6">
              Before we continue, please review and accept our privacy practices.
            </p>
            
            <div className="space-y-4 mb-6">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={gdprConsent}
                  onChange={(e) => setGdprConsent(e.target.checked)}
                  className="mt-1 mr-3 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  required
                />
                <span className="text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="/legal/privacy-policy" target="_blank" className="text-indigo-600 hover:text-indigo-800 underline">
                    Privacy Policy
                  </a>{' '}
                  and{' '}
                  <a href="/legal/terms-of-service" target="_blank" className="text-indigo-600 hover:text-indigo-800 underline">
                    Terms of Service
                  </a>
                  . I understand that my data will be processed as described in the Privacy Policy. <strong className="text-gray-900">(Required)</strong>
                </span>
              </label>
              
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-1 mr-3 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  I would like to receive marketing communications and updates about new survey opportunities. <em className="text-gray-500">(Optional)</em>
                </span>
              </label>
            </div>
            
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            
            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Back
              </button>
              <button
                onClick={handleConsentSubmit}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Question Card */}
        {currentQuestion >= 0 && question && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <span className="text-sm font-medium text-indigo-600 uppercase tracking-wide">
                {question.category}
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2">
                {question.question}
              </h2>
            </div>

            {/* Select Input */}
            {question.type === 'select' && (
              <div className="space-y-3">
                {question.options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition text-gray-900 ${
                      answers[question.id] === option
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* Multi-Select Input */}
            {question.type === 'multiselect' && (
              <div className="space-y-3">
                {question.options?.map((option) => {
                  const selected = ((answers[question.id] as string[]) || []).includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => handleMultiSelect(option)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition flex items-center text-gray-900 ${
                        selected
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                        selected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                      }`}>
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      {option}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Text Input */}
            {question.type === 'text' && (
              <input
                type="text"
                value={(answers[question.id] as string) || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                placeholder={question.placeholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              />
            )}

            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={handleBack}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:border-gray-400 transition"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Saving...' : currentQuestion === profileQuestions.length - 1 ? 'Complete Profile' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

