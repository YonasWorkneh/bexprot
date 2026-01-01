import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCommodities, generateChartData } from "@/lib/marketData";
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, Sparkles, Fuel, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import PositionsPanel from "@/components/PositionsPanel";
import OrdersPanel from "@/components/OrdersPanel";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradingViewSymbolInfo from "@/components/TradingViewSymbolInfo";
import { useTradingStore } from "@/store/tradingStore";
import { useEffect, useState } from "react";
import TradingPanel from "@/components/TradingPanel";

import {
  GiGoldBar,
  GiMetalBar,
  GiOilDrum,
  GiFire,
  GiWireCoil,
  GiRing,
  GiWheat,
  GiCorn,
  GiCoffeeBeans,
  GiSugarCane,
  GiTShirt,
  GiChocolateBar,
  GiMinerals,
  GiSodaCan
} from "react-icons/gi";

const getCommodityIcon = (symbol: string) => {
  const iconMap: Record<string, any> = {
    'GC': { icon: GiGoldBar, color: "text-yellow-500" },      // Gold
    'SI': { icon: GiMetalBar, color: "text-slate-400" },      // Silver
    'CL': { icon: GiOilDrum, color: "text-slate-800" },       // Oil
    'NG': { icon: GiFire, color: "text-blue-500" },           // Natural Gas
    'HG': { icon: GiWireCoil, color: "text-orange-600" },     // Copper
    'PL': { icon: GiRing, color: "text-slate-300" },          // Platinum
    'ZW': { icon: GiWheat, color: "text-yellow-600" },        // Wheat
    'ZC': { icon: GiCorn, color: "text-yellow-400" },         // Corn
    'PA': { icon: GiMinerals, color: "text-slate-500" },      // Palladium
    'AL': { icon: GiSodaCan, color: "text-slate-400" },       // Aluminum
    'KC': { icon: GiCoffeeBeans, color: "text-amber-800" },   // Coffee
    'SB': { icon: GiSugarCane, color: "text-green-600" },     // Sugar
    'CT': { icon: GiTShirt, color: "text-slate-200" },        // Cotton
    'CC': { icon: GiChocolateBar, color: "text-amber-900" },  // Cocoa
  };
  return iconMap[symbol] || { icon: GiMinerals, color: "text-primary" };
};

const CommodityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const updatePositionPrices = useTradingStore((state) => state.updatePositionPrices);

  const getCommoditySymbol = (symbol: string, category: string) => {
    const symbolMap: Record<string, string> = {
      'GC': 'TVC:GOLD',
      'SI': 'TVC:SILVER',
      'CL': 'TVC:USOIL',
      'NG': 'TVC:NATURALGAS',
      'HG': 'TVC:COPPER',
      'PL': 'TVC:PLATINUM',
      'ZW': 'CBOT:ZW1!',
      'ZC': 'CBOT:ZC1!',
      'PA': 'TVC:PALLADIUM',
      'AL': 'TVC:ALUMINUM',
      'KC': 'TVC:COFFEE',
      'SB': 'TVC:SUGAR',
      'CT': 'TVC:COTTON',
      'CC': 'TVC:COCOA',
    };
    return symbolMap[symbol] || `TVC:${symbol}`;
  };

  const { data: commodities, isLoading } = useQuery({
    queryKey: ["commodities"],
    queryFn: fetchCommodities,
    refetchInterval: 1000,
  });

  const [tvInterval, setTvInterval] = useState<string>("D");
  const [tradingMode, setTradingMode] = useState<"spot" | "futures" | "contract">("spot");

  const commodity = commodities?.find((c) => c.symbol === id);

  useEffect(() => {
    if (commodity) {
      updatePositionPrices(`commodity_${commodity.symbol}`, commodity.price);
    }
  }, [commodity, updatePositionPrices]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!commodity) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Commodity not found
      </div>
    );
  }

  const isPositive = commodity.changePercent >= 0;
  const { icon: CommodityIcon, color } = getCommodityIcon(commodity.symbol);



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
          <div className="w-12 h-12 bg-secondary/50 rounded-xl flex items-center justify-center">
            <CommodityIcon className={color} size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{commodity.name}</h1>
            <div className="text-muted-foreground">{commodity.symbol}</div>
          </div>
        </div>

        <div className="mb-4">
          <TradingViewSymbolInfo symbol={getCommoditySymbol(commodity.symbol, commodity.category)} />
        </div>
      </div>

      <div className="mb-6">
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
          <TradingViewWidget symbol={getCommoditySymbol(commodity.symbol, commodity.category)} height={500} interval={tvInterval} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <TradingPanel
            assetId={`commodity_${commodity.symbol}`}
            assetSymbol={commodity.symbol}
            currentPrice={commodity.price}
            tradingMode={tradingMode}
          />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <PositionsPanel assetId={`commodity_${commodity.symbol}`} assetSymbol={commodity.symbol} />
          <OrdersPanel assetId={`commodity_${commodity.symbol}`} assetSymbol={commodity.symbol} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-2">Unit</div>
          <div className="text-xl font-semibold text-foreground">{commodity.unit}</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-2">Category</div>
          <div className="text-xl font-semibold text-foreground">{commodity.category}</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-2">Change</div>
          <div className={`text-xl font-mono font-semibold ${isPositive ? "text-success" : "text-danger"}`}>
            {isPositive ? "+" : ""}${commodity.change.toFixed(2)}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-2">Change %</div>
          <div className={`text-xl font-mono font-semibold ${isPositive ? "text-success" : "text-danger"}`}>
            {isPositive ? "+" : ""}{commodity.changePercent.toFixed(2)}%
          </div>
        </div>
      </div>

    </div>
  );
};

export default CommodityDetail;
