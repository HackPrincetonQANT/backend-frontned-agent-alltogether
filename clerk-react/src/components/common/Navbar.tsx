import { UserButton } from '@clerk/clerk-react';
import { useState } from 'react';

interface NavbarProps {
  activeView: 'home' | 'transactions' | 'insights';
  setActiveView: (view: 'home' | 'transactions' | 'insights') => void;
}

export const Navbar = ({ activeView, setActiveView }: NavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = (tab: 'home' | 'transactions' | 'insights') => {
    setActiveView(tab);
    setMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-[#f8f3e9] border-b-4 border-[#6b4423] px-6 py-5 shadow-lg relative z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Hamburger Menu */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex flex-col gap-1.5 p-2 hover:bg-[#f3ecd8] rounded-lg transition-colors"
              aria-label="Menu"
            >
              <span className={`w-7 h-1 bg-[#6b4423] rounded-full transition-all ${menuOpen ? 'rotate-45 translate-y-2.5' : ''}`}></span>
              <span className={`w-7 h-1 bg-[#6b4423] rounded-full transition-all ${menuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-7 h-1 bg-[#6b4423] rounded-full transition-all ${menuOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
            </button>
            
            <h1 className="text-4xl font-rique font-bold text-[#6b4423]">Piggy Bank</h1>
          </div>
          
          <div className="border-4 border-[#6b4423] rounded-full overflow-hidden">
            <UserButton />
          </div>
        </div>
      </nav>

      {/* Sidebar Overlay */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-[#f8f3e9] border-r-4 border-[#6b4423] shadow-2xl z-50 transform transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <h2 className="text-3xl font-rique font-bold text-[#6b4423] mb-8">Menu</h2>
          
          <nav className="space-y-2">
            {/* Home / Dashboard */}
            <button
              onClick={() => handleNavClick('home')}
              className={`w-full text-left px-6 py-4 rounded-2xl font-lexend text-lg transition-all border-4 ${
                activeView === 'home'
                  ? 'bg-[#6b4423] text-[#fdfbf7] border-[#6b4423]'
                  : 'bg-[#fdfbf7] text-[#6b4423] border-[#6b4423] hover:bg-[#f3ecd8]'
              }`}
            >
              Home
            </button>

            {/* Transactions */}
            <button
              onClick={() => handleNavClick('transactions')}
              className={`w-full text-left px-6 py-4 rounded-2xl font-lexend text-lg transition-all border-4 ${
                activeView === 'transactions'
                  ? 'bg-[#6b4423] text-[#fdfbf7] border-[#6b4423]'
                  : 'bg-[#fdfbf7] text-[#6b4423] border-[#6b4423] hover:bg-[#f3ecd8]'
              }`}
            >
              Transactions
            </button>

            {/* Insights */}
            <button
              onClick={() => handleNavClick('insights')}
              className={`w-full text-left px-6 py-4 rounded-2xl font-lexend text-lg transition-all border-4 ${
                activeView === 'insights'
                  ? 'bg-[#6b4423] text-[#fdfbf7] border-[#6b4423]'
                  : 'bg-[#fdfbf7] text-[#6b4423] border-[#6b4423] hover:bg-[#f3ecd8]'
              }`}
            >
              Insights
            </button>
          </nav>
        </div>
      </div>
    </>
  );
};
