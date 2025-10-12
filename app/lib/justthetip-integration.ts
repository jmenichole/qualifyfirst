/**
 * QualifyFirst - JustTheTip Integration Service
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

// JustTheTip Integration for QualifyFirst Payouts
// Connects to your existing JustTheTip Discord bot system

interface JustTheTipUser {
  discord_id?: string;
  tip_balance: number;
  wallet_address?: string;
  payout_preference: 'justthetip' | 'wallet' | 'both';
}

interface PayoutRequest {
  user_id: string;
  amount: number;
  type: 'survey_completion' | 'referral_bonus' | 'manual_payout' | 'microtask_completion';
  survey_id?: number;
  referral_id?: number;
  microtask_id?: number;
}

export class JustTheTipIntegration {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    // These would come from environment variables
    this.apiUrl = process.env.NEXT_PUBLIC_JUSTTHETIP_API_URL || 'https://your-justthetip-api.com';
    this.apiKey = process.env.JUSTTHETIP_API_KEY || '';
  }

  // Credit user's JustTheTip balance
  async creditBalance(discordId: string, amount: number, reason: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/credit-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          discord_id: discordId,
          amount: amount,
          reason: reason,
          source: 'qualifyfirst'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('JustTheTip credit error:', error);
      return false;
    }
  }

  // Get user's current JustTheTip balance
  async getUserBalance(discordId: string): Promise<number> {
    try {
      const response = await fetch(`${this.apiUrl}/api/balance/${discordId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.balance || 0;
      }
      return 0;
    } catch (error) {
      console.error('JustTheTip balance check error:', error);
      return 0;
    }
  }

  // Link QualifyFirst user to Discord ID
  async linkDiscordAccount(userId: string, discordId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/link-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          qualify_first_user_id: userId,
          discord_id: discordId
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Discord linking error:', error);
      return false;
    }
  }

  // Process payout based on user preference
  async processPayout(request: PayoutRequest, userPreferences: JustTheTipUser): Promise<{
    success: boolean;
    method: string;
    transaction_id?: string;
    error?: string;
  }> {
    try {
      // If user prefers JustTheTip or doesn't have wallet
      if (userPreferences.payout_preference === 'justthetip' || !userPreferences.wallet_address) {
        if (!userPreferences.discord_id) {
          return {
            success: false,
            method: 'error',
            error: 'Discord account not linked'
          };
        }

        const reason = this.getPayoutReason(request.type, request);
        const credited = await this.creditBalance(userPreferences.discord_id, request.amount, reason);

        return {
          success: credited,
          method: 'justthetip_balance',
          transaction_id: `jtt_${Date.now()}_${request.user_id}`
        };
      }

      // For direct wallet payouts, you'd integrate with your existing crypto system
      // This is a placeholder for direct wallet integration
      return {
        success: false,
        method: 'wallet',
        error: 'Direct wallet payouts not implemented yet'
      };

    } catch (error) {
      return {
        success: false,
        method: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getPayoutReason(type: PayoutRequest['type'], request: PayoutRequest): string {
    switch (type) {
      case 'survey_completion':
        return `Survey completion reward - Survey #${request.survey_id}`;
      case 'referral_bonus':
        return `Referral bonus - Referral #${request.referral_id}`;
      case 'microtask_completion':
        return `Microtask completion reward - Task #${request.microtask_id}`;
      case 'manual_payout':
        return 'Manual payout from QualifyFirst';
      default:
        return 'QualifyFirst earnings';
    }
  }
}

// Singleton instance
export const justTheTipIntegration = new JustTheTipIntegration();