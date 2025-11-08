export const Insights = () => {
  // Hardcoded insights data for now
  const categorySpending = [
    { category: 'Food & Drink', amount: 234.56, percentage: 35, color: '#FF6B6B' },
    { category: 'Shopping', amount: 189.99, percentage: 28, color: '#4ECDC4' },
    { category: 'Transportation', amount: 125.34, percentage: 19, color: '#45B7D1' },
    { category: 'Entertainment', amount: 89.99, percentage: 13, color: '#96CEB4' },
    { category: 'Other', amount: 34.50, percentage: 5, color: '#DDA15E' }
  ];

  const monthlyTrend = [
    { month: 'July', spent: 580, saved: 220 },
    { month: 'August', spent: 620, saved: 180 },
    { month: 'September', spent: 550, saved: 250 },
    { month: 'October', spent: 670, saved: 130 },
    { month: 'November', spent: 480, saved: 320 }
  ];

  const streakDays = 12;
  const goalProgress = 67;
  const goalCost = 250;
  const savedAmount = 17;
  const weeklySavingsTarget = 20;
  
  // Calculate weeks to goal
  const remainingAmount = goalCost - savedAmount;
  const weeksToGoal = Math.ceil(remainingAmount / weeklySavingsTarget);

  // Max values for graph scaling
  const maxSpent = Math.max(...monthlyTrend.map(m => m.spent));
  const maxSaved = Math.max(...monthlyTrend.map(m => m.saved));
  const maxValue = Math.max(maxSpent, maxSaved);

  // Streak visualization (6 fire emojis + 1 circle per week)
  const weeksInStreak = Math.floor(streakDays / 7);
  const daysInCurrentWeek = streakDays % 7;

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
            <div className="flex items-center justify-center">
              <svg width="180" height="180" viewBox="0 0 120 120" className="transform -rotate-90">
                {categorySpending.map((item, index) => {
                  const previousPercentages = categorySpending.slice(0, index).reduce((sum, cat) => sum + cat.percentage, 0);
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
                        <title>{item.category}: {item.percentage}%</title>
                      </path>
                    </g>
                  );
                })}
              </svg>
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
            <p className="text-4xl font-rique font-bold text-[#6b4423]">{goalProgress}%</p>
            <p className="text-sm font-lexend text-[#8b6240] mb-3">to your bike</p>
            <div className="bg-[#fdfbf7] rounded-lg p-3 border-2 border-[#6b4423]">
              <p className="text-xs font-lexend text-[#8b6240] mb-1">At ${weeklySavingsTarget}/week:</p>
              <p className="text-lg font-rique font-bold text-[#6b4423]">{weeksToGoal} weeks to goal</p>
              <p className="text-xs font-lexend text-[#8b6240] mt-1">${remainingAmount} remaining</p>
            </div>
          </div>
        </div>

        {/* Monthly Trend Graph */}
        <div className="bg-[#f8f3e9] rounded-3xl p-8 shadow-xl border-4 border-[#6b4423] mb-8">
          <h2 className="text-3xl font-rique font-bold text-[#6b4423] mb-6">Monthly Trend</h2>
          
          <div className="relative h-64">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-sm font-lexend text-[#8b6240]">
              <span>${maxValue}</span>
              <span>${Math.round(maxValue * 0.75)}</span>
              <span>${Math.round(maxValue * 0.5)}</span>
              <span>${Math.round(maxValue * 0.25)}</span>
              <span>$0</span>
            </div>
            
            {/* Graph area */}
            <div className="ml-12 h-full flex items-end justify-around gap-4 pb-8">
              {monthlyTrend.map((month) => (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                  {/* Bars */}
                  <div className="w-full flex gap-1 items-end h-48">
                    {/* Spent bar */}
                    <div 
                      className="flex-1 bg-red-500 rounded-t-lg border-2 border-[#6b4423] transition-all hover:opacity-80 relative group"
                      style={{ height: `${(month.spent / maxValue) * 100}%` }}
                    >
                      <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-lexend font-bold text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        ${month.spent}
                      </span>
                    </div>
                    {/* Saved bar */}
                    <div 
                      className="flex-1 bg-green-500 rounded-t-lg border-2 border-[#6b4423] transition-all hover:opacity-80 relative group"
                      style={{ height: `${(month.saved / maxValue) * 100}%` }}
                    >
                      <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-lexend font-bold text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        ${month.saved}
                      </span>
                    </div>
                  </div>
                  {/* Month label */}
                  <span className="text-sm font-lexend font-bold text-[#6b4423]">{month.month}</span>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="absolute bottom-0 right-0 flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded border-2 border-[#6b4423]"></div>
                <span className="text-sm font-lexend text-[#6b4423]">Spent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded border-2 border-[#6b4423]"></div>
                <span className="text-sm font-lexend text-[#6b4423]">Saved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pro Tips Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Pro Tips (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="bg-[#f8f3e9] rounded-3xl p-8 shadow-xl border-4 border-[#6b4423]">
              <h2 className="text-3xl font-rique font-bold text-[#6b4423] mb-6">💡 Pro Tips</h2>
              
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
