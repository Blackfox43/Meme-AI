import React from "react";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: "feed" | "create" | "leaders" | "profile";
  setActiveTab: (tab: "feed" | "create" | "leaders" | "profile") => void;
  onGoPro?: () => void;
  onOpenSettings?: () => void;
  isPro?: boolean;
  points?: number;
  hasActiveDailyChallenge?: boolean;
  authUser?: {
    displayName?: string | null;
    photoURL?: string | null;
    email?: string | null;
    isAnonymous?: boolean;
  } | null;
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
    <div
      className="mesh-bg min-h-[100dvh] flex flex-col w-full max-w-md mx-auto relative overflow-x-hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 max-w-md mx-auto opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(139,92,246,0.25), transparent 60%)",
        }}
      />

      <header
        className="sticky top-0 z-50 px-3 py-2.5 flex justify-between items-center gap-2 border-b border-white/[0.06]"
        style={{
          background: "rgba(7, 11, 20, 0.82)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div
          className="flex items-center gap-2 cursor-pointer min-w-0"
          onClick={() => setActiveTab("feed")}
        >
          <div className="w-9 h-9 shrink-0 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-violet-500/30 ring-1 ring-white/20">
            M
          </div>
          <h1 className="text-lg font-black italic tracking-tighter text-premium truncate">
            MEMEAI
          </h1>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {points !== undefined && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black text-amber-200 ring-1 ring-amber-400/25 bg-amber-500/10">
              <i className="fa-solid fa-star text-[9px] text-amber-400"></i>
              <span>{points}</span>
            </div>
          )}

          <button
            onClick={onGoPro}
            className={`px-2.5 py-1 rounded-full text-[10px] font-black active:scale-95 transition-all flex items-center gap-1 ${
              isPro
                ? "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25"
                : "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-orange-500/20"
            }`}
          >
            <i className="fa-solid fa-crown text-[9px]"></i>
            <span>{isPro ? "PRO" : "GO PRO"}</span>
          </button>

          {authUser && !authUser.isAnonymous ? (
            <button
              onClick={() => setActiveTab("profile")}
              className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-violet-400/40 shadow-md"
              title={`Signed in as ${authUser.displayName || authUser.email || "User"}`}
            >
              {authUser.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center text-xs font-black text-white">
                  {(authUser.displayName || "U")[0].toUpperCase()}
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={onLoginGoogle}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 ring-1 ring-white/10 text-slate-300 flex items-center justify-center transition-all"
              title="Sign in with Google"
            >
              <i className="fa-brands fa-google text-red-400 text-xs"></i>
            </button>
          )}
        </div>
      </header>

      <main
        className="flex-1 overflow-y-auto overflow-x-hidden relative z-10"
        style={{ paddingBottom: "calc(6.5rem + env(safe-area-inset-bottom))" }}
      >
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-3 flex justify-between items-center border-t border-white/[0.06]"
        style={{
          paddingTop: "0.65rem",
          paddingBottom: "calc(0.65rem + env(safe-area-inset-bottom))",
          background: "rgba(7, 11, 20, 0.9)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {(
          [
            { tab: "feed" as const, icon: "fa-fire", label: "FEED" },
            { tab: "leaders" as const, icon: "fa-trophy", label: "TRENDS", pulse: hasActiveDailyChallenge },
          ] as const
        ).map((item) => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className={`relative flex flex-col items-center gap-0.5 min-w-[3.25rem] transition-colors ${
              activeTab === item.tab ? "text-violet-300" : "text-slate-500"
            }`}
          >
            {"pulse" in item && item.pulse && (
              <span className="absolute -top-0.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
            )}
            <i className={`fa-solid ${item.icon} text-lg`}></i>
            <span className="text-[9px] font-bold tracking-wider">{item.label}</span>
          </button>
        ))}

        <button
          onClick={() => setActiveTab("create")}
          className="-mt-9 p-[3px] rounded-2xl bg-gradient-to-br from-violet-400 via-fuchsia-500 to-amber-400 shadow-xl shadow-violet-600/40 active:scale-95 transition-transform"
          title="Create"
        >
          <div className="bg-slate-950 rounded-[0.85rem] p-3 text-white">
            <i className="fa-solid fa-plus text-xl"></i>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-0.5 min-w-[3.25rem] transition-colors ${
            activeTab === "profile" ? "text-violet-300" : "text-slate-500"
          }`}
        >
          <i className="fa-solid fa-circle-user text-lg"></i>
          <span className="text-[9px] font-bold tracking-wider">YOU</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-0.5 min-w-[3.25rem] text-slate-500 transition-colors"
        >
          <i className="fa-solid fa-gear text-lg"></i>
          <span className="text-[9px] font-bold tracking-wider">SETTINGS</span>
        </button>
      </nav>
    </div>
  );
};
