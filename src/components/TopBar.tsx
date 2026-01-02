import { Bell, Search, LogOut, Wallet, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { useTradingStore } from "@/store/tradingStore";
import { useAuthStore } from "@/store/authStore";
import { useWalletStore } from "@/store/walletStore";
import { useToast } from "@/hooks/use-toast";
import { useNotificationStore } from "@/store/notificationStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlobalSearch from "./GlobalSearch";
import WalletConnectModal from "./WalletConnectModal";
import {
  formatBalance,
  formatAddress,
  getNetworkName,
} from "@/lib/walletUtils";
import { useQuery } from "@tanstack/react-query";
import { getAllUserWallets, formatUSDT } from "@/lib/usdtWalletUtils";

const TopBar = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const {
    walletAddress,
    balanceUSD,
    nativeBalance,
    chainId,
    walletType,
    disconnectWallet,
  } = useWalletStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  // Fetch wallets and calculate total balance
  const {
    data: wallets = [],
    isLoading: isLoadingWallets,
    isRefetching: isRefreshingWallets,
    refetch: refetchWallets,
  } = useQuery({
    queryKey: ["topbar-wallets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await getAllUserWallets(user.id);
    },
    enabled: !!user?.id && isAuthenticated,
    staleTime: 1000 * 5, // 5 seconds stale time
    refetchInterval: 10000, // Auto-refetch every 10 seconds
    retry: 2,
  });

  // Calculate total balance from all network wallets
  const totalWalletBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <>
      <div className="flex items-center justify-between flex-1 min-w-0">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search Button
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="text-muted-foreground hover:text-foreground rounded-xl"
          >
            <Search size={18} />
          </Button> */}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Wallet Connection Status */}
          {walletAddress ? (
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-secondary rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  {walletType === "solana"
                    ? "Solana"
                    : getNetworkName(chainId || 1)}
                </span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Wallet size={14} className="text-muted-foreground" />
                <span className="font-mono text-sm font-medium">
                  {formatBalance(nativeBalance, 4)}{" "}
                  {walletType === "solana" ? "SOL" : "ETH"}
                </span>
              </div>
              <div className="h-4 w-px bg-border" />
              <span className="font-mono text-xs text-muted-foreground">
                {formatAddress(walletAddress)}
              </span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWalletModalOpen(true)}
              className="hidden lg:flex rounded-xl"
            >
              <Wallet size={16} className="mr-2" />
              Connect Wallet
            </Button>
          )}

          {/* Account Balance */}
          {isAuthenticated && (
            <>
              {/* Welcome Message with Avatar */}
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                    <span className="text-xs font-bold text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-foreground hidden md:block">
                  {user?.name?.split(" ")[0] || "User"}
                </span>
              </div>

              <div className="hidden lg:flex items-center gap-4 text-sm">
                {/* Demo Mode Badge Removed */}
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help">
                          <span className="text-muted-foreground">
                            Total Balance:
                          </span>
                          <span className="font-mono font-bold text-foreground">
                            {formatUSDT(totalWalletBalance)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold text-xs">
                            Balance Breakdown:
                          </p>
                          {wallets.length > 0 ? (
                            wallets.map((wallet) => (
                              <p key={wallet.id}>
                                {wallet.network}:{" "}
                                <span className="font-mono text-green-400">
                                  {formatUSDT(wallet.balance)}
                                </span>
                              </p>
                            ))
                          ) : (
                            <p className="text-muted-foreground text-xs">
                              No wallets found
                            </p>
                          )}
                          <p className="mt-1 pt-1 border-t border-border">
                            <span className="font-semibold">Total: </span>
                            <span className="font-mono text-primary">
                              {formatUSDT(totalWalletBalance)}
                            </span>
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-muted"
                    onClick={async () => {
                      toast({ title: "Refreshing balance..." });
                      const { data: refreshedWallets = [] } =
                        await refetchWallets();
                      const refreshedTotal = refreshedWallets.reduce(
                        (sum, w) => sum + w.balance,
                        0
                      );
                      toast({
                        title: "Balance Refreshed",
                        description: `Total Balance: ${formatUSDT(
                          refreshedTotal
                        )}`,
                      });
                    }}
                    title="Refresh Balance"
                    disabled={isRefreshingWallets}
                  >
                    <RefreshCw
                      size={12}
                      className={isRefreshingWallets ? "animate-spin" : ""}
                    />
                  </Button>
                </div>
              </div>
            </>
          )}

          {isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground rounded-xl relative"
                onClick={() => navigate("/notifications")}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground rounded-xl"
              >
                <LogOut size={18} />
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/auth")}
              className="bg-primary text-foreground hover:bg-primary/90 rounded-xl"
            >
              Login
            </Button>
          )}
        </div>
      </div>

      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <WalletConnectModal
        open={walletModalOpen}
        onOpenChange={setWalletModalOpen}
      />
    </>
  );
};

export default TopBar;
