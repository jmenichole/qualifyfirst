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
  | 'filters_used';

// Track analytics events
export async function trackEvent(
  event: AnalyticsEvent, 
  properties?: Record<string, any>
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
export async function trackPageView(page: string, additionalData?: Record<string, any>) {
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
  additionalData?: Record<string, any>
) {
  await trackEvent(action === 'clicked' ? 'survey_clicked' : 'survey_completed', {
    survey_id: surveyId,
    action,
    ...additionalData
  });
}