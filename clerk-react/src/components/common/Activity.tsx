import { useState, useEffect } from 'react';
import { Mascot } from './Mascot';
import { fetchUserTransactions, fetchPredictions } from '../../services';
import type { Transaction, Prediction } from '../../types';

export const Activity = () => {
  const [activeTab, setActiveTab] = useState<'recently' | 'connections'>('recently');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with actual user ID from Clerk authentication
  const userId = 'u_demo_min';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch transactions and predictions in parallel
        const [transactionsData, predictionsData] = await Promise.all([
          fetchUserTransactions(userId, 20),
          fetchPredictions(userId, 5)
        ]);
        
        setTransactions(transactionsData);
        setPredictions(predictionsData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Group transactions by category for the card view
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const category = transaction.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Get category emoji
  const getCategoryEmoji = (category: string): string => {
    const emojiMap: Record<string, string> = {
      'Coffee': '☕',
      'Food': '🍔',
      'Groceries': '🛒',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Transportation': '🚗',
      'Dining': '🍽️',
      'Other': '💰'
    };
    return emojiMap[category] || '💰';
  };

  // Format date nicely
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format time nicely
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Vendors for connection graph - matching onboarding services
  const vendors = [
    { id: 'amazon', name: 'Amazon', logo: '🛒', merchantId: 44, description: 'Transaction data' },
    { id: 'doordash', name: 'DoorDash', logo: '🍔', merchantId: 19, description: 'Food delivery' },
    { id: 'ubereats', name: 'Uber Eats', logo: '🍕', merchantId: 36, description: 'Food delivery' },
    { id: 'netflix', name: 'Netflix', logo: '🎬', merchantId: 16, description: 'Streaming' },
    { id: 'spotify', name: 'Spotify', logo: '🎵', merchantId: 13, description: 'Music streaming' },
    { id: 'starbucks', name: 'Starbucks', logo: '☕', merchantId: 11, description: 'Coffee' },
    { id: 'traderjoes', name: 'Trader Joe\'s', logo: '🛒', description: 'Groceries' },
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-rique font-bold text-[#6b4423] mb-8">
            Activity
          </h1>
          <div className="flex items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-[#6b4423] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-rique font-bold text-[#6b4423] mb-8">
            Activity
          </h1>
          <div className="bg-red-100 border-4 border-red-600 rounded-2xl p-6">
            <h2 className="text-2xl font-rique font-bold text-red-800 mb-2">Error Loading Data</h2>
            <p className="text-red-700 font-lexend">{error}</p>
            <p className="text-red-600 font-lexend text-sm mt-4">
              Make sure your backend is running at the configured URL.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-rique font-bold text-[#6b4423] mb-8">
          Activity
        </h1>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('recently')}
            className={`px-8 py-4 rounded-2xl font-lexend text-lg font-bold transition-all border-4 ${
              activeTab === 'recently'
                ? 'bg-[#6b4423] text-[#fdfbf7] border-[#6b4423] shadow-xl'
                : 'bg-[#f8f3e9] text-[#6b4423] border-[#6b4423] hover:bg-[#f3ecd8]'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-8 py-4 rounded-2xl font-lexend text-lg font-bold transition-all border-4 ${
              activeTab === 'connections'
                ? 'bg-[#6b4423] text-[#fdfbf7] border-[#6b4423] shadow-xl'
                : 'bg-[#f8f3e9] text-[#6b4423] border-[#6b4423] hover:bg-[#f3ecd8]'
            }`}
          >
            Connections
          </button>
        </div>

        {/* Recently Tab */}
        {activeTab === 'recently' && (
          <div>
            <h2 className="text-3xl font-rique font-bold text-[#6b4423] mb-6">This Week</h2>
            
            {transactions.length === 0 ? (
              <div className="bg-[#f8f3e9] rounded-2xl p-12 text-center border-4 border-[#6b4423]">
                <p className="text-2xl font-rique text-[#6b4423]">No transactions found</p>
                <p className="text-lg font-lexend text-[#8b6240] mt-2">
                  Start making purchases to see them here!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Group and display transactions by category */}
                {Object.entries(groupedTransactions).map(([category, categoryTransactions]) => {
                  const totalAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
                  const emoji = getCategoryEmoji(category);
                  
                  return (
                    <div
                      key={category}
                      className="bg-[#f8f3e9] rounded-2xl p-6 shadow-lg border-4 border-[#6b4423] hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-4xl">{emoji}</div>
                        <div>
                          <h3 className="text-xl font-rique font-bold text-[#6b4423]">{category}</h3>
                          <p className="text-xs font-lexend text-[#8b6240]">
                            {categoryTransactions.length} {categoryTransactions.length === 1 ? 'transaction' : 'transactions'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {categoryTransactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="bg-[#fdfbf7] rounded-lg p-3"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-rique font-bold text-[#6b4423]">
                                  {transaction.item}
                                </p>
                                <p className="text-xs font-lexend text-[#8b6240]">
                                  {formatDate(transaction.date)} • {formatTime(transaction.date)}
                                </p>
                              </div>
                              <p className="text-base font-rique font-bold text-red-600">
                                ${transaction.amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 bg-[#6b4423] rounded-lg p-3 text-center">
                        <p className="text-sm font-lexend text-[#fdfbf7]">Category Total</p>
                        <p className="text-2xl font-rique font-bold text-[#fdfbf7]">
                          ${totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Predictions Section */}
            {predictions.length > 0 && (
              <div className="mt-8">
                <h2 className="text-3xl font-rique font-bold text-[#6b4423] mb-6">
                  Predicted Upcoming Purchases
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {predictions.map((prediction, index) => (
                    <div
                      key={index}
                      className="bg-[#e8f4f8] rounded-2xl p-6 shadow-lg border-4 border-[#4a9ebe] hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-4xl">{getCategoryEmoji(prediction.category)}</div>
                        <div>
                          <h3 className="text-xl font-rique font-bold text-[#2c5f75]">
                            {prediction.item}
                          </h3>
                          <p className="text-xs font-lexend text-[#4a7a8f]">
                            {prediction.category}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs font-lexend text-[#4a7a8f] mb-1">
                            Predicted Next Purchase
                          </p>
                          <p className="text-sm font-rique font-bold text-[#2c5f75]">
                            {formatDate(prediction.next_time)}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs font-lexend text-[#4a7a8f] mb-1">
                            Purchase History
                          </p>
                          <p className="text-sm font-rique font-bold text-[#2c5f75]">
                            {prediction.samples} {prediction.samples === 1 ? 'purchase' : 'purchases'}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs font-lexend text-[#4a7a8f] mb-1">
                            Confidence
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-[#4a9ebe] h-2 rounded-full"
                                style={{ width: `${prediction.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-rique font-bold text-[#2c5f75]">
                              {(prediction.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div className="bg-[#f8f3e9] rounded-3xl p-8 shadow-xl border-4 border-[#6b4423]">
            {/* Mascot Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="bg-[#fdfbf7] rounded-full p-8 border-6 border-[#6b4423] shadow-2xl mb-6" style={{ borderWidth: '6px' }}>
                <div className="transform scale-150">
                  <Mascot happiness={100} />
                </div>
              </div>
              <h2 className="text-3xl font-rique font-bold text-[#6b4423] text-center mb-2">
                Your Piggy is Connected!
              </h2>
              <p className="text-lg font-lexend text-[#8b6240] text-center max-w-2xl">
                Your piggy bank is tracking all your connected services to help you save smarter
              </p>
            </div>

            {/* Connection Graph - Fixed size */}
            <div className="relative w-full h-[400px] mb-8">
              {/* SVG for all connection lines */}
              <svg 
                className="absolute inset-0 pointer-events-none" 
                width="100%" 
                height="100%"
                style={{ zIndex: 1 }}
              >
                {vendors.map((vendor, index) => {
                  // Calculate positions in a circle
                  const angle = (index * 360) / vendors.length - 90; // Start from top
                  const radius = 35; // Percentage-based radius
                  const centerX = 50;
                  const centerY = 50;
                  const x = centerX + Math.cos((angle * Math.PI) / 180) * radius;
                  const y = centerY + Math.sin((angle * Math.PI) / 180) * radius;

                  return (
                    <line
                      key={vendor.name}
                      x1={`${centerX}%`}
                      y1={`${centerY}%`}
                      x2={`${x}%`}
                      y2={`${y}%`}
                      stroke="#6b4423"
                      strokeWidth="3"
                      strokeDasharray="8,4"
                      opacity="0.6"
                    />
                  );
                })}
              </svg>

              {/* Center Mascot (smaller version) */}
              <div 
                className="absolute"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10
                }}
              >
                <div className="bg-[#fdfbf7] rounded-full p-4 border-4 border-[#6b4423] shadow-xl">
                  <Mascot happiness={100} />
                </div>
              </div>

              {/* Vendor Bubbles positioned in circle */}
              {vendors.map((vendor, index) => {
                const angle = (index * 360) / vendors.length - 90; // Start from top
                const radius = 35; // Percentage-based radius
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;

                return (
                  <div
                    key={vendor.name}
                    className="absolute transition-all hover:scale-110"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(calc(-50% + ${x}%), calc(-50% + ${y}%))`,
                      zIndex: 5
                    }}
                  >
                    <div 
                      className="bg-[#fdfbf7] rounded-full p-3 border-4 border-[#6b4423] shadow-lg hover:shadow-xl transition-all w-20 h-20 flex flex-col items-center justify-center"
                    >
                      <div className="text-2xl mb-1">{vendor.logo}</div>
                      <p className="text-[9px] font-lexend font-bold text-[#6b4423] text-center leading-tight">
                        {vendor.name.length > 10 ? vendor.name.substring(0, 8) + '...' : vendor.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Knot-style Connected Services Buttons */}
            <div className="mt-8">
              <p className="text-xl font-rique font-bold text-[#6b4423] mb-6 text-center">
                Connected Services
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="p-5 rounded-2xl border-4 border-[#5a3a1f] bg-[#6b4423] text-[#fdfbf7] shadow-lg hover:scale-105 transition-all relative cursor-default"
                  >
                    {/* Checkmark badge */}
                    <div className="absolute top-2 right-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                      <span className="text-white font-bold text-sm">✓</span>
                    </div>
                    
                    <div className="text-4xl mb-2 text-center">{vendor.logo}</div>
                    <div className="font-rique font-bold text-base text-center">{vendor.name}</div>
                    {vendor.description && (
                      <div className="text-xs font-lexend mt-1 opacity-90 text-center">{vendor.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
