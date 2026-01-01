import { useQuery } from "@tanstack/react-query";
import { fetchTopCryptos } from "@/lib/coingecko";
import PriceCard from "@/components/PriceCard";
import { useNavigate } from "react-router-dom";
import { Loader2, TrendingUp, ChevronDown, ChevronUp, Wallet } from "lucide-react";
import { useTradingStore } from "@/store/tradingStore";
import { useAuthStore } from "@/store/authStore";
import PositionsPanel from "@/components/PositionsPanel";
import OrdersPanel from "@/components/OrdersPanel";
import TradingViewWidget from "@/components/TradingViewWidget";
import RecentActivity from "@/components/RecentActivity";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    getTotalPnL,
    getEquity,
    getOpenPositionsCount,
    getTotalTrades,
    getWinRate,
    positions,
    orderHistory
  } = useTradingStore();
  const user = useAuthStore((state) => state.user);
  const [isPanelsOpen, setIsPanelsOpen] = useState(true);

  const { data: cryptos, isLoading } = useQuery({
    queryKey: ["topCryptos"],
    queryFn: () => fetchTopCryptos(20),
    refetchInterval: 30000,
  });

  // Use computed statistics for real-time updates
  const totalPnL = getTotalPnL();
  const equity = getEquity();
  const openPositions = getOpenPositionsCount();
  const totalTrades = getTotalTrades();
  const winRate = getWinRate();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {user ? `Welcome back, ${user.name}!` : "Dashboard"}
          </h1>
          <p className="text-muted-foreground">Your trading overview and market data</p>
        </div>
      </div>

      {/* Trading Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Equity Card */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Equity</div>
            <Wallet className="text-primary" size={18} />
          </div>
          <div className="text-2xl font-mono font-bold text-foreground">
            ${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Total P&L</div>
            <TrendingUp className={totalPnL >= 0 ? "text-success" : "text-danger"} size={18} />
          </div>
          <div className={`text-2xl font-mono font-bold ${totalPnL >= 0 ? "text-success" : "text-danger"}`}>
            {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-2">Open Positions</div>
          <div className="text-2xl font-bold text-foreground">{openPositions}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-2">Total Trades</div>
          <div className="text-2xl font-bold text-foreground">{totalTrades}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-2">Win Rate</div>
          <div className="text-2xl font-bold text-foreground">
            {totalTrades > 0
              ? `${winRate.toFixed(1)}%`
              : "—"}
          </div>
        </div>
      </div>

      {/* Trading Panels (Collapsible) */}
      {(positions.length > 0 || orderHistory.length > 0) && (
        <Collapsible open={isPanelsOpen} onOpenChange={setIsPanelsOpen} className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Active Orders & Positions</h2>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                {isPanelsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PositionsPanel />
              <OrdersPanel />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Favorite Chart & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4 h-[500px]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Favorite Chart</h2>
            <div className="text-sm text-muted-foreground">BTC/USD</div>
          </div>
          <div className="h-[calc(100%-2rem)]">
            <TradingViewWidget symbol="CRYPTO:BTCUSD" height="100%" />
          </div>
        </div>
        <div className="lg:col-span-1 h-[500px]">
          <RecentActivity />
        </div>
      </div>

      {/* Market Overview */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Top Cryptocurrencies</h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cryptos?.map((crypto) => (
              <PriceCard
                key={crypto.id}
                asset={crypto}
                onClick={() => navigate(`/crypto/${crypto.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
