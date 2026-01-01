import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchForexPairs } from "@/lib/marketData";
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import PositionsPanel from "@/components/PositionsPanel";
import OrdersPanel from "@/components/OrdersPanel";
import TradingViewWidget from "@/components/TradingViewWidget";
import { useTradingStore } from "@/store/tradingStore";
import { useEffect, useState } from "react";
import TradingPanel from "@/components/TradingPanel";

const ForexDetail = () => {
  const { pair } = useParams<{ pair: string }>();
  const navigate = useNavigate();
  const updatePositionPrices = useTradingStore((state) => state.updatePositionPrices);
  const [tradingMode, setTradingMode] = useState<"spot" | "futures" | "contract">("spot");
  const [tvInterval, setTvInterval] = useState<string>("D");

  const { data: pairs, isLoading } = useQuery({
    queryKey: ["forex"],
    queryFn: fetchForexPairs,
    refetchInterval: 3000,
  });

  const forexPair = pairs?.find((p) => p.symbol.replace('/', '-') === pair);

  useEffect(() => {
    if (forexPair) {
      updatePositionPrices(`forex_${forexPair.symbol}`, forexPair.rate);
    }
  }, [forexPair, updatePositionPrices]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!forexPair) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Forex pair not found
      </div>
    );
  }

  const isPositive = forexPair.changePercent >= 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground rounded-lg"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg border border-border">
          <span className="text-xs font-medium text-muted-foreground px-2 hidden sm:block">Mode:</span>
          {(["spot", "futures", "contract"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTradingMode(mode)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                tradingMode === mode 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <DollarSign className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{forexPair.symbol}</h1>
            <div className="text-muted-foreground">{forexPair.name}</div>
          </div>
        </div>

        <div className="mb-2 flex flex-wrap gap-2">
          {[
            { label: "1m", v: "1" },
            { label: "5m", v: "5" },
            { label: "15m", v: "15" },
            { label: "1h", v: "60" },
            { label: "4h", v: "240" },
            { label: "1D", v: "D" },
            { label: "1W", v: "W" },
            { label: "1M", v: "M" },
          ].map((tf) => (
            <Button
              key={tf.label}
              variant={tvInterval === tf.v ? "default" : "outline"}
              size="sm"
              onClick={() => setTvInterval(tf.v)}
            >
              {tf.label}
            </Button>
          ))}
        </div>

        <div className="mb-6">
          <TradingViewWidget symbol={`FX:${forexPair.symbol.replace('/', '')}`} height={500} interval={tvInterval} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <TradingPanel
            assetId={`forex_${forexPair.symbol}`}
            assetSymbol={forexPair.symbol}
            currentPrice={forexPair.rate}
            tradingMode={tradingMode}
          />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <PositionsPanel assetId={`forex_${forexPair.symbol}`} assetSymbol={forexPair.symbol} />
          <OrdersPanel assetId={`forex_${forexPair.symbol}`} assetSymbol={forexPair.symbol} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-2">Bid Price</div>
          <div className="text-xl font-mono font-semibold text-foreground">
            {forexPair.bid.toFixed(4)}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-2">Ask Price</div>
          <div className="text-xl font-mono font-semibold text-foreground">
            {forexPair.ask.toFixed(4)}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-2">Spread</div>
          <div className="text-xl font-mono font-semibold text-foreground">
            {(forexPair.ask - forexPair.bid).toFixed(4)}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-2">Change</div>
          <div className={`text-xl font-mono font-semibold ${isPositive ? "text-success" : "text-danger"}`}>
            {isPositive ? "+" : ""}{forexPair.change.toFixed(4)}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ForexDetail;