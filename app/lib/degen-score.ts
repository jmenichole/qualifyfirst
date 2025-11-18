/**
 * QualifyFirst - Degen Score System
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

/**
 * Degen Score: Behavioral profiling system for better survey matching
 * 
 * Uses behavior from across the ecosystem:
 * - Late-night activity → nightlife brand surveys
 * - High tilt → behavioral surveys
 * - Prediction users → market forecasting surveys
 * - Generous tippers → fintech surveys
 */

export interface DegenScoreFactors {
  // Time-based behavior
  lateNightActivity: number;        // 0-100: activity between 10pm-4am
  sessionFrequency: number;          // 0-100: how often they log in
  
  // Financial behavior
  tippingGenerosity: number;         // 0-100: JustTheTip activity
  riskTolerance: number;             // 0-100: betting/prediction patterns
  
  // Emotional patterns
  tiltScore: number;                 // 0-100: from TiltCheck integration
  streakCommitment: number;          // 0-100: consistency in completing tasks
  
  // Engagement
  crossPlatformActivity: number;     // 0-100: activity across ecosystem
  communityParticipation: number;    // 0-100: social engagement
}

export interface DegenProfile {
  score: number;                     // Overall 0-100 degen score
  factors: DegenScoreFactors;
  archetype: DegenArchetype;
  surveyAffinities: string[];        // Types of surveys this degen matches
  lastUpdated: Date;
}

export type DegenArchetype = 
  | 'night_owl'           // Late night gamers
  | 'high_roller'         // Big spenders, risk takers
  | 'steady_eddie'        // Consistent, reliable
  | 'social_butterfly'    // High community engagement
  | 'tilt_master'         // Emotional, reactive
  | 'prediction_pro'      // Analytics minded
  | 'generous_tipper'     // Financial services affinity
  | 'degen_veteran';      // All-around degen

export class DegenScoreService {
  
  /**
   * Calculate overall degen score from behavioral factors
   */
  calculateDegenScore(factors: DegenScoreFactors): number {
    const weights = {
      lateNightActivity: 0.15,
      sessionFrequency: 0.10,
      tippingGenerosity: 0.15,
      riskTolerance: 0.15,
      tiltScore: 0.10,
      streakCommitment: 0.15,
      crossPlatformActivity: 0.15,
      communityParticipation: 0.05,
    };

    let score = 0;
    score += factors.lateNightActivity * weights.lateNightActivity;
    score += factors.sessionFrequency * weights.sessionFrequency;
    score += factors.tippingGenerosity * weights.tippingGenerosity;
    score += factors.riskTolerance * weights.riskTolerance;
    score += factors.tiltScore * weights.tiltScore;
    score += factors.streakCommitment * weights.streakCommitment;
    score += factors.crossPlatformActivity * weights.crossPlatformActivity;
    score += factors.communityParticipation * weights.communityParticipation;

    return Math.round(score);
  }

  /**
   * Determine degen archetype based on factors
   */
  determineArchetype(factors: DegenScoreFactors): DegenArchetype {
    // Night Owl: High late-night activity
    if (factors.lateNightActivity > 75) {
      return 'night_owl';
    }

    // High Roller: High risk tolerance and tipping
    if (factors.riskTolerance > 75 && factors.tippingGenerosity > 60) {
      return 'high_roller';
    }

    // Generous Tipper: High tipping, moderate risk
    if (factors.tippingGenerosity > 75) {
      return 'generous_tipper';
    }

    // Prediction Pro: High cross-platform, moderate risk tolerance
    if (factors.riskTolerance > 60 && factors.crossPlatformActivity > 70) {
      return 'prediction_pro';
    }

    // Tilt Master: High tilt score
    if (factors.tiltScore > 70) {
      return 'tilt_master';
    }

    // Social Butterfly: High community participation
    if (factors.communityParticipation > 75) {
      return 'social_butterfly';
    }

    // Steady Eddie: High streak commitment, moderate everything else
    if (factors.streakCommitment > 75) {
      return 'steady_eddie';
    }

    // Degen Veteran: High scores across the board
    const avgScore = Object.values(factors).reduce((a, b) => a + b, 0) / Object.values(factors).length;
    if (avgScore > 70) {
      return 'degen_veteran';
    }

    // Default
    return 'steady_eddie';
  }

  /**
   * Map archetypes to survey affinities
   */
  getSurveyAffinities(archetype: DegenArchetype): string[] {
    const affinities: Record<DegenArchetype, string[]> = {
      night_owl: [
        'nightlife brands',
        'entertainment',
        'food delivery',
        'gaming',
        'streaming services'
      ],
      high_roller: [
        'cryptocurrency',
        'investment services',
        'luxury brands',
        'travel',
        'premium products'
      ],
      steady_eddie: [
        'household products',
        'retail surveys',
        'consumer goods',
        'technology',
        'general market research'
      ],
      social_butterfly: [
        'social media',
        'community products',
        'events',
        'networking',
        'lifestyle brands'
      ],
      tilt_master: [
        'behavioral research',
        'psychology studies',
        'emotional products',
        'mental health',
        'stress management'
      ],
      prediction_pro: [
        'market forecasting',
        'analytics tools',
        'financial services',
        'data products',
        'business intelligence'
      ],
      generous_tipper: [
        'fintech',
        'banking',
        'payment services',
        'charitable giving',
        'financial planning'
      ],
      degen_veteran: [
        'all survey types',
        'high-value research',
        'longitudinal studies',
        'panel surveys',
        'advanced demographics'
      ]
    };

    return affinities[archetype];
  }

  /**
   * Build a complete degen profile
   */
  buildDegenProfile(factors: DegenScoreFactors): DegenProfile {
    const score = this.calculateDegenScore(factors);
    const archetype = this.determineArchetype(factors);
    const surveyAffinities = this.getSurveyAffinities(archetype);

    return {
      score,
      factors,
      archetype,
      surveyAffinities,
      lastUpdated: new Date()
    };
  }

  /**
   * Get archetype display info
   */
  getArchetypeInfo(archetype: DegenArchetype): {
    emoji: string;
    title: string;
    description: string;
  } {
    const info: Record<DegenArchetype, { emoji: string; title: string; description: string }> = {
      night_owl: {
        emoji: '🦉',
        title: 'Night Owl',
        description: 'You\'re most active after dark. Brands targeting night owls love you.'
      },
      high_roller: {
        emoji: '🎰',
        title: 'High Roller',
        description: 'Big spender, big risk taker. Premium brands want your opinion.'
      },
      steady_eddie: {
        emoji: '⭐',
        title: 'Steady Eddie',
        description: 'Consistent and reliable. The backbone of quality research.'
      },
      social_butterfly: {
        emoji: '🦋',
        title: 'Social Butterfly',
        description: 'Highly engaged in the community. Social brands need you.'
      },
      tilt_master: {
        emoji: '🌊',
        title: 'Tilt Master',
        description: 'Emotional and reactive. Behavioral researchers value your honesty.'
      },
      prediction_pro: {
        emoji: '📊',
        title: 'Prediction Pro',
        description: 'Analytics-minded. Market forecasting surveys are your jam.'
      },
      generous_tipper: {
        emoji: '💰',
        title: 'Generous Tipper',
        description: 'You share the wealth. Fintech companies want your insights.'
      },
      degen_veteran: {
        emoji: '👑',
        title: 'Degen Veteran',
        description: 'All-around degen. You qualify for everything. Legend status.'
      }
    };

    return info[archetype];
  }

  /**
   * Generate mock factors for testing (replace with real data from ecosystem)
   */
  generateMockFactors(userId: string): DegenScoreFactors {
    // In production, these would come from:
    // - TiltCheck for tilt scores
    // - JustTheTip for tipping behavior
    // - CollectClock for prediction patterns
    // - DegensAgainstDecency for gaming activity
    // - Activity logs for time patterns
    
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seed = hash % 100;

    return {
      lateNightActivity: (seed * 1.3) % 100,
      sessionFrequency: (seed * 1.7) % 100,
      tippingGenerosity: (seed * 2.1) % 100,
      riskTolerance: (seed * 1.9) % 100,
      tiltScore: (seed * 1.5) % 100,
      streakCommitment: (seed * 2.3) % 100,
      crossPlatformActivity: (seed * 1.1) % 100,
      communityParticipation: (seed * 1.8) % 100,
    };
  }
}

// Singleton instance
export const degenScoreService = new DegenScoreService();
