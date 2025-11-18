/**
 * QualifyFirst - User Dashboard Page
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Survey } from '../lib/lib/matching';
import { AffiliateDisclosure } from '../components/AffiliateDisclosure';
import { EarningsDisclaimer } from '../components/EarningsDisclaimer';
import { degenScoreService, DegenProfile } from '../lib/degen-score';

export default function DashboardPage() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([]);
  const [profile, setProfile] = useState<{email: string, answers: {[key: string]: string | string[]}} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [totalSurveys, setTotalSurveys] = useState(0);
  const [sortBy, setSortBy] = useState<'payout' | 'time' | 'provider'>('payout');
  const [filterMinPayout, setFilterMinPayout] = useState<number>(0);
  const [filterMaxTime, setFilterMaxTime] = useState<number>(60);
  const [searchTerm, setSearchTerm] = useState('');
  const [degenProfile, setDegenProfile] = useState<DegenProfile | null>(null);

  const loadUserData = useCallback(async (email: string) => {
    try {
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Calculate degen score
      const factors = degenScoreService.generateMockFactors(profileData.id);
      const degenProf = degenScoreService.buildDegenProfile(factors);
      setDegenProfile(degenProf);

      // Get all surveys
      const { data: allSurveys, error: surveysError } = await supabase
        .from('surveys')
        .select('*')
        .eq('active', true)
        .order('payout', { ascending: false });

      if (surveysError) throw surveysError;

      // Simple matching (expand this later)
      const matched = allSurveys.filter(survey => matchesSurvey(profileData, survey));
      
      setSurveys(matched);
      setFilteredSurveys(matched);
      setMatchCount(matched.length);
      setTotalSurveys(allSurveys.length);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      await loadUserData(user.email!);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Authentication error');
      setLoading(false);
    }
  }, [router, loadUserData]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const matchesSurvey = (profile: {[key: string]: string | string[]}, survey: Survey) => {
    // Basic matching logic
    if (survey.required_countries && survey.required_countries.length > 0) {
      const matches = survey.required_countries.some((country: string) => 
        typeof profile.location === 'string' && profile.location.toLowerCase().includes(country.toLowerCase())
      );
      if (!matches) return false;
    }
    return true;
  };

  const handleSurveyClick = async (survey: Survey) => {
    // Track click
    await supabase.rpc('increment_survey_clicks', { survey_id: survey.id });
    
    // Open survey
    window.open(survey.affiliate_url, '_blank');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Apply filters and sorting
  useEffect(() => {
    const filtered = surveys.filter(survey => {
      const matchesSearch = searchTerm === '' || 
        survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        survey.provider.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPayout = survey.payout >= filterMinPayout;
      const matchesTime = survey.estimated_time <= filterMaxTime;
      
      return matchesSearch && matchesPayout && matchesTime;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'payout':
          return b.payout - a.payout;
        case 'time':
          return a.estimated_time - b.estimated_time;
        case 'provider':
          return a.provider.localeCompare(b.provider);
        default:
          return 0;
      }
    });

    setFilteredSurveys(filtered);
  }, [surveys, searchTerm, filterMinPayout, filterMaxTime, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your surveys...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
          <a href="/login" className="block mt-6 text-indigo-600 hover:text-indigo-700">
            Try logging in again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-purple-500/20 p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 text-transparent bg-clip-text mb-2">
                Degen Dashboard
              </h1>
              <p className="text-purple-300">
                {profile?.email}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/smart-dashboard')}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition text-sm font-medium flex items-center space-x-2 shadow-lg"
              >
                <span>🧠</span>
                <span>AI Dashboard</span>
              </button>
              <button
                onClick={() => router.push('/microtasks')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition text-sm font-medium shadow-lg"
              >
                Microtasks
              </button>
              <button
                onClick={() => router.push('/referrals')}
                className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-rose-700 transition text-sm font-medium shadow-lg"
              >
                Referrals
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-gray-300"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Degen Score Display */}
          {degenProfile && (
            <div className="mb-6 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-400/30 rounded-xl p-6 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-6xl">
                    {degenScoreService.getArchetypeInfo(degenProfile.archetype).emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-cyan-300">
                        Degen Score: {degenProfile.score}
                      </h2>
                      <span className="bg-purple-500/50 text-purple-100 px-3 py-1 rounded-full text-sm font-semibold">
                        {degenScoreService.getArchetypeInfo(degenProfile.archetype).title}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">
                      {degenScoreService.getArchetypeInfo(degenProfile.archetype).description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {degenProfile.surveyAffinities.slice(0, 4).map((affinity, idx) => (
                        <span key={idx} className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded">
                          {affinity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400 mb-1">Your Match Power</div>
                  <div className="w-32 h-32 relative">
                    <svg className="transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="rgba(139, 92, 246, 0.2)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(degenProfile.score / 100) * 283} 283`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-cyan-300">{degenProfile.score}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border border-indigo-400/30 px-6 py-4 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <div className="text-3xl font-bold text-cyan-300">{matchCount}</div>
              <div className="text-sm text-gray-300">Matched Surveys</div>
            </div>
            <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-400/30 px-6 py-4 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <div className="text-3xl font-bold text-green-300">
                ${surveys.reduce((sum, s) => sum + Number(s.payout), 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-300">Potential Earnings</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-400/30 px-6 py-4 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <div className="text-3xl font-bold text-purple-300">
                {totalSurveys > 0 ? Math.round((matchCount / totalSurveys) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-300">Match Rate</div>
            </div>
          </div>
          
          {/* Microtasks Banner - Updated Theme */}
          <div className="mt-6 bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-400/30 rounded-xl p-4 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
            <div className="flex items-start gap-3">
              <div className="text-3xl">✨</div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-300 mb-1">Quick Cash: Microtasks!</h3>
                <p className="text-sm text-gray-300 mb-2">
                  Complete quick tasks like link validation, data verification, and content review. Earn $0.25-$2.50 per task in just 2-10 minutes!
                </p>
                <button
                  onClick={() => router.push('/microtasks')}
                  className="text-sm font-semibold text-green-400 hover:text-green-300"
                >
                  Browse Microtasks →
                </button>
              </div>
            </div>
          </div>

          {/* Legal Disclosures */}
          <div className="mt-6 space-y-3">
            <EarningsDisclaimer />
            <AffiliateDisclosure variant="inline" />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-purple-500/20 p-6 mb-6">
          <h2 className="text-xl font-semibold text-cyan-300 mb-4">Filter & Sort Surveys</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search surveys..."
                className="w-full px-3 py-2 bg-slate-900/50 border border-purple-500/30 text-gray-200 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'payout' | 'time' | 'provider')}
                className="w-full px-3 py-2 bg-slate-900/50 border border-purple-500/30 text-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="payout">💰 Highest Payout</option>
                <option value="time">⚡ Shortest Time</option>
                <option value="provider">🏢 Provider</option>
              </select>
            </div>

            {/* Min Payout */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Min Payout (${filterMinPayout})
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={filterMinPayout}
                onChange={(e) => setFilterMinPayout(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Max Time */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Time ({filterMaxTime} min)
              </label>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={filterMaxTime}
                onChange={(e) => setFilterMaxTime(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredSurveys.length} of {surveys.length} matched surveys
          </div>
        </div>

        {/* Edit Profile Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/profile/edit')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all transform hover:scale-105 shadow-lg"
          >
            ⚙️ Edit Profile
          </button>
        </div>

        {/* Surveys */}
        {filteredSurveys.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-purple-500/20 p-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-cyan-300 mb-2">
              {surveys.length === 0 ? 'No matches yet, degen' : 'No surveys match your filters'}
            </h2>
            <p className="text-gray-300">
              {surveys.length === 0 
                ? 'Check back soon for new surveys that match your vibe!' 
                : 'Try adjusting your filters to see more opportunities.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSurveys.map((survey) => (
              <div
                key={survey.id}
                className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl shadow-2xl border border-purple-500/20 p-6 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all cursor-pointer transform hover:scale-[1.02]"
                onClick={() => handleSurveyClick(survey)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 text-transparent bg-clip-text">
                        {survey.title}
                      </h3>
                      <span className="text-sm font-medium text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
                        {survey.provider}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 mb-4">
                      {survey.description}
                    </p>
                    
                    <div className="flex gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {survey.estimated_time} min
                      </div>
                      <div className="flex items-center gap-1 text-green-300">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        ${survey.payout.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <button className="ml-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:from-cyan-500 hover:to-blue-500 transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg">
                    🚀 Start
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
