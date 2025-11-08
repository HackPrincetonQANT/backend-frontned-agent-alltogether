import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
// @ts-ignore
import KnotapiJS from 'knotapi-js';

type Tab = 'knot' | 'goals' | 'bank' | 'imessage';

interface Goal {
  name: string;
  cost: string;
}

export const Onboarding = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('knot');
  const [knotServices, setKnotServices] = useState<string[]>([]);
  const [goal, setGoal] = useState<Goal>({ name: '', cost: '' });
  const [isConnecting, setIsConnecting] = useState(false);
  const [bankConnected, setBankConnected] = useState(false);
  const [imessageConnected, setImessageConnected] = useState(false);

  const handleComplete = async () => {
    // Update user metadata
    await user?.update({
      unsafeMetadata: {
        servicesConnected: knotServices.length,
        goalsSet: goal.name && goal.cost ? 1 : 0,
      },
    });
    
    window.location.reload();
  };

  // Knot Transaction Link - connect to merchant via Flask backend
  const connectToKnot = async (serviceId: string, merchantId: number) => {
    setIsConnecting(true);
    
    try {
      const knotapi = new KnotapiJS();

      const sessionResponse = await fetch('http://localhost:8000/api/knot/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id || 'user123',
          product: 'transaction_link',
        }),
      });

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.error('Backend API Error:', errorText);
        throw new Error(`Failed to create session from backend: ${errorText}`);
      }

      const sessionData = await sessionResponse.json();
      console.log('Session created via backend:', sessionData);
      
      // Read the public client ID from environment variable
      const publicClientId = import.meta.env.VITE_KNOT_CLIENT_ID;

      if (!publicClientId) {
        console.error('VITE_KNOT_CLIENT_ID is not set in your .env file');
        throw new Error('Frontend configuration error - missing client ID');
      }
      
      knotapi.open({
        sessionId: sessionData.session_id,
        clientId: publicClientId, 
        environment: 'development',
        product: 'transaction_link',
        merchantIds: [merchantId], 
        entryPoint: 'onboarding',
        onSuccess: (product: string, details: any) => {
          console.log('✅ Knot onSuccess called!', { product, details, serviceId });
          // Add service to connected services
          setKnotServices(prev => {
            const newServices = prev.includes(serviceId) ? prev : [...prev, serviceId];
            console.log('📊 Updated knotServices:', newServices);
            return newServices;
          });
          setIsConnecting(false);
        },
        onError: (product: string, errorCode: string, errorDescription: string) => {
          console.error('❌ Knot Error:', product, errorCode, errorDescription);
          setIsConnecting(false);
        },
        onExit: (product: string) => {
          console.log('🚪 User exited Knot', product);
          setIsConnecting(false);
        },
        onEvent: (product: string, event: string, merchant: string) => {
          console.log('📢 Knot Event:', { product, event, merchant });
          // Try adding on connection event as well
          if (event === 'MERCHANT_CONNECTED' || event === 'CONNECTION_SUCCESS' || event === 'SUCCESS') {
            console.log('🎉 Connection event detected, adding service:', serviceId);
            setKnotServices(prev => {
              const newServices = prev.includes(serviceId) ? prev : [...prev, serviceId];
              console.log('📊 Updated knotServices from event:', newServices);
              return newServices;
            });
          }
        },
      });
    } catch (error) {
      console.error('Failed to connect to Knot:', error);
      setIsConnecting(false);
    }
  };

  const availableServices = [
    { 
      id: 'amazon', 
      name: 'Amazon', 
      icon: '🛒',
      isKnot: true,
      merchantId: 44,
      description: 'Transaction data'
    },
    { 
      id: 'doordash', 
      name: 'DoorDash', 
      icon: '🍔',
      isKnot: true,
      merchantId: 19,
      description: 'Food delivery'
    },
    { 
      id: 'ubereats', 
      name: 'Uber Eats', 
      icon: '🍕',
      isKnot: true,
      merchantId: 36,
      description: 'Food delivery'
    },
    { 
      id: 'netflix', 
      name: 'Netflix', 
      icon: '🎬',
      isKnot: true,
      merchantId: 16,
      description: 'Streaming'
    },
    { 
      id: 'spotify', 
      name: 'Spotify', 
      icon: '🎵',
      isKnot: true,
      merchantId: 13,
      description: 'Music streaming'
    },
    { 
      id: 'starbucks', 
      name: 'Starbucks', 
      icon: '☕',
      isKnot: true,
      merchantId: 11,
      description: 'Coffee'
    },
  ];

  const toggleService = (serviceId: string, merchantId?: number) => {
    const service = availableServices.find(s => s.id === serviceId);
    
    if (service?.isKnot && merchantId) {
      // Launch Knot integration with specific merchant
      connectToKnot(serviceId, merchantId);
    } else {
      // Regular toggle for other services
      setKnotServices(prev =>
        prev.includes(serviceId)
          ? prev.filter(s => s !== serviceId)
          : [...prev, serviceId]
      );
    }
  };

  const updateGoal = (field: 'name' | 'cost', value: string) => {
    setGoal(prev => ({ ...prev, [field]: value }));
  };

  const connectCapitalOne = () => {
    // Placeholder for Capital One connection
    setBankConnected(true);
    console.log('Connecting to Capital One...');
    // TODO: Implement actual Capital One connection
  };

  const connectIMessage = () => {
    // Placeholder for iMessage connection
    setImessageConnected(true);
    console.log('Allowing iMessage access...');
    // TODO: Implement actual iMessage connection
  };

  const canComplete = 
    goal.name.trim() && 
    goal.cost.trim() &&
    bankConnected &&
    imessageConnected;










  return (
    <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-6">
      <div className="bg-[#f8f3e9] rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border-4 border-[#6b4423]">
        {/* Header */}
        <div className="bg-[#f3ecd8] m-4 p-6 border-4 border-[#6b4423] rounded-3xl shadow-lg">
          <h1 className="text-5xl font-rique text-[#6b4423] mb-2">Let's Get Started</h1>
          <p className="text-lg font-lexend text-[#8b6240]">Complete all steps to unlock your dashboard</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b-4 border-[#6b4423] bg-[#f3ecd8]">
          <button
            onClick={() => setActiveTab('knot')}
            className={`flex-1 py-5 px-6 font-rique font-bold text-lg transition-all border-r-4 border-[#6b4423] ${
              activeTab === 'knot'
                ? 'bg-[#6b4423] text-[#fdfbf7] shadow-inner'
                : 'text-[#6b4423] hover:bg-[#a07856]'
            }`}
          >
            1. Vendors
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 py-5 px-6 font-rique font-bold text-lg transition-all border-r-4 border-[#6b4423] ${
              activeTab === 'goals'
                ? 'bg-[#6b4423] text-[#fdfbf7] shadow-inner'
                : 'text-[#6b4423] hover:bg-[#a07856]'
            }`}
          >
            2. Goals
          </button>
          <button
            onClick={() => setActiveTab('bank')}
            className={`flex-1 py-5 px-6 font-rique font-bold text-lg transition-all border-r-4 border-[#6b4423] ${
              activeTab === 'bank'
                ? 'bg-[#6b4423] text-[#fdfbf7] shadow-inner'
                : 'text-[#6b4423] hover:bg-[#a07856]'
            }`}
          >
            3. Bank
          </button>
          <button
            onClick={() => setActiveTab('imessage')}
            className={`flex-1 py-5 px-6 font-rique font-bold text-lg transition-all ${
              activeTab === 'imessage'
                ? 'bg-[#6b4423] text-[#fdfbf7] shadow-inner'
                : 'text-[#6b4423] hover:bg-[#a07856]'
            }`}
          >
            4. iMessage
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {activeTab === 'knot' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-rique font-bold text-[#6b4423] mb-3">
                  Connect Your Services
                </h2>
                <p className="text-lg font-lexend text-[#8b6240]">
                  Link your favorite merchants to track spending
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availableServices.map(service => (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id, service.merchantId)}
                    disabled={isConnecting}
                    className={`p-6 rounded-2xl border-4 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg relative ${
                      knotServices.includes(service.id)
                        ? 'border-[#5a3a1f] bg-[#6b4423] text-[#fdfbf7] shadow-xl'
                        : 'border-[#6b4423] bg-[#f8f3e9] hover:border-[#5a3a1f] hover:bg-[#f3ecd8]'
                    }`}
                  >
                    {/* Checkmark badge */}
                    <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                      <span className="text-white font-bold text-lg">✓</span>
                    </div>
                    
                    <div className="text-5xl mb-3">{service.icon}</div>
                    <div className="font-rique font-bold text-xl">{service.name}</div>
                    {service.description && (
                      <div className="text-sm font-lexend mt-2 opacity-90">{service.description}</div>
                    )}
                    {service.isKnot && (
                      <div className="text-xs font-lexend mt-2 font-bold opacity-80">Via Knot API</div>
                    )}
                  </button>
                ))}
              </div>

              {isConnecting && (
                <div className="bg-[#a07856] border-4 border-[#6b4423] rounded-2xl p-5 flex items-center gap-4 shadow-lg">
                  <div className="w-6 h-6 border-4 border-[#5a3a1f] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[#3a2414] font-lexend font-bold text-lg">Connecting to merchant...</span>
                </div>
              )}

              <div className="text-base font-lexend text-[#6b4423] font-bold bg-[#f3ecd8] p-4 rounded-xl border-4 border-[#6b4423]">
                Selected: {knotServices.length} service{knotServices.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-rique font-bold text-[#6b4423] mb-3">
                  Set Your Goal
                </h2>
                <p className="text-lg font-lexend text-[#8b6240]">
                  What do you want to save for? Set your goal and target cost
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xl font-rique font-bold text-[#6b4423] mb-3">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    value={goal.name}
                    onChange={e => updateGoal('name', e.target.value)}
                    placeholder="e.g., New iPhone, Vacation, Emergency Fund"
                    className="w-full px-5 py-4 border-4 border-[#6b4423] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#a07856] bg-[#fdfbf7] text-[#3a2414] font-lexend font-medium placeholder-[#a07856]"
                  />
                </div>

                <div>
                  <label className="block text-xl font-rique font-bold text-[#6b4423] mb-3">
                    Target Cost ($)
                  </label>
                  <input
                    type="text"
                    value={goal.cost}
                    onChange={e => updateGoal('cost', e.target.value)}
                    placeholder="e.g., 1200"
                    className="w-full px-5 py-4 border-4 border-[#6b4423] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#a07856] bg-[#fdfbf7] text-[#3a2414] font-lexend font-medium placeholder-[#a07856]"
                  />
                </div>

                {goal.name && goal.cost && (
                  <div className="bg-[#a07856] border-4 border-[#6b4423] rounded-2xl p-6 mt-6 shadow-xl">
                    <div className="flex items-center gap-4 text-[#3a2414]">
                      <span className="text-5xl">TARGET</span>
                      <div>
                        <div className="font-rique font-bold text-2xl">{goal.name}</div>
                        <div className="text-lg font-lexend font-bold text-[#5a3a1f]">Target: ${goal.cost}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-rique font-bold text-[#6b4423] mb-3">
                  Connect Your Bank Account
                </h2>
                <p className="text-lg font-lexend text-[#8b6240]">
                  Link your bank account to enable automatic savings
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-12">
                {!bankConnected ? (
                  <button
                    onClick={connectCapitalOne}
                    className="px-14 py-7 bg-[#6b4423] text-[#fdfbf7] rounded-2xl font-rique font-bold text-2xl border-4 border-[#5a3a1f] hover:shadow-2xl hover:scale-110 transition-all flex items-center gap-4"
                  >
                    <span className="text-4xl">BANK</span>
                    Connect Capital One
                  </button>
                ) : (
                  <div className="bg-[#a07856] border-4 border-[#6b4423] rounded-2xl p-8 flex items-center gap-5 shadow-xl">
                    <span className="text-6xl">DONE</span>
                    <div>
                      <div className="font-rique font-bold text-[#3a2414] text-2xl">Capital One Connected</div>
                      <div className="text-[#5a3a1f] font-lexend text-base font-medium">Your bank account is linked</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'imessage' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-rique font-bold text-[#6b4423] mb-3">
                  Connect iMessage
                </h2>
                <p className="text-lg font-lexend text-[#8b6240]">
                  Allow us to analyze your messages for spending insights
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-12">
                {!imessageConnected ? (
                  <button
                    onClick={connectIMessage}
                    className="px-14 py-7 bg-[#6b4423] text-[#fdfbf7] rounded-2xl font-rique font-bold text-2xl border-4 border-[#5a3a1f] hover:shadow-2xl hover:scale-110 transition-all flex items-center gap-4"
                  >
                    <span className="text-4xl">MSG</span>
                    Allow iMessage Access
                  </button>
                ) : (
                  <div className="bg-[#a07856] border-4 border-[#6b4423] rounded-2xl p-8 flex items-center gap-5 shadow-xl">
                    <span className="text-6xl">DONE</span>
                    <div>
                      <div className="font-rique font-bold text-[#3a2414] text-2xl">iMessage Connected</div>
                      <div className="text-[#5a3a1f] font-lexend text-base font-medium">We can now analyze your spending patterns</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f3ecd8] p-6 flex justify-between items-center border-t-4 border-[#6b4423]">
          <div className="text-base font-lexend font-bold text-[#6b4423]">
            {canComplete
              ? 'All steps complete - Ready to start'
              : 'Complete steps 2-4 to continue'}
          </div>
          <button
            onClick={handleComplete}
            disabled={!canComplete}
            className={`px-10 py-4 rounded-2xl font-rique font-bold text-xl transition-all border-4 ${
              canComplete
                ? 'bg-[#6b4423] text-[#fdfbf7] border-[#5a3a1f] hover:shadow-2xl hover:scale-110'
                : 'bg-[#a07856] text-[#8b6240] border-[#8b6240] cursor-not-allowed opacity-60'
            }`}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};