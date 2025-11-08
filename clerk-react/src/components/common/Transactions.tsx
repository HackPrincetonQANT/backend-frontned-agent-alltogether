export const Transactions = () => {
  // Hardcoded transaction data for now
  const transactions = [
    {
      id: '1',
      merchant: 'Starbucks',
      amount: -5.67,
      date: '2024-11-08',
      category: 'Food & Drink',
      time: '8:30 AM'
    },
    {
      id: '2',
      merchant: 'Amazon',
      amount: -45.99,
      date: '2024-11-07',
      category: 'Shopping',
      time: '3:15 PM'
    },
    {
      id: '3',
      merchant: 'Uber',
      amount: -12.34,
      date: '2024-11-07',
      category: 'Transportation',
      time: '7:45 PM'
    },
    {
      id: '4',
      merchant: 'Direct Deposit',
      amount: 1200.00,
      date: '2024-11-06',
      category: 'Income',
      time: '12:00 AM'
    },
    {
      id: '5',
      merchant: 'Netflix',
      amount: -15.99,
      date: '2024-11-05',
      category: 'Entertainment',
      time: '9:00 AM'
    }
  ];

  const totalSpent = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalIncome = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-rique font-bold text-[#6b4423] mb-8">
          Transactions
        </h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Spent */}
          <div className="bg-[#f8f3e9] rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] border-4 border-[#6b4423]">
            <h3 className="text-xl font-rique font-bold text-[#6b4423] mb-2">Total Spent</h3>
            <p className="text-3xl font-rique font-bold text-red-600">-${totalSpent.toFixed(2)}</p>
            <p className="text-sm font-lexend text-[#8b6240] mt-2">This period</p>
          </div>

          {/* Total Income */}
          <div className="bg-[#f8f3e9] rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] border-4 border-[#6b4423]">
            <h3 className="text-xl font-rique font-bold text-[#6b4423] mb-2">Total Income</h3>
            <p className="text-3xl font-rique font-bold text-green-600">+${totalIncome.toFixed(2)}</p>
            <p className="text-sm font-lexend text-[#8b6240] mt-2">This period</p>
          </div>

          {/* Net Change */}
          <div className="bg-[#f8f3e9] rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] border-4 border-[#6b4423]">
            <h3 className="text-xl font-rique font-bold text-[#6b4423] mb-2">Net Change</h3>
            <p className={`text-3xl font-rique font-bold ${totalIncome - totalSpent > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalIncome - totalSpent > 0 ? '+' : ''}${(totalIncome - totalSpent).toFixed(2)}
            </p>
            <p className="text-sm font-lexend text-[#8b6240] mt-2">This period</p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-[#f8f3e9] rounded-3xl p-8 shadow-xl border-4 border-[#6b4423]">
          <h2 className="text-3xl font-rique font-bold text-[#6b4423] mb-6">Recent Transactions</h2>
          
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-[#fdfbf7] rounded-2xl p-6 border-4 border-[#6b4423] hover:bg-[#f3ecd8] transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-rique font-bold text-[#6b4423]">
                      {transaction.merchant}
                    </h3>
                    <p className="text-sm font-lexend text-[#8b6240] mt-1">
                      {transaction.category}
                    </p>
                    <p className="text-sm font-lexend text-[#8b6240] mt-1">
                      {transaction.date} • {transaction.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-rique font-bold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {transactions.length === 0 && (
            <p className="text-lg font-lexend text-[#8b6240] text-center py-8">
              No transactions yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
