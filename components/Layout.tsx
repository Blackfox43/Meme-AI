
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'feed' | 'create' | 'leaders' | 'profile';
  setActiveTab: (tab: 'feed' | 'create' | 'leaders' | 'profile') => void;
  onGoPro?: () => void;
  onOpenSettings?: () => void;
  isPro?: boolean;
  points?: number;
  hasActiveDailyChallenge?: boolean;
  authUser?: { displayName?: string | null; photoURL?: string | null; email?: string | null; isAnonymous?: boolean } | null;
  onLoginGoogle?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  onGoPro,
  onOpenSettings,
  isPro = false,
  points = 0,
  hasActiveDailyChallenge = true,
  authUser,
  onLoginGoogle,
}) => {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-slate-900 border-x border-slate-800 shadow-2xl relative">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('feed')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-base font-black shadow-md shadow-purple-500/20">
            M
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
            MEMEAI
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {points !== undefined && (
            <div
              className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-full text-[11px] font-black text-amber-300 shadow-sm"
              title="Your MemeAI Points"
            >
              <i className="fa-solid fa-star text-[10px] text-amber-400"></i>
              <span>{points}</span>
            </div>
          )}

          <button
            onClick={onGoPro}
            className={`px-3 py-1 rounded-full text-xs font-black shadow-lg active:scale-95 transition-all flex items-center gap-1 ${
              isPro
                ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-amber-500/30"
                : "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 shadow-amber-500/20"
            }`}
          >
            <i className="fa-solid fa-crown text-[10px]"></i>
            <span>{isPro ? "PRO 👑" : "GO PRO"}</span>
          </button>

          {/* User Auth Avatar / Google Sign-In Shortcut */}
          {authUser && !authUser.isAnonymous ? (
            <button
              onClick={() => setActiveTab('profile')}
              className="w-8 h-8 rounded-full overflow-hidden border border-purple-400/50 hover:border-purple-400 transition-all shadow-md relative"
              title={`Signed in as ${authUser.displayName || authUser.email || "Google User"}`}
            >
              {authUser.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-xs font-black text-white">
                  {(authUser.displayName || "U")[0].toUpperCase()}
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={onLoginGoogle}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-slate-300 flex items-center gap-1.5 transition-all shadow-sm"
              title="Sign in with Google to sync across devices"
            >
              <i className="fa-brands fa-google text-red-400 text-[10px]"></i>
              <span>Sign In</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all text-xs border border-slate-700/60"
              title="Settings"
            >
              <i className="fa-solid fa-gear"></i>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom Navbar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-6 py-4 flex justify-between items-center z-50">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'feed' ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <i className="fa-solid fa-fire text-xl"></i>
          <span className="text-[10px] font-bold">FEED</span>
        </button>
        <button 
          onClick={() => setActiveTab('leaders')}
          className={`relative flex flex-col items-center gap-1 transition-colors ${activeTab === 'leaders' ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {hasActiveDailyChallenge && (
            <span className="absolute -top-1 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
          <i className="fa-solid fa-trophy text-xl"></i>
          <span className="text-[10px] font-bold">TRENDS</span>
        </button>
        
        {/* Create Button (Floating) */}
        <button 
          onClick={() => setActiveTab('create')}
          className={`-mt-12 bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl shadow-xl shadow-purple-500/30 transform hover:scale-110 active:scale-95 transition-all text-white border-4 border-slate-900`}
          title="Create New Meme"
        >
          <i className="fa-solid fa-plus text-2xl"></i>
        </button>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <i className="fa-solid fa-circle-user text-xl"></i>
          <span className="text-[10px] font-bold">YOU</span>
        </button>
        <button 
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <i className="fa-solid fa-gear text-xl"></i>
          <span className="text-[10px] font-bold">SETTINGS</span>
        </button>
      </nav>
    </div>
  );
};
