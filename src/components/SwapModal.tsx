import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDownUp, Loader2, Search, ChevronDown } from "lucide-react";
import { useTradingStore } from "@/store/tradingStore";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { DEPOSIT_ADDRESSES } from "@/lib/depositAddresses";

const SwapModal = () => {
  const [open, setOpen] = useState(false);
  const [fromSelectorOpen, setFromSelectorOpen] = useState(false);
  const [toSelectorOpen, setToSelectorOpen] = useState(false);
  const [fromSearchQuery, setFromSearchQuery] = useState("");
  const [toSearchQuery, setToSearchQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  interface CryptoAsset {
    id: string;
    symbol: string;
    name: string;
    image: string;
    currency: string; // The currency key from DEPOSIT_ADDRESSES
  }

  const [fromAsset, setFromAsset] = useState<CryptoAsset | null>(null);
  const [toAsset, setToAsset] = useState<CryptoAsset | null>(null);

  const { balance, positions, fetchData } = useTradingStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Map currencies to display symbols
  const currencyToSymbol: Record<string, string> = {
    BTC: "BTC",
    ETH: "ETH",
    USDT_TRC20: "USDT",
    USDT: "USDT",
    USDC_ERC20: "USDC",
    USDC: "USDC",
    XRP: "XRP",
    BNB: "BNB",
  };

  // Map currencies to display names (from DEPOSIT_ADDRESSES network field)
  const currencyToName: Record<string, string> = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    USDT_TRC20: "Tether (TRC20)",
    USDT: "Tether",
    USDC_ERC20: "USD Coin (ERC20)",
    USDC: "USD Coin",
    XRP: "Ripple",
    BNB: "BNB",
  };

  // Map currencies to local icon paths
  const currencyToIcon: Record<string, string> = {
    BTC: "/crypto-icons/btc.png",
    ETH: "/crypto-icons/eth.png",
    USDT_TRC20: "", // Will use custom "T" icon
    USDT: "", // Will use custom "T" icon
    USDC_ERC20: "/crypto-icons/usdc.png",
    USDC: "/crypto-icons/usdc.png",
    XRP: "/crypto-icons/xrp.png",
    BNB: "/crypto-icons/bnb.png",
  };

  // Create assets directly from DEPOSIT_ADDRESSES
  const allAssets: CryptoAsset[] = Object.keys(DEPOSIT_ADDRESSES).map(
    (currency) => ({
      id: currency.toLowerCase(),
      symbol: currencyToSymbol[currency] || currency,
      name: currencyToName[currency] || currency,
      image: currencyToIcon[currency] || "",
      currency,
    })
  );

  // Set default assets when modal opens
  useEffect(() => {
    if (open && allAssets.length > 0 && !fromAsset && !toAsset) {
      const btc = allAssets.find((a) => a.currency === "BTC");
      const usdt = allAssets.find(
        (a) => a.currency === "USDT_TRC20" || a.currency === "USDT"
      );
      if (btc) setFromAsset(btc); // Default from BTC
      if (usdt) setToAsset(usdt); // Default to USDT
    }
  }, [open, allAssets.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get balance for an asset from crypto_deposits table (or usdt_wallets for USDT)
  const getAssetBalance = async (
    asset: CryptoAsset | null
  ): Promise<number> => {
    if (!asset || !user?.id) return 0;

    // Use the currency field from DEPOSIT_ADDRESSES, fallback to symbol
    const currency = asset.currency || asset.symbol.toUpperCase();

    // For USDT or USDT_TRC20, ONLY fetch from usdt_wallets table
    // USDT deposits are moved to usdt_wallets when approved and deleted from crypto_deposits
    if (currency === "USDT" || currency === "USDT_TRC20") {
      const { data: wallets } = await supabase
        .from("usdt_wallets")
        .select("balance")
        .eq("user_id", user.id);

      return wallets?.reduce((sum, w) => sum + Number(w.balance || 0), 0) || 0;
    }

    // For other assets, sum crypto_deposits records
    const { data: deposits } = await supabase
      .from("crypto_deposits")
      .select("amount")
      .eq("user_id", user.id)
      .eq("currency", currency)
      .eq("status", "credited");

    return deposits?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;
  };

  const handleSwap = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to swap.",
        variant: "destructive",
      });
      return;
    }

    if (!fromAsset || !toAsset) {
      toast({
        title: "Invalid Selection",
        description: "Please select both from and to assets.",
        variant: "destructive",
      });
      return;
    }

    // Check if same currency (handle USDT variants)
    const fromCurrency = fromAsset.currency || fromAsset.symbol.toUpperCase();
    const toCurrency = toAsset.currency || toAsset.symbol.toUpperCase();

    // Normalize USDT variants for comparison
    const normalizeCurrency = (curr: string) => {
      if (curr === "USDT" || curr === "USDT_TRC20") return "USDT";
      return curr;
    };

    if (normalizeCurrency(fromCurrency) === normalizeCurrency(toCurrency)) {
      toast({
        title: "Invalid Selection",
        description: "Cannot swap the same asset.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please log in to perform swaps.",
        variant: "destructive",
      });
      return;
    }

    const numAmount = Number(amount);
    setIsLoading(true);

    try {
      // Check balance by summing crypto_deposits for the currency
      const actualBalance = await getAssetBalance(fromAsset);

      if (numAmount > actualBalance) {
        setIsLoading(false);
        toast({
          title: "Insufficient Balance",
          description: `You do not have enough ${fromAsset.symbol.toUpperCase()}. Balance: ${actualBalance.toFixed(
            6
          )}`,
          variant: "destructive",
        });
        return;
      }

      // No conversion - same amount for both from and to (1:1 swap)
      // Use currency field from DEPOSIT_ADDRESSES, fallback to symbol
      const fromCurrency = fromAsset.currency || fromAsset.symbol.toUpperCase();
      const toCurrency = toAsset.currency || toAsset.symbol.toUpperCase();
      const timestamp = Date.now();
      const transactionHash = `SWAP_${user.id}_${timestamp}`;

      const isFromUSDT =
        fromCurrency === "USDT" || fromCurrency === "USDT_TRC20";
      const isToUSDT = toCurrency === "USDT" || toCurrency === "USDT_TRC20";

      // 1. Handle "from" asset deduction
      if (isFromUSDT) {
        // For USDT: Deduct directly from usdt_wallets table (no crypto_deposits record)
        const { data: usdtWallets } = await supabase
          .from("usdt_wallets")
          .select("id, balance")
          .eq("user_id", user.id)
          .limit(1);

        if (!usdtWallets || usdtWallets.length === 0) {
          throw new Error("No USDT wallet found");
        }

        const wallet = usdtWallets[0];
        const newBalance = Number(wallet.balance || 0) - numAmount;

        if (newBalance < 0) {
          throw new Error("Insufficient USDT balance");
        }

        const { error: walletError } = await supabase
          .from("usdt_wallets")
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", wallet.id);

        if (walletError) throw walletError;
      } else {
        // For other currencies: Create negative withdrawal in crypto_deposits
        const { error: withdrawalError } = await supabase
          .from("crypto_deposits")
          .insert({
            user_id: user.id,
            deposit_code: `SWAP-OUT-${timestamp.toString(36).toUpperCase()}`,
            currency: fromCurrency,
            deposit_address: "internal_swap",
            transaction_hash: `${transactionHash}_OUT`,
            amount: -numAmount, // Negative amount for withdrawal
            amount_usd: 0, // No price conversion needed for 1:1 swap
            status: "credited", // Mark as credited since it's an internal swap
            notes: `Swap withdrawal: ${numAmount} ${fromCurrency} to ${toCurrency}`,
            credited_at: new Date().toISOString(),
          });

        if (withdrawalError) throw withdrawalError;
      }

      // 2. Handle "to" asset addition
      if (isToUSDT) {
        // For USDT: Add directly to usdt_wallets table (no crypto_deposits record)
        const { data: usdtWallets } = await supabase
          .from("usdt_wallets")
          .select("id, balance")
          .eq("user_id", user.id)
          .limit(1);

        if (usdtWallets && usdtWallets.length > 0) {
          const wallet = usdtWallets[0];
          const newBalance = Number(wallet.balance || 0) + numAmount;
          const { error: walletError } = await supabase
            .from("usdt_wallets")
            .update({
              balance: newBalance,
              updated_at: new Date().toISOString(),
            })
            .eq("id", wallet.id);

          if (walletError) throw walletError;
        } else {
          // Create a new USDT wallet if none exists
          const { error: createError } = await supabase
            .from("usdt_wallets")
            .insert({
              user_id: user.id,
              network: "USDT_TRC20",
              address: `internal_${user.id}_${Date.now()}`,
              balance: numAmount,
            });

          if (createError) throw createError;
        }
      } else {
        // For other currencies: Create positive deposit in crypto_deposits
        const { error: depositError } = await supabase
          .from("crypto_deposits")
          .insert({
            user_id: user.id,
            deposit_code: `SWAP-IN-${timestamp.toString(36).toUpperCase()}`,
            currency: toCurrency,
            deposit_address: "internal_swap",
            transaction_hash: `${transactionHash}_IN`,
            amount: numAmount, // Same amount (1:1 swap)
            amount_usd: 0, // No price conversion needed for 1:1 swap
            status: "credited", // Mark as credited since it's an internal swap
            notes: `Swap deposit: ${numAmount} ${fromCurrency} to ${numAmount} ${toCurrency}`,
            credited_at: new Date().toISOString(),
          });

        if (depositError) throw depositError;
      }

      // 4. Record wallet transactions for audit
      await supabase.from("wallet_transactions").insert([
        {
          user_id: user.id,
          type: "withdrawal",
          amount: -numAmount,
          asset: fromCurrency,
          status: "completed",
          timestamp: new Date().toISOString(),
        },
        {
          user_id: user.id,
          type: "deposit",
          amount: numAmount,
          asset: toCurrency,
          status: "completed",
          timestamp: new Date().toISOString(),
        },
      ]);

      // Refresh data
      await fetchData();
      queryClient.invalidateQueries({ queryKey: ["trading-balance", user.id] });
      queryClient.invalidateQueries({ queryKey: ["usdt-wallets", user.id] });
      queryClient.invalidateQueries({ queryKey: ["topbar-wallets", user.id] });

      setIsLoading(false);
      setOpen(false);
      setAmount("");

      toast({
        title: "Swap Successful",
        description: `Successfully swapped ${numAmount.toFixed(
          6
        )} ${fromCurrency} to ${numAmount.toFixed(6)} ${toCurrency}.`,
      });
    } catch (error: unknown) {
      setIsLoading(false);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to complete swap";
      toast({
        title: "Swap Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const toggleDirection = () => {
    // Swap the assets
    const temp = fromAsset;
    setFromAsset(toAsset);
    setToAsset(temp);
    setAmount(""); // Reset amount on toggle
  };

  // Helper to normalize currency for comparison
  const normalizeCurrencyForFilter = (curr: string) => {
    if (curr === "USDT" || curr === "USDT_TRC20") return "USDT";
    return curr;
  };

  // Filter assets for from selector
  // Only exclude the asset if it's the same currency (handles USDT variants)
  const filteredFromAssets = allAssets.filter((asset) => {
    const assetCurrency = normalizeCurrencyForFilter(
      asset.currency || asset.symbol.toUpperCase()
    );
    const toAssetCurrency = toAsset
      ? normalizeCurrencyForFilter(
          toAsset.currency || toAsset.symbol.toUpperCase()
        )
      : null;

    return (
      assetCurrency !== toAssetCurrency &&
      (asset.name.toLowerCase().includes(fromSearchQuery.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(fromSearchQuery.toLowerCase()))
    );
  });

  // Filter assets for to selector
  // Only exclude the asset if it's the same currency (handles USDT variants)
  const filteredToAssets = allAssets.filter((asset) => {
    const assetCurrency = normalizeCurrencyForFilter(
      asset.currency || asset.symbol.toUpperCase()
    );
    const fromAssetCurrency = fromAsset
      ? normalizeCurrencyForFilter(
          fromAsset.currency || fromAsset.symbol.toUpperCase()
        )
      : null;

    return (
      assetCurrency !== fromAssetCurrency &&
      (asset.name.toLowerCase().includes(toSearchQuery.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(toSearchQuery.toLowerCase()))
    );
  });

  // Calculate estimated output (same as input amount - 1:1 swap)
  const estimatedOutput = amount && fromAsset && toAsset ? amount : "";

  // Get current balance for the "From" field (using state to store async result)
  const [fromBalance, setFromBalance] = useState(0);

  useEffect(() => {
    if (fromAsset && open) {
      getAssetBalance(fromAsset).then(setFromBalance);
    }
  }, [fromAsset, open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white">
          <ArrowDownUp className="mr-2 h-4 w-4" />
          Swap
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Swap Assets</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* From Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              From
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-32 h-14 text-lg"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Dialog
                  open={fromSelectorOpen}
                  onOpenChange={setFromSelectorOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 gap-2 bg-secondary hover:bg-secondary/80 rounded-lg px-3"
                    >
                      {fromAsset ? (
                        <>
                          {fromAsset.currency === "USDT" ||
                          fromAsset.currency === "USDT_TRC20" ? (
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                              T
                            </div>
                          ) : (
                            <img
                              src={fromAsset.image}
                              alt={fromAsset.symbol}
                              className="w-5 h-5 rounded-full"
                            />
                          )}
                          <span className="font-bold text-sm">
                            {fromAsset.symbol.toUpperCase()}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm">Select</span>
                      )}
                      <ChevronDown size={14} className="opacity-50" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm p-0">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold mb-2">Select Token</h3>
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={16}
                        />
                        <Input
                          placeholder="Search name or symbol"
                          className="pl-9"
                          value={fromSearchQuery}
                          onChange={(e) => setFromSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="p-2">
                        {filteredFromAssets.map((asset) => (
                          <button
                            key={asset.id}
                            className="w-full flex items-center gap-3 p-3 hover:bg-secondary rounded-lg transition-colors text-left"
                            onClick={() => {
                              setFromAsset(asset);
                              setFromSelectorOpen(false);
                              setFromSearchQuery("");
                            }}
                          >
                            {asset.currency === "USDT" ||
                            asset.currency === "USDT_TRC20" ? (
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                                T
                              </div>
                            ) : (
                              <img
                                src={asset.image}
                                alt={asset.name}
                                className="w-8 h-8 rounded-full"
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-bold">
                                {asset.symbol.toUpperCase()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {asset.name}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              Balance: {fromBalance.toFixed(6)}{" "}
              {fromAsset?.symbol.toUpperCase() || ""}
            </div>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 bg-background shadow-sm hover:bg-secondary"
              onClick={toggleDirection}
            >
              <ArrowDownUp size={16} className="text-muted-foreground" />
            </Button>
          </div>

          {/* To Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              To
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={estimatedOutput}
                readOnly
                className="pr-32 h-14 text-lg bg-secondary/20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Dialog open={toSelectorOpen} onOpenChange={setToSelectorOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 gap-2 bg-secondary hover:bg-secondary/80 rounded-lg px-3"
                    >
                      {toAsset ? (
                        <>
                          {toAsset.currency === "USDT" ||
                          toAsset.currency === "USDT_TRC20" ? (
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                              T
                            </div>
                          ) : (
                            <img
                              src={toAsset.image}
                              alt={toAsset.symbol}
                              className="w-5 h-5 rounded-full"
                            />
                          )}
                          <span className="font-bold text-sm">
                            {toAsset.symbol.toUpperCase()}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm">Select</span>
                      )}
                      <ChevronDown size={14} className="opacity-50" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm p-0">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold mb-2">Select Token</h3>
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={16}
                        />
                        <Input
                          placeholder="Search name or symbol"
                          className="pl-9"
                          value={toSearchQuery}
                          onChange={(e) => setToSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="p-2">
                        {filteredToAssets.map((asset) => (
                          <button
                            key={asset.id}
                            className="w-full flex items-center gap-3 p-3 hover:bg-secondary rounded-lg transition-colors text-left"
                            onClick={() => {
                              setToAsset(asset);
                              setToSelectorOpen(false);
                              setToSearchQuery("");
                            }}
                          >
                            {asset.currency === "USDT" ||
                            asset.currency === "USDT_TRC20" ? (
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                                T
                              </div>
                            ) : (
                              <img
                                src={asset.image}
                                alt={asset.name}
                                className="w-8 h-8 rounded-full"
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-bold">
                                {asset.symbol.toUpperCase()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {asset.name}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              {toAsset
                ? `You will receive ${
                    estimatedOutput || "0.00"
                  } ${toAsset.symbol.toUpperCase()}`
                : "-"}
            </div>
          </div>

          <Button
            className="w-full mt-4 h-12 text-lg font-semibold"
            onClick={handleSwap}
            disabled={
              isLoading ||
              !amount ||
              !fromAsset ||
              !toAsset ||
              fromAsset.id === toAsset.id
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Swapping...
              </>
            ) : (
              "Swap Now"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SwapModal;
