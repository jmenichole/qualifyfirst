/**
 * AI-Powered Profile Enhancement Suggestions API
 * Analyzes incomplete profiles and suggests improvements
 */

import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'edge';

const suggestionSchema = z.object({
  completionScore: z.number().describe('Profile completion percentage (0-100)'),
  priority: z.enum(['high', 'medium', 'low']).describe('Urgency of improvements'),
  suggestions: z.array(z.object({
    field: z.string().describe('Field name to complete'),
    reason: z.string().describe('Why this field is important'),
    impact: z.string().describe('Expected benefit of completing this field'),
    example: z.string().describe('Example value for guidance'),
  })).describe('List of profile improvement suggestions'),
  estimatedOpportunities: z.number().describe('Additional surveys user could qualify for'),
  personalizedMessage: z.string().describe('Encouraging message tailored to the user'),
});

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // For demo purposes, use mock incomplete profile
    const profileFields = {
      demographics: {
        age: 35,
        gender: 'Male',
        country: 'US',
        employment: 'Full-time',
        income: null, // Missing
        education: null, // Missing
      },
      interests: {
        hobbies: ['Technology', 'Travel'],
        exercise: null, // Missing
        dietary: null, // Missing
      },
      technology: {
        smartphone: 'iPhone',
        social_media: ['Facebook', 'Instagram'],
        streaming: null, // Missing
      },
      consumer: {
        shopping: 'Weekly',
        platforms: ['Amazon'],
        influence: null, // Missing
      },
    };

    // Calculate completeness
    const totalFields = Object.values(profileFields).reduce(
      (sum, category) => sum + Object.keys(category).length,
      0
    );
    const completedFields = Object.values(profileFields).reduce(
      (sum, category) => sum + Object.values(category).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length,
      0
    );

    // Create OpenAI provider with Gateway config
    const openai = createOpenAI({
      apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_GATEWAY_API_KEY 
        ? 'https://ai-gateway.vercel.sh/v1' 
        : undefined,
    });

    // Generate AI suggestions
    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: suggestionSchema,
      prompt: `Analyze this user's profile and suggest improvements to maximize survey opportunities.

Current Profile:
${JSON.stringify(profileFields, null, 2)}

Profile Completeness: ${completedFields}/${totalFields} fields (${Math.round((completedFields / totalFields) * 100)}%)

Provide:
1. Accurate completion score
2. Priority level (high if <50%, medium if <75%, low if 75%+)
3. Top 3-5 most impactful fields to complete
4. For each suggestion, explain why it matters and what benefit they'll get
5. Estimate how many additional surveys they could qualify for
6. A personalized, encouraging message that motivates them to complete their profile

Be specific, actionable, and motivating. Focus on the fields that will unlock the most survey opportunities.`,
      temperature: 0.5,
    });

    return NextResponse.json({
      success: true,
      data: result.object,
    });
  } catch (error) {
    console.error('Error generating profile suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
