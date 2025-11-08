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
