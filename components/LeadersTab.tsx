import React, { useState, useEffect, useMemo } from "react";
import { Meme, DailyChallenge } from "../types";
import { MemeCanvas } from "./MemeCanvas";
import { getTodayDailyChallenge } from "../constants";

interface LeadersTabProps {
  feed: Meme[];
  onLike: (id: string) => void;
  onRemix: (meme: Meme) => void;
  isPro: boolean;
  currentUser?: string;
  userPoints?: number;
  isChallengeCompletedToday?: boolean;
  onAcceptChallenge?: (challenge: DailyChallenge) => void;
  onToast?: (msg: string) => void;
}

export const LeadersTab: React.FC<LeadersTabProps> = ({
  feed,
  onLike,
  onRemix,
  isPro,
  currentUser = "You",
  userPoints = 0,
  isChallengeCompletedToday = false,
  onAcceptChallenge,
  onToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"challenge" | "hallOfFame" | "creators">("challenge");
  const todayChallenge: DailyChallenge = useMemo(() => getTodayDailyChallenge(), []);

  // Real-time countdown timer until next challenge at midnight
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
      const seconds = Math.floor((diffMs / 1000) % 60);
      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter memes submitted for the daily challenge
  const challengeSubmissions = useMemo(() => {
    return feed.filter((m) => {
      if (m.isChallengeEntry) return true;
      const tags = (m.tags || []).map((t) => t.toLowerCase());
      return (
        tags.includes("#memeoftheday") ||
        tags.includes("#dailychallenge") ||
        tags.includes(todayChallenge.tag.toLowerCase()) ||
        (m.challengeTheme && m.challengeTheme.toLowerCase() === todayChallenge.theme.toLowerCase())
      );
    });
  }, [feed, todayChallenge]);

  // Sort memes by likes descending for Hall of Fame
  const sortedMemes = useMemo(() => [...feed].sort((a, b) => b.likes - a.likes), [feed]);
  const podium = sortedMemes.slice(0, 3);
  const runnersUp = sortedMemes.slice(3);

  // Top Creators Mock Leaderboard with dynamic user stats included
  const creatorsLeaderboard = useMemo(() => {
    const staticLeaders = [
      { name: "DevGod", points: 1450, isProBadge: true, streak: 7, badges: ["Pro Creator", "Code Comic"] },
      { name: "MemeLord", points: 1220, isProBadge: true, streak: 5, badges: ["Pro Creator", "Viral Legend"] },
      { name: "BugHunter", points: 890, isProBadge: false, streak: 3, badges: ["Daily Challenger"] },
      { name: "PixelSam", points: 640, isProBadge: false, streak: 2, badges: ["Daily Challenger"] },
    ];

    const currentUserNameClean = currentUser.toLowerCase();
    const userInList = staticLeaders.find((l) => l.name.toLowerCase() === currentUserNameClean);

    let list = [...staticLeaders];
    if (!userInList) {
      list.push({
        name: currentUser,
        points: userPoints,
        isProBadge: isPro,
        streak: isChallengeCompletedToday ? 1 : 0,
        badges: isPro ? ["Pro Creator", "Daily Challenger"] : isChallengeCompletedToday ? ["Daily Challenger"] : ["Meme Novice"],
      });
    } else {
      list = list.map((l) => {
        if (l.name.toLowerCase() === currentUserNameClean) {
          return {
            ...l,
            points: Math.max(l.points, userPoints),
            isProBadge: isPro || l.isProBadge,
            streak: isChallengeCompletedToday ? Math.max(l.streak, 1) : l.streak,
          };
        }
        return l;
      });
    }

    return list.sort((a, b) => b.points - a.points);
  }, [currentUser, userPoints, isPro, isChallengeCompletedToday]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 0:
        return {
          icon: "fa-solid fa-crown text-amber-400 text-xl",
          border: "border-amber-400/40 shadow-amber-400/10",
          bg: "bg-amber-400/10 text-amber-400",
          rankText: "1ST PLACE",
        };
      case 1:
        return {
          icon: "fa-solid fa-medal text-slate-300 text-xl",
          border: "border-slate-300/40 shadow-slate-300/10",
          bg: "bg-slate-300/10 text-slate-300",
          rankText: "2ND PLACE",
        };
      case 2:
        return {
          icon: "fa-solid fa-medal text-amber-700 text-xl",
          border: "border-amber-700/40 shadow-amber-700/10",
          bg: "bg-amber-700/10 text-amber-700",
          rankText: "3RD PLACE",
        };
      default:
        return null;
    }
  };

  const handleStartChallenge = () => {
    if (onAcceptChallenge) {
      onAcceptChallenge(todayChallenge);
    }
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24">
      {/* Top Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-black tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-purple-400 to-pink-500">
          TRENDS &amp; CHALLENGES
        </h2>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          Daily Prompt Competitions &amp; Community Hall of Fame
        </p>
      </div>

      {/* Featured Daily Challenge Card */}
      <div
        id="daily-challenge-card"
        className="relative overflow-hidden bg-gradient-to-b from-purple-950/60 via-slate-900 to-slate-900/90 border-2 border-purple-500/50 rounded-3xl p-5 shadow-2xl space-y-4 transition-all hover:border-purple-400"
      >
        {/* Glow Accent Background */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none"></div>

        {/* Card Header row: Badge, Timer, and Reward */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1 shadow-md shadow-amber-500/20">
              <i className="fa-solid fa-bolt text-[9px]"></i>
              DAILY CHALLENGE
            </span>
            <span className="text-[10px] bg-purple-900/70 border border-purple-700/60 text-purple-200 px-2 py-0.5 rounded-full font-bold">
              {todayChallenge.tag}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
            <i className="fa-solid fa-stopwatch text-amber-400 text-[10px]"></i>
            <span>
              {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Challenge Theme Title & Prompt */}
        <div className="space-y-1.5">
          <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
            <span>{todayChallenge.theme}</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {todayChallenge.description}
          </p>
        </div>

        {/* Prompt Inspiration Box */}
        <div className="bg-slate-950/60 border border-purple-500/20 rounded-2xl p-3 flex items-start gap-2.5">
          <i className="fa-solid fa-lightbulb text-amber-400 text-sm mt-0.5 shrink-0"></i>
          <div className="space-y-0.5 min-w-0">
            <p className="text-[9px] uppercase tracking-wider font-extrabold text-amber-300">
              Today&apos;s Creative Prompt:
            </p>
            <p className="text-xs italic text-slate-200 font-medium">
              &quot;{todayChallenge.prompt}&quot;
            </p>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="bg-gradient-to-r from-purple-900/30 to-amber-950/20 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
              <i className="fa-solid fa-crown"></i>
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-amber-300 tracking-wider">
                CHALLENGE REWARD
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <span className="text-amber-400">+{todayChallenge.rewardPoints} Points</span>
                <span>•</span>
                <span className="text-purple-300 flex items-center gap-1">
                  <i className="fa-solid fa-award text-[11px] text-purple-400"></i>
                  Pro Badge &amp; Perks
                </span>
              </div>
            </div>
          </div>

          {isChallengeCompletedToday ? (
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 px-2.5 py-1 rounded-xl font-black uppercase shadow-sm">
                <i className="fa-solid fa-circle-check text-emerald-400"></i>
                CLAIMED TODAY
              </span>
            </div>
          ) : (
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-950/60 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-lg font-bold">
                1 Meme Needed
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div>
          {isChallengeCompletedToday ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-2 font-bold">
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-sparkles text-amber-400"></i>
                  Today&apos;s Pro Reward Unlocked (+250 Pts)
                </span>
                <span className="font-mono text-emerald-400">👑 ACTIVE</span>
              </div>
              <button
                id="daily-challenge-create-btn"
                onClick={handleStartChallenge}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-purple-500/40 hover:border-purple-400 text-purple-200 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <i className="fa-solid fa-plus-circle text-purple-400"></i>
                <span>Submit Another Challenge Meme</span>
              </button>
            </div>
          ) : (
            <button
              id="daily-challenge-accept-btn"
              onClick={handleStartChallenge}
              className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 group"
            >
              <i className="fa-solid fa-wand-magic-sparkles text-amber-300 group-hover:rotate-12 transition-transform"></i>
              <span>Accept Challenge &amp; Create (+{todayChallenge.rewardPoints} Pts)</span>
              <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Switcher */}
      <div className="flex items-center bg-slate-800/60 p-1 rounded-2xl border border-slate-700/60">
        <button
          id="leaders-tab-challenge"
          onClick={() => setActiveSubTab("challenge")}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === "challenge"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <i className="fa-solid fa-bolt text-[10px]"></i>
          <span>Challenge Entries ({challengeSubmissions.length})</span>
        </button>

        <button
          id="leaders-tab-hall-of-fame"
          onClick={() => setActiveSubTab("hallOfFame")}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === "hallOfFame"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <i className="fa-solid fa-trophy text-[10px]"></i>
          <span>Hall of Fame</span>
        </button>

        <button
          id="leaders-tab-creators"
          onClick={() => setActiveSubTab("creators")}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === "creators"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <i className="fa-solid fa-medal text-[10px]"></i>
          <span>Top Creators</span>
        </button>
      </div>

      {/* VIEW 1: Daily Challenge Entries Showcase */}
      {activeSubTab === "challenge" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-fire text-amber-400"></i>
              <span>Today&apos;s Challenge Submissions</span>
            </h3>
            <span className="text-[10px] text-purple-400 font-bold">
              {challengeSubmissions.length} memes submitted
            </span>
          </div>

          {challengeSubmissions.length === 0 ? (
            <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-900/30 border border-purple-500/30 mx-auto flex items-center justify-center text-purple-400 text-xl">
                <i className="fa-solid fa-flag-checkered"></i>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-200">No submissions for today&apos;s theme yet!</p>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                  Be the very first creator to publish a meme for &quot;{todayChallenge.theme}&quot; and claim your Pro reward badge!
                </p>
              </div>
              <button
                onClick={handleStartChallenge}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-md shadow-purple-600/20"
              >
                Create The First Entry 🚀
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {challengeSubmissions.map((meme, idx) => (
                <div
                  key={`${meme.id}-challenge-${idx}`}
                  className="bg-slate-800/40 rounded-3xl p-4 border border-purple-500/30 space-y-3 hover:border-purple-400/60 transition-all shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-black text-white">
                        {meme.creator ? meme.creator[0].toUpperCase() : "M"}
                      </div>
                      <div>
                        <p className="font-extrabold text-xs text-slate-200">@{meme.creator}</p>
                        <span className="text-[9px] text-purple-400 font-bold">
                          ⚡ Challenge Entry
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300 font-extrabold text-xs bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
                      <i className="fa-solid fa-heart text-pink-500"></i>
                      {meme.likes}
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800/80">
                    <MemeCanvas {...meme} isPro={isPro} />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] bg-purple-950 border border-purple-800 text-purple-300 px-2 py-0.5 rounded-md font-bold">
                        {todayChallenge.tag}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onLike(meme.id)}
                        className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all"
                      >
                        <i className="fa-solid fa-heart mr-1"></i> LIKE
                      </button>
                      <button
                        onClick={() => onRemix(meme)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-md shadow-purple-500/20"
                      >
                        <i className="fa-solid fa-wand-magic-sparkles mr-1"></i> REMIX
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: All-Time Hall of Fame */}
      {activeSubTab === "hallOfFame" && (
        <div className="space-y-6">
          {sortedMemes.length === 0 ? (
            <div className="py-20 text-center text-slate-500 italic">
              No memes published yet. Go publish the first viral meme!
            </div>
          ) : (
            <div className="space-y-6">
              {/* Podium */}
              {podium.map((meme, idx) => {
                const style = getRankBadge(idx)!;
                return (
                  <div
                    key={`${meme.id}-podium-${idx}`}
                    className={`relative bg-slate-800/40 rounded-3xl p-4 border ${style.border} shadow-2xl transition-all hover:scale-[1.01] duration-300`}
                  >
                    {/* Rank Header */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <i className={style.icon}></i>
                        <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${style.bg}`}>
                          {style.rankText}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-300 font-extrabold text-xs bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-800">
                        <i className="fa-solid fa-heart text-pink-500 animate-pulse mr-0.5"></i>
                        {meme.likes}
                      </div>
                    </div>

                    {/* Meme Canvas */}
                    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800/80">
                      <MemeCanvas {...meme} isPro={isPro} />
                    </div>

                    {/* Footer details */}
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs font-bold text-slate-300">
                        by <span className="text-purple-400">@{meme.creator}</span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onLike(meme.id)}
                          className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all"
                        >
                          <i className="fa-solid fa-heart mr-1"></i> LIKE
                        </button>
                        <button
                          onClick={() => onRemix(meme)}
                          className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-purple-500/20"
                        >
                          <i className="fa-solid fa-wand-magic-sparkles mr-1"></i> REMIX
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Runners Up List */}
              {runnersUp.length > 0 && (
                <div className="bg-slate-800/20 rounded-3xl border border-slate-800 p-4 space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    RUNNERS UP
                  </h3>
                  <div className="divide-y divide-slate-800/60">
                    {runnersUp.map((meme, idx) => (
                      <div
                        key={`${meme.id}-runnerup-${idx}`}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 border border-slate-700/40">
                            {idx + 4}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-200 truncate">
                              &quot;{meme.topText || meme.bottomText}&quot;
                            </p>
                            <p className="text-[10px] text-slate-500">
                              by @{meme.creator}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onLike(meme.id)}
                            className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 bg-slate-800/40 px-2 py-1.5 rounded-lg border border-slate-700/30 hover:text-pink-400 transition-all"
                          >
                            <i className="fa-solid fa-heart text-pink-500 mr-0.5"></i>
                            {meme.likes}
                          </button>
                          <button
                            onClick={() => onRemix(meme)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-400 hover:text-white transition-all text-[11px]"
                          >
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: Creator Leaderboard with Points & Pro Badges */}
      {activeSubTab === "creators" && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-ranking-star text-amber-400"></i>
              <span>Creator Points &amp; Pro Badges</span>
            </h3>
            <span className="text-[10px] text-slate-400">Ranked by Points</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {creatorsLeaderboard.map((creator, index) => {
              const isCurrent = creator.name.toLowerCase() === currentUser.toLowerCase();
              return (
                <div
                  key={creator.name}
                  className={`flex items-center justify-between py-3.5 px-2 rounded-2xl transition-all ${
                    isCurrent ? "bg-purple-950/40 border border-purple-500/30 my-1" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 text-center font-black text-xs ${
                        index === 0
                          ? "text-amber-400"
                          : index === 1
                          ? "text-slate-300"
                          : index === 2
                          ? "text-amber-600"
                          : "text-slate-500"
                      }`}
                    >
                      #{index + 1}
                    </span>

                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center font-black text-xs text-white shadow-md shrink-0">
                      {creator.name[0].toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-200 truncate">
                          @{creator.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[8px] bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded font-bold uppercase">
                            You
                          </span>
                        )}
                        {creator.isProBadge && (
                          <span
                            className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm"
                            title="Pro Creator Badge"
                          >
                            <i className="fa-solid fa-crown text-[7px]"></i> PRO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="text-amber-400 font-bold">{creator.points} pts</span>
                        {creator.streak > 0 && (
                          <span className="text-orange-400 flex items-center gap-0.5 font-bold">
                            <i className="fa-solid fa-fire text-[9px]"></i> {creator.streak}d streak
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {creator.badges.slice(0, 1).map((b) => (
                      <span
                        key={b}
                        className="text-[9px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md font-semibold hidden sm:inline"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

