/**
 * QualifyFirst - Referral System Service
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { supabase } from './supabase';

// Generate a unique referral code
export function generateReferralCode(email: string): string {
  // Create a short, memorable code from email + random chars
  const emailPrefix = email.substring(0, email.indexOf('@')).toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${emailPrefix}${randomSuffix}`;
}

// Create referral link
export function createReferralLink(referralCode: string, baseUrl: string = window.location.origin): string {
  return `${baseUrl}?ref=${referralCode}`;
}

// Track referral signup
export async function trackReferralSignup(referralCode: string, newUserId: string) {
  try {
    // Find the referrer by their referral code
    const { data: referrer, error: referrerError } = await supabase
      .from('user_profiles')
      .select('id, user_id, email')
      .eq('referral_code', referralCode)
      .single();

    if (referrerError || !referrer) {
      console.log('No valid referrer found for code:', referralCode);
      return null;
    }

    // Create referral record
    const { data: referralData, error: referralError } = await supabase
      .from('referrals')
      .insert([{
        referrer_id: referrer.id,
        referred_user_id: newUserId,
        referral_code: referralCode,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (referralError) {
      console.error('Error creating referral record:', referralError);
      return null;
    }

    console.log('Referral tracked successfully:', referralData);
    return referralData;

  } catch (error) {
    console.error('Error tracking referral:', error);
    return null;
  }
}

// Get referral stats for a user
export async function getReferralStats(userId: string) {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) return null;

    // Get referral counts
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*, referred_profile:user_profiles!referrals_referred_user_id_fkey(email)')
      .eq('referrer_id', profile.id);

    if (referralsError) {
      console.error('Error getting referrals:', referralsError);
      return null;
    }

    const totalReferrals = referrals?.length || 0;
    const completedReferrals = referrals?.filter(r => r.status === 'completed').length || 0;
    const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0;
    
    return {
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      referrals: referrals || []
    };

  } catch (error) {
    console.error('Error getting referral stats:', error);
    return null;
  }
}

// Complete referral (when referred user completes their first survey)
export async function completeReferral(referredUserId: string) {
  try {
    const { data: _data, error } = await supabase
      .from('referrals')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('referred_user_id', referredUserId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error completing referral:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error completing referral:', error);
    return false;
  }
}