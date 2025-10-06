'use client';

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

export class AISurveyMatcher {
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
  }

  // Main matching function - returns top survey matches
  async getTopMatches(userProfile: UserProfile, availableSurveys: SurveyOffer[], limit: number = 3): Promise<{
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

  // Filter surveys based on hard requirements (age, country, etc.)
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

  // AI-powered survey scoring
  private async scoreSurveys(userProfile: UserProfile, surveys: SurveyOffer[]): Promise<(SurveyOffer & { matchScore: MatchScore })[]> {
    const scoredSurveys = [];

    for (const survey of surveys) {
      try {
        // Get historical performance data
        const historicalData = await this.getHistoricalPerformance(survey.provider, survey.id);
        
        // Calculate match score using AI + heuristics
        const matchScore = await this.calculateMatchScore(userProfile, survey, historicalData);
        
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

  // AI-powered match score calculation
  private async calculateMatchScore(
    userProfile: UserProfile, 
    survey: SurveyOffer, 
    historicalData: Record<string, unknown>
  ): Promise<MatchScore> {
    
    // Prepare data for AI analysis
    const prompt = this.buildMatchingPrompt(userProfile, survey, historicalData);
    
    try {
      // Use OpenAI for intelligent matching
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert survey matching algorithm. Analyze user profiles and survey requirements to predict completion probability. Return a JSON score between 0-1 with detailed factors.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 300
        })
      });

      if (response.ok) {
        const aiResult = await response.json();
        const aiScore = this.parseAIResponse(aiResult.choices[0]?.message?.content);
        
        if (aiScore) {
          return {
            survey_id: survey.id,
            score: aiScore.score,
            confidence: aiScore.confidence,
            factors: aiScore.factors
          };
        }
      }
    } catch (error) {
      console.error('AI scoring error:', error);
    }

    // Fallback to heuristic scoring
    return this.getHeuristicMatchScore(userProfile, survey, historicalData);
  }

  // Build prompt for AI matching
  private buildMatchingPrompt(userProfile: UserProfile, survey: SurveyOffer, historicalData: Record<string, unknown>): string {
    return `
Analyze this user-survey match:

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
- Similar surveys completed by user: ${historicalData.similarCompleted || 0}
- Provider success rate for this user: ${historicalData.providerSuccessRate || 0}%
- Average reward/time ratio preference: ${historicalData.rewardTimeRatio || 'unknown'}

Return JSON with:
{
  "score": 0.85,
  "confidence": 0.92,
  "factors": {
    "demographic_match": 0.90,
    "interest_match": 0.75,
    "completion_history": 0.88,
    "provider_performance": 0.85
  },
  "reasoning": "Strong demographic alignment, high user completion rate, good reward-to-time ratio match"
}
    `.trim();
  }

  // Parse AI response
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
            provider_performance: parsed.factors?.provider_performance || 0.5
          }
        };
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }
    return null;
  }

  // Heuristic fallback scoring
  private getHeuristicMatchScore(userProfile: UserProfile, survey: SurveyOffer, _historicalData: Record<string, unknown>): MatchScore {
    const factors = {
      demographic_match: this.calculateDemographicMatch(userProfile, survey),
      interest_match: this.calculateInterestMatch(userProfile, survey),
      completion_history: Math.min(userProfile.completion_history.completion_rate / 100, 1),
      provider_performance: survey.completion_rate
    };

    // Weighted average
    const score = (
      factors.demographic_match * 0.3 +
      factors.interest_match * 0.25 +
      factors.completion_history * 0.25 +
      factors.provider_performance * 0.2
    );

    return {
      survey_id: survey.id,
      score: Math.min(Math.max(score, 0), 1),
      confidence: 0.7, // Lower confidence for heuristic
      factors
    };
  }

  // Helper scoring functions
  private calculateDemographicMatch(userProfile: UserProfile, survey: SurveyOffer): number {
    let score = 1.0;

    // Age alignment
    if (survey.min_age || survey.max_age) {
      const targetAge = ((survey.min_age || 18) + (survey.max_age || 65)) / 2;
      const ageDiff = Math.abs(userProfile.age - targetAge);
      score *= Math.max(0, 1 - (ageDiff / 20)); // Penalty for age distance
    }

    // Gender match
    if (survey.gender && survey.gender.length > 0) {
      score *= survey.gender.includes(userProfile.gender) ? 1.0 : 0.3;
    }

    return score;
  }

  private calculateInterestMatch(userProfile: UserProfile, survey: SurveyOffer): number {
    if (!survey.interests || survey.interests.length === 0) return 0.7; // Neutral

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
        provider_performance: survey.completion_rate
      }
    };
  }

  // Get historical performance data
  private async getHistoricalPerformance(provider: string, _surveyId: string): Promise<Record<string, unknown>> {
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
        avgTime: completions.reduce((sum, c) => sum + c.time_spent, 0) / completions.length
      };
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return {};
    }
  }

  // Record completion feedback for AI training
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
          timestamp: feedback.timestamp
        }]);
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  }
}

// Singleton instance
export const aiSurveyMatcher = new AISurveyMatcher();