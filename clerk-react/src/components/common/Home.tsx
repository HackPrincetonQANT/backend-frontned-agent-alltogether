import { useUser } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { Mascot } from './Mascot';
import { fetchAccountBalance, fetchAIDeals, type AccountBalance } from '../../services';

export const Home = () => {
  const { user } = useUser();
  const firstName = user?.firstName || 'Friend';

  // Hardcoded data for now
  const goalName = 'Bike';
  const goalCost = 250;
  const savedAmount = 17;
  const progress = (savedAmount / goalCost) * 100;

  // State for bank account data
  const [accountData, setAccountData] = useState<AccountBalance | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);

  // State for AI deals
  const [aiDeals, setAIDeals] = useState<Array<{
    title: string;
    subtitle: string;
    description: string;
    savings: number;
    category: string;
    cta: string;
    icon: string;
  }>>([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(true);

  // Weekly savings target
  const [weeklySavingsTarget, setWeeklySavingsTarget] = useState(20);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(weeklySavingsTarget.toString());

  // Fetch account balance and AI deals on component mount
  useEffect(() => {
    const loadAccountBalance = async () => {
      try {
        setIsLoadingAccount(true);
        setAccountError(null);
        const balance = await fetchAccountBalance();
        setAccountData(balance);
      } catch (error) {
        console.error('Failed to load account balance:', error);
        setAccountError(error instanceof Error ? error.message : 'Failed to load account balance');
      } finally {
        setIsLoadingAccount(false);
      }
    };

    const loadAIDeals = async () => {
      try {
        setIsLoadingDeals(true);
        const deals = await fetchAIDeals('u_demo_min', 10);
        setAIDeals(deals);
      } catch (error) {
        console.error('Failed to load AI deals:', error);
      } finally {
        setIsLoadingDeals(false);
      }
    };

    loadAccountBalance();
    loadAIDeals();
  }, []);

  const handleEditTarget = () => {
    setIsEditingTarget(true);
    setTempTarget(weeklySavingsTarget.toString());
  };

  const handleSaveTarget = () => {
    const newTarget = parseFloat(tempTarget);
    if (!isNaN(newTarget) && newTarget > 0) {
      setWeeklySavingsTarget(newTarget);
    }
    setIsEditingTarget(false);
  };

  const handleCancelEdit = () => {
    setIsEditingTarget(false);
    setTempTarget(weeklySavingsTarget.toString());
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[200px]">
          {/* Large card - spans 2 columns */}
          <div className="bg-[#f8f3e9] rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] border-4 border-[#6b4423] lg:col-span-2 lg:row-span-2">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h2 className="text-4xl font-rique font-bold text-[#6b4423] mb-4">Welcome Back, {firstName}</h2>
                <p className="text-xl font-lexend text-[#8b6240] mb-6">Your dashboard is ready. Let's crush those savings goals</p>
              </div>
              <Mascot happiness={100} />
            </div>
            
            {/* Goal Progress */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-rique font-bold text-[#6b4423]">{goalName}</h3>
                <span className="text-lg font-lexend font-bold text-[#6b4423]">${savedAmount} / ${goalCost}</span>
              </div>
              <div className="bg-[#f3ecd8] h-6 rounded-full border-4 border-[#6b4423]">
                <div 
                  className="bg-[#6b4423] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm font-lexend text-[#8b6240] mt-2">{Math.round(progress)}% complete</p>

              {/* Weekly Savings Target */}
              <div className="mt-6 bg-[#fdfbf7] rounded-2xl p-4 border-4 border-[#6b4423]">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="text-sm font-lexend text-[#8b6240] mb-1">Weekly Savings Target</p>
                    {isEditingTarget ? (
                      <div className="flex gap-2 items-center">
                        <span className="text-xl font-rique font-bold text-[#6b4423]">$</span>
                        <input
                          type="number"
                          value={tempTarget}
                          onChange={(e) => setTempTarget(e.target.value)}
                          className="w-24 px-3 py-1 text-xl font-rique font-bold text-[#6b4423] bg-[#f3ecd8] border-2 border-[#6b4423] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423]"
                          autoFocus
                        />
                        <span className="text-lg font-lexend text-[#8b6240]">/week</span>
                      </div>
                    ) : (
                      <p className="text-2xl font-rique font-bold text-[#6b4423]">
                        ${weeklySavingsTarget}/week
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isEditingTarget ? (
                      <>
                        <button
                          onClick={handleSaveTarget}
                          className="px-4 py-2 bg-[#6b4423] text-[#fdfbf7] font-lexend font-bold text-sm rounded-lg border-2 border-[#5a3a1f] hover:bg-[#5a3a1f] transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-[#f3ecd8] text-[#6b4423] font-lexend font-bold text-sm rounded-lg border-2 border-[#6b4423] hover:bg-[#f8f3e9] transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleEditTarget}
                        className="px-4 py-2 bg-[#6b4423] text-[#fdfbf7] font-lexend font-bold text-sm rounded-lg border-2 border-[#5a3a1f] hover:bg-[#5a3a1f] transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Balance Card */}
          <div className="bg-[#f8f3e9] rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] border-4 border-[#6b4423]">
            <h3 className="text-2xl font-rique font-bold mb-3 text-[#6b4423]">Bank Balance</h3>
            <div className="mt-4">
              {isLoadingAccount ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-8 h-8 border-4 border-[#6b4423] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : accountError ? (
                <div className="text-red-600 text-sm font-lexend">
                  <p className="mb-2">⚠️ {accountError}</p>
                  <p className="text-xs text-[#8b6240]">Check your .env.local file</p>
                </div>
              ) : accountData ? (
                <>
                  <p className="text-sm font-lexend text-[#8b6240] mb-1">{accountData.nickname || 'Capital One Savings'}</p>
                  <p className="text-sm font-lexend text-[#8b6240] mb-3">
                    ••••{accountData.accountNumber.slice(-4)}
                  </p>
                  <p className="text-3xl font-rique font-bold text-[#6b4423]">
                    ${accountData.balance.toFixed(2)}
                  </p>
                </>
              ) : (
                <p className="text-sm font-lexend text-[#8b6240]">No account data available</p>
              )}
            </div>
          </div>

          {/* Deals for You Section */}
          <div className="lg:col-span-3 bg-[#f8f3e9] rounded-3xl p-8 shadow-xl border-4 border-[#6b4423]">
            <div className="mb-6">
              <h2 className="text-3xl font-rique font-bold text-[#6b4423]">Deals for You</h2>
              <p className="text-sm font-lexend text-[#8b6240]">Personalized based on your spending</p>
            </div>

            {isLoadingDeals ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-[#6b4423] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : aiDeals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {aiDeals.map((deal, index) => (
                  <div
                    key={index}
                    className="bg-[#fdfbf7] rounded-2xl p-6 border-4 border-[#6b4423] hover:shadow-xl transition-all hover:scale-[1.02]"
                  >
                    <h3 className="text-xl font-rique font-bold text-[#6b4423] mb-2 leading-tight">{deal.title}</h3>
                    <p className="text-sm font-lexend text-[#8b6240] font-semibold mb-3">{deal.subtitle}</p>
                    <p className="text-sm font-lexend text-[#6b4423] mb-4 leading-relaxed min-h-[60px]">{deal.description}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="bg-green-600 text-white px-3 py-2 rounded-lg font-lexend font-bold text-sm shadow-md">
                        Save ${deal.savings}/mo
                      </div>
                      <button className="px-4 py-2 bg-[#6b4423] text-[#fdfbf7] font-lexend font-bold text-sm rounded-lg hover:bg-[#5a3a1f] transition-colors shadow-md border-2 border-[#5a3a1f]">
                        {deal.cta}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg font-lexend text-[#8b6240]">No deals available right now</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
