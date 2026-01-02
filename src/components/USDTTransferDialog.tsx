import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  ArrowRightLeft,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatUSDT } from "@/lib/usdtWalletUtils";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { useQueryClient, useQuery } from "@tanstack/react-query";

interface USDTTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalWalletBalance: number;
  onSuccess?: () => void;
  reverse?: boolean; // If true, transfer from trading balance to USDT wallet (default: false = from USDT to trading)
}

const USDTTransferDialog = ({
  open,
  onOpenChange,
  totalWalletBalance,
  onSuccess,
  reverse = false,
}: USDTTransferDialogProps) => {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch wallets to calculate USDT balance (consistent with network wallets display)
  const { data: wallets = [] } = useQuery({
    queryKey: ["transfer-dialog-wallets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { getAllUserWallets } = await import("@/lib/usdtWalletUtils");
      return await getAllUserWallets(user.id);
    },
    enabled: !!user?.id && open,
    staleTime: 1000 * 5,
    refetchInterval: 10000, // Auto-refetch every 10 seconds
  });

  // Fetch trading balance for reverse transfers
  const { data: tradingBalance = 0 } = useQuery({
    queryKey: ["transfer-dialog-trading-balance", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data, error } = await supabase
        .from("users")
        .select("trading_balance")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching trading balance:", error);
        return 0;
      }
      const rawBalance = data?.trading_balance;
      return typeof rawBalance === "string"
        ? parseFloat(rawBalance)
        : (rawBalance as number) || 0;
    },
    enabled: !!user?.id && open && reverse,
    staleTime: 1000 * 5,
    refetchInterval: 10000,
  });

  // Calculate USDT balance from wallets
  // Get all USDT wallets (any network) - USDT is stored in usdt_wallets table
  const usdtBalance = wallets
    .filter((w) => {
      // Include wallets that are USDT-related (check network or currency)
      const network = w.network?.toUpperCase() || "";
      return network.includes("USDT") || network === "TRC20";
    })
    .reduce((sum, w) => sum + w.balance, 0);

  // Determine source balance based on direction
  const sourceBalance = reverse ? tradingBalance : usdtBalance;
  const amountNum = amount ? parseFloat(amount) : 0;
  const hasEnoughBalance = amountNum > 0 && amountNum <= sourceBalance;
  const minTransfer = 1; // Minimum $1 USDT

  const resetForm = () => {
    setAmount("");
    setError("");
    setStep("form");
  };

  const handleTransfer = async () => {
    if (!user?.id) return;

    setError("");
    setLoading(true);

    try {
      if (isNaN(amountNum) || amountNum < minTransfer) {
        throw new Error(`Minimum transfer is $${minTransfer} USDT`);
      }

      if (!hasEnoughBalance) {
        throw new Error(
          reverse ? "Insufficient trading balance" : "Insufficient USDT balance"
        );
      }

      // Get current trading balance
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("trading_balance")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      const currentTradingBalance = Number(userData?.trading_balance || 0);

      if (reverse) {
        // Transfer FROM trading balance TO USDT wallet
        // 1. Deduct from trading balance
        const newTradingBalance = currentTradingBalance - amountNum;
        const { error: tradingBalanceError } = await supabase
          .from("users")
          .update({ trading_balance: newTradingBalance })
          .eq("id", user.id);

        if (tradingBalanceError) throw tradingBalanceError;

        // 2. Add to USDT wallet (find first USDT wallet or create one)
        // Note: We update usdt_wallets directly and DON'T create a crypto_deposits record
        // because USDT balances are ONLY fetched from usdt_wallets table (not crypto_deposits)
        // Query directly from usdt_wallets table without network filter
        const { data: usdtWalletsData, error: fetchError } = await supabase
          .from("usdt_wallets")
          .select("id, balance")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1);

        if (fetchError) throw fetchError;

        if (usdtWalletsData && usdtWalletsData.length > 0) {
          const targetWallet = usdtWalletsData[0];
          const newBalance = Number(targetWallet.balance || 0) + amountNum;
          const { error: walletError } = await supabase
            .from("usdt_wallets")
            .update({
              balance: newBalance,
              updated_at: new Date().toISOString(),
            })
            .eq("id", targetWallet.id);

          if (walletError) throw walletError;
        } else {
          // Create a new USDT wallet if none exists
          const { error: createError } = await supabase
            .from("usdt_wallets")
            .insert({
              user_id: user.id,
              network: "USDT_TRC20",
              address: `internal_${user.id}_${Date.now()}`,
              balance: amountNum,
            });

          if (createError) throw createError;
        }

        // 3. Create transaction record for audit trail
        await supabase.from("wallet_transactions").insert({
          user_id: user.id,
          type: "trade_pnl",
          amount: -amountNum, // Negative because it's leaving trading balance
          asset: "USDT",
          status: "completed",
          timestamp: new Date().toISOString(),
        });
      } else {
        // Transfer FROM USDT wallet TO trading balance (original direction)
        // 1. Deduct from USDT wallet directly (not via crypto_deposits)
        // Query directly from usdt_wallets table without network filter
        const { data: usdtWalletsData, error: fetchError } = await supabase
          .from("usdt_wallets")
          .select("id, balance")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1);

        if (fetchError) throw fetchError;

        if (!usdtWalletsData || usdtWalletsData.length === 0) {
          throw new Error("No USDT wallet found");
        }

        const targetWallet = usdtWalletsData[0];
        const newBalance = Number(targetWallet.balance || 0) - amountNum;

        if (newBalance < 0) {
          throw new Error("Insufficient USDT balance");
        }

        const { error: walletError } = await supabase
          .from("usdt_wallets")
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetWallet.id);

        if (walletError) throw walletError;

        // 2. Update trading balance
        const newTradingBalance = currentTradingBalance + amountNum;
        const { error: tradingBalanceError } = await supabase
          .from("users")
          .update({ trading_balance: newTradingBalance })
          .eq("id", user.id);

        if (tradingBalanceError) throw tradingBalanceError;

        // 3. Create transaction record for audit trail
        await supabase.from("wallet_transactions").insert({
          user_id: user.id,
          type: "trade_pnl",
          amount: amountNum, // Positive for wallet -> trading
          asset: "USDT",
          status: "completed",
          timestamp: new Date().toISOString(),
        });
      }

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({
        queryKey: ["transfer-dialog-wallets", user.id],
      });
      queryClient.invalidateQueries({ queryKey: ["usdt-wallets", user.id] });
      queryClient.invalidateQueries({ queryKey: ["trading-balance", user.id] });
      queryClient.invalidateQueries({
        queryKey: ["wallet-trading-balance", user.id],
      });
      queryClient.invalidateQueries({ queryKey: ["topbar-wallets", user.id] });
      if (reverse) {
        // Also invalidate trading panel wallets and transfer dialog trading balance
        queryClient.invalidateQueries({
          queryKey: ["trading-panel-wallets", user.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["transfer-dialog-trading-balance", user.id],
        });
      }

      setStep("success");
      toast({
        title: "Transfer Successful",
        description: `Successfully transferred ${formatUSDT(amountNum)} USDT ${
          reverse ? "from trading balance to wallet" : "to trading balance"
        }`,
      });

      setTimeout(() => {
        onOpenChange(false);
        resetForm();
        onSuccess?.();
      }, 2000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to transfer USDT";
      setError(errorMessage);
      toast({
        title: "Transfer Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (step === "form") {
      setStep("confirm");
    } else if (step === "confirm") {
      handleTransfer();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            {reverse ? "Transfer to Wallet" : "Transfer to Trading Balance"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground py-2">
            {reverse
              ? "Transfer USDT from your trading balance to your wallet balance"
              : "Transfer USDT from your wallet balance to your trading balance"}
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USDT)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono"
                min={minTransfer}
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Available: {formatUSDT(sourceBalance)}{" "}
                {reverse ? "Trading Balance" : "USDT"}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {reverse
                    ? "Current Trading Balance:"
                    : "Current USDT Balance:"}
                </span>
                <span className="font-semibold">
                  {formatUSDT(sourceBalance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transfer Amount:</span>
                <span className="font-semibold">{formatUSDT(amountNum)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-muted-foreground">
                  {reverse ? "New Trading Balance:" : "New USDT Balance:"}
                </span>
                <span className="font-semibold text-primary">
                  {formatUSDT(sourceBalance - amountNum)}
                </span>
              </div>
              {reverse && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    New USDT Balance:
                  </span>
                  <span className="font-semibold text-green-500">
                    {formatUSDT(usdtBalance + amountNum)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Confirm transfer of {formatUSDT(amountNum)} USDT{" "}
                {reverse
                  ? "from trading balance to wallet"
                  : "to trading balance"}
                ?
              </AlertDescription>
            </Alert>
            <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transfer Amount:</span>
                <span className="font-semibold">{formatUSDT(amountNum)}</span>
              </div>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Transfer Successful!
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                {formatUSDT(amountNum)} USDT has been transferred{" "}
                {reverse
                  ? "from trading balance to wallet"
                  : "to trading balance"}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "form" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={
                  !hasEnoughBalance || loading || amountNum < minTransfer
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </>
          )}
          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("form")}>
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  "Confirm Transfer"
                )}
              </Button>
            </>
          )}
          {step === "success" && (
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default USDTTransferDialog;
