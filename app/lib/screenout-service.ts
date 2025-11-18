/**
 * QualifyFirst - Smart Screenout Compensation System
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import { supabase } from './supabase';

export interface ScreenoutEvent {
  id?: number;
  user_id: string;
  survey_id: number;
  survey_title: string;
  time_spent_seconds: number;
  reason?: string;
  compensation_amount: number;
  compensated_at?: Date;
  alternative_surveys_offered: number[];
  created_at: Date;
}

export interface ScreenoutCompensation {
  amount: number;
  message: string;
  alternativeSurveys: unknown[];
  profileTips: string[];
}

export class ScreenoutService {
  
  /**
   * Calculate compensation amount based on time spent
   * Even a small amount shows we value their time
   */
  calculateCompensation(timeSpentSeconds: number): number {
    // Base compensation
    let amount = 0.05; // $0.05 minimum

    // Add based on time spent
    const minutes = Math.floor(timeSpentSeconds / 60);
    if (minutes >= 1) {
      amount += minutes * 0.05; // $0.05 per minute
    }

    // Cap at $0.50 for screenouts
    return Math.min(amount, 0.50);
  }

  /**
   * Get alternative surveys (3-5 suggestions)
   */
  async recordScreenout(
    userId: string,
    surveyId: number,
    surveyTitle: string,
    timeSpentSeconds: number,
    reason?: string
  ): Promise<ScreenoutCompensation> {
    try {
      const compensation = this.calculateCompensation(timeSpentSeconds);

      // Get alternative surveys (3-5 suggestions)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Get alternative surveys based on profile
      const { data: alternatives } = await supabase
        .from('surveys')
        .select('*')
        .eq('active', true)
        .neq('id', surveyId)
        .limit(5);

      const alternativeSurveyIds = alternatives?.map(s => s.id) || [];

      // Record the screenout event
      await supabase
        .from('screenout_events')
        .insert({
          user_id: userId,
          survey_id: surveyId,
          survey_title: surveyTitle,
          time_spent_seconds: timeSpentSeconds,
          reason: reason,
          compensation_amount: compensation,
          compensated_at: new Date().toISOString(),
          alternative_surveys_offered: alternativeSurveyIds
        });

      // Credit compensation to user's balance
      await this.creditCompensation(userId, compensation, surveyId);

      // Track analytics
      await supabase
        .from('analytics_events')
        .insert({
          user_id: userId,
          event_type: 'survey_screenout',
          properties: {
            survey_id: surveyId,
            time_spent: timeSpentSeconds,
            compensation: compensation
          }
        });

      return {
        amount: compensation,
        message: this.getEmpathyMessage(timeSpentSeconds),
        alternativeSurveys: alternatives || [],
        profileTips: this.getProfileImprovementTips(profile)
      };

    } catch (error) {
      console.error('Error recording screenout:', error);
      throw error;
    }
  }

  /**
   * Credit compensation to user's pending balance
   */
  private async creditCompensation(
    userId: string,
    amount: number,
    surveyId: number
  ): Promise<void> {
    // Add to user's pending balance
    const { data: existingBalance } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingBalance) {
      await supabase
        .from('user_balances')
        .update({
          pending_balance: (existingBalance.pending_balance || 0) + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('user_balances')
        .insert({
          user_id: userId,
          pending_balance: amount,
          available_balance: 0
        });
    }

    // Record transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: amount,
        type: 'screenout_compensation',
        status: 'completed',
        description: `Screenout compensation for survey #${surveyId}`,
        survey_id: surveyId
      });
  }

  /**
   * Get empathetic message for screenout
   */
  private getEmpathyMessage(timeSpentSeconds: number): string {
    const minutes = Math.floor(timeSpentSeconds / 60);

    if (minutes < 1) {
      return "That sucked, but we caught it quick. Here's something for your trouble. 🤝";
    } else if (minutes < 3) {
      return "Getting screened out after a few minutes is the worst. We got you though. 💰";
    } else if (minutes < 5) {
      return "Damn, that took a while just to get rejected. Not cool. Here's compensation. 🎁";
    } else {
      return "That's just disrespectful to waste that much of your time. Here's extra for dealing with that BS. 👑";
    }
  }

  /**
   * Get profile improvement tips
   */
  private getProfileImprovementTips(profile: Record<string, unknown> | null): string[] {
    const tips: string[] = [];

    if (!profile) {
      return ['Complete your full profile to get better matches'];
    }

    // Check for missing key fields
    if (!profile.age || profile.age === 'prefer_not_to_say') {
      tips.push('Adding your age range improves matching by 40%');
    }

    if (!profile.employment_status) {
      tips.push('Employment status helps match you to relevant surveys');
    }

    if (!profile.hobbies || (Array.isArray(profile.hobbies) && profile.hobbies.length === 0)) {
      tips.push('Add hobbies to unlock niche survey opportunities');
    }

    if (!profile.income_range) {
      tips.push('Income range unlocks higher-paying financial surveys');
    }

    if (tips.length === 0) {
      tips.push('Your profile looks solid! This was just bad luck.');
      tips.push('Our AI is learning from this to avoid similar mismatches.');
    }

    return tips;
  }

  /**
   * Get user's screenout stats
   */
  async getUserScreenoutStats(userId: string): Promise<{
    totalScreenouts: number;
    totalCompensation: number;
    avgTimeWasted: number;
    lastScreenout?: Date;
  }> {
    try {
      const { data: screenouts } = await supabase
        .from('screenout_events')
        .select('*')
        .eq('user_id', userId);

      if (!screenouts || screenouts.length === 0) {
        return {
          totalScreenouts: 0,
          totalCompensation: 0,
          avgTimeWasted: 0
        };
      }

      const totalCompensation = screenouts.reduce(
        (sum, s) => sum + (s.compensation_amount || 0),
        0
      );

      const avgTimeWasted = Math.round(
        screenouts.reduce((sum, s) => sum + (s.time_spent_seconds || 0), 0) / screenouts.length
      );

      return {
        totalScreenouts: screenouts.length,
        totalCompensation,
        avgTimeWasted,
        lastScreenout: screenouts[0]?.created_at
      };
    } catch (error) {
      console.error('Error fetching screenout stats:', error);
      return {
        totalScreenouts: 0,
        totalCompensation: 0,
        avgTimeWasted: 0
      };
    }
  }

  /**
   * Report survey disqualification (called from survey completion tracking)
   */
  async reportDisqualification(
    userId: string,
    surveyId: number,
    surveyTitle: string,
    timeSpent: number
  ): Promise<ScreenoutCompensation> {
    return this.recordScreenout(
      userId,
      surveyId,
      surveyTitle,
      timeSpent,
      'Survey disqualification'
    );
  }
}

// Singleton instance
export const screenoutService = new ScreenoutService();
