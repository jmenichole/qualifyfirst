// Database Types
export interface UserProfile {
  id: number;
  user_id: string;
  email: string;
  created_at: string;
  updated_at: string;
  
  // Demographics
  age?: string;
  gender?: string;
  location?: string;
  employment?: string;
  income?: string;
  education?: string;
  household_size?: string;
  
  // Technology & Media
  smartphone?: string;
  social_media?: string[];
  streaming?: string[];
  
  // Shopping & Consumer Behavior
  shopping_frequency?: string;
  shopping_platforms?: string[];
  purchase_influence?: string;
  
  // Lifestyle & Interests
  hobbies?: string[];
  exercise?: string;
  dietary?: string;
  
  // Health & Wellness
  health_concerns?: string[];
  
  // Financial
  financial_products?: string[];
  
  // Automotive
  vehicle?: string;
  
  // Travel
  travel_frequency?: string;
}

export interface Survey {
  id: number;
  title: string;
  provider: string;
  payout: number;
  estimated_time: number;
  description: string;
  affiliate_url: string;
  min_age?: number;
  max_age?: number;
  required_gender?: string[];
  required_countries?: string[];
  required_employment?: string[];
  required_income_min?: string;
  required_hobbies?: string[];
  active: boolean;
  clicks: number;
  created_at: string;
  updated_at: string;
}

export interface SurveyClick {
  id: number;
  survey_id: number;
  profile_id: number;
  clicked_at: string;
}

// API Response Types
export interface SupabaseResponse<T> {
  data: T | null;
  error: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number | null;
  error: any;
}

// Form Types
export interface ProfileFormData {
  email: string;
  [key: string]: string | string[];
}

export interface LoginFormData {
  email: string;
}

// Component Props Types
export interface QuestionProps {
  id: string;
  question: string;
  type: 'select' | 'multiselect' | 'text';
  options?: string[];
  placeholder?: string;
  category: string;
}

export interface ProfileAnswer {
  [key: string]: string | string[];
}

// Auth Types
export interface AuthUser {
  id: string;
  email?: string;
  created_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

// Matching Algorithm Types
export interface MatchingCriteria {
  age?: { min?: number; max?: number };
  gender?: string[];
  countries?: string[];
  employment?: string[];
  income?: string;
  hobbies?: string[];
}

export interface MatchedSurveysResponse {
  surveys: Survey[];
  profile: UserProfile;
  matchCount: number;
  totalSurveys: number;
}

// Analytics Types
export interface AnalyticsEvent {
  event_name: string;
  user_id?: string;
  profile_id?: number;
  survey_id?: number;
  properties?: Record<string, any>;
  timestamp: string;
}

export interface ConversionMetrics {
  profilesCreated: number;
  surveysClicked: number;
  conversionRate: number;
  averagePayout: number;
}