// API endpoint to generate CPX Research wall URLs
// Handles secure hash generation server-side

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { cpxWallIntegration } from '../../../lib/cpx-wall-integration';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const messageId = searchParams.get('message_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user profile data
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('username, email, subid1, subid2')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate wall URL
    const wallUrl = cpxWallIntegration.generateWallURL({
      appId: process.env.CPX_APP_ID || '29491',
      userId,
      username: profile?.username || '',
      email: profile?.email || '',
      subid1: profile?.subid1 || '',
      subid2: profile?.subid2 || '',
      messageId: messageId || undefined
    });

    return NextResponse.json({ 
      wallUrl,
      messageId: messageId || null
    });

  } catch (error) {
    console.error('CPX wall URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate wall URL' }, 
      { status: 500 }
    );
  }
}