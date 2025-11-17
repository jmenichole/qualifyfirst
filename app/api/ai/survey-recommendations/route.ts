/**
 * AI-Powered Survey Recommendations API
 * Uses Vercel AI Gateway for streaming personalized survey recommendations
 */

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // For demo purposes, use mock data if Supabase is not configured
    const context = {
      profile: {
        age: 35,
        gender: 'Male',
        country: 'US',
        interests: ['Technology', 'Travel', 'Fitness'],
        employment: 'Full-time',
        income: '$50,000-$75,000',
      },
      recentActivity: [
        { result: 'completed', earned: 5.50 },
        { result: 'completed', earned: 3.25 },
      ],
      availableSurveys: 15,
    };

    // Create OpenAI provider with Gateway config
    const openai = createOpenAI({
      apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_GATEWAY_API_KEY 
        ? 'https://ai-gateway.vercel.sh/v1' 
        : undefined,
    });

    // Stream AI-generated recommendations
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: `You are an expert survey recommendation assistant for QualifyFirst platform.
Your goal is to provide personalized, actionable recommendations to help users find the best surveys.

Guidelines:
- Be enthusiastic but honest
- Consider user's profile and completion history
- Recommend surveys that match their interests
- Provide tips for maximizing earnings
- Mention estimated time and rewards
- Keep recommendations concise and engaging`,
        },
        {
          role: 'user',
          content: `Generate personalized survey recommendations for this user:

Profile:
- Age: ${context.profile.age}
- Gender: ${context.profile.gender}
- Location: ${context.profile.country}
- Interests: ${context.profile.interests.join(', ') || 'General'}
- Employment: ${context.profile.employment}

Recent Activity:
- Completed surveys: ${context.recentActivity.filter(a => a.result === 'completed').length}
- Total earned: $${context.recentActivity.reduce((sum, a) => sum + (a.earned || 0), 0).toFixed(2)}

Available surveys: ${context.availableSurveys}

Provide:
1. Top 3 recommended survey types for this user
2. Best time strategies for maximum earnings
3. One personalized tip based on their profile`,
        },
      ],
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
