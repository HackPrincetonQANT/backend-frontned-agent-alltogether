export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export interface OnboardingData {
  title: string;
  subtitle: string;
  steps: OnboardingStep[];
  ctaText: string;
  ctaLink?: string;
}

export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isNew?: boolean;
}

// Backend API Types
export interface Transaction {
  id: string;
  item: string;
  amount: number;
  date: string;  // ISO8601 timestamp
  category: string;
}

export interface Prediction {
  item: string;
  category: string;
  next_time: string;  // ISO8601 timestamp
  confidence: number;
  samples: number;
}
