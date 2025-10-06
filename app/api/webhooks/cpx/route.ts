// CPX Research Postback URL Handler
// Handles survey completion notifications from CPX Research
// URL: https://yourdomain.com/api/webhooks/cpx

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { payoutProcessor } from '../../../lib/payout-processor';
import { aiSurveyMatcher } from '../../../lib/ai-survey-matcher';
import crypto from 'crypto';

// CPX Research postback parameters (based on official documentation)
interface CPXPostback {
  status: string;           // "1" = completed, "2" = canceled/screened out
  trans_id: string;         // CPX unique transaction ID
  user_id: string;          // Your user identifier
  sub_id?: string;          // Your subId1 (renamed from subid_1)
  sub_id_2?: string;        // Your subId2 (renamed from subid_2)
  amount_local: string;     // Amount in your currency
  amount_usd: string;       // Amount in USD
  offer_id?: string;        // CPX offer identifier
  hash?: string;            // Security hash (renamed from secure_hash)
  ip_click: string;         // User click IP address
  type?: string;            // Type: "out", "complete", or "bonus"
}

export async function POST(request: NextRequest) {
  try {
    console.log('CPX Postback received');
    
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Extract CPX postback parameters (based on official documentation)
    const postbackData: CPXPostback = {
      status: searchParams.get('status') || '',
      trans_id: searchParams.get('trans_id') || '',
      user_id: searchParams.get('user_id') || '',
      sub_id: searchParams.get('sub_id') || undefined,
      sub_id_2: searchParams.get('sub_id_2') || undefined,
      amount_local: searchParams.get('amount_local') || '',
      amount_usd: searchParams.get('amount_usd') || '',
      offer_id: searchParams.get('offer_id') || undefined,
      hash: searchParams.get('hash') || undefined,
      ip_click: searchParams.get('ip_click') || '',
      type: searchParams.get('type') || undefined,
    };

    console.log('CPX Postback data:', postbackData);

    // Validate required parameters
    if (!postbackData.user_id || !postbackData.trans_id || !postbackData.status) {
      console.error('Missing required CPX parameters');
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify secure hash if provided (CPX uses hash parameter)
    if (postbackData.hash && !verifySecureHash(postbackData)) {
      console.error('Invalid secure hash');
      return NextResponse.json({ error: 'Invalid secure hash' }, { status: 401 });
    }

    // Process the postback
    if (postbackData.status === '1') {
      // Survey completed successfully
      await handleCPXCompletion(postbackData);
    } else {
      // Survey not completed (disqualified, abandoned, etc.)
      await handleCPXFailure(postbackData);
    }

    // CPX expects "1" response for successful processing
    return new NextResponse('1', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('CPX webhook error:', error);
    
    // Log the error but still return success to CPX to prevent retries
    await logWebhookError('cpx', error);
    return new NextResponse('1', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Also handle GET requests (CPX may send both)
export async function GET(request: NextRequest) {
  return POST(request);
}

function verifySecureHash(data: CPXPostback): boolean {
  try {
    // Get the security hash from environment variables
    const securityHash = process.env.CPX_SECURITY_HASH_KEY || 'VlS4csbvdjWxI6J6AZwwsOD3BTC1pkKL';
    
    if (!data.hash || !data.trans_id) {
      return false;
    }

    // CPX secure hash format: MD5(trans_id + '-' + security_hash)
    const hashString = data.trans_id + '-' + securityHash;
    const expectedHash = crypto.createHash('md5').update(hashString).digest('hex');

    return data.hash.toLowerCase() === expectedHash.toLowerCase();
  } catch (error) {
    console.error('Secure hash verification error:', error);
    return false;
  }
}

async function handleCPXCompletion(data: CPXPostback) {
  try {
    const rewardAmount = parseFloat(data.amount_usd);
    
    // Record the survey completion
    const { error: insertError } = await supabase
      .from('survey_completions')
      .insert({
        user_id: data.user_id,
        provider: 'cpx',
        survey_id: data.trans_id, // Use trans_id as survey identifier
        transaction_id: data.trans_id,
        status: 'completed',
        payout_amount: rewardAmount,
        currency: 'USD',
        completed_at: new Date().toISOString(),
        provider_data: {
          ip: data.ip_click,
          type: data.type,
          amount_local: data.amount_local,
          subid_1: data.subid_1,
          subid_2: data.subid_2,
        }
      });

    if (insertError) {
      console.error('Error recording completion:', insertError);
      return;
    }

    // Process payout through JustTheTip
    await payoutProcessor.processSurveyPayout(
      data.user_id,
      parseInt(data.trans_id),
      rewardAmount
    );

    // Record feedback for AI matching improvement
    await aiSurveyMatcher.recordCompletionFeedback({
      user_id: data.user_id,
      survey_id: data.trans_id,
      provider: 'cpx',
      result: 'completed',
      time_spent: 0, // CPX doesn't provide this
      reward_earned: rewardAmount,
      user_attributes: {
        ip: data.ip_click,
        subid_1: data.subid_1,
        subid_2: data.subid_2,
      },
      survey_attributes: {
        type: data.type,
        amount_local: data.amount_local,
        transaction_id: data.trans_id,
      },
      timestamp: new Date().toISOString()
    });

    console.log(`CPX survey completed: User ${data.user_id}, Reward: $${rewardAmount} USD`);
    
  } catch (error) {
    console.error('Error processing CPX completion:', error);
    throw error;
  }
}

async function handleCPXFailure(data: CPXPostback) {
  try {
    // Record the failed attempt
    const { error: insertError } = await supabase
      .from('survey_completions')
      .insert({
        user_id: data.user_id,
        provider: 'cpx',
        survey_id: data.trans_id, // Use trans_id as survey identifier
        transaction_id: data.trans_id,
        status: data.status === '2' ? 'disqualified' : 'abandoned',
        payout_amount: 0,
        currency: 'USD',
        completed_at: new Date().toISOString(),
        provider_data: {
          ip: data.ip_click,
          type: data.type,
          amount_local: data.amount_local,
          subid_1: data.subid_1,
          subid_2: data.subid_2,
        }
      });

    if (insertError) {
      console.error('Error recording failure:', insertError);
      return;
    }

    // Record feedback for AI matching improvement
    await aiSurveyMatcher.recordCompletionFeedback({
      user_id: data.user_id,
      survey_id: data.trans_id,
      provider: 'cpx',
      result: data.status === '2' ? 'disqualified' : 'abandoned',
      time_spent: 0,
      reward_earned: 0,
      user_attributes: {
        ip: data.ip_click,
        subid_1: data.subid_1,
        subid_2: data.subid_2,
      },
      survey_attributes: {
        type: data.type,
        amount_local: data.amount_local,
        transaction_id: data.trans_id,
      },
      timestamp: new Date().toISOString()
    });

    console.log(`CPX survey failed: User ${data.user_id}, Trans ID ${data.trans_id}, Status: ${data.status}`);
    
  } catch (error) {
    console.error('Error processing CPX failure:', error);
    throw error;
  }
}

async function logWebhookError(provider: string, error: any) {
  try {
    await supabase
      .from('webhook_logs')
      .insert({
        provider,
        error_message: error.message || 'Unknown error',
        error_details: error.stack || '',
        created_at: new Date().toISOString(),
      });
  } catch (logError) {
    console.error('Failed to log webhook error:', logError);
  }
}