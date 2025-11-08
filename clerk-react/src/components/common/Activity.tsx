import { useState } from 'react';
import { Mascot } from './Mascot';

export const Activity = () => {
  const [activeTab, setActiveTab] = useState<'recently' | 'connections'>('recently');

  // Mock data for Starbucks transactions
  const starbucksTransactions = [
    { id: '1', item: 'Tall Cappuccino', amount: 4.45, time: '8:30 AM', date: 'Nov 8' },
    { id: '2', item: 'Grande Latte', amount: 5.25, time: '8:15 AM', date: 'Nov 7' },
    { id: '3', item: 'Tall Cappuccino', amount: 4.45, time: '9:00 AM', date: 'Nov 6' },
    { id: '4', item: 'Venti Americano', amount: 4.95, time: '8:45 AM', date: 'Nov 5' },
  ];

  // Mock data for Netflix viewing
  const netflixViewing = [
    { id: '1', show: 'Lupin', episode: 'Chapter 1', season: 1, date: 'Nov 6' },
    { id: '2', show: 'Lupin', episode: 'Chapter 2', season: 1, date: 'Nov 7' },
  ];

  // Mock data for Trader Joe's purchase
  const traderJoesItems = [
    { id: '1', item: 'Organic Bananas', price: 2.99 },
    { id: '2', item: 'Almond Milk', price: 3.49 },
    { id: '3', item: 'Quinoa Pack', price: 4.99 },
    { id: '4', item: 'Mixed Greens', price: 3.99 },
    { id: '5', item: 'Dark Chocolate', price: 2.49 },
  ];

  const traderJoesTotal = traderJoesItems.reduce((sum, item) => sum + item.price, 0);

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
            
            {/* Pinterest-style masonry grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Starbucks Card */}
              <div className="bg-[#f8f3e9] rounded-2xl p-6 shadow-lg border-4 border-[#6b4423] hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">☕</div>
                  <div>
                    <h3 className="text-xl font-rique font-bold text-[#6b4423]">Starbucks</h3>
                    <p className="text-xs font-lexend text-[#8b6240]">4 visits this week</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {starbucksTransactions.map((transaction) => (
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
                            {transaction.date} • {transaction.time}
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
                  <p className="text-sm font-lexend text-[#fdfbf7]">Weekly Total</p>
                  <p className="text-2xl font-rique font-bold text-[#fdfbf7]">
                    ${starbucksTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Netflix Card */}
              <div className="bg-[#f8f3e9] rounded-2xl p-6 shadow-lg border-4 border-[#6b4423] hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">📺</div>
                  <div>
                    <h3 className="text-xl font-rique font-bold text-[#6b4423]">Netflix</h3>
                    <p className="text-xs font-lexend text-[#8b6240]">2 episodes watched</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {netflixViewing.map((viewing) => (
                    <div
                      key={viewing.id}
                      className="bg-[#fdfbf7] rounded-lg p-3"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-rique font-bold text-[#6b4423]">
                            {viewing.show}
                          </p>
                          <p className="text-xs font-lexend text-[#8b6240]">
                            S{viewing.season} • {viewing.episode}
                          </p>
                          <p className="text-xs font-lexend text-[#8b6240]">
                            {viewing.date}
                          </p>
                        </div>
                        <div className="text-2xl">▶️</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trader Joe's Card */}
              <div className="bg-[#f8f3e9] rounded-2xl p-6 shadow-lg border-4 border-[#6b4423] hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">🛒</div>
                  <div>
                    <h3 className="text-xl font-rique font-bold text-[#6b4423]">Trader Joe's</h3>
                    <p className="text-xs font-lexend text-[#8b6240]">Latest shopping trip</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {traderJoesItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#fdfbf7] rounded-lg p-2 flex justify-between items-center"
                    >
                      <span className="text-sm font-lexend text-[#6b4423]">{item.item}</span>
                      <span className="text-sm font-rique font-bold text-[#6b4423]">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 bg-[#6b4423] rounded-lg p-3 text-center">
                  <p className="text-sm font-lexend text-[#fdfbf7]">Cart Total</p>
                  <p className="text-2xl font-rique font-bold text-[#fdfbf7]">
                    ${traderJoesTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
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
