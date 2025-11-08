import { useUser } from '@clerk/clerk-react';
import { useState } from 'react';
import { Mascot } from './Mascot';

export const Home = () => {
  const { user } = useUser();
  const firstName = user?.firstName || 'Friend';

  // Hardcoded data for now
  const goalName = 'Bike';
  const goalCost = 250;
  const savedAmount = 17;
  const progress = (savedAmount / goalCost) * 100;
  const bankBalance = 1234.56;

  // Weekly savings target
  const [weeklySavingsTarget, setWeeklySavingsTarget] = useState(20);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(weeklySavingsTarget.toString());

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
              <p className="text-sm font-lexend text-[#8b6240] mb-1">Capital One Savings</p>
              <p className="text-sm font-lexend text-[#8b6240] mb-3">••••xx90</p>
              <p className="text-3xl font-rique font-bold text-[#6b4423]">${bankBalance.toFixed(2)}</p>
            </div>
          </div>

          {/* Small card */}
          <div className="bg-[#f8f3e9] rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] border-4 border-[#6b4423]">
            <h3 className="text-2xl font-rique font-bold text-[#6b4423] mb-3">Insights</h3>
            <p className="text-lg font-lexend text-[#8b6240]">0 pending</p>
          </div>

          {/* Recent Transactions - spans 2 rows */}
          <div className="bg-[#f8f3e9] rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] border-4 border-[#6b4423] lg:row-span-2">
            <h3 className="text-3xl font-rique font-bold mb-3 text-[#6b4423]">Recent Transactions</h3>
            <p className="text-lg font-lexend text-[#8b6240]">Coming soon...</p>
          </div>

          {/* Small card */}
          <div className="bg-[#f8f3e9] rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] border-4 border-[#6b4423]">
            <h3 className="text-2xl font-rique font-bold text-[#6b4423] mb-3">Alerts</h3>
            <p className="text-lg font-lexend text-[#8b6240]">All caught up</p>
          </div>

          {/* Large card - spans 2 columns */}
          <div className="bg-[#f8f3e9] rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] border-4 border-[#6b4423] lg:col-span-2">
            <h3 className="text-3xl font-rique font-bold text-[#6b4423] mb-3">Recent Activity</h3>
            <p className="text-lg font-lexend text-[#8b6240]">Nothing to show yet</p>
          </div>

          {/* Small card */}
          <div className="bg-[#f8f3e9] rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] border-4 border-[#6b4423]">
            <h3 className="text-2xl font-rique font-bold mb-3 text-[#6b4423]">Goals</h3>
            <p className="text-lg font-lexend text-[#8b6240]">Set your goals</p>
          </div>
        </div>
      </div>
    </div>
  );
};
