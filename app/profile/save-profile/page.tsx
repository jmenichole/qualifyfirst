/**
 * QualifyFirst - Save Profile Page
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function SaveProfilePage() {
  const [status, setStatus] = useState<'saving' | 'success' | 'error'>('saving');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const saveProfile = async () => {
      try {
        // Get the authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('User not authenticated');
        }

        // Get the pending profile data from localStorage
        const pendingProfileStr = localStorage.getItem('pendingProfile');
        if (!pendingProfileStr) {
          throw new Error('No profile data found');
        }

        const pendingProfile = JSON.parse(pendingProfileStr);
        
        // Generate referral code and add user_id to profile data
        const userReferralCode = pendingProfile.email.substring(0, pendingProfile.email.indexOf('@')).toLowerCase().replace(/[^a-z0-9]/g, '') + Math.random().toString(36).substring(2, 6);
        
        const profileData = {
          ...pendingProfile,
          user_id: user.id,
          referral_code: userReferralCode
        };

        console.log('Saving profile with user_id:', profileData);

        // Save to database
        const { data, error: profileError } = await supabase
          .from('user_profiles')
          .insert([profileData])
          .select();

        if (profileError) {
          console.error('Profile save error:', profileError);
          throw profileError;
        }

        console.log('Profile saved successfully:', data);

        // Check for referral code and track it
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref') || localStorage.getItem('referralCode');
        
        if (referralCode) {
          // Track the referral
          const { trackReferralSignup } = await import('../../lib/referrals');
          await trackReferralSignup(referralCode, user.id);
          localStorage.removeItem('referralCode'); // Clean up
        }
        
        // Clear the temporary data
        localStorage.removeItem('pendingProfile');
        
        setStatus('success');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);

      } catch (err) {
        console.error('Error saving profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to save profile');
        setStatus('error');
      }
    };

    saveProfile();
  }, [router]);

  if (status === 'saving') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Saving your profile...</h2>
          <p className="text-gray-600">
            Please wait while we set up your account.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Profile saved successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your profile has been created and you&apos;re now logged in.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to your dashboard...
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
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Error saving profile</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => router.push('/profile')}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}