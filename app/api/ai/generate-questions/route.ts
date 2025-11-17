/**
 * AI-Powered Survey Question Generation API
 * Generates targeted screening questions for survey providers
 */

import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'edge';

const questionSchema = z.object({
  questions: z.array(z.object({
    id: z.string().describe('Unique question identifier'),
    question: z.string().describe('The screening question text'),
    type: z.enum(['multiple-choice', 'yes-no', 'scale', 'text']).describe('Question type'),
    options: z.array(z.string()).optional().describe('Options for multiple-choice questions'),
    purpose: z.string().describe('Why this question is important for screening'),
    expectedQualification: z.string().describe('What responses would qualify the user'),
  })).describe('List of generated screening questions'),
  targetAudience: z.string().describe('Description of ideal respondents'),
  estimatedCompletionTime: z.number().describe('Estimated time to complete in minutes'),
  recommendedReward: z.number().describe('Suggested reward amount in USD'),
});

export async function POST(req: Request) {
  try {
    const { 
      surveyTopic,
      targetDemographics,
      surveyGoal,
      numberOfQuestions = 5,
    } = await req.json();

    if (!surveyTopic || !surveyGoal) {
      return NextResponse.json(
        { error: 'Survey topic and goal are required' },
        { status: 400 }
      );
    }

    // Create OpenAI provider with Gateway config
    const openai = createOpenAI({
      apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_GATEWAY_API_KEY 
        ? 'https://ai-gateway.vercel.sh/v1' 
        : undefined,
    });

    // Generate AI-powered questions
    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: questionSchema,
      prompt: `Generate ${numberOfQuestions} effective screening questions for a survey.

Survey Topic: ${surveyTopic}

Survey Goal: ${surveyGoal}

Target Demographics: ${targetDemographics ? JSON.stringify(targetDemographics) : 'General audience'}

Requirements:
1. Create ${numberOfQuestions} screening questions that help identify qualified respondents
2. Mix question types (multiple-choice, yes-no, scale) for variety
3. Ensure questions are clear, unbiased, and easy to understand
4. Each question should serve a specific screening purpose
5. Include 3-5 options for multiple-choice questions
6. Provide reasoning for each question's inclusion
7. Specify what responses would qualify someone
8. Describe the ideal target audience
9. Estimate completion time (aim for 5-10 minutes)
10. Suggest appropriate reward based on time and complexity

Best practices:
- Avoid leading or loaded questions
- Use simple language
- Be specific and actionable
- Consider cultural sensitivity
- Ensure questions are relevant to the survey goal`,
      temperature: 0.7,
    });

    return NextResponse.json({
      success: true,
      data: result.object,
      metadata: {
        surveyTopic,
        surveyGoal,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
