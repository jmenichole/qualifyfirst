import { supabase } from '../supabase';

export interface Survey {
  id: number;
  title: string;
  provider: string;
  payout: number;
  estimated_time: number;
  description: string;
  affiliate_url: string;
  min_age: number | null;
  max_age: number | null;
  required_gender: string[] | null;
  required_countries: string[] | null;
  required_employment: string[] | null;
  required_income_min: string | null;
  required_hobbies: string[] | null;
  active: boolean;
  clicks: number;
}

export interface UserProfile {
  age: string;
  gender: string;
  location: string;
  employment: string;
  income: string;
  hobbies: string[];
  [key: string]: string | string[] | undefined;
}

// Convert age range to number for comparison
function getAgeFromRange(ageRange: string): number {
  const ranges: { [key: string]: number } = {
    '18-24': 21,
    '25-34': 30,
    '35-44': 40,
    '45-54': 50,
    '55-64': 60,
    '65+': 70
  };
  return ranges[ageRange] || 25;
}

// Check if user matches survey requirements
export function matchesSurvey(profile: UserProfile, survey: Survey): boolean {
  // Age check
  if (survey.min_age || survey.max_age) {
    const userAge = getAgeFromRange(profile.age);
    if (survey.min_age && userAge < survey.min_age) return false;
    if (survey.max_age && userAge > survey.max_age) return false;
  }

  // Gender check
  if (survey.required_gender && survey.required_gender.length > 0) {
    if (!survey.required_gender.includes(profile.gender)) return false;
  }

  // Country check
  if (survey.required_countries && survey.required_countries.length > 0) {
    const matches = survey.required_countries.some(country => 
      profile.location.toLowerCase().includes(country.toLowerCase())
    );
    if (!matches) return false;
  }

  // Employment check
  if (survey.required_employment && survey.required_employment.length > 0) {
    if (!survey.required_employment.includes(profile.employment)) return false;
  }

  // Hobbies check (at least one match)
  if (survey.required_hobbies && survey.required_hobbies.length > 0) {
    const userHobbies = profile.hobbies || [];
    const hasMatch = survey.required_hobbies.some(hobby => 
      userHobbies.includes(hobby)
    );
    if (!hasMatch) return false;
  }

  return true;
}

// Get matched surveys for a user profile
export async function getMatchedSurveys(profileId: number): Promise<{ 
  surveys: Survey[], 
  profile: UserProfile,
  matchCount: number,
  totalSurveys: number 
}> {
  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (profileError || !profile) {
    throw new Error('Profile not found');
  }

  // Get all active surveys
  const { data: allSurveys, error: surveysError } = await supabase
    .from('surveys')
    .select('*')
    .eq('active', true)
    .order('payout', { ascending: false });

  if (surveysError || !allSurveys) {
    throw new Error('Failed to load surveys');
  }

  // Filter surveys that match user profile
  const matchedSurveys = allSurveys.filter(survey => 
    matchesSurvey(profile as UserProfile, survey as Survey)
  );

  return {
    surveys: matchedSurveys as Survey[],
    profile: profile as UserProfile,
    matchCount: matchedSurveys.length,
    totalSurveys: allSurveys.length
  };
}

// Track survey click
export async function trackSurveyClick(surveyId: number, profileId: number) {
  // Increment click count
  await supabase.rpc('increment_survey_clicks', { survey_id: surveyId });

  // Log the click (optional - for analytics later)
  await supabase
    .from('survey_clicks')
    .insert([{ 
      survey_id: surveyId, 
      profile_id: profileId,
      clicked_at: new Date().toISOString()
    }]);
}