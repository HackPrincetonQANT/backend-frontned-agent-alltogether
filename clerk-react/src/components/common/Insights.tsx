import { useState, useEffect } from 'react';
import { fetchUserTransactions } from '../../services';
import type { Transaction } from '../../types';

export const Insights = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // TODO: Replace with actual user ID from Clerk
  const userId = 'u_demo_min';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchUserTransactions(userId, 100); // Get more data for insights
        setTransactions(data);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  // Calculate category spending from real data
  const categorySpending = transactions.reduce((acc, transaction) => {
    const category = transaction.category || 'Other';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalSpent = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0);
  
  // Define colors for categories
  const categoryColors: Record<string, string> = {
    'Coffee': '#8B4513',
    'Groceries': '#4ECDC4',
    'Transport': '#45B7D1',
    'Food': '#FF6B6B',
    'Entertainment': '#96CEB4',
    'Shopping': '#DDA15E',
    'Other': '#B8B8B8'
  };

  const categorySpendingArray = Object.entries(categorySpending).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    color: categoryColors[category] || '#B8B8B8'
  })).sort((a, b) => b.amount - a.amount);

  const streakDays = 12;
  const goalCost = 250;
  const savedAmount = 167; // Calculate from actual savings data
  const weeklySavingsTarget = 20;
  
  // Calculate weeks to goal
  const remainingAmount = goalCost - savedAmount;
  const weeksToGoal = Math.ceil(remainingAmount / weeklySavingsTarget);

  // Streak visualization
  const weeksInStreak = Math.floor(streakDays / 7);
  const daysInCurrentWeek = streakDays % 7;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-rique font-bold text-[#6b4423] mb-8">Insights</h1>
          <div className="flex items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-[#6b4423] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-rique font-bold text-[#6b4423] mb-8">
          Insights
        </h1>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Spending Pie Chart */}
          <div className="bg-[#f8f3e9] rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] border-4 border-[#6b4423]">
            <h3 className="text-xl font-rique font-bold text-[#6b4423] mb-4">Spending Breakdown</h3>
            <div className="flex items-center justify-center mb-4">
              <svg width="180" height="180" viewBox="0 0 120 120" className="transform -rotate-90">
                {categorySpendingArray.map((item, index) => {
                  const previousPercentages = categorySpendingArray.slice(0, index).reduce((sum, cat) => sum + cat.percentage, 0);
                  const startAngle = (previousPercentages / 100) * 360;
                  const endAngle = ((previousPercentages + item.percentage) / 100) * 360;
                  
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  
                  const x1 = 60 + 50 * Math.cos(startRad);
                  const y1 = 60 + 50 * Math.sin(startRad);
                  const x2 = 60 + 50 * Math.cos(endRad);
                  const y2 = 60 + 50 * Math.sin(endRad);
                  
                  const largeArc = item.percentage > 50 ? 1 : 0;
                  
                  return (
                    <g key={item.category}>
                      <path
                        d={`M 60 60 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={item.color}
                        stroke="#6b4423"
                        strokeWidth="2"
                        className="transition-opacity hover:opacity-80 cursor-pointer"
                      >
                        <title>{item.category}: ${item.amount.toFixed(2)} ({item.percentage.toFixed(1)}%)</title>
                      </path>
                    </g>
                  );
                })}
              </svg>
            </div>
            {/* Category Legend */}
            <div className="space-y-2">
              {categorySpendingArray.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border-2 border-[#6b4423]"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-lexend text-[#6b4423]">{item.category}</span>
                  </div>
                  <span className="text-sm font-lexend font-bold text-[#6b4423]">
                    ${item.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Streak */}
          <div className="bg-[#f8f3e9] rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] border-4 border-[#6b4423]">
            <h3 className="text-xl font-rique font-bold text-[#6b4423] mb-2">Savings Streak</h3>
            <p className="text-4xl font-rique font-bold text-[#6b4423]">{streakDays} days</p>
            <p className="text-sm font-lexend text-[#8b6240] mb-4">Keep it up!</p>
            
            {/* Streak Progress Visualization */}
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: weeksInStreak }).map((_, i) => (
                <span key={`fire-${i}`} className="text-2xl">🔥</span>
              ))}
              {daysInCurrentWeek > 0 && (
                <span className="text-2xl">⭕</span>
              )}
            </div>
          </div>

          {/* Goal Progress with Weeks to Goal */}
          <div className="bg-[#f8f3e9] rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] border-4 border-[#6b4423]">
            <h3 className="text-xl font-rique font-bold text-[#6b4423] mb-2">Goal Progress</h3>
            <p className="text-4xl font-rique font-bold text-[#6b4423]">${savedAmount}</p>
            <p className="text-sm font-lexend text-[#8b6240] mb-1">saved of ${goalCost}</p>
            <div className="w-full bg-[#fdfbf7] rounded-full h-3 mb-3 border-2 border-[#6b4423]">
              <div 
                className="bg-green-500 h-full rounded-full transition-all"
                style={{ width: `${(savedAmount / goalCost) * 100}%` }}
              />
            </div>
            <div className="bg-[#fdfbf7] rounded-lg p-3 border-2 border-[#6b4423]">
              <p className="text-xs font-lexend text-[#8b6240] mb-1">At ${weeklySavingsTarget}/week:</p>
              <p className="text-lg font-rique font-bold text-[#6b4423]">{weeksToGoal} weeks to goal</p>
              <p className="text-xs font-lexend text-[#8b6240] mt-1">${remainingAmount.toFixed(2)} remaining</p>
            </div>
          </div>
        </div>

        {/* Piggy Tips Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Piggy Tips (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="bg-[#f8f3e9] rounded-3xl p-8 shadow-xl border-4 border-[#6b4423]">
              <h2 className="text-3xl font-rique font-bold text-[#6b4423] mb-2">🐷 Piggy Tips</h2>
              <p className="text-sm font-lexend text-[#8b6240] mb-6 italic">
                Don't worry, Piggy will remind you!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Netflix Tip */}
                <div className="bg-[#fdfbf7] rounded-2xl p-5 border-4 border-[#6b4423] hover:bg-[#f3ecd8] transition-all hover:scale-[1.02]">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">📺</span>
                    <div>
                      <h3 className="text-lg font-rique font-bold text-[#6b4423]">Netflix Usage Low</h3>
                      <p className="text-xs font-lexend text-[#8b6240] mt-1">Only 2 episodes this month</p>
                    </div>
                  </div>
                  <p className="text-sm font-lexend text-[#8b6240] mb-3">
                    You've barely used Netflix. Consider canceling next month and saving $15.99.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-rique font-bold text-green-600">Save $16/mo</span>
                    <button className="px-3 py-1 bg-[#6b4423] text-[#fdfbf7] font-lexend text-xs rounded-lg border-2 border-[#5a3a1f] hover:bg-[#5a3a1f] transition-colors">
                      Review
                    </button>
                  </div>
                </div>

                {/* Coffee Tip */}
                <div className="bg-[#fdfbf7] rounded-2xl p-5 border-4 border-[#6b4423] hover:bg-[#f3ecd8] transition-all hover:scale-[1.02]">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">☕</span>
                    <div>
                      <h3 className="text-lg font-rique font-bold text-[#6b4423]">Daily Starbucks</h3>
                      <p className="text-xs font-lexend text-[#8b6240] mt-1">$5.50 × 22 days = $121/mo</p>
                    </div>
                  </div>
                  <p className="text-sm font-lexend text-[#8b6240] mb-3">
                    Try Dunkin' or make coffee at home. Could save $80+ per month!
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-rique font-bold text-green-600">Save $80/mo</span>
                    <button className="px-3 py-1 bg-[#6b4423] text-[#fdfbf7] font-lexend text-xs rounded-lg border-2 border-[#5a3a1f] hover:bg-[#5a3a1f] transition-colors">
                      Explore
                    </button>
                  </div>
                </div>

                {/* Gym Membership Tip */}
                <div className="bg-[#fdfbf7] rounded-2xl p-5 border-4 border-[#6b4423] hover:bg-[#f3ecd8] transition-all hover:scale-[1.02]">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">💪</span>
                    <div>
                      <h3 className="text-lg font-rique font-bold text-[#6b4423]">Gym Check-ins</h3>
                      <p className="text-xs font-lexend text-[#8b6240] mt-1">Only 4 visits this month</p>
                    </div>
                  </div>
                  <p className="text-sm font-lexend text-[#8b6240] mb-3">
                    You're paying $50/month but barely going. Consider a cheaper plan or home workouts.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-rique font-bold text-green-600">Save $35/mo</span>
                    <button className="px-3 py-1 bg-[#6b4423] text-[#fdfbf7] font-lexend text-xs rounded-lg border-2 border-[#5a3a1f] hover:bg-[#5a3a1f] transition-colors">
                      Review
                    </button>
                  </div>
                </div>

                {/* Subscription Bundling */}
                <div className="bg-[#fdfbf7] rounded-2xl p-5 border-4 border-[#6b4423] hover:bg-[#f3ecd8] transition-all hover:scale-[1.02]">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">📱</span>
                    <div>
                      <h3 className="text-lg font-rique font-bold text-[#6b4423]">Multiple Subscriptions</h3>
                      <p className="text-xs font-lexend text-[#8b6240] mt-1">5 music/video services</p>
                    </div>
                  </div>
                  <p className="text-sm font-lexend text-[#8b6240] mb-3">
                    Bundle Spotify & Hulu for $10.99 instead of paying separately ($25.98).
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-rique font-bold text-green-600">Save $15/mo</span>
                    <button className="px-3 py-1 bg-[#6b4423] text-[#fdfbf7] font-lexend text-xs rounded-lg border-2 border-[#5a3a1f] hover:bg-[#5a3a1f] transition-colors">
                      Bundle
                    </button>
                  </div>
                </div>

                {/* Lunch Spending */}
                <div className="bg-[#fdfbf7] rounded-2xl p-5 border-4 border-[#6b4423] hover:bg-[#f3ecd8] transition-all hover:scale-[1.02]">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">🍱</span>
                    <div>
                      <h3 className="text-lg font-rique font-bold text-[#6b4423]">Daily Takeout</h3>
                      <p className="text-xs font-lexend text-[#8b6240] mt-1">$15 × 20 days = $300/mo</p>
                    </div>
                  </div>
                  <p className="text-sm font-lexend text-[#8b6240] mb-3">
                    Pack lunch 3 days a week and save over $180/month on food costs.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-rique font-bold text-green-600">Save $180/mo</span>
                    <button className="px-3 py-1 bg-[#6b4423] text-[#fdfbf7] font-lexend text-xs rounded-lg border-2 border-[#5a3a1f] hover:bg-[#5a3a1f] transition-colors">
                      Plan
                    </button>
                  </div>
                </div>

                {/* Delivery Fees */}
                <div className="bg-[#fdfbf7] rounded-2xl p-5 border-4 border-[#6b4423] hover:bg-[#f3ecd8] transition-all hover:scale-[1.02]">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">🚗</span>
                    <div>
                      <h3 className="text-lg font-rique font-bold text-[#6b4423]">Delivery Fees</h3>
                      <p className="text-xs font-lexend text-[#8b6240] mt-1">$8.50 average per order</p>
                    </div>
                  </div>
                  <p className="text-sm font-lexend text-[#8b6240] mb-3">
                    You spent $102 on delivery fees alone this month. Try pickup when possible.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-rique font-bold text-green-600">Save $75/mo</span>
                    <button className="px-3 py-1 bg-[#6b4423] text-[#fdfbf7] font-lexend text-xs rounded-lg border-2 border-[#5a3a1f] hover:bg-[#5a3a1f] transition-colors">
                      Track
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Price Comparisons (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="bg-[#f8f3e9] rounded-3xl p-6 shadow-xl border-4 border-[#6b4423] sticky top-6">
              <h2 className="text-2xl font-rique font-bold text-[#6b4423] mb-4">💰 Better Deals</h2>
              
              <div className="space-y-4">
                {/* Trader Joe's vs Walmart */}
                <div className="bg-[#fdfbf7] rounded-xl p-4 border-4 border-[#6b4423]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🛒</span>
                    <h3 className="text-base font-rique font-bold text-[#6b4423]">Grocery Savings</h3>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-lexend text-[#8b6240]">Trader Joe's</span>
                      <span className="text-sm font-lexend font-bold text-red-600">$87.50</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-lexend text-[#8b6240]">Walmart</span>
                      <span className="text-sm font-lexend font-bold text-green-600">$67.30</span>
                    </div>
                  </div>
                  <div className="bg-green-100 rounded-lg p-2 border-2 border-green-600">
                    <p className="text-xs font-lexend font-bold text-green-700 text-center">
                      Save $20.20 per trip! 💚
                    </p>
                  </div>
                </div>

                {/* Whole Foods vs Aldi */}
                <div className="bg-[#fdfbf7] rounded-xl p-4 border-4 border-[#6b4423]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🥬</span>
                    <h3 className="text-base font-rique font-bold text-[#6b4423]">Produce Deals</h3>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-lexend text-[#8b6240]">Whole Foods</span>
                      <span className="text-sm font-lexend font-bold text-red-600">$45.99</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-lexend text-[#8b6240]">Aldi</span>
                      <span className="text-sm font-lexend font-bold text-green-600">$28.75</span>
                    </div>
                  </div>
                  <div className="bg-green-100 rounded-lg p-2 border-2 border-green-600">
                    <p className="text-xs font-lexend font-bold text-green-700 text-center">
                      Save $17.24 per trip! 🌱
                    </p>
                  </div>
                </div>

                {/* Target vs Amazon */}
                <div className="bg-[#fdfbf7] rounded-xl p-4 border-4 border-[#6b4423]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📦</span>
                    <h3 className="text-base font-rique font-bold text-[#6b4423]">Online Shopping</h3>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-lexend text-[#8b6240]">Target</span>
                      <span className="text-sm font-lexend font-bold text-red-600">$156.78</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-lexend text-[#8b6240]">Amazon</span>
                      <span className="text-sm font-lexend font-bold text-green-600">$132.45</span>
                    </div>
                  </div>
                  <div className="bg-green-100 rounded-lg p-2 border-2 border-green-600">
                    <p className="text-xs font-lexend font-bold text-green-700 text-center">
                      Save $24.33 shopping! 📱
                    </p>
                  </div>
                </div>

                {/* CVS vs Costco */}
                <div className="bg-[#fdfbf7] rounded-xl p-4 border-4 border-[#6b4423]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">💊</span>
                    <h3 className="text-base font-rique font-bold text-[#6b4423]">Pharmacy Savings</h3>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-lexend text-[#8b6240]">CVS</span>
                      <span className="text-sm font-lexend font-bold text-red-600">$89.99</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-lexend text-[#8b6240]">Costco Pharmacy</span>
                      <span className="text-sm font-lexend font-bold text-green-600">$54.99</span>
                    </div>
                  </div>
                  <div className="bg-green-100 rounded-lg p-2 border-2 border-green-600">
                    <p className="text-xs font-lexend font-bold text-green-700 text-center">
                      Save $35.00 on meds! 💊
                    </p>
                  </div>
                </div>

                {/* Total Potential Savings */}
                <div className="bg-[#6b4423] rounded-xl p-4 border-4 border-[#5a3a1f] mt-4">
                  <p className="text-sm font-lexend text-[#f8f3e9] mb-1 text-center">Total Monthly Savings</p>
                  <p className="text-3xl font-rique font-bold text-[#fdfbf7] text-center">$96.77</p>
                  <p className="text-xs font-lexend text-[#f8f3e9] mt-1 text-center">if you switch stores!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
