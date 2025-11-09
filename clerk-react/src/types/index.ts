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
  confidence: number;
  category: string;
  next_time: string;
  samples: number;
}

export interface SmartTip {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  savings: number;
  action: string;
  category: string;
}

export interface BetterDeal {
  current_store: string;
  current_spending: number;
  alternative_store: string;
  emoji: string;
  savings_percent: number;
  monthly_savings: number;
  purchase_count: number;
  category: string;
  all_alternatives: Array<{
    name: string;
    price_diff: number;
    emoji: string;
  }>;
}

