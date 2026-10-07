import React, { useState } from "react";
import { Meme } from "../types";
import { MemeCanvas } from "./MemeCanvas";

interface ProfileTabProps {
  feed: Meme[];
  username: string;
  onChangeUsername: (name: string) => void;
  onLike: (id: string) => void;
  onRemix: (meme: Meme) => void;
  isPro: boolean;
  userPoints?: number;
  completedChallengesCount?: number;
  isChallengeCompletedToday?: boolean;
  onNavigateToChallenges?: () => void;
  onOpenUpgradeModal?: () => void;
  authUser?: { displayName?: string | null; email?: string | null; photoURL?: string | null; isAnonymous?: boolean } | null;
  onLoginGoogle?: () => Promise<void>;
  onLogout?: () => Promise<void>;
  isSyncingCloud?: boolean;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  feed,
  username,
  onChangeUsername,
  onLike,
  onRemix,
  isPro,
  userPoints = 0,
  completedChallengesCount = 0,
  isChallengeCompletedToday = false,
  onNavigateToChallenges,
  onOpenUpgradeModal,
  authUser,
  onLoginGoogle,
  onLogout,
  isSyncingCloud = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(username);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Filter memes created by this user
  const userMemes = feed.filter((m) => m.creator.toLowerCase() === username.toLowerCase() || m.creator === "You");

  // Calculate statistics
  const totalMemes = userMemes.length;
  const totalLikes = userMemes.reduce((sum, m) => sum + (m.likes || 0), 0);

  const handleGoogleAuth = async () => {
    if (!onLoginGoogle) return;
    setIsSigningIn(true);
    try {
      await onLoginGoogle();
    } finally {
      setIsSigningIn(false);
    }
  };

  const saveUsername = () => {
    if (tempName.trim()) {
      onChangeUsername(tempName.trim());
      setIsEditing(false);
    }
  };

  const generateMemeLordName = async () => {
    setIsGeneratingName(true);
    try {
      // Call standard Gemini text endpoint to generate a creative username
      const response = await fetch("/api/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: "https://picsum.photos/seed/meme1/500/500", // dummy
          style: "Sarcastic",
          context: "Generate a single hilarious internet-meme-themed handle or nickname like 'CodeGlitcher' or 'SarcasmSultan' or 'MondaySurvivor' based on current trends. Return JSON with topText as the handle and bottomText empty."
        })
      });
      if (response.ok) {
        const result = await response.json();
        const generatedName = result.topText.replace(/[^a-zA-Z0-9]/g, ""); // clean up
        if (generatedName) {
          onChangeUsername(generatedName);
          setTempName(generatedName);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingName(false);
    }
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-b from-purple-900/30 to-slate-800/40 border border-purple-500/20 rounded-3xl p-6 text-center space-y-4 shadow-xl">
        {/* Avatar */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="w-full h-full rounded-3xl bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 flex items-center justify-center text-3xl font-black text-white shadow-lg border border-purple-400/30">
            {username[0].toUpperCase()}
          </div>
          {isPro && (
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 border-2 border-slate-900 text-slate-950 w-7 h-7 rounded-full flex items-center justify-center text-[10px] shadow-lg font-black" title="Pro Badge Active">
              <i className="fa-solid fa-crown text-[9px]"></i>
            </div>
          )}
        </div>

        {/* Username Editor */}
        <div className="space-y-2">
          {isEditing ? (
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="bg-slate-950 border border-purple-500/50 rounded-xl px-3 py-1.5 text-xs text-center font-bold focus:outline-none"
                placeholder="New username"
                maxLength={20}
              />
              <button
                onClick={saveUsername}
                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-lg font-extrabold text-slate-100">@{username}</h3>
              {isPro && (
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <i className="fa-solid fa-crown text-[8px]"></i> PRO
                </span>
              )}
              <button
                onClick={() => {
                  setTempName(username);
                  setIsEditing(true);
                }}
                className="text-slate-500 hover:text-purple-400 text-xs"
              >
                <i className="fa-solid fa-pen-to-square"></i>
              </button>
            </div>
          )}

          {/* AI Generator */}
          <button
            onClick={generateMemeLordName}
            disabled={isGeneratingName}
            className="text-[10px] text-purple-400 font-extrabold hover:text-purple-300 transition-colors uppercase tracking-wider flex items-center gap-1.5 justify-center mx-auto"
          >
            {isGeneratingName ? (
              <i className="fa-solid fa-spinner animate-spin"></i>
            ) : (
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            )}
            {isGeneratingName ? "Generating..." : "Generate AI Meme Lord Name"}
          </button>
        </div>

        {/* Stats Grid: Memes, Likes, Points */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/60 max-w-sm mx-auto">
          <div className="text-center">
            <p className="text-xl font-black text-slate-200">{totalMemes}</p>
            <p className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest">
              MEMES
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-pink-500">{totalLikes}</p>
            <p className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest">
              LIKES
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-amber-400">{userPoints}</p>
            <p className="text-[8px] text-amber-500/80 font-extrabold uppercase tracking-widest">
              POINTS ⭐
            </p>
          </div>
        </div>

        {/* Badges & Achievements Showcase */}
        <div className="pt-2 border-t border-slate-800/60 text-left space-y-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
            UNLOCKED BADGES
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {isPro ? (
              <span className="bg-gradient-to-r from-amber-400/20 to-yellow-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                <i className="fa-solid fa-crown text-amber-400 text-[9px]"></i>
                Pro Creator
              </span>
            ) : (
              <span className="bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5 opacity-60">
                <i className="fa-solid fa-lock text-[9px]"></i>
                Pro Creator (Locked)
              </span>
            )}

            {completedChallengesCount > 0 || isChallengeCompletedToday ? (
              <span className="bg-purple-900/40 border border-purple-500/50 text-purple-300 text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                <i className="fa-solid fa-bolt text-amber-400 text-[9px]"></i>
                Daily Challenger
              </span>
            ) : (
              <span className="bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5 opacity-60">
                <i className="fa-solid fa-lock text-[9px]"></i>
                Daily Challenger
              </span>
            )}

            <span className="bg-slate-800/60 border border-slate-700/60 text-slate-300 text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1.5">
              <i className="fa-solid fa-masks-theater text-pink-400 text-[9px]"></i>
              Meme Maker
            </span>
          </div>
        </div>

        {/* Daily Challenge Shortcut if not done */}
        {!isChallengeCompletedToday && onNavigateToChallenges && (
          <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-3 flex items-center justify-between gap-3 text-left">
            <div>
              <p className="text-[10px] font-black text-amber-300 uppercase tracking-wide flex items-center gap-1">
                <i className="fa-solid fa-bolt text-amber-400 text-[9px]"></i>
                Daily Challenge Available!
              </p>
              <p className="text-[10px] text-slate-300">
                Complete today&apos;s prompt to unlock the Pro Badge &amp; +250 Pts.
              </p>
            </div>
            <button
              onClick={onNavigateToChallenges}
              className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all shadow-md shadow-purple-600/20"
            >
              Go ⚡
            </button>
          </div>
        )}
      </div>

      {/* Membership & Monetization Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800/80 to-purple-950/40 border border-purple-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 text-xs font-black shadow-md">
              <i className="fa-solid fa-crown"></i>
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              MEMBERSHIP &amp; MONETIZATION
            </span>
          </div>
          <span
            className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
              isPro
                ? "bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-sm"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            {isPro ? "PRO ACTIVE 👑" : "FREE TIER"}
          </span>
        </div>

        <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Export Quality</span>
            <span className="font-bold text-white">{isPro ? "4K Ultra-Sharp (No Watermark)" : "Standard 720p (Watermarked)"}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">AI Magic Speed</span>
            <span className="font-bold text-white">{isPro ? "VIP Priority Queue" : "Standard Speed"}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Veo Video Memes</span>
            <span className="font-bold text-white">{isPro ? "Unlimited" : "1 Daily"}</span>
          </div>
        </div>

        {onOpenUpgradeModal && (
          <button
            onClick={onOpenUpgradeModal}
            className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
              isPro
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                : "bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white shadow-purple-600/25 hover:opacity-95 active:scale-95"
            }`}
          >
            <i className="fa-solid fa-crown text-amber-400 text-xs"></i>
            <span>{isPro ? "View Membership Perks" : "Upgrade to Pro ($4.99/mo or 500 Pts)"}</span>
          </button>
        )}
      </div>

      {/* Cloud Database & User Authentication Card */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <i className="fa-solid fa-cloud text-purple-400"></i> CLOUD DATABASE &amp; AUTH
          </span>
          <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Firestore Connected
          </span>
        </div>

        {authUser && !authUser.isAnonymous ? (
          <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {authUser.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border border-purple-400/60 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-sm font-black text-white">
                  {(authUser.displayName || "U")[0].toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <p className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                  {authUser.displayName || "Google Account"}
                  <span className="text-[9px] bg-purple-900/60 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-bold">
                    Synced
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                  {authUser.email}
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition-all shrink-0"
              >
                Sign Out
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 text-left space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <i className="fa-brands fa-google text-red-400"></i>
                Sync Account with Google
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Connect your Google account to retain your points, Pro badges, and creations across all your devices and browsers without losing data.
              </p>
            </div>

            <button
              onClick={handleGoogleAuth}
              disabled={isSigningIn}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSigningIn ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <i className="fa-brands fa-google text-red-500 text-sm"></i>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Published Memes Grid */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
          YOUR CREATIONS ({totalMemes})
        </h3>

        {userMemes.length === 0 ? (
          <div className="bg-slate-800/10 rounded-2xl border-2 border-dashed border-slate-800 p-12 text-center text-slate-500 italic space-y-1">
            <i className="fa-solid fa-cloud-arrow-up text-2xl text-slate-700"></i>
            <p className="text-xs">You haven&apos;t posted any memes yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {userMemes.map((meme) => (
              <div
                key={meme.id}
                className="bg-slate-800/20 rounded-3xl p-3 border border-slate-800 space-y-3"
              >
                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                  <MemeCanvas {...meme} isPro={isPro} />
                </div>
                <div className="flex items-center justify-between px-1">
                  <div className="flex gap-4">
                    <span className="text-slate-400 font-bold text-xs">
                      <i className="fa-solid fa-heart text-pink-500 mr-1"></i>
                      {meme.likes}
                    </span>
                    <span className="text-slate-500 text-[10px] uppercase font-black">
                      {meme.humorStyle}
                    </span>
                    {meme.isChallengeEntry && (
                      <span className="text-amber-400 text-[10px] font-black flex items-center gap-1">
                        <i className="fa-solid fa-bolt text-[8px]"></i> Challenge
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onRemix(meme)}
                    className="text-purple-400 hover:text-purple-300 font-bold text-xs"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles mr-1"></i> Remix
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
