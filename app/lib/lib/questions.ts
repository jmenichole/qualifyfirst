export const profileQuestions = [
  // Demographics
  {
    id: 'age',
    question: 'What is your age?',
    type: 'select',
    options: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
    category: 'demographics'
  },
  {
    id: 'gender',
    question: 'What is your gender?',
    type: 'select',
    options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
    category: 'demographics'
  },
  {
    id: 'location',
    question: 'What is your location? (Country)',
    type: 'text',
    placeholder: 'e.g., United States',
    category: 'demographics'
  },
  {
    id: 'employment',
    question: 'What is your employment status?',
    type: 'select',
    options: ['Full-time employed', 'Part-time employed', 'Self-employed', 'Unemployed', 'Student', 'Retired'],
    category: 'demographics'
  },
  {
    id: 'income',
    question: 'What is your annual household income?',
    type: 'select',
    options: ['Under $25k', '$25k-$50k', '$50k-$75k', '$75k-$100k', '$100k-$150k', 'Over $150k', 'Prefer not to say'],
    category: 'demographics'
  },
  {
    id: 'education',
    question: 'What is your highest level of education?',
    type: 'select',
    options: ['High school or less', 'Some college', 'Associate degree', 'Bachelor\'s degree', 'Master\'s degree', 'Doctorate or higher'],
    category: 'demographics'
  },
  {
    id: 'household_size',
    question: 'How many people live in your household?',
    type: 'select',
    options: ['1', '2', '3', '4', '5+'],
    category: 'demographics'
  },
  
  // Technology & Media
  {
    id: 'smartphone',
    question: 'What type of smartphone do you use?',
    type: 'select',
    options: ['iPhone', 'Android', 'Other', 'I don\'t use a smartphone'],
    category: 'technology'
  },
  {
    id: 'social_media',
    question: 'Which social media platforms do you use regularly? (Select all)',
    type: 'multiselect',
    options: ['Facebook', 'Instagram', 'Twitter/X', 'TikTok', 'LinkedIn', 'Reddit', 'Snapchat', 'None'],
    category: 'technology'
  },
  {
    id: 'streaming',
    question: 'Which streaming services do you subscribe to? (Select all)',
    type: 'multiselect',
    options: ['Netflix', 'Hulu', 'Disney+', 'Amazon Prime', 'HBO Max', 'YouTube Premium', 'Spotify', 'Apple Music', 'None'],
    category: 'technology'
  },
  
  // Shopping & Consumer Behavior
  {
    id: 'shopping_frequency',
    question: 'How often do you shop online?',
    type: 'select',
    options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never'],
    category: 'consumer'
  },
  {
    id: 'shopping_platforms',
    question: 'Where do you shop online most? (Select all)',
    type: 'multiselect',
    options: ['Amazon', 'Walmart', 'Target', 'eBay', 'Etsy', 'Local retailers', 'Other'],
    category: 'consumer'
  },
  {
    id: 'purchase_influence',
    question: 'What influences your purchase decisions most?',
    type: 'select',
    options: ['Price', 'Brand reputation', 'Reviews', 'Recommendations', 'Quality', 'Convenience'],
    category: 'consumer'
  },
  
  // Lifestyle & Interests
  {
    id: 'hobbies',
    question: 'What are your main hobbies/interests? (Select all)',
    type: 'multiselect',
    options: ['Gaming', 'Sports', 'Cooking', 'Travel', 'Reading', 'Music', 'Art', 'Fitness', 'Technology', 'Gardening'],
    category: 'lifestyle'
  },
  {
    id: 'exercise',
    question: 'How often do you exercise?',
    type: 'select',
    options: ['Daily', '3-5 times per week', '1-2 times per week', 'Rarely', 'Never'],
    category: 'lifestyle'
  },
  {
    id: 'dietary',
    question: 'Do you follow any special diet?',
    type: 'select',
    options: ['None', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Gluten-free', 'Other'],
    category: 'lifestyle'
  },
  
  // Health & Wellness
  {
    id: 'health_concerns',
    question: 'Are you interested in health/wellness topics? (Select all)',
    type: 'multiselect',
    options: ['Mental health', 'Fitness', 'Nutrition', 'Sleep', 'Weight management', 'Chronic conditions', 'None'],
    category: 'health'
  },
  
  // Financial
  {
    id: 'financial_products',
    question: 'Which financial products do you use? (Select all)',
    type: 'multiselect',
    options: ['Credit cards', 'Savings account', 'Investment account', 'Mortgage', 'Auto loan', 'Cryptocurrency', 'None'],
    category: 'financial'
  },
  
  // Automotive
  {
    id: 'vehicle',
    question: 'Do you own or lease a vehicle?',
    type: 'select',
    options: ['Own', 'Lease', 'No vehicle', 'Planning to buy/lease soon'],
    category: 'automotive'
  },
  
  // Travel
  {
    id: 'travel_frequency',
    question: 'How often do you travel for leisure?',
    type: 'select',
    options: ['Multiple times per year', 'Once per year', 'Every few years', 'Rarely', 'Never'],
    category: 'travel'
  }
];

export type ProfileAnswer = {
  [key: string]: string | string[];
};