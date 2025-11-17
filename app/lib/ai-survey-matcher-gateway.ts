/**
 * QualifyFirst - AI Survey Matcher with Vercel AI Gateway
 * 
 * This version uses Vercel AI Gateway for improved reliability,
 * multi-model support, and automatic failover.
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { supabase } from './supabase';
import type { SurveyOffer, UserProfile } from './survey-provider-api';

interface MatchScore {
  survey_id: string;
  score: number;
  confidence: number;
  factors: {
    demographic_match: number;
    interest_match: number;
    completion_history: number;
    provider_performance: number;
  };
  reasoning?: string;
  model_used?: string;
}

interface CompletionFeedback {
  user_id: string;
  survey_id: string;
  provider: string;
  result: 'completed' | 'disqualified' | 'abandoned';
  time_spent: number;
  reward_earned: number;
  user_attributes: Record<string, unknown>;
  survey_attributes: Record<string, unknown>;
  timestamp: string;
}

interface AIGatewayConfig {
  primaryModel: string;
  fallbackModel: string;
  useGateway: boolean;
  gatewayUrl?: string;
  enableMultiModel: boolean;
}

export class AISurveyMatcherGateway {
  private config: AIGatewayConfig;

  constructor(config?: Partial<AIGatewayConfig>) {
    this.config = {
      primaryModel: 'gpt-4o-mini',
      fallbackModel: 'claude-3-5-sonnet-latest',
      useGateway: true,
      gatewayUrl: 'https://ai-gateway.vercel.sh/v1',
      enableMultiModel: false,
      ...config
    };
  }

  /**
   * Get top survey matches for a user
   * Uses Vercel AI Gateway for improved reliability
   */
  async getTopMatches(
    userProfile: UserProfile,
    availableSurveys: SurveyOffer[],
    limit: number = 3
  ): Promise<{
    matches: (SurveyOffer & { matchScore: MatchScore })[];
    totalAnalyzed: number;
  }> {
    // Step 1: Quick filtering based on hard requirements
    const eligibleSurveys = this.filterEligibleSurveys(userProfile, availableSurveys);
    
    // Step 2: AI scoring for remaining surveys
    const scoredSurveys = await this.scoreSurveys(userProfile, eligibleSurveys);
    
    // Step 3: Sort by score and return top matches
    const topMatches = scoredSurveys
      .sort((a, b) => b.matchScore.score - a.matchScore.score)
      .slice(0, limit);

    return {
      matches: topMatches,
      totalAnalyzed: availableSurveys.length
    };
  }

  /**
   * Filter surveys based on hard requirements (age, country, etc.)
   */
  private filterEligibleSurveys(userProfile: UserProfile, surveys: SurveyOffer[]): SurveyOffer[] {
    return surveys.filter(survey => {
      // Country check
      if (survey.country && !survey.country.includes(userProfile.country)) {
        return false;
      }

      // Age check
      if (survey.min_age && userProfile.age < survey.min_age) {
        return false;
      }
      if (survey.max_age && userProfile.age > survey.max_age) {
        return false;
      }

      // Gender check
      if (survey.gender && !survey.gender.includes(userProfile.gender)) {
        return false;
      }

      // Device check
      if (survey.device && !survey.device.includes(userProfile.device)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Score surveys using AI models via Vercel AI Gateway
   */
  private async scoreSurveys(
    userProfile: UserProfile,
    surveys: SurveyOffer[]
  ): Promise<(SurveyOffer & { matchScore: MatchScore })[]> {
    const scoredSurveys = [];

    for (const survey of surveys) {
      try {
        // Get historical performance data
        const historicalData = await this.getHistoricalPerformance(survey.provider, survey.id);
        
        // Calculate match score using AI via Gateway
        const matchScore = await this.calculateMatchScoreWithGateway(
          userProfile,
          survey,
          historicalData
        );
        
        scoredSurveys.push({
          ...survey,
          matchScore
        });
      } catch (error) {
        console.error(`Error scoring survey ${survey.id}:`, error);
        // Fallback to basic scoring
        scoredSurveys.push({
          ...survey,
          matchScore: this.getBasicMatchScore(survey)
        });
      }
    }

    return scoredSurveys;
  }

  /**
   * Calculate match score using Vercel AI Gateway
   * Supports automatic failover between models
   */
  private async calculateMatchScoreWithGateway(
    userProfile: UserProfile,
    survey: SurveyOffer,
    historicalData: Record<string, unknown>
  ): Promise<MatchScore> {
    const prompt = this.buildMatchingPrompt(userProfile, survey, historicalData);

    try {
      // Use multi-model consensus if enabled
      if (this.config.enableMultiModel) {
        return await this.getMultiModelConsensus(userProfile, survey, historicalData);
      }

      // Primary model attempt via Gateway
      const primaryModel = this.getModel(this.config.primaryModel);
      const result = await generateText({
        model: primaryModel,
        prompt,
        temperature: 0.1,
      });

      const parsedScore = this.parseAIResponse(result.text);
      if (parsedScore) {
        return {
          ...parsedScore,
          survey_id: survey.id,
          model_used: this.config.primaryModel,
        };
      }

      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Primary model error, trying fallback:', error);
      
      try {
        // Fallback to secondary model
        const fallbackModel = this.getModel(this.config.fallbackModel);
        const result = await generateText({
          model: fallbackModel,
          prompt,
          temperature: 0.1,
        });

        const parsedScore = this.parseAIResponse(result.text);
        if (parsedScore) {
          return {
            ...parsedScore,
            survey_id: survey.id,
            model_used: this.config.fallbackModel,
          };
        }
      } catch (fallbackError) {
        console.error('Fallback model error:', fallbackError);
      }

      // Final fallback to heuristic scoring
      return this.getHeuristicMatchScore(userProfile, survey, historicalData);
    }
  }

  /**
   * Get multi-model consensus for more robust predictions
   */
  private async getMultiModelConsensus(
    userProfile: UserProfile,
    survey: SurveyOffer,
    historicalData: Record<string, unknown>
  ): Promise<MatchScore> {
    const prompt = this.buildMatchingPrompt(userProfile, survey, historicalData);
    const models = [
      { model: this.getModel('gpt-4o-mini'), name: 'gpt-4o-mini' },
      { model: this.getModel('claude-3-5-sonnet-latest'), name: 'claude-3.5-sonnet' },
    ];

    const results = await Promise.allSettled(
      models.map(async ({ model, name }) => {
        const result = await generateText({
          model,
          prompt,
          temperature: 0.1,
        });
        const parsed = this.parseAIResponse(result.text);
        if (!parsed) {
          throw new Error('Failed to parse AI response');
        }
        return { ...parsed, model_used: name, survey_id: survey.id };
      })
    );

    // Combine successful results
    const successfulResults = results
      .filter((r): r is PromiseFulfilledResult<MatchScore & { model_used: string }> => r.status === 'fulfilled')
      .map(r => r.value);

    if (successfulResults.length === 0) {
      return this.getHeuristicMatchScore(userProfile, survey, historicalData);
    }

    // Calculate weighted average
    const avgScore = successfulResults.reduce((sum, r) => sum + (r?.score || 0), 0) / successfulResults.length;
    const avgConfidence = successfulResults.reduce((sum, r) => sum + (r?.confidence || 0), 0) / successfulResults.length;
    
    const avgFactors = {
      demographic_match: successfulResults.reduce((sum, r) => sum + (r?.factors?.demographic_match || 0), 0) / successfulResults.length,
      interest_match: successfulResults.reduce((sum, r) => sum + (r?.factors?.interest_match || 0), 0) / successfulResults.length,
      completion_history: successfulResults.reduce((sum, r) => sum + (r?.factors?.completion_history || 0), 0) / successfulResults.length,
      provider_performance: successfulResults.reduce((sum, r) => sum + (r?.factors?.provider_performance || 0), 0) / successfulResults.length,
    };

    return {
      survey_id: survey.id,
      score: avgScore,
      confidence: avgConfidence,
      factors: avgFactors,
      model_used: 'multi-model-consensus',
      reasoning: `Consensus from ${successfulResults.length} models`,
    };
  }

  /**
   * Get AI model with Gateway configuration
   */
  private getModel(modelName: string) {
    const gatewayConfig = this.config.useGateway
      ? {
          apiKey: process.env.AI_GATEWAY_API_KEY,
          baseURL: this.config.gatewayUrl,
        }
      : {};

    if (modelName.startsWith('gpt-') || modelName.startsWith('o1-')) {
      const openaiProvider = createOpenAI(gatewayConfig);
      return openaiProvider(modelName);
    } else if (modelName.startsWith('claude-')) {
      const anthropicProvider = createAnthropic(gatewayConfig);
      return anthropicProvider(modelName);
    }

    // Default to OpenAI
    const openaiProvider = createOpenAI(gatewayConfig);
    return openaiProvider('gpt-4o-mini');
  }

  /**
   * Build prompt for AI matching
   */
  private buildMatchingPrompt(
    userProfile: UserProfile,
    survey: SurveyOffer,
    historicalData: Record<string, unknown>
  ): string {
    return `
Analyze this user-survey match and predict completion probability.

USER PROFILE:
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Country: ${userProfile.country}
- Interests: ${userProfile.interests.join(', ')}
- Employment: ${userProfile.employment}
- Income: ${userProfile.income_range}
- Completion Rate: ${userProfile.completion_history.completion_rate}%
- Avg Survey Time: ${userProfile.completion_history.avg_survey_time} min

SURVEY DETAILS:
- Title: ${survey.title}
- Provider: ${survey.provider}
- Reward: $${survey.reward}
- Est. Time: ${survey.estimated_time} min
- Completion Rate: ${survey.completion_rate}%
- Target Age: ${survey.min_age || 'any'} - ${survey.max_age || 'any'}
- Target Gender: ${survey.gender?.join(', ') || 'any'}

HISTORICAL DATA:
- Similar surveys completed: ${historicalData.similarCompleted || 0}
- Provider success rate: ${historicalData.providerSuccessRate || 0}%

Return JSON only with this exact structure:
{
  "score": 0.85,
  "confidence": 0.92,
  "factors": {
    "demographic_match": 0.90,
    "interest_match": 0.75,
    "completion_history": 0.88,
    "provider_performance": 0.85
  },
  "reasoning": "Brief explanation"
}
    `.trim();
  }

  /**
   * Parse AI response to extract match score
   */
  private parseAIResponse(content: string): MatchScore | null {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          survey_id: '',
          score: Math.min(Math.max(parsed.score || 0, 0), 1),
          confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
          factors: {
            demographic_match: parsed.factors?.demographic_match || 0.5,
            interest_match: parsed.factors?.interest_match || 0.5,
            completion_history: parsed.factors?.completion_history || 0.5,
            provider_performance: parsed.factors?.provider_performance || 0.5,
          },
          reasoning: parsed.reasoning,
        };
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }
    return null;
  }

  /**
   * Heuristic fallback scoring when AI is unavailable
   */
  private getHeuristicMatchScore(
    userProfile: UserProfile,
    survey: SurveyOffer,
    _historicalData: Record<string, unknown>
  ): MatchScore {
    const factors = {
      demographic_match: this.calculateDemographicMatch(userProfile, survey),
      interest_match: this.calculateInterestMatch(userProfile, survey),
      completion_history: Math.min(userProfile.completion_history.completion_rate / 100, 1),
      provider_performance: survey.completion_rate,
    };

    const score = (
      factors.demographic_match * 0.3 +
      factors.interest_match * 0.25 +
      factors.completion_history * 0.25 +
      factors.provider_performance * 0.2
    );

    return {
      survey_id: survey.id,
      score: Math.min(Math.max(score, 0), 1),
      confidence: 0.6,
      factors,
      model_used: 'heuristic-fallback',
    };
  }

  private calculateDemographicMatch(userProfile: UserProfile, survey: SurveyOffer): number {
    let score = 1.0;

    if (survey.min_age || survey.max_age) {
      const targetAge = ((survey.min_age || 18) + (survey.max_age || 65)) / 2;
      const ageDiff = Math.abs(userProfile.age - targetAge);
      score *= Math.max(0, 1 - (ageDiff / 20));
    }

    if (survey.gender && survey.gender.length > 0) {
      score *= survey.gender.includes(userProfile.gender) ? 1.0 : 0.3;
    }

    return score;
  }

  private calculateInterestMatch(userProfile: UserProfile, survey: SurveyOffer): number {
    if (!survey.interests || survey.interests.length === 0) return 0.7;

    const userInterests = userProfile.interests.map((i: string) => i.toLowerCase());
    const surveyInterests = survey.interests.map((i: string) => i.toLowerCase());
    
    const matchCount = surveyInterests.filter((interest: string) => 
      userInterests.some((userInt: string) => userInt.includes(interest) || interest.includes(userInt))
    ).length;

    return Math.min(matchCount / surveyInterests.length, 1);
  }

  private getBasicMatchScore(survey: SurveyOffer): MatchScore {
    return {
      survey_id: survey.id,
      score: survey.completion_rate * (survey.reward / Math.max(survey.estimated_time, 1)),
      confidence: 0.5,
      factors: {
        demographic_match: 0.5,
        interest_match: 0.5,
        completion_history: 0.5,
        provider_performance: survey.completion_rate,
      },
      model_used: 'basic',
    };
  }

  /**
   * Get historical performance data
   */
  private async getHistoricalPerformance(
    provider: string,
    _surveyId: string
  ): Promise<Record<string, unknown>> {
    try {
      const { data } = await supabase
        .from('survey_completion_feedback')
        .select('*')
        .eq('provider', provider)
        .limit(100);

      if (!data || data.length === 0) return {};

      const completions = data.filter(d => d.result === 'completed');
      const providerSuccessRate = (completions.length / data.length) * 100;

      return {
        totalAttempts: data.length,
        completedAttempts: completions.length,
        providerSuccessRate,
        avgReward: completions.reduce((sum, c) => sum + c.reward_earned, 0) / completions.length,
        avgTime: completions.reduce((sum, c) => sum + c.time_spent, 0) / completions.length,
      };
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return {};
    }
  }

  /**
   * Record completion feedback for continuous improvement
   */
  async recordCompletionFeedback(feedback: CompletionFeedback): Promise<void> {
    try {
      await supabase
        .from('survey_completion_feedback')
        .insert([{
          user_id: feedback.user_id,
          survey_id: feedback.survey_id,
          provider: feedback.provider,
          result: feedback.result,
          time_spent: feedback.time_spent,
          reward_earned: feedback.reward_earned,
          user_attributes: feedback.user_attributes,
          survey_attributes: feedback.survey_attributes,
          timestamp: feedback.timestamp,
        }]);
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  }
}

// Singleton instance with Gateway enabled
export const aiSurveyMatcherGateway = new AISurveyMatcherGateway({
  useGateway: true,
  enableMultiModel: false, // Enable for production after testing
});
