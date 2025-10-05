'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Survey } from '../lib/lib/matching';

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
    let filtered = surveys.filter(survey => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Your Matched Surveys
              </h1>
              <p className="text-gray-600">
                {profile?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
          
          <div className="mt-6 flex gap-4">
            <div className="bg-indigo-50 px-4 py-3 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{matchCount}</div>
              <div className="text-sm text-gray-600">Matched Surveys</div>
            </div>
            <div className="bg-green-50 px-4 py-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${surveys.reduce((sum, s) => sum + Number(s.payout), 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Potential Earnings</div>
            </div>
            <div className="bg-blue-50 px-4 py-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {totalSurveys > 0 ? Math.round((matchCount / totalSurveys) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Match Rate</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Filter & Sort Surveys</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search surveys..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'payout' | 'time' | 'provider')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="payout">Highest Payout</option>
                <option value="time">Shortest Time</option>
                <option value="provider">Provider</option>
              </select>
            </div>

            {/* Min Payout */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Payout (${filterMinPayout})
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={filterMinPayout}
                onChange={(e) => setFilterMinPayout(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Max Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Time ({filterMaxTime} min)
              </label>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={filterMaxTime}
                onChange={(e) => setFilterMaxTime(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredSurveys.length} of {surveys.length} matched surveys
          </div>
        </div>

        {/* Edit Profile Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/profile/edit')}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
          >
            Edit Profile
          </button>
        </div>

        {/* Surveys */}
        {filteredSurveys.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {surveys.length === 0 ? 'No matches yet' : 'No surveys match your filters'}
            </h2>
            <p className="text-gray-600">
              {surveys.length === 0 
                ? 'Check back soon for new surveys!' 
                : 'Try adjusting your filters to see more surveys.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSurveys.map((survey) => (
              <div
                key={survey.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
                onClick={() => handleSurveyClick(survey)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {survey.title}
                      </h3>
                      <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        {survey.provider}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">
                      {survey.description}
                    </p>
                    
                    <div className="flex gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {survey.estimated_time} min
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        ${survey.payout.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <button className="ml-4 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2">
                    Start Survey
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
