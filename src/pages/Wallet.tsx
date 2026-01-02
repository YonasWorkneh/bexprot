import { Button } from "@/components/ui/button";
import {
  Wallet as WalletIcon,
  Copy,
  Power,
  Network,
  ArrowUpFromLine,
} from "lucide-react";
import { useTradingStore } from "@/store/tradingStore";
import { useAuthStore } from "@/store/authStore";
import { useWalletStore } from "@/store/walletStore";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import WalletConnectModal from "@/components/WalletConnectModal";
import SendCrypto from "@/components/SendCrypto";
import ReceiveCrypto from "@/components/ReceiveCrypto";
import TransactionHistory from "@/components/TransactionHistory";
import WithdrawDialog from "@/components/WithdrawDialog";
import CustomUSDTWallet from "@/components/CustomUSDTWallet";
import CryptoNetworkAddresses from "@/components/CryptoNetworkAddresses";
import {
  formatBalance,
  formatAddress,
  getNetworkName,
  getNativeCurrency,
} from "@/lib/walletUtils";
import { SUPPORTED_WALLETS } from "@/lib/walletConfig";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Wallet = () => {
  const { syncWithWalletBalance } = useTradingStore();
  const { user, isAuthenticated } = useAuthStore();

  // Fetch trading balance from user table with React Query
  const { data: tradingBalance = 0, isLoading: isLoadingBalance } = useQuery({
    queryKey: ["wallet-trading-balance", user?.id],
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
      return (data?.trading_balance as number) || 0;
    },
    enabled: !!user?.id && isAuthenticated,
    staleTime: 1000 * 5, // 5 seconds stale time
    refetchInterval: 10000, // Auto-refetch every 10 seconds
    retry: 2,
  });

  const balance = tradingBalance;
  const {
    connectedWallet,
    walletAddress,
    nativeBalance,
    balanceUSD,
    walletType,
    chainId,
    disconnectWallet,
    switchChain,
    fetchBalance,
  } = useWalletStore();
  const { toast } = useToast();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const { reconnect } = useWalletStore();

  // Reconnect wallet on mount
  useEffect(() => {
    reconnect();
  }, [reconnect]);

  // Fetch USDT balance on mount and when user changes
  const { fetchUSDTBalance } = useTradingStore();
  useEffect(() => {
    if (user) {
      fetchUSDTBalance();
    }
  }, [user, fetchUSDTBalance]);

  // Sync wallet balance with trading balance
  useEffect(() => {
    if (connectedWallet && balanceUSD >= 0) {
      syncWithWalletBalance(balanceUSD);
    } else if (!connectedWallet) {
      syncWithWalletBalance(0);
    }
  }, [balanceUSD, connectedWallet, syncWithWalletBalance]);

  // Refresh balance periodically
  useEffect(() => {
    if (connectedWallet) {
      const interval = setInterval(() => {
        fetchBalance();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [connectedWallet, fetchBalance]);

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: "Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const handleSwitchChain = async (newChainId: number) => {
    const result = await switchChain(newChainId);
    if (result.success) {
      toast({
        title: "Network Switched",
        description: `Switched to ${getNetworkName(newChainId)}`,
      });
    } else {
      toast({
        title: "Switch Failed",
        description: result.error || "Failed to switch network",
        variant: "destructive",
      });
    }
  };

  const walletInfo = SUPPORTED_WALLETS.find((w) => w.id === connectedWallet);
  const currency =
    walletType === "solana" ? "SOL" : getNativeCurrency(chainId || 1);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Wallet
        </h1>
        <p className="text-muted-foreground">
          Manage your crypto wallet and transactions
        </p>
      </div>

      {/* Bexprot Wallet (formerly USDT Wallet) - Now at the top */}
      <div className="mb-8">
        <CustomUSDTWallet />
      </div>

      {/* Crypto Network Addresses */}
      <div className="mb-8">
        <CryptoNetworkAddresses />
      </div>

      <div className="border-t border-border my-8"></div>

      {/* Account Balance Card */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              Trading Account Balance
            </div>
            <div className="text-3xl font-bold font-mono text-foreground">
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-right space-y-2">
            <div className="text-xs text-muted-foreground mb-1">
              Account Holder
            </div>
            <div className="font-semibold text-foreground">
              {user?.name || "Guest User"}
            </div>
          </div>
        </div>
      </div>

      <WalletConnectModal
        open={walletModalOpen}
        onOpenChange={setWalletModalOpen}
      />

      <WithdrawDialog
        open={withdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
      />
    </div>
  );
};

export default Wallet;
