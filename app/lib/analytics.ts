/**
 * QualifyFirst - Analytics Service
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import { supabase } from '../lib/supabase';

// Analytics event types
export type AnalyticsEvent = 
  | 'profile_completed'
  | 'survey_clicked'
  | 'survey_completed'
  | 'profile_edited'
  | 'magic_link_sent'
  | 'user_logged_in'
  | 'user_logged_out'
  | 'dashboard_viewed'
  | 'filters_used'
  | 'microtask_viewed'
  | 'microtask_started'
  | 'microtask_completed'
  | 'microtask_submitted';

// Track analytics events
export async function trackEvent(
  event: AnalyticsEvent, 
  properties?: Record<string, string | number | boolean>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get user profile ID if available
    let profileId = null;
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      profileId = profile?.id;
    }

    // Insert analytics event
    await supabase.from('analytics_events').insert([{
      event_type: event,
      user_id: user?.id,
      profile_id: profileId,
      properties: properties || {},
      timestamp: new Date().toISOString()
    }]);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event, properties);
    }

  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

// Track page views
export async function trackPageView(page: string, additionalData?: Record<string, string | number | boolean>) {
  await trackEvent('dashboard_viewed', {
    page,
    timestamp: new Date().toISOString(),
    ...additionalData
  });
}

// Track survey interactions
export async function trackSurveyInteraction(
  surveyId: number, 
  action: 'clicked' | 'completed',
  additionalData?: Record<string, string | number | boolean>
) {
  await trackEvent(action === 'clicked' ? 'survey_clicked' : 'survey_completed', {
    survey_id: surveyId,
    action,
    ...additionalData
  });
}

// Track microtask interactions
export async function trackMicrotaskInteraction(
  microtaskId: number,
  action: 'viewed' | 'started' | 'completed' | 'submitted',
  additionalData?: Record<string, string | number | boolean>
) {
  const eventMap = {
    viewed: 'microtask_viewed',
    started: 'microtask_started',
    completed: 'microtask_completed',
    submitted: 'microtask_submitted'
  } as const;

  await trackEvent(eventMap[action], {
    microtask_id: microtaskId,
    action,
    ...additionalData
  });
}