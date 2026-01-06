import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TradingViewWidget from "@/components/TradingViewWidget";
import { TrendingUp, DollarSign, Coins, Wheat, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Markets = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [selectedSymbol, setSelectedSymbol] = useState("CRYPTO:BTCUSD");
  const [interval, setInterval] = useState("D");

  const popularMarkets = [
    // Cryptocurrencies
    {
      symbol: "CRYPTO:BTCUSD",
      name: "Bitcoin",
      category: "Crypto",
      icon: Coins,
    },
    {
      symbol: "CRYPTO:ETHUSD",
      name: "Ethereum",
      category: "Crypto",
      icon: Coins,
    },
    { symbol: "CRYPTO:BNBUSD", name: "BNB", category: "Crypto", icon: Coins },
    {
      symbol: "CRYPTO:SOLUSD",
      name: "Solana",
      category: "Crypto",
      icon: Coins,
    },
    {
      symbol: "CRYPTO:ADAUSD",
      name: "Cardano",
      category: "Crypto",
      icon: Coins,
    },
    {
      symbol: "CRYPTO:XRPUSD",
      name: "Ripple",
      category: "Crypto",
      icon: Coins,
    },
    // Stocks
    {
      symbol: "NASDAQ:AAPL",
      name: "Apple Inc.",
      category: "Stocks",
      icon: TrendingUp,
    },
    {
      symbol: "NASDAQ:MSFT",
      name: "Microsoft",
      category: "Stocks",
      icon: TrendingUp,
    },
    {
      symbol: "NASDAQ:GOOGL",
      name: "Alphabet",
      category: "Stocks",
      icon: TrendingUp,
    },
    {
      symbol: "NASDAQ:TSLA",
      name: "Tesla",
      category: "Stocks",
      icon: TrendingUp,
    },
    {
      symbol: "NASDAQ:AMZN",
      name: "Amazon",
      category: "Stocks",
      icon: TrendingUp,
    },
    {
      symbol: "NASDAQ:META",
      name: "Meta",
      category: "Stocks",
      icon: TrendingUp,
    },
    // Forex
    {
      symbol: "FX:EURUSD",
      name: "EUR/USD",
      category: "Forex",
      icon: DollarSign,
    },
    {
      symbol: "FX:GBPUSD",
      name: "GBP/USD",
      category: "Forex",
      icon: DollarSign,
    },
    {
      symbol: "FX:USDJPY",
      name: "USD/JPY",
      category: "Forex",
      icon: DollarSign,
    },
    {
      symbol: "FX:AUDUSD",
      name: "AUD/USD",
      category: "Forex",
      icon: DollarSign,
    },
    // Commodities
    {
      symbol: "TVC:GOLD",
      name: "Gold",
      category: "Commodities",
      icon: Wheat,
    },
    {
      symbol: "TVC:SILVER",
      name: "Silver",
      category: "Commodities",
      icon: Wheat,
    },
    {
      symbol: "TVC:USOIL",
      name: "Crude Oil",
      category: "Commodities",
      icon: Wheat,
    },
  ];

  const intervals = [
    { label: "1m", value: "1" },
    { label: "5m", value: "5" },
    { label: "15m", value: "15" },
    { label: "1h", value: "60" },
    { label: "4h", value: "240" },
    { label: "1D", value: "D" },
    { label: "1W", value: "W" },
    { label: "1M", value: "M" },
  ];

  const selectedMarket =
    popularMarkets.find((m) => m.symbol === selectedSymbol) ||
    popularMarkets[0];

  // Group markets by category for tabs
  const marketsByCategory = popularMarkets.reduce((acc, market) => {
    if (!acc[market.category]) {
      acc[market.category] = [];
    }
    acc[market.category].push(market);
    return acc;
  }, {} as Record<string, typeof popularMarkets>);

  const categories = Object.keys(marketsByCategory);
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || "");

  // Authenticated view: Tabs at top, chart as main content
  if (isAuthenticated) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        {/* Category Tabs */}
        <div className="bg-card border border-border rounded-xl p-4">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="text-xs sm:text-sm"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="space-y-2">
              {marketsByCategory[selectedCategory]?.map((market) => {
                const Icon = market.icon;
                const isSelected = market.symbol === selectedSymbol;
                return (
                  <button
                    key={market.symbol}
                    onClick={() => setSelectedSymbol(market.symbol)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      isSelected
                        ? "bg-primary/20 border border-primary"
                        : "bg-secondary/50 hover:bg-secondary border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{market.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {market.symbol}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Tabs>
        </div>

        {/* Chart Header */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {selectedMarket.icon && (
                  <selectedMarket.icon className="h-5 w-5 text-primary" />
                )}
                {selectedMarket.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedMarket.symbol}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {intervals.map((int) => (
                <Button
                  key={int.value}
                  variant={interval === int.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInterval(int.value)}
                  className="h-8"
                >
                  {int.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* TradingView Chart */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <TradingViewWidget
            symbol={selectedSymbol}
            height={600}
            interval={interval}
          />
        </div>
      </div>
    );
  }

  // Unauthenticated view: Original layout with sidebar and back button
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/">
            <Button
              variant="default"
              size="sm"
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Market List Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="text-lg font-semibold mb-4">Popular Markets</h2>
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {popularMarkets.map((market) => {
                  const Icon = market.icon;
                  const isSelected = market.symbol === selectedSymbol;
                  return (
                    <button
                      key={market.symbol}
                      onClick={() => setSelectedSymbol(market.symbol)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        isSelected
                          ? "bg-primary/20 border border-primary"
                          : "bg-secondary/50 hover:bg-secondary border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">
                          {market.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {market.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Chart Header */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    {selectedMarket.icon && (
                      <selectedMarket.icon className="h-5 w-5 text-primary" />
                    )}
                    {selectedMarket.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedMarket.symbol}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {intervals.map((int) => (
                    <Button
                      key={int.value}
                      variant={interval === int.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setInterval(int.value)}
                      className="h-8"
                    >
                      {int.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* TradingView Chart */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <TradingViewWidget
                symbol={selectedSymbol}
                height={600}
                interval={interval}
              />
            </div>

            {/* Info Banner */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
              <p className="text-sm text-muted-foreground text-center">
                <strong className="text-foreground">
                  Want to start trading?
                </strong>{" "}
                <Link to="/auth" className="text-primary hover:underline">
                  Sign up for free
                </Link>{" "}
                to access advanced trading tools, portfolio management, and
                more.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Markets;
