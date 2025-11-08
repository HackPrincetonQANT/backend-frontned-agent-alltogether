import type { OnboardingData } from '../types/index';

export const onboardingData: OnboardingData = {
  title: "Welcome to Your Journey",
  subtitle: "Let's get you set up in just a few steps",
  steps: [
    {
      id: "step-1",
      title: "Complete Your Profile",
      description: "Add a profile picture and fill in your details so others can know you better.",
      icon: "👤"
    },
    {
      id: "step-2",
      title: "Explore Features",
      description: "Discover all the powerful tools and features available in your dashboard.",
      icon: "🚀"
    },
    {
      id: "step-3",
      title: "Connect Integrations",
      description: "Connect your favorite tools and services to streamline your workflow.",
      icon: "🔗"
    },
    {
      id: "step-4",
      title: "Invite Your Team",
      description: "Bring your team on board and start collaborating together.",
      icon: "👥"
    }
  ],
  ctaText: "Get Started",
  ctaLink: "/dashboard"
};
