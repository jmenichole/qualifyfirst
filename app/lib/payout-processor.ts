'use client';

import { supabase } from './supabase';
import { justTheTipIntegration } from './justthetip-integration';

interface PayoutTransaction {
  id: number;
  user_id: string;
  amount: number;
  type: 'survey_completion' | 'referral_bonus' | 'manual_payout';
  method: 'justthetip_balance' | 'wallet' | 'split';
  status: 'pending' | 'completed' | 'failed';
  transaction_id?: string;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export class PayoutProcessor {
  
  // Process survey completion payout
  async processSurveyPayout(userId: string, surveyId: number, amount: number): Promise<boolean> {
    try {
      // Get user payout preferences
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('discord_id, wallet_address, payout_preference, minimum_payout')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Check if amount meets minimum payout threshold
      const currentEarnings = await this.getPendingEarnings(userId);
      const totalAmount = currentEarnings + amount;

      if (totalAmount >= profile.minimum_payout) {
        // Process immediate payout
        return await this.executePayoutTransfer(userId, totalAmount, 'survey_completion', { survey_id: surveyId });
      } else {
        // Store as pending earnings
        await this.addPendingEarnings(userId, amount, 'survey_completion', surveyId);
        return true;
      }

    } catch (error) {
      console.error('Survey payout error:', error);
      return false;
    }
  }

  // Process referral bonus payout
  async processReferralPayout(userId: string, referralId: number, amount: number): Promise<boolean> {
    try {
      // For referral bonuses, always add to JustTheTip balance immediately
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('discord_id')
        .eq('user_id', userId)
        .single();

      if (!profile?.discord_id) {
        // Store as pending if Discord not linked
        await this.addPendingEarnings(userId, amount, 'referral_bonus', referralId);
        return true;
      }

      const success = await justTheTipIntegration.creditBalance(
        profile.discord_id,
        amount,
        `Referral bonus - Referral #${referralId}`
      );

      if (success) {
        await this.recordPayoutTransaction(userId, amount, 'referral_bonus', 'justthetip_balance', 'completed');
        await this.updateUserEarnings(userId, amount, 'referral');
      }

      return success;

    } catch (error) {
      console.error('Referral payout error:', error);
      return false;
    }
  }

  // Execute actual payout transfer
  private async executePayoutTransfer(
    userId: string, 
    amount: number, 
    type: PayoutTransaction['type'],
    metadata?: any
  ): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('discord_id, wallet_address, payout_preference')
        .eq('user_id', userId)
        .single();

      if (!profile) return false;

      let success = false;
      let method: PayoutTransaction['method'] = 'justthetip_balance';

      switch (profile.payout_preference) {
        case 'justthetip':
          if (profile.discord_id) {
            success = await justTheTipIntegration.creditBalance(
              profile.discord_id,
              amount,
              `QualifyFirst ${type.replace('_', ' ')}`
            );
            method = 'justthetip_balance';
          }
          break;

        case 'wallet':
          // For now, all payouts go to JustTheTip until direct wallet integration is built
          if (profile.discord_id) {
            success = await justTheTipIntegration.creditBalance(
              profile.discord_id,
              amount,
              `QualifyFirst ${type.replace('_', ' ')} (wallet payout pending)`
            );
            method = 'justthetip_balance';
          }
          break;

        case 'both':
          // Split: small amounts to JustTheTip, large amounts pending for wallet
          if (amount < 25 && profile.discord_id) {
            success = await justTheTipIntegration.creditBalance(
              profile.discord_id,
              amount,
              `QualifyFirst ${type.replace('_', ' ')}`
            );
            method = 'justthetip_balance';
          } else {
            // Store large amounts as pending for future wallet payout
            await this.addPendingEarnings(userId, amount, type, metadata?.survey_id || metadata?.referral_id);
            success = true;
            method = 'wallet';
          }
          break;
      }

      if (success) {
        await this.recordPayoutTransaction(userId, amount, type, method, 'completed');
        await this.updateUserEarnings(userId, amount, type === 'referral_bonus' ? 'referral' : 'survey');
        await this.clearPendingEarnings(userId);
      }

      return success;

    } catch (error) {
      console.error('Payout execution error:', error);
      return false;
    }
  }

  // Helper methods
  private async getPendingEarnings(userId: string): Promise<number> {
    const { data } = await supabase
      .from('pending_earnings')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'pending');

    return data?.reduce((sum, earning) => sum + earning.amount, 0) || 0;
  }

  private async addPendingEarnings(userId: string, amount: number, type: string, sourceId?: number): Promise<void> {
    await supabase
      .from('pending_earnings')
      .insert([{
        user_id: userId,
        amount,
        type,
        source_id: sourceId,
        status: 'pending'
      }]);
  }

  private async clearPendingEarnings(userId: string): Promise<void> {
    await supabase
      .from('pending_earnings')
      .update({ status: 'processed' })
      .eq('user_id', userId)
      .eq('status', 'pending');
  }

  private async recordPayoutTransaction(
    userId: string, 
    amount: number, 
    type: PayoutTransaction['type'],
    method: PayoutTransaction['method'],
    status: PayoutTransaction['status']
  ): Promise<void> {
    await supabase
      .from('payout_transactions')
      .insert([{
        user_id: userId,
        amount,
        type,
        method,
        status,
        transaction_id: `${method}_${Date.now()}_${userId.slice(-6)}`,
        completed_at: status === 'completed' ? new Date().toISOString() : null
      }]);
  }

  private async updateUserEarnings(userId: string, amount: number, earningType: 'survey' | 'referral'): Promise<void> {
    const currentYear = new Date().getFullYear();
    
    await supabase.rpc('increment_user_earnings', {
      p_user_id: userId,
      p_year: currentYear,
      p_amount: amount,
      p_type: earningType
    });
  }

  // Get user's total earnings and payout history
  async getUserPayoutSummary(userId: string): Promise<{
    totalEarnings: number;
    pendingAmount: number;
    paidAmount: number;
    justTheTipBalance: number;
    recentTransactions: PayoutTransaction[];
  }> {
    try {
      // Get current year earnings
      const { data: earnings } = await supabase
        .from('user_earnings')
        .select('*')
        .eq('user_id', userId)
        .eq('year', new Date().getFullYear())
        .single();

      // Get pending earnings
      const pendingAmount = await this.getPendingEarnings(userId);

      // Get recent transactions
      const { data: transactions } = await supabase
        .from('payout_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get JustTheTip balance if Discord linked
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('discord_id')
        .eq('user_id', userId)
        .single();

      let justTheTipBalance = 0;
      if (profile?.discord_id) {
        justTheTipBalance = await justTheTipIntegration.getUserBalance(profile.discord_id);
      }

      const totalEarnings = earnings?.total_earnings || 0;
      const paidAmount = totalEarnings - pendingAmount;

      return {
        totalEarnings,
        pendingAmount,
        paidAmount,
        justTheTipBalance,
        recentTransactions: transactions || []
      };

    } catch (error) {
      console.error('Error getting payout summary:', error);
      return {
        totalEarnings: 0,
        pendingAmount: 0,
        paidAmount: 0,
        justTheTipBalance: 0,
        recentTransactions: []
      };
    }
  }
}

// Singleton instance
export const payoutProcessor = new PayoutProcessor();