import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { paddleService, PaddleConfig } from "../services/paddleService";
import { apiUrl } from "../src/apiBase";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  onUpgradeSuccess: (
    plan: "monthly" | "annual" | "points",
    bonusPoints?: number,
    provider?: "paddle" | "paypal" | "points"
  ) => void;
  userPoints: number;
  onToast: (msg: string) => void;
  authUser?: User | null;
}

interface PayPalConfig {
  isConfigured: boolean;
  clientId: string | null;
  environment: string;
  paymentLinks?: {
    annual: string | null;
    monthly: string | null;
  };
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  isPro,
  onUpgradeSuccess,
  userPoints,
  onToast,
  authUser,
}) => {
  const [paymentProvider, setPaymentProvider] = useState<"paddle" | "paypal" | "points">("paddle");
  const [selectedPlan, setSelectedPlan] = useState<"annual" | "monthly" | "points">("annual");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paddleConfig, setPaddleConfig] = useState<PaddleConfig | null>(null);
  const [paypalConfig, setPaypalConfig] = useState<PayPalConfig | null>(null);

  // Interactive Paddle Checkout drawer for sandbox / seamless test card entry
  const [showPaddleCardDrawer, setShowPaddleCardDrawer] = useState(false);
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("888");
  const [cardZip, setCardZip] = useState("94105");

  // Fetch Paddle and PayPal configurations from backend
  useEffect(() => {
    if (!isOpen) return;

    // Load Paddle configuration
    paddleService
      .getConfig()
      .then((cfg) => setPaddleConfig(cfg))
      .catch((e) => console.warn("Paddle config load warning:", e));

    // Try initializing Paddle.js if present
    paddleService.initPaddle().catch(() => {});

    // Load PayPal configuration
    fetch(apiUrl("/api/paypal/config"))
      .then((res) => res.json())
      .then((data: PayPalConfig) => setPaypalConfig(data))
      .catch((err) => console.warn("Could not load PayPal config:", err));
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Paddle Checkout Handler
  const handlePaddleCheckout = async () => {
    setIsProcessing(true);
    try {
      const res = await paddleService.openCheckout({
        plan: selectedPlan === "points" ? "annual" : selectedPlan,
        email: authUser?.email || undefined,
        uid: authUser?.uid || undefined,
        onSuccess: (data) => {
          onUpgradeSuccess(data.plan, data.bonusPoints, "paddle");
          onToast(
            `👑 Welcome to MemeAI Pro! Unlocked via Paddle Billing (+${data.bonusPoints} Points) ✨`
          );
          onClose();
        },
        onError: (err) => {
          onToast(err.message || "Paddle checkout failed. Please try again.");
        },
      });

      if (!res.isSimulated) {
        onToast("Paddle Checkout initialized... 💳");
      } else {
        // If simulated or sandbox mode, open the realistic Paddle card drawer for seamless verification
        setShowPaddleCardDrawer(true);
      }
    } catch (e: any) {
      onToast(e?.message || "Paddle checkout encountered an issue.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Complete Simulated Paddle Card Transaction
  const handleConfirmPaddleCard = async () => {
    setIsProcessing(true);
    try {
      const plan = selectedPlan === "points" ? "annual" : selectedPlan;
      const verified = await paddleService.verifyTransaction(
        `txn_pad_${Date.now()}`,
        plan,
        authUser?.uid
      );

      const bonus = plan === "annual" ? 500 : 100;
      onUpgradeSuccess(plan, bonus, "paddle");
      onToast(
        `🎉 Paddle Payment Authorized! You are now MemeAI Pro with 4K exports & clean memes! (+${bonus} pts)`
      );
      setShowPaddleCardDrawer(false);
      onClose();
    } catch (e) {
      onToast("Payment verification failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. PayPal Checkout Handler
  const handlePayPalCheckout = async () => {
    setIsProcessing(true);
    try {
      const plan = selectedPlan === "points" ? "annual" : selectedPlan;
      const res = await fetch(apiUrl("/api/paypal/create-order"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          uid: authUser?.uid,
          email: authUser?.email,
        }),
      });

      const data = await res.json();

      if (data.url) {
        onToast("Redirecting to PayPal Checkout... 💳");
        setTimeout(() => {
          window.open(data.url, "_blank") || (window.location.href = data.url);
        }, 600);
        return;
      }

      // Simulated or captured fallback
      const bonus = plan === "annual" ? 500 : 100;
      onUpgradeSuccess(plan, bonus, "paypal");
      onToast(`👑 Welcome to MemeAI Pro via PayPal! (+${bonus} Bonus Points) ✨`);
      onClose();
    } catch (e) {
      onToast("PayPal checkout error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Creator Points Redemption Handler
  const handlePointsRedemption = async () => {
    if (userPoints < 500) {
      onToast("You need at least 500 points to redeem 1 Month of Pro! Complete Daily Challenges to earn more ⭐");
      return;
    }
    setIsProcessing(true);
    try {
      await fetch(apiUrl("/api/subscription/activate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "points_monthly",
          paymentMethod: "reward_points",
          uid: authUser?.uid,
        }),
      });
      onUpgradeSuccess("points", -500, "points");
      onToast("🎉 500 Points Redeemed! Welcome to MemeAI Pro! 👑");
      onClose();
    } catch (e) {
      onToast("Failed to redeem points. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Unified Checkout Trigger
  const handleMainAction = () => {
    if (paymentProvider === "points" || selectedPlan === "points") {
      handlePointsRedemption();
    } else if (paymentProvider === "paddle") {
      handlePaddleCheckout();
    } else {
      handlePayPalCheckout();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-6 text-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-black text-2xl">
              {paymentProvider === "paddle" ? (
                <i className="fa-solid fa-credit-card"></i>
              ) : paymentProvider === "paypal" ? (
                <i className="fa-brands fa-paypal"></i>
              ) : (
                <i className="fa-solid fa-star text-amber-300"></i>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black italic tracking-tight text-white">
                  MEMEAI CREATOR PRO
                </h2>
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                  OFFICIAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Unlock viral creator tools, watermark removal & 4K exports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Current Pro Status Badge */}
        {isPro && (
          <div className="bg-gradient-to-r from-emerald-950/60 to-slate-800/80 border border-emerald-500/40 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <i className="fa-solid fa-circle-check text-emerald-400 text-base"></i>
              <div>
                <p className="text-xs font-black text-white">Your Pro Membership is Active 👑</p>
                <p className="text-[10px] text-emerald-300/80">
                  Watermark-free 4K downloads & VIP AI access active
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onUpgradeSuccess("monthly", 0);
                onToast("Subscription status refreshed! ✨");
              }}
              className="text-[10px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-all"
            >
              Manage
            </button>
          </div>
        )}

        {/* Payment Gateway Selector Tabs (Paddle vs PayPal vs Points) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            PAYMENT GATEWAY
          </label>
          <div className="grid grid-cols-3 gap-2 bg-slate-800/60 p-1.5 rounded-2xl border border-slate-700/60">
            {/* Paddle Tab */}
            <button
              type="button"
              onClick={() => {
                setPaymentProvider("paddle");
                if (selectedPlan === "points") setSelectedPlan("annual");
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex flex-col items-center gap-1 transition-all ${
                paymentProvider === "paddle"
                  ? "bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-1 text-[11px]">
                <i className="fa-solid fa-shield-halved text-indigo-300"></i>
                <span>Paddle</span>
              </div>
              <span className="text-[8px] font-semibold opacity-80">Cards & Apple Pay</span>
            </button>

            {/* PayPal Tab */}
            <button
              type="button"
              onClick={() => {
                setPaymentProvider("paypal");
                if (selectedPlan === "points") setSelectedPlan("annual");
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex flex-col items-center gap-1 transition-all ${
                paymentProvider === "paypal"
                  ? "bg-gradient-to-b from-[#0070BA] to-[#003087] text-white shadow-md shadow-blue-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-1 text-[11px]">
                <i className="fa-brands fa-paypal text-[#FFC439]"></i>
                <span>PayPal</span>
              </div>
              <span className="text-[8px] font-semibold opacity-80">Express Wallet</span>
            </button>

            {/* Points Tab */}
            <button
              type="button"
              onClick={() => {
                setPaymentProvider("points");
                setSelectedPlan("points");
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex flex-col items-center gap-1 transition-all ${
                paymentProvider === "points"
                  ? "bg-gradient-to-b from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-1 text-[11px]">
                <i className="fa-solid fa-star"></i>
                <span>Points</span>
              </div>
              <span className="text-[8px] font-semibold opacity-80">{userPoints} ⭐ Available</span>
            </button>
          </div>
        </div>

        {/* Pricing Tier Selector */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            SELECT MEMBERSHIP PLAN
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Annual Option */}
            {paymentProvider !== "points" && (
              <div
                onClick={() => setSelectedPlan("annual")}
                className={`relative p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedPlan === "annual"
                    ? paymentProvider === "paddle"
                      ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/15"
                      : "bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/15"
                    : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedPlan === "annual"
                        ? paymentProvider === "paddle"
                          ? "border-indigo-400 bg-indigo-600 text-white text-[10px]"
                          : "border-blue-400 bg-blue-600 text-white text-[10px]"
                        : "border-slate-600"
                    }`}
                  >
                    {selectedPlan === "annual" && <i className="fa-solid fa-check"></i>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-white uppercase">Annual Pass</p>
                      <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        SAVE 40% &amp; BEST VALUE
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      $3.33/mo ($39.99 billed yearly) • Includes +500 Bonus Points ⭐
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-amber-300">$39.99</p>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">/ year</p>
                </div>
              </div>
            )}

            {/* Monthly Option */}
            {paymentProvider !== "points" && (
              <div
                onClick={() => setSelectedPlan("monthly")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedPlan === "monthly"
                    ? paymentProvider === "paddle"
                      ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/15"
                      : "bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/15"
                    : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedPlan === "monthly"
                        ? paymentProvider === "paddle"
                          ? "border-indigo-400 bg-indigo-600 text-white text-[10px]"
                          : "border-blue-400 bg-blue-600 text-white text-[10px]"
                        : "border-slate-600"
                    }`}
                  >
                    {selectedPlan === "monthly" && <i className="fa-solid fa-check"></i>}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase">Monthly Pass</p>
                    <p className="text-[10px] text-slate-400">
                      Flexible monthly billing • Includes +100 Points • Cancel anytime
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">$4.99</p>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">/ month</p>
                </div>
              </div>
            )}

            {/* Redeem Points Option */}
            {(paymentProvider === "points" || selectedPlan === "points") && (
              <div
                onClick={() => {
                  setSelectedPlan("points");
                  setPaymentProvider("points");
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedPlan === "points"
                    ? "bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/50 shadow-lg"
                    : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedPlan === "points"
                        ? "border-amber-400 bg-amber-500 text-slate-950 text-[10px]"
                        : "border-slate-600"
                    }`}
                  >
                    {selectedPlan === "points" && <i className="fa-solid fa-check"></i>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-amber-300 uppercase">Redeem Points</p>
                      <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Balance: {userPoints} ⭐
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Trade 500 creator points for 1 Month of Pro!
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-amber-400">500 PTS</p>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Free</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pro Benefits Grid */}
        <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl space-y-2.5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            ALL PRO PERKS INCLUDED
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-ban text-pink-400 text-xs"></i>
              <span>No Watermarks</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-wand-magic-sparkles text-purple-400 text-xs"></i>
              <span>Unlimited AI Magic</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-tv text-cyan-400 text-xs"></i>
              <span>4K Ultra-Crisp Export</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-crown text-amber-400 text-xs"></i>
              <span>Gold Pro Badge</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-video text-emerald-400 text-xs"></i>
              <span>Priority Veo Video</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-shield-halved text-indigo-400 text-xs"></i>
              <span>Instant Cloud Sync</span>
            </div>
          </div>
        </div>

        {/* Payment Gateway Trust Banners */}
        {paymentProvider === "paddle" && selectedPlan !== "points" && (
          <div className="p-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-950/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-base shadow">
                <i className="fa-solid fa-shield-heart"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-white">Paddle Billing &amp; MoR</span>
                  <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {paddleConfig?.isConfigured ? "PADDLE LIVE" : "SANDBOX READY"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Global Merchant of Record: Credit Cards, Apple Pay, Google Pay, iDEAL &amp; Wire
                </p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <i className="fa-solid fa-lock text-[9px]"></i> 256-bit SSL
              </span>
            </div>
          </div>
        )}

        {paymentProvider === "paypal" && selectedPlan !== "points" && (
          <div className="p-3.5 rounded-2xl border border-blue-500/30 bg-blue-950/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#003087] flex items-center justify-center text-white text-base shadow">
                <i className="fa-brands fa-paypal"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-white">PayPal Express Checkout</span>
                  <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {paypalConfig?.isConfigured ? "PAYPAL LIVE" : "SANDBOX READY"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Pay securely with PayPal balance, Bank Account, or Cards worldwide
                </p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <i className="fa-solid fa-lock text-[9px]"></i> Buyer Protected
              </span>
            </div>
          </div>
        )}

        {/* Realistic Paddle Card Drawer / Sandbox Interactive Tester */}
        {showPaddleCardDrawer && (
          <div className="bg-slate-950 border border-indigo-500/50 p-4 rounded-2xl space-y-3.5 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-black text-indigo-300 uppercase tracking-wider">
                  Paddle Checkout Sheet
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPaddleCardDrawer(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase">Card Number</label>
                <div className="relative mt-0.5">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 text-slate-400 text-xs">
                    <i className="fa-brands fa-cc-visa text-blue-400"></i>
                    <i className="fa-brands fa-cc-mastercard text-amber-500"></i>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Expires</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">CVC</label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Zip / Postal</label>
                  <input
                    type="text"
                    value={cardZip}
                    onChange={(e) => setCardZip(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCardNumber("4242 •••• •••• 4242");
                  setCardExpiry("12/28");
                  setCardCvc("888");
                  setCardZip("94105");
                  onToast("Loaded Paddle test card parameters! 💳");
                }}
                className="flex-1 py-2 rounded-xl text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Auto-Fill Test Card
              </button>
              <button
                type="button"
                onClick={handleConfirmPaddleCard}
                disabled={isProcessing}
                className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-1.5"
              >
                {isProcessing ? (
                  <i className="fa-solid fa-spinner animate-spin"></i>
                ) : (
                  <>
                    <i className="fa-solid fa-lock"></i>
                    <span>Pay {selectedPlan === "annual" ? "$39.99" : "$4.99"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* CTA Action Button */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleMainAction}
            disabled={
              isProcessing ||
              ((paymentProvider === "points" || selectedPlan === "points") && userPoints < 500)
            }
            className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
              paymentProvider === "points" || selectedPlan === "points"
                ? userPoints >= 500
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-amber-500/25"
                  : "bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed"
                : paymentProvider === "paddle"
                ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/30 hover:opacity-95"
                : "bg-gradient-to-r from-[#0070BA] via-[#003087] to-[#001c48] hover:from-[#007cd0] text-white shadow-blue-500/30 hover:opacity-95"
            }`}
          >
            {isProcessing ? (
              <>
                <i className="fa-solid fa-spinner animate-spin"></i>
                <span>PROCESSING...</span>
              </>
            ) : paymentProvider === "points" || selectedPlan === "points" ? (
              userPoints >= 500 ? (
                <>
                  <i className="fa-solid fa-bolt"></i>
                  <span>REDEEM 500 POINTS FOR 1 MONTH PRO</span>
                </>
              ) : (
                <span>NEED {500 - userPoints} MORE POINTS TO REDEEM</span>
              )
            ) : paymentProvider === "paddle" ? (
              <>
                <i className="fa-solid fa-credit-card text-indigo-300"></i>
                <span>
                  PAY WITH PADDLE ({selectedPlan === "annual" ? "$39.99/YR" : "$4.99/MO"})
                </span>
              </>
            ) : (
              <>
                <i className="fa-brands fa-paypal text-base text-[#FFC439]"></i>
                <span>
                  PAY WITH PAYPAL ({selectedPlan === "annual" ? "$39.99/YR" : "$4.99/MO"})
                </span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-medium">
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-shield-halved text-emerald-400"></i>
              {paymentProvider === "paddle"
                ? "Paddle Merchant of Record"
                : paymentProvider === "paypal"
                ? "PayPal 256-bit SSL"
                : "Free Points"}
            </span>
            <span>Cancel anytime</span>
            <span>Instant Pro unlock</span>
          </div>
        </div>
      </div>
    </div>
  );
};
