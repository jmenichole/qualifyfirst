'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { profileQuestions, ProfileAnswer } from '../lib/lib/questions';

export default function ProfilePage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<ProfileAnswer>({});
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailScreen, setShowEmailScreen] = useState(true);

  const question = profileQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / profileQuestions.length) * 100;

  const handleAnswer = (value: string | string[]) => {
    setAnswers({ ...answers, [question.id]: value });
  };

  const handleNext = () => {
    if (!answers[question.id] || (Array.isArray(answers[question.id]) && (answers[question.id] as string[]).length === 0)) {
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
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{ email, ...answers }])
        .select();

      if (error) throw error;

      router.push(`/profile/complete?id=${data[0].id}`);
    } catch (err) {
      setError('Failed to save profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMultiSelect = (option: string) => {
    const current = (answers[question.id] as string[]) || [];
    const updated = current.includes(option)
      ? current.filter(item => item !== option)
      : [...current, option];
    handleAnswer(updated);
  };

  const handleEmailSubmit = () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setError('');
    setShowEmailScreen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Progress Bar - Only show after email screen */}
        {!showEmailScreen && (
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

        {/* Email Input (First Screen) */}
        {showEmailScreen && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Let&apos;s get started!
            </h2>
            <p className="text-gray-600 mb-6">
              Enter your email to save your profile and get matched with surveys.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

        {/* Question Card */}
        {!showEmailScreen && (
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
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
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
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition flex items-center ${
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}