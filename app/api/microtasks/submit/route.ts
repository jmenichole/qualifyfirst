// API endpoint for submitting microtask completions
import { NextRequest, NextResponse } from 'next/server';
import { microtaskService } from '../../../lib/microtask-service';
import { supabase } from '../../../lib/supabase';
import { trackMicrotaskInteraction } from '../../../lib/analytics';

interface SubmitRequest {
  microtask_id: number;
  submission_data: Record<string, unknown>;
  time_spent_seconds?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SubmitRequest = await request.json();
    
    // Validate request
    if (!body.microtask_id || !body.submission_data) {
      return NextResponse.json({ 
        error: 'Missing required fields: microtask_id and submission_data' 
      }, { status: 400 });
    }

    // Submit completion
    const result = await microtaskService.submitMicrotaskCompletion(
      user.id,
      body.microtask_id,
      body.submission_data,
      body.time_spent_seconds
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Failed to submit completion' 
      }, { status: 400 });
    }

    // Track analytics
    await trackMicrotaskInteraction(body.microtask_id, 'submitted', {
      time_spent: body.time_spent_seconds || 0,
      validation_score: result.completion?.validation_score || 0,
      status: result.completion?.status || 'unknown'
    });

    return NextResponse.json({ 
      success: true,
      completion: result.completion
    });

  } catch (error) {
    console.error('Microtask submit API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
