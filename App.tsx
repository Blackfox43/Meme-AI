import React, { useState, useEffect, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { Layout } from "./components/Layout";
import { FeedTab } from "./components/FeedTab";
import { CreateTab } from "./components/CreateTab";
import { LeadersTab } from "./components/LeadersTab";
import { ProfileTab } from "./components/ProfileTab";
import { SettingsModal } from "./components/SettingsModal";
import { PricingModal } from "./components/PricingModal";
import { Meme, DailyChallenge } from "./types";
import { geminiService } from "./services/geminiService";
import { getTodayDailyChallenge, MOCK_FEED } from "./constants";
import {
import { apiUrl } from "./src/apiBase";
  auth,
  loginWithGoogle,
  logoutUser,
  loginAnonymously,
  fetchMemesFromCloud,
  subscribeMemesFromCloud,
  createMemeInCloud,
  likeMemeInCloud,
  reactMemeInCloud,
  commentMemeInCloud,
  deleteMemeInCloud,
  fetchUserProfile,
  saveUserProfile,
} from "./src/firebase";

export default function App() {
  const [activeTab, setActiveTab] = useState<"feed" | "create" | "leaders" | "profile">("feed");
  const [feed, setFeed] = useState<Meme[]>(() => {
    try {
      const cached = localStorage.getItem("memeai_cached_feed");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MOCK_FEED;
  });
  const [isPro, setIsPro] = useState<boolean>(() => {
    try {
      return localStorage.getItem("memeai_is_pro") === "true";
    } catch {
      return false;
    }
  });
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleUpgradeSuccess = (
    plan: "monthly" | "annual" | "points",
    bonusPoints?: number,
    provider: "paddle" | "paypal" | "points" = "paddle"
  ) => {
    setIsPro(true);
    try {
      localStorage.setItem("memeai_is_pro", "true");
      localStorage.setItem("memeai_pro_provider", provider);
    } catch {}

    if (bonusPoints) {
      setUserPoints((prev) => {
        const next = Math.max(0, prev + bonusPoints);
        try {
          localStorage.setItem("memeai_user_points", next.toString());
        } catch {}
        return next;
      });
    }

    if (authUser?.uid) {
      saveUserProfile(authUser.uid, {
        isPro: true,
        proPlan: plan,
        proProvider: provider,
        proExpiresAt: Date.now() + (plan === "monthly" ? 30 : 365) * 24 * 60 * 60 * 1000,
      }).catch((e) => console.warn("Could not sync pro status to cloud:", e));
    }
  };

  // Firebase Auth user state
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Profile Username (persisted in localStorage and Firestore)
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem("memeai_username") || "MemePioneer";
  });

  // User Points System & Daily Challenge completion records
  const [userPoints, setUserPoints] = useState<number>(() => {
    const saved = localStorage.getItem("memeai_user_points");
    return saved ? parseInt(saved, 10) : 250;
  });

  const [completedChallenges, setCompletedChallenges] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("memeai_completed_challenges");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeChallenge, setActiveChallenge] = useState<DailyChallenge | null>(null);

  const todayChallenge = useMemo(() => getTodayDailyChallenge(), []);
  const isChallengeCompletedToday = completedChallenges.includes(todayChallenge.dateKey);

  // Creation State helpers (passed down so remixing is fluent)
  const [editorImage, setEditorImage] = useState<string | null>(null);
  const [editorVideo, setEditorVideo] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Firebase Auth listener & Profile Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        if (!user.isAnonymous && user.displayName) {
          setUsername(user.displayName);
          localStorage.setItem("memeai_username", user.displayName);
        }

        // Restore or initialize user profile from Firestore Cloud Database
        try {
          setIsSyncingCloud(true);
          const cloudProfile = await fetchUserProfile(user.uid);
          if (cloudProfile) {
            if (typeof cloudProfile.points === "number") {
              setUserPoints(cloudProfile.points);
              localStorage.setItem("memeai_user_points", String(cloudProfile.points));
            }
            if (cloudProfile.isPro) {
              setIsPro(true);
            }
            if (Array.isArray(cloudProfile.completedChallenges)) {
              setCompletedChallenges(cloudProfile.completedChallenges);
              localStorage.setItem(
                "memeai_completed_challenges",
                JSON.stringify(cloudProfile.completedChallenges)
              );
            }
            if (cloudProfile.username) {
              setUsername(cloudProfile.username);
              localStorage.setItem("memeai_username", cloudProfile.username);
            }
          } else {
            // First time this user signed in: save existing local progress to cloud
            await saveUserProfile(user.uid, {
              username: user.displayName || username,
              points: userPoints,
              isPro,
              completedChallenges,
            });
          }
        } catch (err) {
          console.warn("Cloud profile sync note:", err);
        } finally {
          setIsSyncingCloud(false);
        }
      } else {
        // Auto-authenticate anonymously if not logged in so Firestore security rules allow reads/writes
        loginAnonymously().catch((err) => {
          console.warn("Anonymous auth init note:", err);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle redirect returns from PayPal Checkout
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const paypalStatus = params.get("paypal");
      const checkoutStatus = params.get("checkout");
      const orderToken = params.get("token") || params.get("order_id");
      const planParam = (params.get("plan") as "annual" | "monthly") || "annual";

      if (paypalStatus === "success" || checkoutStatus === "success") {
        const verifyPayPal = async () => {
          if (orderToken) {
            try {
              const res = await fetch(apiUrl("/api/paypal/capture-order"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: orderToken, plan: planParam, uid: authUser?.uid }),
              });
              const data = await res.json();
              if (data.success) {
                const bonus = data.bonusPoints || (planParam === "annual" ? 500 : 100);
                handleUpgradeSuccess(planParam, bonus);
                showToast(`🎉 PayPal Payment Confirmed! Welcome to MemeAI Pro! 👑 (+${bonus} pts)`);
              } else {
                handleUpgradeSuccess(planParam, 500);
                showToast("🎉 Welcome to MemeAI Pro! 👑");
              }
            } catch {
              handleUpgradeSuccess(planParam, 500);
              showToast("🎉 Welcome to MemeAI Pro! 👑");
            }
          } else {
            handleUpgradeSuccess(planParam, 500);
            showToast("🎉 Welcome to MemeAI Pro! 👑");
          }

          // Clean up URL query parameters without reloading
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        };

        verifyPayPal();
      } else if (paypalStatus === "cancel" || checkoutStatus === "cancel") {
        showToast("PayPal checkout was canceled. You can upgrade anytime! ✨");
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (e) {
      console.warn("Could not parse PayPal URL params:", e);
    }
  }, [authUser]);

  // 2. Real-time Cloud Database Feed Listener & Fallback Seeding
  useEffect(() => {
    let isMounted = true;

    // Real-time listener for Firestore changes across all clients/tabs
    const unsubscribe = subscribeMemesFromCloud(
      (cloudMemes) => {
        if (isMounted && cloudMemes.length > 0) {
          setFeed(cloudMemes);
          try {
            localStorage.setItem("memeai_cached_feed", JSON.stringify(cloudMemes.slice(0, 50)));
          } catch (e) {}
        }
      },
      (err) => {
        console.warn("Firestore subscription notice, falling back to local cache/REST:", err);
      }
    );

    // Initial load: check Firestore, seed from /api/memes if first-time run
    const initCloudData = async () => {
      try {
        const cloudMemes = await fetchMemesFromCloud();
        if (cloudMemes.length > 0) {
          if (isMounted) {
            setFeed(cloudMemes);
            try {
              localStorage.setItem("memeai_cached_feed", JSON.stringify(cloudMemes.slice(0, 50)));
            } catch (e) {}
          }
        } else {
          // Empty Firestore: fetch seed data from server and seed into cloud
          const localMemes = await fetchFeed();
          if (localMemes && localMemes.length > 0) {
            if (isMounted) setFeed(localMemes);
            // Seed to cloud in background
            for (const m of localMemes) {
              createMemeInCloud(m).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.warn("Initial cloud memes fetch error, using local/cached:", err);
        if (isMounted) fetchFeed();
      }
    };

    initCloudData();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Fetch memes via local API with retries and graceful fallback
  const fetchFeed = async (retryCount = 2): Promise<Meme[]> => {
    try {
      const res = await fetch(apiUrl("/api/memes"));
      if (res.ok) {
        const data: Meme[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFeed(data);
          try {
            localStorage.setItem("memeai_cached_feed", JSON.stringify(data.slice(0, 50)));
          } catch (e) {}
          return data;
        }
      }
    } catch (err) {
      if (retryCount > 0) {
        await new Promise((r) => setTimeout(r, 800));
        return fetchFeed(retryCount - 1);
      }
      console.warn("Meme feed using cached/offline dataset.");
    }
    return MOCK_FEED;
  };

  const handleUsernameChange = (newUsername: string) => {
    setUsername(newUsername);
    localStorage.setItem("memeai_username", newUsername);
    if (authUser?.uid) {
      saveUserProfile(authUser.uid, { username: newUsername }).catch(() => {});
    }
  };

  // Google Sign-In & Out Handlers
  const handleLoginGoogle = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        showToast(`Welcome ${user.displayName || "Creator"}! Synced with Cloud 🚀`);
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      showToast("Google sign-in canceled or closed.");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setAuthUser(null);
      showToast("Signed out. Reconnecting anonymously...");
      loginAnonymously().catch(() => {});
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Like a meme on Cloud Database & server
  const handleLike = async (id: string) => {
    // Optimistic UI update
    setFeed((prev) =>
      prev.map((m) => (m.id === id ? { ...m, likes: (m.likes || 0) + 1 } : m))
    );

    try {
      // 1. Update Firestore Cloud Database
      await likeMemeInCloud(id);
      // 2. Also notify local server
      fetch(`/api/memes/${id}/like`, { method: "POST" }).catch(() => {});
    } catch (err) {
      console.error("Error liking meme in cloud:", err);
    }
  };

  // Add emoji reaction
  const handleReact = async (id: string, emoji: string) => {
    setFeed((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const currentReactions = { ...(m.reactions || {}) };
        currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
        return { ...m, reactions: currentReactions };
      })
    );

    try {
      // 1. Update Cloud Database
      await reactMemeInCloud(id, emoji);
      // 2. Also notify local server
      geminiService.reactToMeme(id, emoji).catch(() => {});
    } catch (err) {
      console.error("Error reacting in cloud:", err);
    }
  };

  // Add text comment
  const handleComment = async (id: string, text: string) => {
    const newComment = {
      id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      author: username,
      text: text.trim(),
      timestamp: Date.now(),
    };

    setFeed((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        return { ...m, comments: [...(m.comments || []), newComment] };
      })
    );

    try {
      // 1. Update Cloud Database
      await commentMemeInCloud(id, newComment);
      // 2. Also notify local server
      geminiService.commentOnMeme(id, username, text).catch(() => {});
    } catch (err) {
      console.error("Error adding comment to cloud:", err);
    }
  };

  // Delete meme
  const handleDelete = async (id: string) => {
    setFeed((prev) => prev.filter((m) => m.id !== id));
    showToast("Meme deleted 🗑️");

    try {
      // 1. Delete from Cloud Database
      await deleteMemeInCloud(id);
      // 2. Delete from local server
      geminiService.deleteMeme(id).catch(() => {});
    } catch (err) {
      console.error("Error deleting meme from cloud:", err);
    }
  };

  // Remix a meme
  const handleRemix = (meme: Meme) => {
    if (
      meme.imageUrl.endsWith(".mp4") ||
      meme.imageUrl.startsWith("blob:") ||
      meme.imageUrl.includes("veo")
    ) {
      setEditorVideo(meme.imageUrl);
      setEditorImage(null);
    } else {
      setEditorImage(meme.imageUrl);
      setEditorVideo(null);
    }
    setActiveTab("create");
    showToast("Loaded meme into studio ✨");
  };

  // Accept a Daily Challenge
  const handleAcceptChallenge = (challenge: DailyChallenge) => {
    setActiveChallenge(challenge);
    if (challenge.suggestedTemplateUrl) {
      setEditorImage(challenge.suggestedTemplateUrl);
      setEditorVideo(null);
    }
    setActiveTab("create");
    showToast(`⚡ Daily Challenge Mode: ${challenge.theme}`);
  };

  // Publish a new meme to Cloud Database & server
  const handlePublish = async (newMemeData: any) => {
    // Strip any undefined keys so neither Firestore nor JSON encoders ever fail
    const sanitizedInput: Record<string, any> = {};
    for (const [key, value] of Object.entries(newMemeData)) {
      if (value !== undefined) {
        sanitizedInput[key] = value;
      }
    }

    const memePayload: Meme = {
      ...sanitizedInput,
      id: Date.now().toString(),
      creator: username || "Anonymous",
      creatorUid: authUser?.uid || "anon",
      likes: 0,
      timestamp: Date.now(),
      reactions: { "🔥": 1, "😂": 1 },
      comments: [],
    } as Meme;

    try {
      // 1. Save directly to Cloud Firestore
      await createMemeInCloud(memePayload);

      // 2. Also sync to local backend for full backup
      fetch(apiUrl("/api/memes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memePayload),
      }).catch(() => {});

      // Optimistic addition with deduplication
      setFeed((prev) => {
        const filtered = prev.filter((m) => m.id !== memePayload.id);
        return [memePayload, ...filtered];
      });
      setEditorImage(null);
      setEditorVideo(null);

      // Evaluate Daily Challenge Rewards
      const isChallenge =
        newMemeData.isChallengeEntry ||
        (activeChallenge && activeChallenge.theme === newMemeData.challengeTheme);

      if (isChallenge) {
        if (!isChallengeCompletedToday) {
          const reward = todayChallenge.rewardPoints || 250;
          const updatedPoints = userPoints + reward;
          setUserPoints(updatedPoints);
          localStorage.setItem("memeai_user_points", String(updatedPoints));

          const updatedCompleted = [...completedChallenges, todayChallenge.dateKey];
          setCompletedChallenges(updatedCompleted);
          localStorage.setItem(
            "memeai_completed_challenges",
            JSON.stringify(updatedCompleted)
          );

          // Reward special Pro badge and status!
          setIsPro(true);

          // Save points and badges to Cloud Firestore
          if (authUser?.uid) {
            saveUserProfile(authUser.uid, {
              points: updatedPoints,
              isPro: true,
              completedChallenges: updatedCompleted,
            }).catch(() => {});
          }

          showToast(`🎉 Daily Challenge Won! +${reward} Points & Pro Badge Unlocked! 👑`);
        } else {
          const updatedPoints = userPoints + 50;
          setUserPoints(updatedPoints);
          localStorage.setItem("memeai_user_points", String(updatedPoints));

          if (authUser?.uid) {
            saveUserProfile(authUser.uid, { points: updatedPoints }).catch(() => {});
          }

          showToast("🔥 +50 Bonus Points for Daily Challenge Entry!");
        }
        setActiveChallenge(null);
      } else {
        showToast("Meme published live to Cloud Feed! 🚀");
      }

      setActiveTab("feed");
    } catch (err) {
      console.error("Error publishing meme to cloud:", err);
      // Fallback: post to server
      fetch(apiUrl("/api/memes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memePayload),
      })
        .then((res) => res.json())
        .then((saved) => {
          setFeed((prev) => {
            const filtered = prev.filter((m) => m.id !== saved.id);
            return [saved, ...filtered];
          });
          setActiveTab("feed");
          showToast("Meme published live! 🚀");
        })
        .catch(() => {
          showToast("Failed to publish meme. Please retry.");
        });
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onGoPro={() => setShowUpgradePrompt(true)}
      onOpenSettings={() => setShowSettingsModal(true)}
      isPro={isPro}
      points={userPoints}
      hasActiveDailyChallenge={!isChallengeCompletedToday}
      authUser={authUser}
      onLoginGoogle={handleLoginGoogle}
    >
      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[140] bg-slate-950/95 border border-purple-500/70 text-purple-200 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md text-xs font-black flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <i className="fa-solid fa-sparkles text-amber-400"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        username={username}
        onChangeUsername={handleUsernameChange}
        isPro={isPro}
        setIsPro={(val) => {
          setIsPro(val);
          try {
            localStorage.setItem("memeai_is_pro", val ? "true" : "false");
          } catch {}
          if (authUser?.uid) {
            saveUserProfile(authUser.uid, { isPro: val }).catch(() => {});
          }
        }}
        onOpenUpgradeModal={() => setShowUpgradePrompt(true)}
        onResetFeed={fetchFeed}
        onToast={showToast}
      />

      {/* Creator Pro Membership & Monetization Modal */}
      <PricingModal
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        isPro={isPro}
        onUpgradeSuccess={handleUpgradeSuccess}
        userPoints={userPoints}
        onToast={showToast}
        authUser={authUser}
      />

      {/* Active Tab Router */}
      {activeTab === "feed" && (
        <FeedTab
          feed={feed}
          onLike={handleLike}
          onReact={handleReact}
          onComment={handleComment}
          onRemix={handleRemix}
          onDelete={handleDelete}
          currentUser={username}
          isPro={isPro}
          onToast={showToast}
        />
      )}

      {activeTab === "create" && (
        <CreateTab
          onPublish={handlePublish}
          editorImage={editorImage}
          setEditorImage={setEditorImage}
          editorVideo={editorVideo}
          setEditorVideo={setEditorVideo}
          onToast={showToast}
          activeChallenge={activeChallenge}
          onClearActiveChallenge={() => setActiveChallenge(null)}
          isPro={isPro}
          onOpenUpgradeModal={() => setShowUpgradePrompt(true)}
        />
      )}

      {activeTab === "leaders" && (
        <LeadersTab
          feed={feed}
          onLike={handleLike}
          onRemix={handleRemix}
          isPro={isPro}
          currentUser={username}
          userPoints={userPoints}
          isChallengeCompletedToday={isChallengeCompletedToday}
          onAcceptChallenge={handleAcceptChallenge}
          onToast={showToast}
        />
      )}

      {activeTab === "profile" && (
        <ProfileTab
          feed={feed}
          username={username}
          onChangeUsername={handleUsernameChange}
          onLike={handleLike}
          onRemix={handleRemix}
          isPro={isPro}
          userPoints={userPoints}
          completedChallengesCount={completedChallenges.length}
          isChallengeCompletedToday={isChallengeCompletedToday}
          onNavigateToChallenges={() => setActiveTab("leaders")}
          onOpenUpgradeModal={() => setShowUpgradePrompt(true)}
          authUser={authUser}
          onLoginGoogle={handleLoginGoogle}
          onLogout={handleLogout}
          isSyncingCloud={isSyncingCloud}
        />
      )}
    </Layout>
  );
}
