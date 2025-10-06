// API endpoint for survey provider webhooks
// Handles completion notifications and triggers payouts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { payoutProcessor } from '../../../lib/payout-processor';
import { aiSurveyMatcher } from '../../../lib/ai-survey-matcher';

interface WebhookData {
  user_id: string;
  survey_id: string;
  provider: string;
  status: 'completed' | 'disqualified' | 'abandoned';
  payout: number;
  time_spent: number;
  provider_data?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook authenticity (implement based on provider requirements)
    const authHeader = request.headers.get('authorization');
    if (!isValidWebhook(authHeader)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: WebhookData = await request.json();
    
    // Validate required fields
    if (!data.user_id || !data.survey_id || !data.provider || !data.status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Process based on survey completion status
    switch (data.status) {
      case 'completed':
        await handleSurveyCompletion(data);
        break;
      case 'disqualified':
      case 'abandoned':
        await handleSurveyFailure(data);
        break;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

async function handleSurveyCompletion(data: WebhookData) {
  try {
    // 1. Record completion feedback for AI training
    await recordCompletionFeedback(data);

    // 2. Process payout
    const payoutSuccess = await payoutProcessor.processSurveyPayout(
      data.user_id,
      parseInt(data.survey_id.split('_')[1]), // Extract numeric ID
      data.payout
    );

    // 3. Update user completion stats
    await updateUserCompletionStats(data.user_id, true);

    // 4. Log completion event
    await supabase
      .from('analytics_events')
      .insert([{
        event_type: 'survey_completed',
        user_id: data.user_id,
        properties: {
          survey_id: data.survey_id,
          provider: data.provider,
          payout: data.payout,
          time_spent: data.time_spent,
          payout_success: payoutSuccess
        }
      }]);

    console.log(`Survey completed: ${data.survey_id} for user ${data.user_id}, payout: $${data.payout}`);

  } catch (error) {
    console.error('Error handling survey completion:', error);
    throw error;
  }
}

async function handleSurveyFailure(data: WebhookData) {
  try {
    // 1. Record failure feedback for AI training
    await recordCompletionFeedback(data);

    // 2. Update user completion stats
    await updateUserCompletionStats(data.user_id, false);

    // 3. Log failure event
    await supabase
      .from('analytics_events')
      .insert([{
        event_type: 'survey_failed',
        user_id: data.user_id,
        properties: {
          survey_id: data.survey_id,
          provider: data.provider,
          status: data.status,
          time_spent: data.time_spent
        }
      }]);

    console.log(`Survey ${data.status}: ${data.survey_id} for user ${data.user_id}`);

  } catch (error) {
    console.error('Error handling survey failure:', error);
    throw error;
  }
}

async function recordCompletionFeedback(data: WebhookData) {
  try {
    // Get user profile for AI training
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', data.user_id)
      .single();

    // Get original survey data if available
    const { data: clickData } = await supabase
      .from('ai_survey_clicks')
      .select('*')
      .eq('user_id', data.user_id)
      .eq('survey_id', data.survey_id)
      .order('clicked_at', { ascending: false })
      .limit(1)
      .single();

    // Record feedback for AI improvement
    await aiSurveyMatcher.recordCompletionFeedback({
      user_id: data.user_id,
      survey_id: data.survey_id,
      provider: data.provider,
      result: data.status,
      time_spent: data.time_spent,
      reward_earned: data.status === 'completed' ? data.payout : 0,
      user_attributes: {
        age: profile?.age,
        gender: profile?.gender,
        country: profile?.location,
        interests: profile?.hobbies,
        employment: profile?.employment
      },
      survey_attributes: {
        expected_reward: clickData?.expected_reward,
        match_score: clickData?.match_score,
        provider: data.provider
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error recording completion feedback:', error);
  }
}

async function updateUserCompletionStats(userId: string, completed: boolean) {
  try {
    // This would update user's completion rate statistics
    // Implementation depends on your user stats tracking needs
    
    const { data: stats } = await supabase
      .from('user_completion_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (stats) {
      await supabase
        .from('user_completion_stats')
        .update({
          total_attempts: stats.total_attempts + 1,
          completed_surveys: completed ? stats.completed_surveys + 1 : stats.completed_surveys,
          completion_rate: completed 
            ? ((stats.completed_surveys + 1) / (stats.total_attempts + 1)) * 100
            : (stats.completed_surveys / (stats.total_attempts + 1)) * 100
        })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('user_completion_stats')
        .insert([{
          user_id: userId,
          total_attempts: 1,
          completed_surveys: completed ? 1 : 0,
          completion_rate: completed ? 100 : 0
        }]);
    }

  } catch (error) {
    console.error('Error updating completion stats:', error);
  }
}

function isValidWebhook(authHeader: string | null): boolean {
  // Implement webhook signature verification based on your providers
  // Example for BitLabs or CPX Research webhook verification
  
  if (!authHeader) return false;
  
  const expectedToken = process.env.WEBHOOK_SECRET_TOKEN;
  return authHeader === `Bearer ${expectedToken}`;
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  // Some providers require GET endpoint verification
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ 
    status: 'active', 
    service: 'QualifyFirst Survey Webhooks' 
  });
}