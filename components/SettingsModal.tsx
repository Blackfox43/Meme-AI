import React, { useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onChangeUsername: (name: string) => void;
  isPro: boolean;
  setIsPro: (val: boolean) => void;
  onResetFeed: () => void;
  onToast: (msg: string) => void;
  onOpenUpgradeModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  username,
  onChangeUsername,
  isPro,
  setIsPro,
  onResetFeed,
  onToast,
  onOpenUpgradeModal,
}) => {
  const [tempName, setTempName] = useState(username);

  if (!isOpen) return null;

  const handleSaveUsername = () => {
    if (tempName.trim()) {
      onChangeUsername(tempName.trim());
      onToast("Username updated! ✨");
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-5 text-slate-200">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-gear text-purple-400"></i>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">App Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>

        {/* Pro Plan Status */}
        <div className="bg-gradient-to-r from-purple-900/30 to-amber-900/20 border border-purple-500/30 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <i className="fa-solid fa-crown text-[9px]"></i> Membership Tier
            </span>
            <p className="text-xs font-bold text-white">
              {isPro ? "MemeAI Pro Member" : "MemeAI Free Tier"}
            </p>
            <p className="text-[9px] text-slate-400">
              {isPro ? "Watermark-free exports unlocked" : "Includes 'MemeAI FREE' watermark"}
            </p>
          </div>
          <button
            onClick={() => {
              if (!isPro && onOpenUpgradeModal) {
                onClose();
                onOpenUpgradeModal();
                return;
              }
              const next = !isPro;
              setIsPro(next);
              onToast(next ? "Upgraded to MemeAI Pro! 👑" : "Switched to Free Tier");
            }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-md ${
              isPro
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:opacity-90"
            }`}
          >
            {isPro ? "Manage Plan" : "Upgrade Pro"}
          </button>
        </div>

        {/* Username Setting */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Creator Handle
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                @
              </span>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                maxLength={24}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
              />
            </div>
            <button
              onClick={handleSaveUsername}
              className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all"
            >
              Save
            </button>
          </div>
        </div>

        {/* Billing Gateways & Merchant of Record */}
        <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
              Billing &amp; Merchant of Record
            </span>
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-shield-halved text-indigo-400"></i>
                <strong className="text-white">Paddle Billing</strong> (Cards, Apple Pay, iDEAL)
              </span>
              <span className="text-indigo-300 font-bold">Enabled</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <i className="fa-brands fa-paypal text-blue-400"></i>
                <strong className="text-white">PayPal Express</strong> (Wallet &amp; Cards)
              </span>
              <span className="text-blue-300 font-bold">Enabled</span>
            </div>
          </div>
        </div>

        {/* AI Engine Specs */}
        <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl space-y-1.5">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
            AI Engine Capabilities
          </span>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <span className="text-purple-400">⚡</span> Gemini 2.5 Flash
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <span className="text-pink-400">🎨</span> Imagen 3 Studio
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <span className="text-blue-400">🎬</span> Google Veo
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <span className="text-emerald-400">🔊</span> Neural TTS Audio
            </div>
          </div>
        </div>

        {/* Reset / Feed management */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={() => {
              onResetFeed();
              onToast("Feed refreshed to latest memes! 🔄");
            }}
            className="text-[10px] text-slate-500 hover:text-red-400 font-bold uppercase transition-colors flex items-center gap-1"
          >
            <i className="fa-solid fa-rotate-left"></i>
            <span>Refresh Sample Feed</span>
          </button>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-1.5 rounded-xl text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
