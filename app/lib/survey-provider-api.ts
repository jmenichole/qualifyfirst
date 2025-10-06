'use client';

// Survey Provider API Integration
// Supports multiple survey networks (BitLabs, CPX Research, etc.)

export interface SurveyOffer {
  id: string;
  provider: string;
  title: string;
  description: string;
  reward: number;
  estimated_time: number;
  completion_rate: number;
  click_url: string;
  
  // Targeting criteria
  country?: string[];
  min_age?: number;
  max_age?: number;
  gender?: string[];
  device?: string[];
  interests?: string[];
  
  // Provider-specific metadata
  provider_data?: Record<string, any>;
}

export interface UserProfile {
  age: number;
  gender: string;
  country: string;
  device: string;
  interests: string[];
  employment: string;
  income_range: string;
  completion_history: {
    total_attempts: number;
    completed: number;
    completion_rate: number;
    avg_survey_time: number;
  };
}

export class SurveyProviderAPI {
  private providers: Map<string, ProviderConfig> = new Map();

  constructor() {
    // Initialize survey provider configurations
    this.setupProviders();
  }

  private setupProviders() {
    // BitLabs Configuration
    this.providers.set('bitlabs', {
      name: 'BitLabs',
      apiUrl: 'https://api.bitlabs.ai/v1',
      apiKey: process.env.BITLABS_API_KEY || '',
      endpoints: {
        offers: '/offers',
        clicks: '/clicks',
        conversions: '/conversions'
      },
      requiredFields: ['user_id', 'country', 'age', 'gender']
    });

    // CPX Research Configuration  
    this.providers.set('cpx', {
      name: 'CPX Research',
      apiUrl: 'https://api.cpxresearch.com/v1',
      apiKey: process.env.CPX_API_KEY || '',
      endpoints: {
        offers: '/surveys',
        clicks: '/click',
        conversions: '/postback'
      },
      requiredFields: ['user_id', 'country']
    });

    // Add more providers as needed
  }

  // Get available surveys from all providers
  async getAvailableSurveys(userProfile: UserProfile, userId: string): Promise<SurveyOffer[]> {
    const allOffers: SurveyOffer[] = [];

    // Fetch from each active provider
    for (const [providerId, config] of this.providers) {
      if (!config.apiKey) continue;

      try {
        const offers = await this.fetchProviderOffers(providerId, config, userProfile, userId);
        allOffers.push(...offers);
      } catch (error) {
        console.error(`Error fetching from ${providerId}:`, error);
        // Continue with other providers
      }
    }

    return allOffers;
  }

  // Fetch offers from specific provider
  private async fetchProviderOffers(
    providerId: string,
    config: ProviderConfig,
    userProfile: UserProfile,
    userId: string
  ): Promise<SurveyOffer[]> {
    
    switch (providerId) {
      case 'bitlabs':
        return this.fetchBitLabsOffers(config, userProfile, userId);
      case 'cpx':
        return this.fetchCPXOffers(config, userProfile, userId);
      default:
        return [];
    }
  }

  // BitLabs specific implementation
  private async fetchBitLabsOffers(config: ProviderConfig, userProfile: UserProfile, userId: string): Promise<SurveyOffer[]> {
    const params = new URLSearchParams({
      user_id: userId,
      country: userProfile.country,
      age: userProfile.age.toString(),
      gender: userProfile.gender.toLowerCase(),
      device: userProfile.device
    });

    const response = await fetch(`${config.apiUrl}${config.endpoints.offers}?${params}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`BitLabs API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.offers?.map((offer: any) => ({
      id: `bitlabs_${offer.id}`,
      provider: 'bitlabs',
      title: offer.title || 'Survey Opportunity',
      description: offer.description || 'Complete this survey to earn rewards',
      reward: offer.reward || 0,
      estimated_time: offer.estimated_time || 10,
      completion_rate: offer.completion_rate || 0.5,
      click_url: offer.click_url,
      country: offer.country ? [offer.country] : undefined,
      min_age: offer.min_age,
      max_age: offer.max_age,
      gender: offer.gender ? [offer.gender] : undefined,
      device: offer.device ? [offer.device] : undefined,
      provider_data: offer
    })) || [];
  }

  // CPX Research specific implementation
  private async fetchCPXOffers(config: ProviderConfig, userProfile: UserProfile, userId: string): Promise<SurveyOffer[]> {
    const params = new URLSearchParams({
      user_id: userId,
      country: userProfile.country,
      age: userProfile.age.toString(),
      gender: userProfile.gender
    });

    const response = await fetch(`${config.apiUrl}${config.endpoints.offers}?${params}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`CPX API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.surveys?.map((survey: any) => ({
      id: `cpx_${survey.id}`,
      provider: 'cpx',
      title: survey.title || 'Research Survey',
      description: survey.description || 'Share your opinions and earn rewards',
      reward: survey.payout || 0,
      estimated_time: survey.length_of_interview || 15,
      completion_rate: survey.conversion_rate || 0.4,
      click_url: survey.survey_url,
      country: survey.country_codes,
      min_age: survey.min_age,
      max_age: survey.max_age,
      gender: survey.gender_codes,
      provider_data: survey
    })) || [];
  }

  // Track survey click for provider
  async trackSurveyClick(surveyId: string, userId: string): Promise<boolean> {
    const [providerId] = surveyId.split('_');
    const config = this.providers.get(providerId);
    
    if (!config) return false;

    try {
      const response = await fetch(`${config.apiUrl}${config.endpoints.clicks}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          survey_id: surveyId.replace(`${providerId}_`, ''),
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.error(`Error tracking click for ${providerId}:`, error);
      return false;
    }
  }
}

interface ProviderConfig {
  name: string;
  apiUrl: string;
  apiKey: string;
  endpoints: {
    offers: string;
    clicks: string;
    conversions: string;
  };
  requiredFields: string[];
}

// Singleton instance
export const surveyProviderAPI = new SurveyProviderAPI();