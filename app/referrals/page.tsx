/**
 * QualifyFirst - Referrals Page
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { getReferralStats, createReferralLink } from '../lib/referrals';
import { LoadingSpinner } from '../components/LoadingComponents';
import { useNotifications } from '../components/Notifications';

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  referrals: Array<{
    id: number;
    referral_code: string;
    status: string;
    created_at: string;
    referred_profile?: { email: string };
  }>;
}

export default function ReferralDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile to get referral code
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }

      // Get referral stats
      const referralStats = await getReferralStats(user.id);
      if (referralStats) {
        setStats(referralStats);
      }

    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    const referralLink = createReferralLink(referralCode);
    try {
      await navigator.clipboard.writeText(referralLink);
      addNotification({
        type: 'success',
        title: 'Success!',
        message: 'Referral link copied to clipboard!'
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to copy link. Please copy it manually.'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const referralLink = referralCode ? createReferralLink(referralCode) : '';
  const rewardPerReferral = 2.50; // $2.50 per completed referral
  const totalEarnings = (stats?.completedReferrals || 0) * rewardPerReferral;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Dashboard</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Referral Program</h2>
            <p className="text-indigo-100">
              Earn $2.50 for every friend who completes their first survey!
            </p>
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-indigo-600">{stats?.totalReferrals || 0}</div>
          <div className="text-sm text-gray-600">Total Referrals</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-green-600">{stats?.completedReferrals || 0}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-yellow-600">{stats?.pendingReferrals || 0}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-purple-600">${totalEarnings.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Earned</div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Your Referral Link</h3>
        
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
          />
          <button
            onClick={copyReferralLink}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Copy</span>
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Share your referral link with friends</li>
            <li>• They sign up and complete their profile</li>
            <li>• When they complete their first survey, you earn $2.50</li>
            <li>• Track your earnings right here in your dashboard</li>
          </ul>
        </div>
      </div>

      {/* Referral History */}
      {stats && stats.referrals.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Referral History</h3>
          
          <div className="space-y-3">
            {stats.referrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">
                    {referral.referred_profile?.email || 'New User'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    referral.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {referral.status}
                  </span>
                  {referral.status === 'completed' && (
                    <span className="text-green-600 font-medium">
                      +$2.50
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Options */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Share Your Link</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out QualifyFirst - only see surveys you actually qualify for!&url=${encodeURIComponent(referralLink)}`, '_blank')}
            className="flex items-center justify-center space-x-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            <span>Twitter</span>
          </button>
          
          <button
            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank')}
            className="flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <span>Facebook</span>
          </button>
          
          <button
            onClick={() => window.open(`mailto:?subject=Check out QualifyFirst&body=I found this great survey platform that only shows you surveys you actually qualify for! Sign up here: ${referralLink}`, '_blank')}
            className="flex items-center justify-center space-x-2 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            <span>Email</span>
          </button>
          
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'QualifyFirst',
                  text: 'Check out QualifyFirst - only see surveys you actually qualify for!',
                  url: referralLink
                });
              }
            }}
            className="flex items-center justify-center space-x-2 p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <span>Share</span>
          </button>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}