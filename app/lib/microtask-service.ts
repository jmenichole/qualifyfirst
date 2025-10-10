'use client';

import { supabase } from './supabase';
import { payoutProcessor } from './payout-processor';

export interface Microtask {
  id: number;
  title: string;
  description: string;
  instructions: string;
  task_type: 'data_verification' | 'content_moderation' | 'image_tagging' | 'text_transcription' | 'link_validation' | 'social_media_engagement' | 'feedback_collection' | 'quality_assurance';
  payout: number;
  estimated_minutes: number;
  total_slots: number;
  completed_slots: number;
  required_accuracy: number;
  active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  task_data: Record<string, unknown>;
  validation_rules: Record<string, unknown>;
  categories?: MicrotaskCategory[];
}

export interface MicrotaskCompletion {
  id: number;
  microtask_id: number;
  user_id: string;
  profile_id: number;
  status: 'submitted' | 'approved' | 'rejected' | 'pending_review';
  submission_data: Record<string, unknown>;
  validation_score?: number;
  payout_amount: number;
  payout_status: 'pending' | 'completed' | 'failed';
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  time_spent_seconds?: number;
  submitted_at: string;
  microtask?: Microtask;
}

export interface MicrotaskCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  active: boolean;
}

export class MicrotaskService {
  
  // Get all available microtasks for a user
  async getAvailableMicrotasks(userId: string): Promise<Microtask[]> {
    try {
      // Get tasks user hasn't completed yet
      const { data: completions } = await supabase
        .from('microtask_completions')
        .select('microtask_id')
        .eq('user_id', userId);

      const completedIds = completions?.map(c => c.microtask_id) || [];

      const query = supabase
        .from('microtasks')
        .select('*')
        .eq('active', true)
        .lt('completed_slots', supabase.rpc('get_total_slots', {}))
        .order('payout', { ascending: false });

      // Filter out completed tasks
      if (completedIds.length > 0) {
        query.not('id', 'in', `(${completedIds.join(',')})`);
      }

      // Filter out expired tasks
      query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching microtasks:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Error in getAvailableMicrotasks:', error);
      return [];
    }
  }

  // Get microtask by ID with category information
  async getMicrotaskById(taskId: number): Promise<Microtask | null> {
    try {
      const { data, error } = await supabase
        .from('microtasks')
        .select(`
          *,
          microtask_category_assignments (
            category_id,
            microtask_categories (*)
          )
        `)
        .eq('id', taskId)
        .single();

      if (error || !data) {
        console.error('Error fetching microtask:', error);
        return null;
      }

      // Transform the data to include categories
      const microtask = {
        ...data,
        categories: data.microtask_category_assignments?.map(
          (assignment: { microtask_categories: MicrotaskCategory }) => assignment.microtask_categories
        ) || []
      };

      return microtask;

    } catch (error) {
      console.error('Error in getMicrotaskById:', error);
      return null;
    }
  }

  // Submit a microtask completion
  async submitMicrotaskCompletion(
    userId: string,
    taskId: number,
    submissionData: Record<string, unknown>,
    timeSpentSeconds?: number
  ): Promise<{ success: boolean; completion?: MicrotaskCompletion; error?: string }> {
    try {
      // Get user profile ID
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        return { success: false, error: 'User profile not found' };
      }

      // Get microtask details
      const microtask = await this.getMicrotaskById(taskId);
      if (!microtask) {
        return { success: false, error: 'Microtask not found' };
      }

      // Check if task is still available
      if (!microtask.active || microtask.completed_slots >= microtask.total_slots) {
        return { success: false, error: 'Microtask is no longer available' };
      }

      // Check if expired
      if (microtask.expires_at && new Date(microtask.expires_at) < new Date()) {
        return { success: false, error: 'Microtask has expired' };
      }

      // Validate submission data
      const validationScore = this.validateSubmission(submissionData, microtask.validation_rules);

      // Insert completion record
      const { data: completion, error } = await supabase
        .from('microtask_completions')
        .insert([{
          microtask_id: taskId,
          user_id: userId,
          profile_id: profile.id,
          submission_data: submissionData,
          validation_score: validationScore,
          payout_amount: microtask.payout,
          time_spent_seconds: timeSpentSeconds
        }])
        .select()
        .single();

      if (error) {
        console.error('Error submitting completion:', error);
        return { success: false, error: 'Failed to submit completion' };
      }

      // If auto-approved, process payout
      if (completion.status === 'approved') {
        await this.processMicrotaskPayout(userId, completion.id);
      }

      return { success: true, completion };

    } catch (error) {
      console.error('Error in submitMicrotaskCompletion:', error);
      return { success: false, error: 'An error occurred while submitting' };
    }
  }

  // Validate submission data against rules
  private validateSubmission(
    submissionData: Record<string, unknown>,
    validationRules: Record<string, unknown>
  ): number {
    try {
      const rules = validationRules as {
        required_fields?: string[];
        min_length?: number;
        max_length?: number;
        min_tags?: number;
        max_tags?: number;
        rating_scale?: [number, number];
      };

      let score = 1.0;

      // Check required fields
      if (rules.required_fields) {
        const missingFields = rules.required_fields.filter(
          field => !submissionData[field] || submissionData[field] === ''
        );
        if (missingFields.length > 0) {
          score -= (missingFields.length / rules.required_fields.length) * 0.5;
        }
      }

      // Check text length requirements
      if (rules.min_length && typeof submissionData.text === 'string') {
        if (submissionData.text.length < rules.min_length) {
          score -= 0.2;
        }
      }

      // Check tag requirements
      if (rules.min_tags && Array.isArray(submissionData.tags)) {
        if (submissionData.tags.length < rules.min_tags) {
          score -= 0.3;
        }
      }

      return Math.max(0, Math.min(1, score));

    } catch (error) {
      console.error('Validation error:', error);
      return 0.5; // Default to moderate score on validation errors
    }
  }

  // Process payout for approved microtask
  async processMicrotaskPayout(userId: string, completionId: number): Promise<boolean> {
    try {
      const { data: completion, error: fetchError } = await supabase
        .from('microtask_completions')
        .select('*, microtasks(*)')
        .eq('id', completionId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !completion) {
        console.error('Error fetching completion for payout:', fetchError);
        return false;
      }

      if (completion.status !== 'approved' || completion.payout_status !== 'pending') {
        return false;
      }

      // Process payout through the existing payout processor
      const success = await payoutProcessor.processSurveyPayout(
        userId,
        completion.microtask_id, // Using microtask_id as source
        completion.payout_amount
      );

      // Update payout status
      if (success) {
        await supabase
          .from('microtask_completions')
          .update({ payout_status: 'completed' })
          .eq('id', completionId);
      } else {
        await supabase
          .from('microtask_completions')
          .update({ payout_status: 'failed' })
          .eq('id', completionId);
      }

      return success;

    } catch (error) {
      console.error('Error processing microtask payout:', error);
      return false;
    }
  }

  // Get user's microtask completion history
  async getUserCompletions(userId: string, limit: number = 50): Promise<MicrotaskCompletion[]> {
    try {
      const { data, error } = await supabase
        .from('microtask_completions')
        .select(`
          *,
          microtasks (*)
        `)
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user completions:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Error in getUserCompletions:', error);
      return [];
    }
  }

  // Get user's microtask earnings summary
  async getUserMicrotaskEarnings(userId: string): Promise<{
    totalEarned: number;
    totalCompleted: number;
    pendingReview: number;
    pendingPayout: number;
  }> {
    try {
      const { data: completions, error } = await supabase
        .from('microtask_completions')
        .select('status, payout_status, payout_amount')
        .eq('user_id', userId);

      if (error || !completions) {
        return { totalEarned: 0, totalCompleted: 0, pendingReview: 0, pendingPayout: 0 };
      }

      const summary = completions.reduce((acc, completion) => {
        if (completion.status === 'approved') {
          acc.totalCompleted++;
          if (completion.payout_status === 'completed') {
            acc.totalEarned += completion.payout_amount;
          } else if (completion.payout_status === 'pending') {
            acc.pendingPayout += completion.payout_amount;
          }
        } else if (completion.status === 'pending_review' || completion.status === 'submitted') {
          acc.pendingReview++;
        }
        return acc;
      }, {
        totalEarned: 0,
        totalCompleted: 0,
        pendingReview: 0,
        pendingPayout: 0
      });

      return summary;

    } catch (error) {
      console.error('Error in getUserMicrotaskEarnings:', error);
      return { totalEarned: 0, totalCompleted: 0, pendingReview: 0, pendingPayout: 0 };
    }
  }

  // Get all categories
  async getCategories(): Promise<MicrotaskCategory[]> {
    try {
      const { data, error } = await supabase
        .from('microtask_categories')
        .select('*')
        .eq('active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Error in getCategories:', error);
      return [];
    }
  }

  // Get microtasks by category
  async getMicrotasksByCategory(categoryId: number, userId?: string): Promise<Microtask[]> {
    try {
      let completedIds: number[] = [];
      
      if (userId) {
        const { data: completions } = await supabase
          .from('microtask_completions')
          .select('microtask_id')
          .eq('user_id', userId);
        
        completedIds = completions?.map(c => c.microtask_id) || [];
      }

      const { data: assignments } = await supabase
        .from('microtask_category_assignments')
        .select(`
          microtask_id,
          microtasks (*)
        `)
        .eq('category_id', categoryId);

      if (!assignments) return [];

      // Filter and return microtasks
      const microtasks = assignments
        .map(a => a.microtasks)
        .filter(m => 
          m && 
          m.active && 
          m.completed_slots < m.total_slots &&
          !completedIds.includes(m.id) &&
          (!m.expires_at || new Date(m.expires_at) > new Date())
        );

      return microtasks;

    } catch (error) {
      console.error('Error in getMicrotasksByCategory:', error);
      return [];
    }
  }
}

// Singleton instance
export const microtaskService = new MicrotaskService();
