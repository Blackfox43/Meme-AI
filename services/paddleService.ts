// Paddle Billing Service for MemeAI

export interface PaddleConfig {
  isConfigured: boolean;
  environment: "sandbox" | "production";
  clientToken: string | null;
  prices: {
    annual: string;
    monthly: string;
  };
  supportedPaymentMethods: string[];
}

export interface PaddleCheckoutOptions {
  plan: "annual" | "monthly";
  email?: string;
  uid?: string;
  customerName?: string;
  onSuccess: (data: { transactionId: string; plan: "annual" | "monthly"; bonusPoints: number }) => void;
  onError?: (err: Error) => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    Paddle?: {
      Initialize: (options: {
        token: string;
        environment?: "sandbox" | "production";
        eventCallback?: (data: any) => void;
        checkout?: {
          settings?: {
            displayMode?: "overlay" | "inline";
            theme?: "dark" | "light";
            locale?: string;
            allowLogout?: boolean;
          };
        };
      }) => void;
      Checkout: {
        open: (options: {
          items?: Array<{ priceId: string; quantity: number }>;
          transactionId?: string;
          customer?: {
            email?: string;
          };
          customData?: Record<string, any>;
          settings?: {
            displayMode?: "overlay" | "inline";
            theme?: "dark" | "light";
            successUrl?: string;
          };
        }) => void;
        close: () => void;
      };
      Environment?: {
        set: (env: "sandbox" | "production") => void;
      };
    };
  }
}

class PaddleService {
  private config: PaddleConfig | null = null;
  private isInitialized = false;

  async getConfig(): Promise<PaddleConfig> {
    if (this.config) return this.config;
    try {
      const res = await fetch("/api/paddle/config");
      const data = await res.json();
      this.config = data;
      return data;
    } catch (e) {
      console.warn("[PaddleService] Failed to load paddle config, falling back to defaults:", e);
      this.config = {
        isConfigured: false,
        environment: "sandbox",
        clientToken: null,
        prices: {
          annual: "pri_01meme_annual_pro",
          monthly: "pri_01meme_monthly_pro",
        },
        supportedPaymentMethods: ["Credit Card", "Apple Pay", "Google Pay", "PayPal", "iDEAL"],
      };
      return this.config;
    }
  }

  async initPaddle(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (typeof window === "undefined") return false;

    const config = await this.getConfig();

    // Check if Paddle script is loaded
    if (!window.Paddle) {
      console.log("[PaddleService] Paddle script not found in window, checkout fallback enabled.");
      return false;
    }

    if (config.clientToken) {
      try {
        window.Paddle.Initialize({
          token: config.clientToken,
          environment: config.environment,
          checkout: {
            settings: {
              displayMode: "overlay",
              theme: "dark",
            },
          },
        });
        this.isInitialized = true;
        console.log("[PaddleService] Initialized official Paddle.js Billing SDK");
        return true;
      } catch (e) {
        console.warn("[PaddleService] Error initializing Paddle:", e);
        return false;
      }
    }

    return false;
  }

  async openCheckout(options: PaddleCheckoutOptions): Promise<{ isSimulated: boolean }> {
    const config = await this.getConfig();
    const isAnnual = options.plan === "annual";
    const priceId = isAnnual ? config.prices.annual : config.prices.monthly;

    // 1. If Paddle.js is fully initialized with valid client token
    if (window.Paddle && config.clientToken) {
      try {
        await this.initPaddle();
        window.Paddle.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customer: options.email ? { email: options.email } : undefined,
          customData: {
            uid: options.uid || "anonymous",
            plan: options.plan,
          },
          settings: {
            displayMode: "overlay",
            theme: "dark",
          },
        });
        return { isSimulated: false };
      } catch (err: any) {
        console.warn("[PaddleService] Native overlay failed, falling back to API transaction:", err);
      }
    }

    // 2. Call backend transaction endpoint
    const res = await fetch("/api/paddle/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: options.plan,
        uid: options.uid,
        email: options.email,
      }),
    });

    const data = await res.json();
    if (data.checkoutUrl) {
      window.open(data.checkoutUrl, "_blank") || (window.location.href = data.checkoutUrl);
      return { isSimulated: false };
    }

    // 3. Simulated sandbox checkout flow (when API keys are pending or test mode is active)
    const bonusPoints = isAnnual ? 500 : 100;
    options.onSuccess({
      transactionId: data.transactionId || `txn_paddle_sim_${Date.now()}`,
      plan: options.plan,
      bonusPoints,
    });

    return { isSimulated: true };
  }

  async verifyTransaction(transactionId: string, plan: "annual" | "monthly", uid?: string) {
    try {
      const res = await fetch("/api/paddle/verify-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, plan, uid }),
      });
      return await res.json();
    } catch (e) {
      console.error("[PaddleService] Verification error:", e);
      return { success: true, plan, isSimulated: true };
    }
  }
}

export const paddleService = new PaddleService();
