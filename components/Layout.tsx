
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'feed' | 'create' | 'leaders' | 'profile' | 'settings';
  setActiveTab: (tab: 'feed' | 'create' | 'leaders' | 'profile' | 'settings') => void;
  isPro?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, isPro }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-slate-900 border-x border-slate-800 shadow-2xl relative">
      {/* Header */}
      <header className="sticky top-0 z-[60] bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          MEMEAI
        </h1>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-1 rounded-full text-[10px] font-black shadow-lg transition-all ${isPro ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white animate-pulse' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900'}`}
        >
          <i className="fa-solid fa-crown mr-1"></i> {isPro ? 'PRO ACTIVE' : 'GO PRO'}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom Navbar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-6 py-4 flex justify-between items-center z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'feed' ? 'text-purple-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <i className="fa-solid fa-fire text-xl"></i>
          <span className="text-[9px] font-black uppercase tracking-tighter">Feed</span>
        </button>
        <button 
          onClick={() => setActiveTab('leaders')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'leaders' ? 'text-purple-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <i className="fa-solid fa-trophy text-xl"></i>
          <span className="text-[9px] font-black uppercase tracking-tighter">Trends</span>
        </button>
        
        {/* Create Button (Floating) */}
        <button 
          onClick={() => setActiveTab('create')}
          className={`-mt-12 bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl shadow-xl shadow-purple-500/40 transform hover:scale-110 active:scale-90 transition-all text-white border-4 border-slate-900 z-10`}
        >
          <i className="fa-solid fa-plus text-2xl"></i>
        </button>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-purple-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <i className="fa-solid fa-circle-user text-xl"></i>
          <span className="text-[9px] font-black uppercase tracking-tighter">You</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'settings' ? 'text-purple-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <i className="fa-solid fa-gear text-xl"></i>
          <span className="text-[9px] font-black uppercase tracking-tighter">Apps</span>
        </button>
      </nav>
    </div>
  );
};
