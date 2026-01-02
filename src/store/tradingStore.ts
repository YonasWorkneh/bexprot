import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { useAuthStore as useAuthStoreHook } from "./authStore";
import { useNotificationStore } from "./notificationStore";
import { getTotalBalance, getUserWallets } from "@/lib/usdtWalletUtils";
import {
  getSystemSettings,
  type SystemSettings,
  DEFAULT_SETTINGS,
} from "@/lib/adminSettings";
import { toast } from "sonner";
import {
  getBalanceWithFallback,
  setCachedBalance,
  updateSnapshotInDB,
} from "@/lib/balanceSnapshot";

export type OrderType = "market" | "limit";
export type OrderSide = "buy" | "sell";
export type OrderStatus = "open" | "filled" | "cancelled";
export type TradingMode = "spot" | "futures" | "contract";

// Track contracts currently being processed to prevent duplicate payouts/notifications
const processingContractIds = new Set<string>();

export interface Order {
  id: string;
  assetId: string;
  assetName: string;
  type: OrderType;
  side: OrderSide;
  price: number;
  amount: number;
  total: number;
  status: OrderStatus;
  timestamp: number;
  filledAt?: number;
  leverage?: number;
  mode?: TradingMode;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Position {
  id: string;
  assetId: string;
  assetName: string;
  side: OrderSide;
  entryPrice: number;
  currentPrice: number;
  amount: number;
  pnl: number;
  pnlPercentage: number;
  openedAt: number;
  leverage?: number;
  mode?: TradingMode;
  expiresAt?: number; // For contracts
  payout?: number; // For contracts (e.g., 85%)
  initialInvestment?: number; // For contracts
  finalResult?: "win" | "loss"; // For completed contracts
  finalProfit?: number; // For completed contracts
  stopLoss?: number;
  takeProfit?: number;
}

export interface WithdrawalHistory {
  id: string;
  amount: number;
  toAddress?: string;
  timestamp: number;
  status: "pending" | "completed" | "failed";
  type: "wallet" | "bank";
}

interface TradingState {
  isDemo: boolean;
  isLoading: boolean;

  // Live Account State
  liveBalance: number;
  externalBalance: number; // Balance from connected external wallet (MetaMask, etc.)
  liveOrders: Order[];
  livePositions: Position[];
  liveOrderHistory: Order[];
  liveWithdrawalHistory: WithdrawalHistory[];
  completedContracts: Position[]; // For UI notifications

  // Demo Account State
  demoBalance: number;
  demoOrders: Order[];
  demoPositions: Position[];
  demoOrderHistory: Order[];
  demoWithdrawalHistory: WithdrawalHistory[];

  // Getters (computed based on isDemo)
  balance: number;
  orders: Order[];
  positions: Position[];
  orderHistory: Order[];
  withdrawalHistory: WithdrawalHistory[];
  systemSettings: SystemSettings;

  // Computed Statistics
  getTotalPnL: () => number;
  getEquity: () => number;
  getOpenPositionsCount: () => number;
  getTotalTrades: () => number;
  getWinRate: () => number;

  // Actions
  toggleDemoMode: () => void;
  resetDemoAccount: () => Promise<void>;
  fetchData: (showLoading?: boolean) => Promise<void>;
  subscribeToChanges: () => () => void;

  placeOrder: (
    order: Omit<Order, "id" | "timestamp" | "status"> & {
      mode?: TradingMode;
      contractTime?: number;
      payout?: number;
      stopLoss?: number;
      takeProfit?: number;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  cancelOrder: (orderId: string) => Promise<void>;
  closePosition: (positionId: string) => Promise<void>;
  updatePositionPrices: (assetId: string, currentPrice: number) => void;
  checkContractExpirations: () => void;
  syncWithWalletBalance: (walletBalance: number) => void;
  withdrawToWallet: (
    amount: number,
    walletAddress?: string
  ) => Promise<{ success: boolean; error?: string }>;
  depositFromWallet: (amount: number) => void;
  fetchUSDTBalance: () => Promise<void>;
}

export const useTradingStore = create<TradingState>()((set, get) => ({
  isDemo: false,
  isLoading: false,

  liveBalance: 0,
  externalBalance: 0,
  liveOrders: [],
  livePositions: [],
  liveOrderHistory: [],
  liveWithdrawalHistory: [],
  completedContracts: [],

  demoBalance: 100000,
  demoOrders: [],
  demoPositions: [],
  demoOrderHistory: [],
  demoWithdrawalHistory: [],

  balance: 0,
  orders: [],
  positions: [],
  orderHistory: [],
  withdrawalHistory: [],
  systemSettings: DEFAULT_SETTINGS,

  // Computed Statistics
  getTotalPnL: () => {
    const { positions } = get();
    return positions.reduce((sum, pos) => sum + pos.pnl, 0);
  },

  getEquity: () => {
    const { balance, positions } = get();
    // Equity = Balance + Sum(Position Value)
    // Position Value = Initial Investment + PnL
    const positionsValue = positions.reduce((sum, pos) => {
      const investment = pos.initialInvestment || pos.amount * pos.entryPrice;
      return sum + investment + pos.pnl;
    }, 0);
    return balance + positionsValue;
  },

  getOpenPositionsCount: () => {
    const { positions } = get();
    return positions.length;
  },

  getTotalTrades: () => {
    const { orderHistory } = get();
    return orderHistory.filter((o) => o.status === "filled").length;
  },

  getWinRate: () => {
    const { positions, orderHistory } = get();
    const totalTrades = orderHistory.filter(
      (o) => o.status === "filled"
    ).length;
    if (totalTrades === 0) return 0;

    const winningTrades = positions.filter((p) => p.pnl > 0).length;
    const completedWinningTrades = orderHistory.filter((o) => {
      // Logic for historical win rate might need adjustment for contracts
      // For now, assuming positive total means win
      return o.total > 0; // Simplified
    }).length;

    // Better logic: check if the trade resulted in profit.
    // Since we don't store PnL in Order history explicitly yet, we'll approximate or improve later.
    // For contracts, we can check if payout > 0.

    return 50; // Placeholder until better history tracking
  },

  toggleDemoMode: () => {
    // Demo mode is disabled
    set({ isDemo: false });
  },

  fetchUSDTBalance: async (forceLive = false) => {
    try {
      const user = useAuthStoreHook.getState().user;
      if (!user) {
        console.log("[fetchUSDTBalance] No user found");
        return;
      }

      const performLiveUpdate = async () => {
        const liveBalance = await getTotalBalance(user.id);
        console.log("[fetchUSDTBalance] Live DB balance:", liveBalance);

        // Always update cache/snapshot with fresh data
        setCachedBalance(user.id, liveBalance);
        updateSnapshotInDB(user.id);

        set((state) => {
          const externalBalance = state.externalBalance || 0;
          if (!state.isDemo) {
            return {
              liveBalance: liveBalance,
              balance: liveBalance + externalBalance,
            };
          }
          return { liveBalance: liveBalance };
        });
        return liveBalance;
      };

      if (forceLive) {
        console.log(
          "[fetchUSDTBalance] Forcing live update (bypassing cache)..."
        );
        await performLiveUpdate();
      } else {
        // Use fallback chain (Cache -> Snapshot -> Live)
        await getBalanceWithFallback(
          user.id,
          async () => {
            const liveBalance = await getTotalBalance(user.id);
            return liveBalance;
          },
          (freshBalance) => {
            console.log(
              "[fetchUSDTBalance] Received fresh balance update:",
              freshBalance
            );
            set((state) => {
              const externalBalance = state.externalBalance || 0;
              if (!state.isDemo) {
                return {
                  liveBalance: freshBalance,
                  balance: freshBalance + externalBalance,
                };
              }
              return { liveBalance: freshBalance };
            });
          }
        );
      }
    } catch (error) {
      console.error("Error fetching USDT balance:", error);
    }
  },

  fetchData: async (showLoading = true) => {
    const { isDemo } = get();
    const user = useAuthStoreHook.getState().user;
    if (!user) return;

    if (showLoading) set({ isLoading: true });

    try {
      // Fetch USDT Balance for Live Mode (independent)
      if (!isDemo) {
        await get().fetchUSDTBalance();
      }

      // Parallel Fetching
      const [
        settings,
        { data: userData },
        { data: portfolio },
        { data: ordersData },
        { data: tradesData },
        { data: withdrawalsData },
      ] = await Promise.all([
        getSystemSettings(),
        supabase.from("users").select("preferences").eq("id", user.id).single(),
        supabase
          .from("portfolio")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_demo", isDemo),
        supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_demo", isDemo)
          .eq("status", "open"),
        supabase
          .from("trades")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_demo", isDemo)
          .order("timestamp", { ascending: false })
          .limit(50),
        supabase
          .from("withdrawals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      // Process Settings
      set({ systemSettings: settings });

      // Process User Preferences
      if (userData?.preferences?.demo_balance !== undefined) {
        set({ demoBalance: userData.preferences.demo_balance });
        if (isDemo) {
          set({ balance: userData.preferences.demo_balance });
        }
      }

      // Process Portfolio
      const positions: Position[] = (portfolio || [])
        .map((p: any) => ({
          id: p.id,
          assetId: p.asset,
          assetName: p.asset.toUpperCase(),
          side: "buy" as OrderSide,
          entryPrice: p.average_price,
          currentPrice: p.average_price,
          amount: p.total_quantity,
          pnl: 0,
          pnlPercentage: 0,
          openedAt: new Date(p.updated_at).getTime(),
          mode: "spot" as TradingMode, // Default to spot for existing data
        }))
        .filter((p: Position) => p.amount > 0);

      // Process Orders
      // Process Orders (Limit)
      const orders: Order[] = (ordersData || []).map((o: any) => ({
        id: o.id,
        assetId: o.asset_id,
        assetName: o.asset_name,
        type: o.type,
        side: o.side,
        price: o.price,
        amount: o.amount,
        total: o.total,
        status: o.status,
        timestamp: new Date(o.created_at).getTime(),
        mode: "spot" as TradingMode,
      }));

      // Process Active Contracts (Persistent)
      let activeContracts: Position[] = [];
      if (!isDemo) {
        const { data: activeContractsData } = await supabase
          .from("active_contracts")
          .select("*")
          .eq("user_id", user.id);

        activeContracts = (activeContractsData || []).map((c: any) => ({
          id: c.id,
          assetId: c.asset_id,
          assetName: c.asset_name,
          side: c.side as OrderSide,
          entryPrice: c.entry_price,
          currentPrice: c.entry_price, // Will be updated by price stream
          amount: c.amount,
          pnl: 0,
          pnlPercentage: 0,
          openedAt: c.opened_at, // Use numeric timestamp stored in DB
          mode: "contract",
          expiresAt: c.expires_at,
          payout: c.payout,
          initialInvestment: c.total,
        }));
      }

      // Process Trade History & Persistent Contracts
      // Split trades into Spot and Contracts
      const spotTrades = (tradesData || []).filter(
        (t: any) => !t.contract_data && !t.payout
      );
      const contractTrades = (tradesData || []).filter(
        (t: any) => t.contract_data || t.payout !== null
      );

      const orderHistory: Order[] = spotTrades.map((t: any) => ({
        id: t.id,
        assetId: t.asset,
        assetName: t.asset.toUpperCase(),
        type: "market",
        side: t.type,
        price: t.price,
        amount: t.quantity,
        total: t.price * t.quantity,
        status: "filled",
        timestamp: new Date(t.timestamp || t.created_at).getTime(),
        filledAt: new Date(t.timestamp || t.created_at).getTime(),
        mode: "spot" as TradingMode,
      }));

      // Map Persistent Contract History
      const persistentCompletedContracts: Position[] = contractTrades.map(
        (t: any) => {
          // Use timestamp instead of open_time since open_time doesn't exist
          const openedAt = t.timestamp
            ? new Date(t.timestamp).getTime()
            : t.created_at
            ? new Date(t.created_at).getTime()
            : Date.now();

          return {
            id: t.id,
            assetId: t.asset,
            assetName: t.asset.toUpperCase(),
            side: t.type as OrderSide,
            entryPrice: t.price,
            currentPrice: t.exit_price || t.price,
            amount: t.quantity,
            pnl: t.profit,
            pnlPercentage: 0,
            openedAt: openedAt,
            mode: "contract",
            expiresAt: openedAt + 60 * 1000, // Default to 60 seconds if not available
            payout: t.payout,
            initialInvestment: Math.abs(t.quantity * t.price),
            finalResult:
              t.status === "win"
                ? "win"
                : t.status === "loss"
                ? "loss"
                : undefined,
            finalProfit: t.profit,
          };
        }
      );

      // Process Withdrawal History
      const withdrawalHistory: WithdrawalHistory[] = (
        withdrawalsData || []
      ).map((w: any) => ({
        id: w.id,
        amount: w.amount,
        toAddress: w.address,
        timestamp: new Date(w.created_at).getTime(),
        status:
          w.status === "approved"
            ? "completed"
            : w.status === "rejected"
            ? "failed"
            : "pending",
        type: w.type === "send" ? "wallet" : "bank", // Simplified mapping
      }));

      if (isDemo) {
        set((state) => ({
          demoPositions: [
            ...state.demoPositions.filter((p) => p.mode !== "spot"),
            ...positions,
          ],
          demoOrders: orders,
          demoOrderHistory: orderHistory,
          demoWithdrawalHistory: withdrawalHistory,

          positions: [
            ...state.demoPositions.filter((p) => p.mode !== "spot"),
            ...positions,
          ],
          orders,
          orderHistory,
          withdrawalHistory,
        }));
      } else {
        set((state) => ({
          livePositions: [...activeContracts, ...positions], // Merge active contracts + spot positions
          liveOrders: orders,
          liveOrderHistory: orderHistory,
          liveWithdrawalHistory: withdrawalHistory,

          // Merge persistent contracts with session contracts
          completedContracts: [...persistentCompletedContracts],

          positions: [...activeContracts, ...positions],
          orders,
          orderHistory,
          withdrawalHistory,
        }));
      }
    } catch (error) {
      console.error("Error fetching trading data:", error);
    } finally {
      if (showLoading) set({ isLoading: false });
    }
  },

  subscribeToChanges: () => {
    const user = useAuthStoreHook.getState().user;
    if (!user) return () => {};

    const isAdmin = user.role === "admin";

    const channel = supabase
      .channel("trading_changes")
      // User-specific changes
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trades",
          filter: `user_id=eq.${user.id}`,
        },
        () => get().fetchData(false)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        () => get().fetchData(false)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "portfolio",
          filter: `user_id=eq.${user.id}`,
        },
        () => get().fetchData(false)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "usdt_wallets",
          filter: `user_id=eq.${user.id}`,
        },
        () => get().fetchUSDTBalance()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "withdrawals",
          filter: `user_id=eq.${user.id}`,
        },
        () => get().fetchData(false)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "crypto_deposits",
          filter: `user_id=eq.${user.id}`,
        },
        () => get().fetchData(false)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wallet_transactions",
          filter: `user_id=eq.${user.id}`,
        },
        () => get().fetchData(false)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          // Update demo balance if it changed in preferences
          const newRecord = payload.new as any;
          const newDemoBalance = newRecord?.preferences?.demo_balance;
          if (newDemoBalance !== undefined) {
            set({ demoBalance: newDemoBalance });
            if (get().isDemo) {
              set({ balance: newDemoBalance });
            }
          }
        }
      )

      // Admin-wide changes (if admin)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "system_settings",
        },
        async () => {
          console.log(
            "[Realtime] System settings changed - fetching latest..."
          );
          const settings = await getSystemSettings();
          set({ systemSettings: settings });
          if (!isAdmin) {
            toast.info("System settings updated");
          }
        }
      );

    // If admin, also subscribe to all deposits and withdrawals for the admin panel alerts/updates
    if (isAdmin) {
      channel
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "crypto_deposits" },
          (payload) => {
            toast.info(`New deposit request: $${payload.new.amount_usd}`);
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "withdrawals" },
          (payload) => {
            toast.info(`New withdrawal request: $${payload.new.amount}`);
          }
        );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  resetDemoAccount: async () => {
    const user = useAuthStoreHook.getState().user;
    if (!user) return;

    try {
      await supabase
        .from("trades")
        .delete()
        .eq("user_id", user.id)
        .eq("is_demo", true);
      await supabase
        .from("orders")
        .delete()
        .eq("user_id", user.id)
        .eq("is_demo", true);
      await supabase
        .from("portfolio")
        .delete()
        .eq("user_id", user.id)
        .eq("is_demo", true);

      const { data: userData } = await supabase
        .from("users")
        .select("preferences")
        .eq("id", user.id)
        .single();
      const newPreferences = {
        ...(userData?.preferences || {}),
        demo_balance: 100000,
      };
      await supabase
        .from("users")
        .update({ preferences: newPreferences })
        .eq("id", user.id);

      set({
        demoBalance: 100000,
        demoOrders: [],
        demoPositions: [],
        demoOrderHistory: [],
        demoWithdrawalHistory: [],
        balance: 100000,
        orders: [],
        positions: [],
        orderHistory: [],
        withdrawalHistory: [],
      });
    } catch (error) {
      console.error("Error resetting demo account:", error);
    }
  },

  placeOrder: async (orderData) => {
    const { isDemo, positions, livePositions, demoPositions } = get();
    const user = useAuthStoreHook.getState().user;
    if (!user) return { success: false, error: "Not authenticated" };

    try {
      const mode = orderData.mode || "spot";
      const leverage = orderData.leverage || 1;

      // Calculate required margin/cost
      const cost =
        mode === "futures" ? orderData.total / leverage : orderData.total;

      // For contract mode, check trading_balance from users table
      let currentBalance: number;
      if (mode === "contract" && !isDemo) {
        // Fetch trading_balance from users table
        const { data: userData, error: balanceError } = await supabase
          .from("users")
          .select("trading_balance")
          .eq("id", user.id)
          .single();

        if (balanceError) {
          console.error(
            "[placeOrder] Error fetching trading balance:",
            balanceError
          );
          return { success: false, error: "Failed to fetch balance" };
        }

        // Convert NUMERIC to number (Supabase returns NUMERIC as string sometimes)
        const rawBalance = userData?.trading_balance;
        currentBalance =
          typeof rawBalance === "string"
            ? parseFloat(rawBalance)
            : (rawBalance as number) || 0;

        console.log("[placeOrder] Contract mode - Trading balance:", {
          raw: rawBalance,
          parsed: currentBalance,
          cost: cost,
          sufficient: currentBalance >= cost,
        });
      } else {
        // For other modes, use existing balance logic
        if (!isDemo) await get().fetchUSDTBalance();
        currentBalance = isDemo ? get().demoBalance : get().liveBalance;
      }

      // Balance Check for Buy
      // Balance Check
      // For Spot Buy, Futures (Buy/Sell), and Contracts (Buy/Sell), we need USDT balance.
      // Only Spot Sell uses Asset balance.
      const requiresUSDT = mode !== "spot" || orderData.side === "buy";

      if (requiresUSDT && cost > currentBalance) {
        console.error("[placeOrder] Insufficient balance:", {
          mode,
          cost,
          currentBalance,
          difference: cost - currentBalance,
          requiresUSDT,
        });
        return {
          success: false,
          error: `Insufficient balance. Required: ${cost.toFixed(
            2
          )}, Available: ${currentBalance.toFixed(2)}`,
        };
      }

      // Asset Balance Check for Spot Sell
      if (mode === "spot" && orderData.side === "sell") {
        const currentPositions = isDemo ? demoPositions : livePositions;
        const assetPosition = currentPositions.find(
          (p) => p.assetId === orderData.assetId && p.mode === "spot"
        );

        if (!assetPosition || assetPosition.amount < orderData.amount) {
          return {
            success: false,
            error: `Insufficient ${orderData.assetName} balance`,
          };
        }
      }

      // Helper to deduct USDT from database wallets
      const deductUSDT = async (amount: number) => {
        if (isDemo || !user) return;
        console.log(
          `[deductUSDT] Attempting to deduct ${amount} from user ${user.id}`
        );

        try {
          // Get wallets ordered by oldest first to prioritize primary wallet
          const { data: wallets, error: fetchError } = await supabase
            .from("usdt_wallets")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });

          if (fetchError) throw fetchError;
          if (!wallets || wallets.length === 0)
            throw new Error("No wallets found to deduct from");

          let remaining = amount;
          for (const wallet of wallets) {
            if (remaining <= 0) break;
            const deduct = Math.min(wallet.balance, remaining);
            if (deduct > 0) {
              console.log(
                `[deductUSDT] Deducting ${deduct} from wallet ${wallet.id} (${wallet.network})`
              );
              const { error: updateError } = await supabase
                .from("usdt_wallets")
                .update({
                  balance: Math.max(0, wallet.balance - deduct),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", wallet.id);

              if (updateError) throw updateError;
              remaining -= deduct;
            }
          }

          if (remaining > 0) {
            console.warn(
              `[deductUSDT] Could only deduct ${
                amount - remaining
              } of ${amount}`
            );
          }

          // Refresh local balance after deduction
          await get().fetchUSDTBalance();
        } catch (error) {
          console.error("[deductUSDT] Error:", error);
          throw error;
        }
      };

      // Helper to credit USDT
      const creditUSDT = async (amount: number) => {
        const wallets = await getUserWallets(user.id);
        if (wallets.length > 0) {
          await supabase
            .from("usdt_wallets")
            .update({ balance: wallets[0].balance + amount })
            .eq("id", wallets[0].id);
        }
      };

      // Handle Contract Mode
      if (mode === "contract") {
        if (!get().systemSettings.contract_trading_enabled) {
          return {
            success: false,
            error: "Contract trading is currently disabled by administrator",
          };
        }

        const contractId = Math.random().toString(36).substring(7);
        const openedAt = Date.now();
        const expiresAt = openedAt + (orderData.contractTime || 60) * 1000;
        const payoutPercentage = orderData.payout || 85;

        const newPosition: Position = {
          id: contractId,
          assetId: orderData.assetId,
          assetName: orderData.assetName,
          side: orderData.side,
          entryPrice: orderData.price,
          currentPrice: orderData.price,
          amount: orderData.amount,
          pnl: 0,
          pnlPercentage: 0,
          openedAt: openedAt,
          mode: "contract",
          expiresAt: expiresAt,
          payout: payoutPercentage,
          initialInvestment: orderData.total,
        };

        if (isDemo) {
          // Demo mode: Also don't deduct balance immediately for contracts
          // Balance will be adjusted on expiration based on outcome
          const { data: userData } = await supabase
            .from("users")
            .select("preferences")
            .eq("id", user.id)
            .single();
          const currentDemoBalance = (userData?.preferences as any)?.demo_balance || currentBalance;

          set((state) => ({
            demoBalance: currentDemoBalance, // Keep balance unchanged
            balance: currentDemoBalance,
            demoPositions: [newPosition, ...state.demoPositions],
            positions: [newPosition, ...state.positions],
          }));
        } else {
          // Live Mode:
          // For contracts, we DON'T deduct balance immediately
          // Balance will only be deducted if contract results in a loss
          // If win, only profit is added (initial investment stays untouched)

          // 1. Create trade record in trades table (status: 'open')
          // Note: Using type assertion to bypass TypeScript type checking since
          // the generated types don't include the new contract fields yet
          // Using 'timestamp' field instead of 'open_time' since open_time doesn't exist
          const tradeInsertData: Record<string, unknown> = {
            user_id: user.id,
            asset: orderData.assetId,
            quantity: orderData.amount,
            price: orderData.price,
            type: orderData.side,
            is_demo: false,
            status: "open",
            timestamp: new Date(openedAt).toISOString(), // Use timestamp instead of open_time
            // contract_data is optional - only include if column exists
            // We'll use active_contracts table to track contracts instead
          };

          console.log(
            "[Contract Order] Inserting trade record:",
            tradeInsertData
          );
          const { error: tradeError, data: tradeData } = await supabase
            .from("trades")
            .insert(tradeInsertData as never)
            .select();

          if (tradeError) {
            console.error(
              "[Contract Order] Error creating trade record:",
              tradeError
            );
            console.error("[Contract Order] Error details:", {
              message: tradeError.message,
              code: tradeError.code,
              details: tradeError.details,
              hint: tradeError.hint,
            });
            console.error(
              "[Contract Order] Trade insert data:",
              JSON.stringify(tradeInsertData, null, 2)
            );
            return {
              success: false,
              error: `Failed to create trade record: ${
                tradeError.message ||
                tradeError.code ||
                tradeError.details ||
                "Unknown error"
              }. Please check the browser console for details.`,
            };
          }

          console.log(
            "[Contract Order] Trade record created successfully:",
            tradeData
          );

          // 2. No transaction record needed here - will be recorded on expiration

          // 4. Persist Active Contract to DB (So it survives refresh)
          try {
            await supabase.from("active_contracts").insert({
              id: contractId,
              user_id: user.id,
              asset_id: newPosition.assetId,
              asset_name: newPosition.assetName,
              side: newPosition.side,
              entry_price: newPosition.entryPrice,
              amount: newPosition.amount,
              total: newPosition.initialInvestment,
              payout: newPosition.payout,
              expires_at: newPosition.expiresAt,
              opened_at: newPosition.openedAt,
              status: "open",
              is_demo: false,
            });
          } catch (persistError) {
            console.error(
              "Failed to persist contract, trade will be memory-only:",
              persistError
            );
          }

          // 3. Update Local State (balance unchanged for contracts)
          set((state) => ({
            liveBalance: currentBalance, // Keep balance unchanged
            balance: currentBalance,
            livePositions: [newPosition, ...state.livePositions],
            positions: [newPosition, ...state.positions],
          }));
        }

        return { success: true };
      }

      // Handle Spot & Futures
      if (orderData.type === "market") {
        if (mode === "futures") {
          const newPosition: Position = {
            id: Math.random().toString(36).substring(7),
            assetId: orderData.assetId,
            assetName: orderData.assetName,
            side: orderData.side,
            entryPrice: orderData.price,
            currentPrice: orderData.price,
            amount: orderData.amount,
            pnl: 0,
            pnlPercentage: 0,
            openedAt: Date.now(),
            mode: "futures",
            leverage: leverage,
            initialInvestment: cost,
            stopLoss: orderData.stopLoss,
            takeProfit: orderData.takeProfit,
          };

          const newBalance = currentBalance - cost;

          if (isDemo) {
            const { data: userData } = await supabase
              .from("users")
              .select("preferences")
              .eq("id", user.id)
              .single();
            const newPreferences = {
              ...(userData?.preferences || {}),
              demo_balance: newBalance,
            };
            await supabase
              .from("users")
              .update({ preferences: newPreferences })
              .eq("id", user.id);

            set((state) => ({
              demoBalance: newBalance,
              balance: newBalance,
              demoPositions: [newPosition, ...state.demoPositions],
              positions: [newPosition, ...state.positions],
            }));
          } else {
            await deductUSDT(cost);

            // Record transaction for live mode
            await supabase.from("wallet_transactions").insert({
              user_id: user.id,
              type: "trade_pnl",
              amount: -cost, // Negative for investment/margin
              status: "completed",
              asset: "USDT",
              timestamp: new Date().toISOString(),
            });

            set((state) => ({
              liveBalance: newBalance,
              balance: newBalance,
              livePositions: [newPosition, ...state.livePositions],
              positions: [newPosition, ...state.positions],
            }));
          }
          return { success: true };
        }

        // Spot Sell
        if (mode === "spot" && orderData.side === "sell") {
          const { error } = await supabase.from("trades").insert({
            user_id: user.id,
            asset: orderData.assetId,
            quantity: -orderData.amount,
            price: orderData.price,
            type: orderData.side,
            is_demo: isDemo,
          });
          if (error) throw error;

          const newBalance = currentBalance + orderData.total;
          if (isDemo) {
            const { data: userData } = await supabase
              .from("users")
              .select("preferences")
              .eq("id", user.id)
              .single();
            const newPreferences = {
              ...(userData?.preferences || {}),
              demo_balance: newBalance,
            };
            await supabase
              .from("users")
              .update({ preferences: newPreferences })
              .eq("id", user.id);
            set({ demoBalance: newBalance, balance: newBalance });
          } else {
            await creditUSDT(orderData.total);

            // Record transaction for live mode
            await supabase.from("wallet_transactions").insert({
              user_id: user.id,
              type: "trade_pnl",
              amount: orderData.total, // Positive for sell proceeds
              status: "completed",
              asset: "USDT",
              timestamp: new Date().toISOString(),
            });

            set({ liveBalance: newBalance, balance: newBalance });
          }

          await get().fetchData();
          return { success: true };
        }

        // Spot Buy
        const { error } = await supabase.from("trades").insert({
          user_id: user.id,
          asset: orderData.assetId,
          quantity: orderData.amount,
          price: orderData.price,
          type: orderData.side,
          is_demo: isDemo,
        });

        if (error) throw error;

        const newBalance = currentBalance - orderData.total;

        if (isDemo) {
          const { data: userData } = await supabase
            .from("users")
            .select("preferences")
            .eq("id", user.id)
            .single();
          const newPreferences = {
            ...(userData?.preferences || {}),
            demo_balance: newBalance,
          };
          await supabase
            .from("users")
            .update({ preferences: newPreferences })
            .eq("id", user.id);
          set({ demoBalance: newBalance, balance: newBalance });
        } else {
          await deductUSDT(orderData.total);

          // Record transaction for live mode
          await supabase.from("wallet_transactions").insert({
            user_id: user.id,
            type: "trade_pnl",
            amount: -orderData.total, // Negative for buy cost
            status: "completed",
            asset: "USDT",
            timestamp: new Date().toISOString(),
          });

          set({ liveBalance: newBalance, balance: newBalance });
        }
      } else {
        // Limit Orders
        const { error } = await supabase.from("orders").insert({
          user_id: user.id,
          asset_id: orderData.assetId,
          asset_name: orderData.assetName,
          type: orderData.type,
          side: orderData.side,
          price: orderData.price,
          amount: orderData.amount,
          total: orderData.total,
          status: "open",
          is_demo: isDemo,
        });

        if (error) throw error;

        if (orderData.side === "buy") {
          const newBalance = currentBalance - orderData.total;
          if (isDemo) {
            const { data: userData } = await supabase
              .from("users")
              .select("preferences")
              .eq("id", user.id)
              .single();
            const newPreferences = {
              ...(userData?.preferences || {}),
              demo_balance: newBalance,
            };
            await supabase
              .from("users")
              .update({ preferences: newPreferences })
              .eq("id", user.id);
            set({ demoBalance: newBalance, balance: newBalance });
          } else {
            await deductUSDT(orderData.total);

            // Record transaction for live mode
            await supabase.from("wallet_transactions").insert({
              user_id: user.id,
              type: "trade_pnl",
              amount: -orderData.total, // Negative for locked funds
              status: "completed",
              asset: "USDT",
              timestamp: new Date().toISOString(),
            });

            set({ liveBalance: newBalance, balance: newBalance });
          }
        }
      }

      // Refresh data and update balance snapshot
      await get().fetchData();

      // Update balance snapshot for instant display on next refresh
      if (!isDemo && user) {
        const newBalance = get().liveBalance;
        setCachedBalance(user.id, newBalance);
        updateSnapshotInDB(user.id);
        console.log("[placeOrder] Balance snapshot updated:", newBalance);
      }

      return { success: true };
    } catch (error: any) {
      console.error("Place order error:", error);
      return { success: false, error: error.message };
    }
  },

  checkContractExpirations: async () => {
    const { positions, isDemo } = get();
    const now = Date.now();

    // Filter out contracts that are already being processed
    const expiredContracts = positions.filter(
      (p) =>
        p.mode === "contract" &&
        p.expiresAt &&
        now >= p.expiresAt &&
        !processingContractIds.has(p.id)
    );

    if (expiredContracts.length === 0) return;

    const user = useAuthStoreHook.getState().user;

    // Helper to credit USDT to DB
    // Helper to credit USDT to database wallets
    const creditUSDTToDB = async (amount: number) => {
      if (!user || isDemo) return;
      console.log(
        `[creditUSDTToDB] Attempting to credit ${amount} to user ${user.id}`
      );

      try {
        // Find wallets, prioritized by USDT_TRC20 then oldest first
        const { data: wallets, error: fetchError } = await supabase
          .from("usdt_wallets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (fetchError) throw fetchError;

        if (wallets && wallets.length > 0) {
          // Prefer USDT_TRC20 wallet if it exists, otherwise use the first one (oldest)
          const targetWallet =
            wallets.find((w) => w.network === "USDT_TRC20") || wallets[0];

          console.log(
            `[creditUSDTToDB] Crediting ${amount} to wallet ${targetWallet.id} (${targetWallet.network})`
          );

          const { error: updateError } = await supabase
            .from("usdt_wallets")
            .update({
              balance: (targetWallet.balance || 0) + amount,
              updated_at: new Date().toISOString(),
            })
            .eq("id", targetWallet.id);

          if (updateError) {
            console.error("[creditUSDTToDB] Update failed:", updateError);
            throw updateError;
          }

          console.log(`[creditUSDTToDB] Successfully credited ${amount}`);
        } else {
          console.warn("[creditUSDTToDB] No wallets found to credit");
        }
      } catch (err) {
        console.error("[creditUSDTToDB] Error:", err);
        throw err;
      }
    };

    const user_id = user?.id;

    // Helper to record transaction
    const recordTransaction = async (
      amount: number,
      type: "trade_pnl",
      status: "completed"
    ) => {
      if (!user_id || isDemo) return;
      try {
        await supabase.from("wallet_transactions").insert({
          user_id,
          type,
          amount,
          status,
          asset: "USDT",
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error recording transaction:", err);
      }
    };

    // Fetch system settings from Supabase table (fresh data)
    let contractOutcomeMode = "fair";
    if (!isDemo) {
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from("system_settings")
          .select("contract_outcome_mode")
          .limit(1)
          .maybeSingle();

        if (!settingsError && settingsData) {
          contractOutcomeMode = settingsData.contract_outcome_mode || "fair";
        } else {
          // Fallback to cached settings if DB fetch fails
          contractOutcomeMode =
            get().systemSettings.contract_outcome_mode || "fair";
        }
      } catch (error) {
        console.error(
          "[Contract Expiration] Error fetching system settings:",
          error
        );
        // Fallback to cached settings
        contractOutcomeMode =
          get().systemSettings.contract_outcome_mode || "fair";
      }
    }

    // Process contracts sequentially to ensure atomic updates
    for (const contract of expiredContracts) {
      if (processingContractIds.has(contract.id)) continue; // Double check
      processingContractIds.add(contract.id);

      let isWin = false;
      let isTie = false;

      console.log(
        `[Contract Expiration] Asset: ${contract.assetName}, Mode: ${contractOutcomeMode}, Side: ${contract.side}, Entry: ${contract.entryPrice}, Current: ${contract.currentPrice}`
      );

      if (!isDemo && contractOutcomeMode === "always_win") {
        isWin = true;
        isTie = false; // Force win, even if price didn't move
        console.log(`[Contract Expiration] FORCED WIN (always_win mode)`);
      } else if (!isDemo && contractOutcomeMode === "always_loss") {
        isWin = false;
        isTie = false; // Force loss
        console.log(`[Contract Expiration] FORCED LOSS (always_loss mode)`);
      } else {
        // Fair mode: Randomly determine win or loss (50/50 chance)
        // Demo mode: Use actual price comparison
        if (isDemo) {
          // Demo mode uses actual price comparison
          if (contract.side === "buy") {
            isWin = contract.currentPrice > contract.entryPrice;
          } else {
            isWin = contract.currentPrice < contract.entryPrice;
          }
          isTie = contract.currentPrice === contract.entryPrice;
        } else {
          // Fair mode: Random 50/50 chance
          isWin = Math.random() >= 0.5; // 50% chance of win
          isTie = false;
          console.log(
            `[Contract Expiration] FAIR MODE: Random result = ${
              isWin ? "WIN" : "LOSS"
            }`
          );
        }
      }

      let profit = 0;
      let payoutAmount = 0;

      if (isWin) {
        const payoutPercentage = (contract.payout || 85) / 100;
        profit = (contract.initialInvestment || 0) * payoutPercentage;
        payoutAmount = (contract.initialInvestment || 0) + profit;
        console.log(
          `[Contract Expiration] WIN: Profit ${profit}, Payout ${payoutAmount}`
        );
      } else if (isTie) {
        payoutAmount = contract.initialInvestment || 0;
        console.log(`[Contract Expiration] TIE: Refund ${payoutAmount}`);
      } else {
        console.log(`[Contract Expiration] LOSS: 0 Payout`);
      }

      // Update DB first (if live)
      if (!isDemo) {
        try {
          // 1. Update trading_balance based on outcome
          // Fetch current trading balance
          const { data: userData } = await supabase
            .from("users")
            .select("trading_balance")
            .eq("id", user.id)
            .single();

          if (!userData) throw new Error("User data not found");

          // Convert NUMERIC to number (Supabase returns NUMERIC as string sometimes)
          const rawBalance = userData?.trading_balance;
          const currentTradingBalance =
            typeof rawBalance === "string"
              ? parseFloat(rawBalance)
              : (rawBalance as number) || 0;

          let newTradingBalance = currentTradingBalance;
          let balanceChange = 0;

          if (isWin) {
            // Win: Add profit amount to trading balance
            // Initial investment was NOT deducted when placing order, so only add profit
            balanceChange = profit;
            newTradingBalance = currentTradingBalance + profit;
            console.log(
              `[Contract Expiration] WIN: Adding profit ${profit} to trading balance (initial investment not deducted)`
            );
          } else if (isTie) {
            // Tie: No change (nothing was deducted, so nothing to refund)
            balanceChange = 0;
            console.log(
              `[Contract Expiration] TIE: No balance change (nothing was deducted)`
            );
          } else {
            // Loss: Deduct initial investment now (was not deducted when placing order)
            const initialInvestment = contract.initialInvestment || 0;
            balanceChange = -initialInvestment;
            newTradingBalance = currentTradingBalance - initialInvestment;
            console.log(
              `[Contract Expiration] LOSS: Deducting initial investment ${initialInvestment} from trading balance`
            );
          }

          // Update trading balance if there's a change
          if (balanceChange !== 0) {
            const { error: balanceError } = await supabase
              .from("users")
              .update({ trading_balance: newTradingBalance })
              .eq("id", user.id);

            if (balanceError) throw balanceError;

            // Record transaction for wins (profit) or losses (deduction)
            await recordTransaction(
              Math.abs(balanceChange), // Use absolute value for transaction amount
              "trade_pnl",
              "completed"
            );
          }

          // 2. Remove from active_contracts (Persistence cleanup)
          await supabase
            .from("active_contracts")
            .delete()
            .eq("id", contract.id);

          // 3. Update the trade record in trades table
          // Find the trade record by matching contract details
          // We'll use the active_contracts table to find the associated trade
          // by matching user_id, asset, type, status='open', and open_time
          const { data: tradeRecords, error: findError } = await supabase
            .from("trades")
            .select("id")
            .eq("user_id", user.id)
            .eq("asset", contract.assetId)
            .eq("type", contract.side)
            .eq("status", "open")
            .order("timestamp", { ascending: false })
            .limit(1);

          if (!findError && tradeRecords && tradeRecords.length > 0) {
            const tradeId = tradeRecords[0].id;
            const tradeStatus = isTie ? "tie" : isWin ? "win" : "loss";

            const updateData: Record<string, unknown> = {
              exit_price: contract.currentPrice,
              payout: payoutAmount,
              profit: isWin ? profit : isTie ? 0 : -contract.initialInvestment!,
              status: tradeStatus,
              // Note: close_time column doesn't exist, using timestamp is sufficient
            };

            const { error: updateError } = await supabase
              .from("trades")
              .update(updateData as never)
              .eq("id", tradeId);

            if (updateError) {
              console.error("Error updating trade record:", updateError);
              throw updateError;
            }
          } else {
            console.warn(
              "Could not find trade record to update for contract:",
              contract.id
            );
          }
        } catch (e) {
          console.error(
            "Failed to process contract DB updates (Payout/Persistence). Skipping local update to prevent desync",
            e
          );
          continue; // Skip local update if DB failed
        }
      }

      // Update Local State
      const completedContract: Position = {
        ...contract,
        finalResult: isWin ? "win" : "loss",
        finalProfit: profit,
        pnl: isWin ? profit : -(contract.initialInvestment || 0),
      };

      // Remove from active positions and add to completed
      set((state) => {
        // Calculate balance change for demo mode
        let balanceChange = 0;
        if (isDemo) {
          if (isWin) {
            // Win: Add profit only (initial investment was not deducted)
            balanceChange = profit;
          } else if (isTie) {
            // Tie: No change
            balanceChange = 0;
          } else {
            // Loss: Deduct initial investment (was not deducted when placing order)
            balanceChange = -(contract.initialInvestment || 0);
          }
        }

        const newBalance = isDemo
          ? state.demoBalance + balanceChange
          : state.liveBalance; // Live balance updates via DB update above

        // Update demo balance in DB if demo
        if (isDemo && user) {
          supabase
            .from("users")
            .update({
              preferences: { ...user.preferences, demo_balance: newBalance },
            })
            .eq("id", user.id)
            .then();
        }

        // We don't remove from processingContractIds here immediately because we want to ensure
        // the next render cycle has completed with the removed position.

        return {
          positions: state.positions.filter((p) => p.id !== contract.id),
          livePositions: isDemo
            ? state.livePositions
            : state.livePositions.filter((p) => p.id !== contract.id),
          demoPositions: isDemo
            ? state.demoPositions.filter((p) => p.id !== contract.id)
            : state.demoPositions,
          completedContracts: [completedContract, ...state.completedContracts],
          // Only update store balance for Demo. Live relies on subscription or fetch.
          balance: isDemo ? newBalance : state.balance,
          liveBalance: isDemo ? state.liveBalance : state.liveBalance,
          demoBalance: isDemo ? newBalance : state.demoBalance,
        };
      });

      // Cleanup set after a delay to ensure state update has propagated
      setTimeout(() => {
        processingContractIds.delete(contract.id);
      }, 2000);

      // Play sound or notification
      if (isWin) {
        useNotificationStore.getState().addNotification({
          title: "Trade Won!",
          message: `You won $${profit.toFixed(2)} on ${contract.assetName}`,
          type: "success",
          iconType: "trade",
        });
      } else if (!isTie) {
        useNotificationStore.getState().addNotification({
          title: "Trade Lost",
          message: `You lost $${contract.initialInvestment?.toFixed(2)} on ${
            contract.assetName
          }`,
          type: "error",
          iconType: "trade",
        });
      }
    }

    // Single fetch after batch processing to ensure sync (handles wins AND losses)
    if (!isDemo && expiredContracts.length > 0) {
      await get().fetchUSDTBalance();
    }
  },

  cancelOrder: async (orderId) => {
    try {
      // 1. Fetch order details to check if it's a buy order that needs refund
      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (fetchError || !order)
        throw fetchError || new Error("Order not found");
      if (order.status !== "open") return;

      // 2. Update status to cancelled
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);
      if (updateError) throw updateError;

      // 3. Refund if it was a buy order
      if (order.side === "buy") {
        const user = useAuthStoreHook.getState().user;
        if (!user) return;

        if (order.is_demo) {
          const { data: userData } = await supabase
            .from("users")
            .select("preferences")
            .eq("id", user.id)
            .single();
          const currentDemoBalance = userData?.preferences?.demo_balance || 0;
          const newBalance = currentDemoBalance + order.total;
          const newPreferences = {
            ...(userData?.preferences || {}),
            demo_balance: newBalance,
          };
          await supabase
            .from("users")
            .update({ preferences: newPreferences })
            .eq("id", user.id);
          set({ demoBalance: newBalance, balance: newBalance });
        } else {
          // Credit USDT back to wallet
          const wallets = await getUserWallets(user.id);
          if (wallets.length > 0) {
            await supabase
              .from("usdt_wallets")
              .update({ balance: wallets[0].balance + order.total })
              .eq("id", wallets[0].id);

            // Record refund transaction
            await supabase.from("wallet_transactions").insert({
              user_id: user.id,
              type: "trade_pnl",
              amount: order.total, // Positive for refund
              status: "completed",
              asset: "USDT",
              timestamp: new Date().toISOString(),
            });

            await get().fetchUSDTBalance();
          }
        }
      }

      await get().fetchData();
    } catch (error) {
      console.error("Cancel order error:", error);
    }
  },

  closePosition: async (positionId) => {
    const { positions } = get();
    const position = positions.find((p) => p.id === positionId);
    if (!position) return;

    // If it's a contract, you can't close it manually (usually)
    if (position.mode === "contract") return;

    try {
      const user = useAuthStoreHook.getState().user;

      // Helper to credit USDT
      const creditUSDT = async (amount: number) => {
        try {
          if (!user) return;
          const wallets = await getUserWallets(user.id);
          if (wallets.length > 0) {
            const { error } = await supabase
              .from("usdt_wallets")
              .update({ balance: wallets[0].balance + amount })
              .eq("id", wallets[0].id);
            if (error) throw error;
          }
        } catch (error) {
          console.error("Error crediting USDT:", error);
          toast.error("Failed to credit winnings. Please contact support.");
        }
      };

      // Handle Futures/Local Positions
      if (position.mode === "futures") {
        const currentBalance = get().isDemo
          ? get().demoBalance
          : get().liveBalance;
        // PnL is already calculated in position.pnl
        // Return: Initial Margin + PnL
        const returnAmount = position.initialInvestment! + position.pnl;
        const newBalance = currentBalance + returnAmount;

        if (get().isDemo) {
          if (user) {
            const { data: userData } = await supabase
              .from("users")
              .select("preferences")
              .eq("id", user.id)
              .single();
            const newPreferences = {
              ...(userData?.preferences || {}),
              demo_balance: newBalance,
            };
            await supabase
              .from("users")
              .update({ preferences: newPreferences })
              .eq("id", user.id);
          }
          set((state) => ({
            demoBalance: newBalance,
            balance: newBalance,
            demoPositions: state.demoPositions.filter(
              (p) => p.id !== positionId
            ),
            positions: state.positions.filter((p) => p.id !== positionId),
          }));
        } else {
          await creditUSDT(returnAmount);

          // Record transaction for live mode
          await supabase.from("wallet_transactions").insert({
            user_id: user.id,
            type: "trade_pnl",
            amount: returnAmount, // Positive for return (margin + pnl)
            status: "completed",
            asset: "USDT",
            timestamp: new Date().toISOString(),
          });

          // We don't update liveBalance directly here because we want to fetch it from DB to be sure
          await get().fetchUSDTBalance();
          set((state) => ({
            livePositions: state.livePositions.filter(
              (p) => p.id !== positionId
            ),
            positions: state.positions.filter((p) => p.id !== positionId),
          }));
        }
        return;
      }

      // Existing Spot Logic
      const side = position.side === "buy" ? "sell" : "buy";
      const { error } = await supabase.from("trades").insert({
        user_id: useAuthStoreHook.getState().user?.id,
        asset: position.assetId,
        quantity: position.amount,
        price: position.currentPrice,
        type: side,
        is_demo: get().isDemo,
      });

      if (error) throw error;

      const currentBalance = get().isDemo
        ? get().demoBalance
        : get().liveBalance;
      const total = position.amount * position.currentPrice;
      const newBalance = currentBalance + total;

      if (get().isDemo) {
        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("preferences")
            .eq("id", user.id)
            .single();
          const newPreferences = {
            ...(userData?.preferences || {}),
            demo_balance: newBalance,
          };
          await supabase
            .from("users")
            .update({ preferences: newPreferences })
            .eq("id", user.id);
        }
        set({ demoBalance: newBalance, balance: newBalance });
      } else {
        await creditUSDT(total);
        await get().fetchUSDTBalance();
      }

      await get().fetchData();
    } catch (error) {
      console.error("Close position error:", error);
    }
  },

  updatePositionPrices: (assetId, currentPrice) => {
    set((state) => {
      const updatePositions = (positions: Position[]) => {
        return positions.map((pos) => {
          if (pos.assetId === assetId) {
            const priceDiff = currentPrice - pos.entryPrice;

            let pnl = 0;
            let pnlPercentage = 0;

            if (pos.mode === "contract") {
              // For contracts, PnL is binary (Win/Loss) but we can show potential PnL
              const isWin =
                pos.side === "buy"
                  ? currentPrice > pos.entryPrice
                  : currentPrice < pos.entryPrice;
              pnl = isWin
                ? pos.initialInvestment! * (pos.payout! / 100)
                : -pos.initialInvestment!;
              pnlPercentage = isWin ? pos.payout! : -100;
            } else if (pos.mode === "futures") {
              // Futures PnL = (Price Diff * Amount) * Leverage?
              // Actually Amount usually includes leverage if we bought that many units.
              // But if Amount = Units, then PnL = (Current - Entry) * Amount.
              // Since we stored leveraged amount, this is correct.
              pnl =
                pos.side === "buy"
                  ? priceDiff * pos.amount
                  : -priceDiff * pos.amount;
              // Percentage based on Initial Investment (Margin)
              pnlPercentage = (pnl / pos.initialInvestment!) * 100;
            } else {
              // Spot
              pnl =
                pos.side === "buy"
                  ? priceDiff * pos.amount
                  : -priceDiff * pos.amount;
              pnlPercentage = (priceDiff / pos.entryPrice) * 100;
            }

            return {
              ...pos,
              currentPrice,
              pnl,
              pnlPercentage:
                pos.side === "buy"
                  ? pnlPercentage
                  : pos.mode === "contract"
                  ? pnlPercentage
                  : -pnlPercentage,
            };
          }
          return pos;
        });
      };

      const newLivePositions = updatePositions(state.livePositions);
      const newDemoPositions = updatePositions(state.demoPositions);

      return {
        livePositions: newLivePositions,
        demoPositions: newDemoPositions,
        positions: state.isDemo ? newDemoPositions : newLivePositions,
      };
    });
  },

  syncWithWalletBalance: (walletBalance) => {
    set((state) => {
      const newExternalBalance = walletBalance;
      if (!state.isDemo) {
        return {
          externalBalance: newExternalBalance,
          balance: state.liveBalance + newExternalBalance,
        };
      }
      return { externalBalance: newExternalBalance };
    });
  },

  withdrawToWallet: async (amount, walletAddress) => {
    const { isDemo, liveBalance } = get();
    const user = useAuthStoreHook.getState().user;

    if (!user) return { success: false, error: "Not authenticated" };
    if (amount <= 0) return { success: false, error: "Invalid amount" };

    // We are removing demo mode, so we primarily focus on live logic.
    // If somehow isDemo is true (shouldn't be), we just return success for UI but do nothing.
    if (isDemo) {
      set((state) => ({
        demoBalance: state.demoBalance - amount,
        balance: state.demoBalance - amount,
      }));
      return { success: true };
    }

    if (amount > liveBalance) {
      return { success: false, error: "Insufficient balance" };
    }

    try {
      // 1. Fetch the user's wallet to check compatibility and existence
      const wallets = await getUserWallets(user.id);
      if (wallets.length === 0)
        return {
          success: false,
          error:
            "No USDT wallet found. Please create one in the Wallet section first.",
        };

      const wallet = wallets[0];

      // 2. IMPORTANT: We no longer deduct funds immediately.
      // Funds are deducted by the Admin upon approval.
      // But we still check if they HAVE enough balance to request it.
      const fee = 0; // Standardize fee for trading balance withdrawals or handle as needed
      if (wallet.balance < amount + fee) {
        return {
          success: false,
          error: `Insufficient balance (Required: ${amount + fee}, Available: ${
            wallet.balance
          })`,
        };
      }

      // 3. Create Withdrawal Request in the database
      // This is what the Admin Panel's get_admin_withdrawals RPC looks for.
      const { error: insertError } = await supabase.from("withdrawals").insert({
        user_id: user.id,
        amount: amount,
        fee: fee,
        address: walletAddress || wallet.address, // Default to their wallet address if not provided
        network: wallet.network,
        type: "withdrawal",
        status: "pending",
        created_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      // 4. Update Local State (Optional: you might want to mark it as pending in the history)
      // We don't deduct liveBalance here anymore.

      return { success: true };
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      return {
        success: false,
        error: error.message || "Failed to process withdrawal",
      };
    }
  },

  depositFromWallet: (amount) => {
    // Rely on backend subscription or manual refresh to update balance
    set((state) => {
      // Only update demo balance optimistically
      if (state.isDemo) {
        return { liveBalance: state.liveBalance + amount };
      }
      // For live, do nothing here. The subscription or explicit fetch will handle it.
      get().fetchUSDTBalance();
      return {};
    });
  },
}));
