import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useState } from 'react';
import { Onboarding } from './components/onboarding';
import { Navbar, Home, Transactions, Insights } from './components/common';
import { useOnboarding } from './hooks';

export default function App() {
  const { shouldShowOnboarding, isLoading } = useOnboarding();
  const [activeView, setActiveView] = useState<'home' | 'transactions' | 'insights'>('home');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <div className="w-16 h-16 border-4 border-[#6b4423] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
          <div className="text-center space-y-8 bg-[#f8f3e9] p-12 rounded-3xl border-4 border-[#6b4423] shadow-xl">
            <h1 className="text-7xl font-rique font-bold text-[#6b4423]">
              Piggy Bank
            </h1>
            <p className="text-xl font-lexend text-[#8b6240]">Your smart savings companion</p>
            <SignInButton>
              <button className="px-10 py-4 bg-[#6b4423] text-[#fdfbf7] font-lexend font-bold text-lg rounded-xl border-4 border-[#5a3a1f] hover:bg-[#5a3a1f] hover:shadow-2xl transition-all hover:scale-105">
                Get Started
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {shouldShowOnboarding ? (
          <Onboarding />
        ) : (
          <>
            <Navbar activeView={activeView} setActiveView={setActiveView} />
            {activeView === 'home' && <Home />}
            {activeView === 'transactions' && <Transactions />}
            {activeView === 'insights' && <Insights />}
          </>
        )}
      </SignedIn>
    </>
  );
}