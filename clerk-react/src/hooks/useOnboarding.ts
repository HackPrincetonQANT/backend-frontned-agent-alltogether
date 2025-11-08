import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

export const useOnboarding = () => {
  const { user, isLoaded } = useUser();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) {
      setIsLoading(false);
      return;
    }

    // Check user metadata for servicesConnected and goalsSet
    const metadata = user.unsafeMetadata as { servicesConnected?: number; goalsSet?: number };
    const servicesConnected = metadata?.servicesConnected ?? 0;
    const goalsSet = metadata?.goalsSet ?? 0;

    // Show onboarding if both are 0
    setShouldShowOnboarding(servicesConnected === 0 && goalsSet === 0);
    setIsLoading(false);
  }, [user, isLoaded]);

  return {
    shouldShowOnboarding,
    isLoading,
  };
};
