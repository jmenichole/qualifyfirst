'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { profileQuestions } from '../../lib/lib/questions';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { LoadingSpinner } from '../../components/LoadingComponents';

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [answers, setAnswers] = useState<{[key: string]: string | string[]}>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);
      
      // Convert profile data to answers format
      const answersData: {[key: string]: string | string[]} = {};
      profileQuestions.forEach(question => {
        if (profileData[question.id] !== undefined && profileData[question.id] !== null) {
          answersData[question.id] = profileData[question.id];
        }
      });
      setAnswers(answersData);

    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(answers)
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAnswer = (questionId: string, value: string | string[]) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleMultiSelect = (questionId: string, option: string) => {
    const current = (answers[questionId] as string[]) || [];
    const updated = current.includes(option)
      ? current.filter(item => item !== option)
      : [...current, option];
    handleAnswer(questionId, updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Edit Your Profile
                </h1>
                <p className="text-gray-600">
                  Update your information to get better survey matches
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {/* Profile Form */}
          <div className="space-y-6">
            {profileQuestions.map((question) => (
              <div key={question.id} className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {question.question}
                </h3>

                {question.type === 'select' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {question.options?.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleAnswer(question.id, option)}
                        className={`p-3 rounded-lg border text-left transition ${
                          answers[question.id] === option
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                            : 'border-gray-200 hover:border-gray-300 text-gray-900'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {question.type === 'multiselect' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {question.options?.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleMultiSelect(question.id, option)}
                        className={`p-3 rounded-lg border text-left transition ${
                          (answers[question.id] as string[])?.includes(option)
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                            : 'border-gray-200 hover:border-gray-300 text-gray-900'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {question.type === 'text' && (
                  <input
                    type="text"
                    value={(answers[question.id] as string) || ''}
                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                    placeholder={question.placeholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
            >
              {saving && <LoadingSpinner size="sm" />}
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
