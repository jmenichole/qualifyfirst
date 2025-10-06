'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { surveyProviderAPI, type SurveyOffer, type UserProfile } from '../lib/survey-provider-api';
import { aiSurveyMatcher } from '../lib/ai-survey-matcher';
import { payoutProcessor } from '../lib/payout-processor';
import { PayoutPreferences } from '../components/PayoutPreferences';
import { LoadingSpinner } from '../components/LoadingComponents';

interface SmartMatch extends SurveyOffer {
  matchScore: {
    survey_id: string;
    score: number;
    confidence: number;
    factors: {
      demographic_match: number;
      interest_match: number;
      completion_history: number;
      provider_performance: number;
    };
  };
}

export default function SmartDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [smartMatches, setSmartMatches] = useState<SmartMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [payoutSummary, setPayoutSummary] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'surveys' | 'payouts' | 'analytics'>('surveys');

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push('/');
        return;
      }

      setUser(authUser);
      await loadUserProfile(authUser.id);
      await loadPayoutSummary(authUser.id);
      await loadSmartMatches(authUser.id);

    } catch (error) {
      console.error('Dashboard initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profile) {
      // Convert to UserProfile format for AI matching
      const aiProfile: UserProfile = {
        age: getAgeFromRange(profile.age),
        gender: profile.gender,
        country: profile.location,
        device: 'desktop', // Default, could be detected
        interests: profile.hobbies || [],
        employment: profile.employment,
        income_range: profile.income,
        completion_history: {
          total_attempts: 0, // Will be calculated from history
          completed: 0,
          completion_rate: 85, // Default optimistic rate for new users
          avg_survey_time: 12 // Default average
        }
      };

      setUserProfile(aiProfile);
    }
  };

  const loadPayoutSummary = async (userId: string) => {
    const summary = await payoutProcessor.getUserPayoutSummary(userId);
    setPayoutSummary(summary);
  };

  const loadSmartMatches = async (userId: string) => {
    if (!userProfile) return;

    setMatchingInProgress(true);
    
    try {
      // Step 1: Fetch available surveys from providers
      const availableSurveys = await surveyProviderAPI.getAvailableSurveys(userProfile, userId);
      
      // Step 2: AI-powered matching and ranking
      const { matches } = await aiSurveyMatcher.getTopMatches(userProfile, availableSurveys, 5);
      
      setSmartMatches(matches);

    } catch (error) {
      console.error('Error loading smart matches:', error);
    } finally {
      setMatchingInProgress(false);
    }
  };

  const handleSurveyClick = async (survey: SmartMatch) => {
    if (!user) return;

    try {
      // Track click with provider
      await surveyProviderAPI.trackSurveyClick(survey.id, user.id);
      
      // Record click in our system
      await supabase
        .from('survey_clicks')
        .insert([{
          survey_id: survey.id,
          user_id: user.id,
          provider: survey.provider,
          expected_reward: survey.reward,
          match_score: survey.matchScore.score
        }]);

      // Open survey in new tab
      window.open(survey.click_url, '_blank');

    } catch (error) {
      console.error('Error handling survey click:', error);
    }
  };

  const getAgeFromRange = (ageRange: string): number => {
    const ranges: Record<string, number> = {
      '18-24': 21, '25-34': 29, '35-44': 39, '45-54': 49, '55-64': 59, '65+': 70
    };
    return ranges[ageRange] || 25;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 0.8) return 'Excellent Match';
    if (score >= 0.6) return 'Good Match';
    return 'Fair Match';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Survey Dashboard</h1>
              <p className="text-gray-600">AI-powered survey matching • Higher completion rates</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-green-800">
                  Balance: ${payoutSummary?.justTheTipBalance?.toFixed(2) || '0.00'}
                </span>
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'surveys', label: 'Smart Matches', icon: '🎯' },
              { id: 'payouts', label: 'Payouts', icon: '💰' },
              { id: 'analytics', label: 'Analytics', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  selectedTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Surveys Tab */}
        {selectedTab === 'surveys' && (
          <div className="space-y-6">
            {/* AI Matching Status */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">🧠 AI Survey Matching</h2>
                  <p className="opacity-90">
                    Our AI analyzes {smartMatches.length} surveys to find your best matches
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{Math.round((smartMatches[0]?.matchScore.score || 0) * 100)}%</div>
                  <div className="text-sm opacity-90">Best Match Score</div>
                </div>
              </div>
            </div>

            {/* Smart Matches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recommended Surveys ({smartMatches.length})
                </h3>
                <button
                  onClick={() => loadSmartMatches(user.id)}
                  disabled={matchingInProgress}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {matchingInProgress ? <LoadingSpinner size="sm" /> : <span>🔄</span>}
                  <span>{matchingInProgress ? 'Analyzing...' : 'Refresh Matches'}</span>
                </button>
              </div>

              {smartMatches.map((survey, index) => (
                <div
                  key={survey.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl font-bold text-indigo-600">#{index + 1}</span>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">{survey.title}</h4>
                          <span className="text-sm text-gray-500">{survey.provider}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(survey.matchScore.score)}`}>
                          {getScoreLabel(survey.matchScore.score)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{survey.description}</p>
                      
                      {/* Match Factors */}
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        {Object.entries(survey.matchScore.factors).map(([factor, score]) => (
                          <div key={factor} className="text-center">
                            <div className="text-lg font-semibold text-gray-900">
                              {Math.round(score * 100)}%
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {factor.replace('_', ' ')}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <span>💰</span>
                          <span className="font-medium">${survey.reward.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>⏱️</span>
                          <span>{survey.estimated_time} min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>✅</span>
                          <span>{Math.round(survey.completion_rate * 100)}% completion</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSurveyClick(survey)}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition flex items-center space-x-2"
                    >
                      <span>Start Survey</span>
                      <span>🚀</span>
                    </button>
                  </div>
                </div>
              ))}

              {smartMatches.length === 0 && !matchingInProgress && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
                  <p className="text-gray-600">Try updating your profile or check back later for new surveys.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payouts Tab */}
        {selectedTab === 'payouts' && (
          <PayoutPreferences userId={user?.id} />
        )}

        {/* Analytics Tab */}
        {selectedTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Performance Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {payoutSummary?.totalEarnings?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-blue-800">Total Earnings</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(((payoutSummary?.paidAmount || 0) / Math.max(payoutSummary?.totalEarnings || 1, 1)) * 100)}%
                </div>
                <div className="text-sm text-green-800">Completion Rate</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {smartMatches.length > 0 ? Math.round(smartMatches[0].matchScore.score * 100) : 0}%
                </div>
                <div className="text-sm text-purple-800">AI Match Accuracy</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}