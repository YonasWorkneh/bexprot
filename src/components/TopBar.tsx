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
import { formatBalance, formatAddress, getNetworkName } from "@/lib/walletUtils";

const TopBar = () => {
  const balance = useTradingStore((state) => state.balance);
  console.log('balance', balance);
  const { user, logout, isAuthenticated } = useAuthStore();
  const { walletAddress, balanceUSD, nativeBalance, chainId, walletType, disconnectWallet } = useWalletStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <>
      <div className="flex items-center justify-between flex-1 min-w-0">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="text-muted-foreground hover:text-foreground rounded-xl"
          >
            <Search size={18} />
          </Button>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Wallet Connection Status */}
          {walletAddress ? (
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-secondary rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  {walletType === 'solana' ? 'Solana' : getNetworkName(chainId || 1)}
                </span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Wallet size={14} className="text-muted-foreground" />
                <span className="font-mono text-sm font-medium">
                  {formatBalance(nativeBalance, 4)} {walletType === 'solana' ? 'SOL' : 'ETH'}
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
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
              </div>

              <div className="hidden lg:flex items-center gap-4 text-sm">
                {/* Demo Mode Badge Removed */}
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help">
                          <span className="text-muted-foreground">Balance:</span>
                          <span className="font-mono font-bold text-foreground">
                            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold text-xs">Balance Breakdown:</p>
                          <p>Internal (Deposited): <span className="font-mono text-green-400">${useTradingStore.getState().liveBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</span></p>
                          <p>External Wallet: <span className="font-mono text-blue-400">${useTradingStore.getState().externalBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</span></p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-muted"
                    onClick={async () => {
                      toast({ title: "Refreshing..." });
                      await useTradingStore.getState().fetchData();
                      await useWalletStore.getState().fetchBalance();
                      const newBalance = useTradingStore.getState().balance;
                      const isDemo = useTradingStore.getState().isDemo;
                      toast({
                        title: "Balance Refreshed",
                        description: `Current ${isDemo ? 'Demo ' : ''}Balance: $${newBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      });
                    }}
                    title="Refresh Balance"
                  >
                    <RefreshCw size={12} className={useTradingStore((state) => state.isLoading) ? "animate-spin" : ""} />
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
                {useNotificationStore((state) => state.unreadCount) > 0 && (
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
      </div >

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
