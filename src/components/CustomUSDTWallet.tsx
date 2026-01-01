import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import InlineDepositSystem from "./InlineDepositSystem";
import {
  Wallet as WalletIcon,
  Send,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  Copy,
  RefreshCw,
  QrCode,
  TrendingUp,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useTradingStore } from "@/store/tradingStore";
import { useToast } from "@/hooks/use-toast";
import {
  getUserWallets,
  getAllUserWallets,
  createUSDTWallet,
  getTotalBalance,
  formatUSDT,
  NETWORKS,
  getNetworkConfig,
  type Network,
  type USDTWallet,
} from "@/lib/usdtWalletUtils";
import USDTSendDialog from "./USDTSendDialog";
import USDTReceiveDialog from "./USDTReceiveDialog";
import USDTDepositDialog from "./USDTDepositDialog";
import USDTWithdrawDialog from "./USDTWithdrawDialog";
import USDTTransactionHistory from "./USDTTransactionHistory";
import RealDepositDialog from "./RealDepositDialog";
import SwapModal from "./SwapModal";
import CryptoDepositDialog from "./CryptoDepositDialog";
import UserDepositHistory from "./UserDepositHistory";
import { getNetworkIcon } from "@/lib/cryptoIcons";

import { useQuery, useQueryClient } from "@tanstack/react-query";

const CustomUSDTWallet = () => {
  const user = useAuthStore((state) => state.user);
  const { fetchData, isDemo } = useTradingStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedWallet, setSelectedWallet] = useState<USDTWallet | null>(null);

  // Dialog states
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [realDepositDialogOpen, setRealDepositDialogOpen] = useState(false);
  const [cryptoDepositDialogOpen, setCryptoDepositDialogOpen] = useState(false);

  // Get balance from trading store
  const balance = useTradingStore((state) => state.balance);

  // Fetch Wallets Query (including credited deposits)
  const {
    data: wallets = [],
    isLoading: loading,
    isRefetching: refreshing,
    error,
    refetch: loadWallets,
  } = useQuery({
    queryKey: ["usdt-wallets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First check if regular wallets exist
      let regularWallets = await getUserWallets(user.id);

      // Auto-create wallets if none exist
      if (regularWallets.length === 0) {
        console.log("No wallets found, creating default wallets...");
        const networks: Network[] = [
          "BTC",
          "USDT_TRC20",
          "SOL",
          "XRP",
          "LTC",
          "BNB",
          "ETH",
          "USDC_ERC20",
        ];
        const creationPromises = networks.map((network) =>
          createUSDTWallet(user.id, network)
        );
        await Promise.all(creationPromises);

        // Fetch again after creation
        regularWallets = await getUserWallets(user.id);

        if (regularWallets.length > 0) {
          toast({
            title: "Wallets Created",
            description: "Your crypto wallets have been automatically created.",
          });
        }
      }

      // Get all wallets including credited deposits
      const allWallets = await getAllUserWallets(user.id);

      return allWallets;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30, // 30 seconds stale time
    refetchInterval: 30000, // Auto-refetch every 30s
  });

  // Calculate total balance
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const lastUpdated = new Date(); // React Query handles this internally, but for UI display we can use current time on render or data timestamp

  // Effect to select default wallet
  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(wallets[0]);
    } else if (wallets.length > 0 && selectedWallet) {
      // Ensure selected wallet still exists/is updated
      const updated = wallets.find((w) => w.id === selectedWallet.id);
      if (updated) setSelectedWallet(updated);
    }
  }, [wallets, selectedWallet]);

  // Sync with global trading store when wallets update
  useEffect(() => {
    if (wallets.length > 0) {
      fetchData();
    }
  }, [wallets, fetchData]);

  // Reload when global balance changes
  useEffect(() => {
    loadWallets();
  }, [balance, loadWallets]);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const handleRefresh = () => {
    loadWallets();
    toast({
      title: "Refreshed",
      description: "Wallet balances updated",
    });
  };

  const handleDialogOpen = (
    dialogSetter: (open: boolean) => void,
    dialogName: string
  ) => {
    if (!selectedWallet && wallets.length === 0) {
      toast({
        title: "No Wallets Available",
        description:
          "Please wait while wallets are being created, or check if the database schema has been set up.",
        variant: "destructive",
      });
      // Try to reload wallets
      loadWallets();
      return;
    }
    dialogSetter(true);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <WalletIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">
            Authentication Required
          </h3>
          <p className="text-muted-foreground">
            Please log in to access your Bexprot wallet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 text-white border-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24 blur-2xl" />

        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardDescription className="text-green-100">
                Total Bexprot Wallet Balance
                {isDemo && " (Demo)"}
              </CardDescription>
              <CardTitle className="text-4xl md:text-5xl font-bold mt-2 font-mono">
                ${formatUSDT(balance)}
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-white hover:bg-white/20"
              >
                <RefreshCw
                  className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <TrendingUp className="h-7 w-7" />
              </div>
            </div>
          </div>
          {lastUpdated && (
            <div className="mt-2 text-sm text-green-100">
              Last updated: {lastUpdated.toLocaleString()}
            </div>
          )}
        </CardHeader>

        <CardContent className="relative">
          <div className="flex items-center gap-2 text-green-50 mb-4">
            <WalletIcon className="h-4 w-4" />
            <span className="text-sm">Tether USD (USDT)</span>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <SwapModal />
            <Button
              onClick={() => setCryptoDepositDialogOpen(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white"
            >
              <ArrowDownCircle className="mr-2 h-4 w-4" />
              Deposit Crypto
            </Button>
            <Button
              onClick={() =>
                handleDialogOpen(setWithdrawDialogOpen, "Withdraw")
              }
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white"
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
            {/* <Button
                            onClick={() => handleDialogOpen(setSendDialogOpen, 'Send')}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white"
                        >
                            <Send className="mr-2 h-4 w-4" />
                            Send
                        </Button>
                        <Button
                            onClick={() => handleDialogOpen(setReceiveDialogOpen, 'Receive')}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white"
                        >
                            <QrCode className="mr-2 h-4 w-4" />
                            Receive
                        </Button> */}
          </div>
        </CardContent>
      </Card>

      {/* Wallets by Network */}
      <Card>
        <CardHeader>
          <CardTitle>Network Wallets</CardTitle>
          <CardDescription>
            Your Bexprot balances across different networks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {loading && wallets.length === 0
              ? Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-muted rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-muted rounded w-16" />
                            <div className="h-2 bg-muted rounded w-8" />
                          </div>
                        </div>
                        <div className="h-6 bg-muted rounded w-24 mb-2" />
                        <div className="h-3 bg-muted rounded w-full" />
                      </CardContent>
                    </Card>
                  ))
              : wallets.map((wallet) => {
                  const network =
                    getNetworkConfig(wallet.network) || NETWORKS.USDT_TRC20;

                  // Skip if network is not found (shouldn't happen with getNetworkConfig)
                  if (!network) {
                    console.warn(
                      `Skipping wallet with unknown network: ${wallet.network}`
                    );
                    return null;
                  }

                  return (
                    <Card
                      key={wallet.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedWallet?.id === wallet.id
                          ? "ring-2 ring-primary shadow-md"
                          : "hover:ring-1 hover:ring-primary/50"
                      }`}
                      onClick={() => setSelectedWallet(wallet)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-2 shadow-md">
                            <img
                              src={getNetworkIcon(wallet.network)}
                              alt={network.symbol}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">
                              {network.name}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {network.symbol}
                            </Badge>
                          </div>
                          {selectedWallet?.id === wallet.id && (
                            <Badge className="text-xs">Active</Badge>
                          )}
                        </div>
                        <div className="mb-2">
                          <p className="text-2xl font-bold font-mono">
                            ${formatUSDT(wallet.balance)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t">
                          <span className="text-xs text-muted-foreground font-mono">
                            {wallet.address.slice(0, 6)}...
                            {wallet.address.slice(-4)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyAddress(wallet.address);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent Bexprot transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <USDTTransactionHistory userId={user.id} onRefresh={loadWallets} />
        </CardContent>
      </Card>

      {/* Dialogs - only render if we have at least one wallet */}
      {(selectedWallet || wallets[0]) && (
        <>
          <USDTSendDialog
            open={sendDialogOpen}
            onOpenChange={setSendDialogOpen}
            wallet={selectedWallet || wallets[0]}
            onSuccess={loadWallets}
          />
          <USDTReceiveDialog
            open={receiveDialogOpen}
            onOpenChange={setReceiveDialogOpen}
            wallet={selectedWallet || wallets[0]}
          />
          <USDTDepositDialog
            open={depositDialogOpen}
            onOpenChange={setDepositDialogOpen}
            wallet={selectedWallet || wallets[0]}
            onSuccess={loadWallets}
          />
          <USDTWithdrawDialog
            open={withdrawDialogOpen}
            onOpenChange={setWithdrawDialogOpen}
            wallet={selectedWallet || wallets[0]}
            onSuccess={loadWallets}
          />
        </>
      )}

      {/* User Deposit History (Unified View) */}
      <Card>
        <CardHeader>
          <CardTitle>Deposit History</CardTitle>
          <CardDescription>
            View your recent deposit requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserDepositHistory userId={user.id} />
        </CardContent>
      </Card>

      {/* Real Deposit Dialog */}
      <RealDepositDialog
        open={realDepositDialogOpen}
        onOpenChange={setRealDepositDialogOpen}
        onSuccess={loadWallets}
      />

      {/* Crypto Deposit Dialog */}
      <CryptoDepositDialog
        open={cryptoDepositDialogOpen}
        onOpenChange={setCryptoDepositDialogOpen}
      />
    </div>
  );
};

export default CustomUSDTWallet;
