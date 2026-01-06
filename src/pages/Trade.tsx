import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTopCryptos, fetchAssetDetail } from "@/lib/coingecko";
import {
  fetchStocks,
  fetchForexPairs,
  fetchCommodities,
} from "@/lib/marketData";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradingPanel from "@/components/TradingPanel";
import TradeHistoryPanel from "@/components/TradeHistoryPanel";
import FavoriteIntervalFilters from "@/components/FavoriteIntervalFilters";
import ChartIntervalSelector from "@/components/ChartIntervalSelector";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTradingStore } from "@/store/tradingStore";
import { useAuthStore } from "@/store/authStore";
import {
  Loader2,
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Search,
} from "lucide-react";
import { formatBalance } from "@/lib/walletUtils";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { fetchTrades, type Trade } from "@/lib/tradesService";

const Trade = () => {
  const [selectedAsset, setSelectedAsset] = useState("bitcoin");
  const [assetType, setAssetType] = useState<
    "crypto" | "stock" | "forex" | "commodity"
  >("crypto");
  const [assetSymbol, setAssetSymbol] = useState("BTC");
  const [assetName, setAssetName] = useState("Bitcoin");
  const [currentPrice, setCurrentPrice] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [timeframe, setTimeframe] = useState(1); // Default 1 day for chart data fetch (not used for TV widget)
  const [showTradeMarkers, setShowTradeMarkers] = useState(true);
  const {
    orders,
    positions,
    cancelOrder,
    closePosition,
    systemSettings,
    isDemo,
  } = useTradingStore();
  const { user } = useAuthStore();

  // Fetch data based on asset type
  const { data: cryptos } = useQuery({
    queryKey: ["topCryptos", 100],
    queryFn: () => fetchTopCryptos(100),
    staleTime: 60000,
    enabled: searchOpen && assetType === "crypto",
  });

  const { data: stocks } = useQuery({
    queryKey: ["stocks"],
    queryFn: fetchStocks,
    staleTime: 60000,
    enabled: searchOpen && assetType === "stock",
  });

  const { data: forex } = useQuery({
    queryKey: ["forex"],
    queryFn: fetchForexPairs,
    staleTime: 60000,
    enabled: searchOpen && assetType === "forex",
  });

  const { data: commodities } = useQuery({
    queryKey: ["commodities"],
    queryFn: fetchCommodities,
    staleTime: 60000,
    enabled: searchOpen && assetType === "commodity",
  });

  // Fetch current price for selected asset
  useEffect(() => {
    const fetchPrice = async () => {
      if (assetType === "crypto") {
        try {
          const data = await fetchAssetDetail(selectedAsset);
          if (data) setCurrentPrice(data.current_price);
        } catch (e) {
          console.error("Failed to fetch crypto price", e);
        }
      } else if (assetType === "stock") {
        const stock = await fetchStocks().then((res) =>
          res.find((s) => s.symbol === selectedAsset)
        );
        if (stock) setCurrentPrice(stock.price);
      } else if (assetType === "forex") {
        const pair = await fetchForexPairs().then((res) =>
          res.find((p) => p.symbol === selectedAsset)
        );
        if (pair) setCurrentPrice(pair.rate);
      } else if (assetType === "commodity") {
        const comm = await fetchCommodities().then((res) =>
          res.find((c) => c.symbol === selectedAsset)
        );
        if (comm) setCurrentPrice(comm.price);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 5000);
    return () => clearInterval(interval);
  }, [selectedAsset, assetType]);

  const [tvInterval, setTvInterval] = useState<string>("D");

  const getTradingViewSymbol = () => {
    if (assetType === "crypto") return `CRYPTO:${assetSymbol}USD`;
    if (assetType === "stock") return `NASDAQ:${assetSymbol}`;
    if (assetType === "forex") return `FX:${assetSymbol.replace("/", "")}`;
    if (assetType === "commodity") {
      const map: Record<string, string> = {
        GC: "TVC:GOLD",
        SI: "TVC:SILVER",
        CL: "TVC:USOIL",
        NG: "TVC:NATURALGAS",
        HG: "TVC:COPPER",
        PL: "TVC:PLATINUM",
        ZW: "CBOT:ZW1!",
        ZC: "CBOT:ZC1!",
        PA: "TVC:PALLADIUM",
        AL: "TVC:ALUMINUM",
        KC: "TVC:COFFEE",
        SB: "TVC:SUGAR",
        CT: "TVC:COTTON",
        CC: "TVC:COCOA",
      };
      return map[assetSymbol] || `TVC:${assetSymbol}`;
    }
    return `CRYPTO:${assetSymbol}USD`;
  };

  const handleAssetSelect = (
    asset,
    type: "crypto" | "stock" | "forex" | "commodity"
  ) => {
    setAssetType(type);
    if (type === "crypto") {
      setSelectedAsset(asset.id);
      setAssetSymbol(asset.symbol.toUpperCase());
      setAssetName(asset.name);
      setCurrentPrice(asset.current_price);
    } else if (type === "stock") {
      setSelectedAsset(asset.symbol);
      setAssetSymbol(asset.symbol);
      setAssetName(asset.name);
      setCurrentPrice(asset.price);
    } else if (type === "forex") {
      setSelectedAsset(asset.symbol);
      setAssetSymbol(asset.symbol);
      setAssetName(asset.name);
      setCurrentPrice(asset.rate);
    } else if (type === "commodity") {
      setSelectedAsset(asset.symbol);
      setAssetSymbol(asset.symbol);
      setAssetName(asset.name);
      setCurrentPrice(asset.price);
    }
    setSearchOpen(false);
  };

  const getFilteredResults = () => {
    const query = searchQuery.toLowerCase();
    if (assetType === "crypto") {
      return (
        cryptos?.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.symbol.toLowerCase().includes(query)
        ) || []
      );
    }
    if (assetType === "stock") {
      return (
        stocks?.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.symbol.toLowerCase().includes(query)
        ) || []
      );
    }
    if (assetType === "forex") {
      return (
        forex?.filter(
          (f) =>
            f.name.toLowerCase().includes(query) ||
            f.symbol.toLowerCase().includes(query)
        ) || []
      );
    }
    if (assetType === "commodity") {
      return (
        commodities?.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.symbol.toLowerCase().includes(query)
        ) || []
      );
    }
    return [];
  };

  const [tradingMode, setTradingMode] = useState<
    "spot" | "futures" | "contract"
  >("spot");

  // Get current asset ID for filtering trades
  const currentAssetId =
    assetType === "crypto"
      ? `crypto_${selectedAsset}`
      : `${assetType}_${selectedAsset}`;

  // Fetch trade history using React Query
  const {
    data: trades = [],
    isLoading: tradesLoading,
    error: tradesError,
  } = useQuery({
    queryKey: ["trades", user?.id, isDemo, currentAssetId],
    queryFn: () =>
      fetchTrades({
        userId: user?.id || "",
        isDemo,
        assetId: currentAssetId,
        limit: 100,
      }),
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Format asset name from trade asset field
  // Assets are stored as "crypto_bitcoin", "stock_AAPL", etc.
  const getAssetDisplayName = (asset: string): string => {
    if (asset.includes("_")) {
      const parts = asset.split("_");
      const assetName = parts.slice(1).join("_");
      // For crypto, capitalize; for others, keep original case
      if (parts[0] === "crypto") {
        return assetName.toUpperCase();
      }
      return assetName;
    }
    return asset.toUpperCase();
  };

  return (
    <div className="p-4 md:p-6 min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground hidden md:block">
            Trade
          </h1>

          {/* Mode Selector */}
          <div className="flex bg-secondary/50 p-1 rounded-lg border border-border">
            {(["spot", "futures", "contract"] as const)
              .filter((mode) => mode !== "contract" || orders.length >= 0) // Placeholder to keep TS happy
              .filter((mode) => {
                if (mode === "contract") {
                  return systemSettings.contract_trading_enabled;
                }
                return true;
              })
              .map((mode) => (
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

          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="min-w-[160px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold">{assetSymbol}</span>
                  <span className="text-muted-foreground text-xs">
                    | {assetName}
                  </span>
                </div>
                <Search size={16} className="text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0">
              <div className="p-4 border-b border-border">
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {(["crypto", "stock", "forex", "commodity"] as const).map(
                    (type) => (
                      <Button
                        key={type}
                        variant={assetType === type ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setAssetType(type)}
                        className="capitalize"
                      >
                        {type}
                      </Button>
                    )
                  )}
                </div>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <Input
                    placeholder="Search assets..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2">
                {getFilteredResults().map((item) => (
                  <button
                    key={item.id || item.symbol}
                    className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors text-left"
                    onClick={() => handleAssetSelect(item, assetType)}
                  >
                    <div>
                      <div className="font-bold">
                        {item.symbol.toUpperCase()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">
                        $
                        {(
                          item.current_price ||
                          item.price ||
                          item.rate ||
                          0
                        ).toLocaleString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right mr-4 hidden md:block">
            <div className="text-xs text-muted-foreground">Current Price</div>
            <div className="text-lg font-mono font-bold">
              ${currentPrice.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 md:min-h-0">
        {/* Left Column: Trading Panel */}
        <div className="flex flex-col gap-4 order-2 xl:order-1">
          <TradingPanel
            assetId={
              assetType === "crypto"
                ? `crypto_${selectedAsset}`
                : `${assetType}_${selectedAsset}`
            }
            assetSymbol={assetSymbol}
            currentPrice={currentPrice}
            tradingMode={tradingMode}
          />
        </div>

        {/* Right Column: Chart & Trading Data */}
        <div className="xl:col-span-2 flex flex-col gap-4 md:min-h-0 order-1 xl:order-2">
          {/* Chart Area */}
          <div className="flex-1 min-h-[450px] bg-card border border-border rounded-xl overflow-hidden relative flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {assetSymbol}
                </span>
                <FavoriteIntervalFilters
                  value={tvInterval}
                  onChange={setTvInterval}
                />
              </div>
            </div>
            <div className="flex-1">
              <TradingViewWidget
                symbol={getTradingViewSymbol()}
                height={600}
                assetId={assetType === "crypto" ? selectedAsset : assetSymbol}
                interval={tvInterval}
              />
            </div>
          </div>

          {/* Orders & Positions Tabs */}
          <div className="bg-card border border-border rounded-xl min-h-[250px] overflow-hidden flex flex-col">
            <Tabs
              defaultValue="positions"
              className="w-full h-full flex flex-col"
            >
              <div className="border-b border-border px-4">
                <TabsList className="h-12 bg-transparent">
                  <TabsTrigger
                    value="positions"
                    className="data-[state=active]:bg-secondary"
                  >
                    Positions
                  </TabsTrigger>
                  <TabsTrigger
                    value="orders"
                    className="data-[state=active]:bg-secondary"
                  >
                    History
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="positions"
                className="flex-1 overflow-auto p-0 m-0"
              >
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground sticky top-0">
                    <tr>
                      <th className="p-3 font-medium">Asset</th>
                      <th className="p-3 font-medium">Side</th>
                      <th className="p-3 font-medium">Size</th>
                      <th className="p-3 font-medium">Entry</th>
                      <th className="p-3 font-medium">Current</th>
                      <th className="p-3 font-medium">P&L</th>
                      <th className="p-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {positions.length > 0 ? (
                      positions.map((pos) => (
                        <tr key={pos.id} className="hover:bg-secondary/20">
                          <td className="p-3 font-medium">{pos.assetName}</td>
                          <td
                            className={`p-3 capitalize ${
                              pos.side === "buy"
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {pos.side}
                          </td>
                          <td className="p-3 font-mono">{pos.amount}</td>
                          <td className="p-3 font-mono">
                            ${formatBalance(pos.entryPrice)}
                          </td>
                          <td className="p-3 font-mono">
                            ${formatBalance(pos.currentPrice)}
                          </td>
                          <td
                            className={`p-3 font-mono ${
                              pos.pnl >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            ${formatBalance(pos.pnl)} (
                            {pos.pnlPercentage.toFixed(2)}%)
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => closePosition(pos.id)}
                            >
                              <X size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-muted-foreground"
                        >
                          No open positions
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TabsContent>

              <TabsContent
                value="orders"
                className="flex-1 overflow-auto p-0 m-0"
              >
                {tradesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : tradesError ? (
                  <div className="p-8 text-center text-destructive">
                    <p>Failed to load trade history</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please try again later
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/50 text-muted-foreground sticky top-0">
                      <tr>
                        <th className="p-3 font-medium">Asset</th>
                        <th className="p-3 font-medium">Type</th>
                        <th className="p-3 font-medium">Side</th>
                        <th className="p-3 font-medium">Quantity</th>
                        <th className="p-3 font-medium">Open price</th>
                        <th className="p-3 font-medium">Close price</th>
                        <th className="p-3 font-medium">Profit/Loss</th>
                        <th className="p-3 font-medium">Cycle (seconds)</th>
                        <th className="p-3 font-medium">Status</th>
                        <th className="p-3 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {trades.length > 0 ? (
                        trades.map((trade) => {
                          const total = trade.quantity * trade.price;
                          const profit = trade.p_l ?? trade.profit ?? null; // Use p_l field, fallback to profit for backward compatibility
                          const status = trade.status || null;

                          return (
                            <tr
                              key={trade.id}
                              className="hover:bg-secondary/20"
                            >
                              <td className="p-3 font-medium">
                                {getAssetDisplayName(trade.asset)}
                              </td>
                              <td className="p-3 capitalize">
                                {trade.is_demo ? "Demo" : "Live"}
                              </td>
                              <td
                                className={`p-3 capitalize ${
                                  trade.type === "buy"
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                              >
                                {trade.type}
                              </td>
                              <td className="p-3 font-mono">
                                {formatBalance(trade.quantity)}
                              </td>
                              <td className="p-3 font-mono">
                                ${formatBalance(trade.price)}
                              </td>
                              <td className="p-3 font-mono">
                                ${formatBalance(total)}
                              </td>
                              <td
                                className={`p-3 font-mono ${
                                  profit !== null
                                    ? profit >= 0
                                      ? "text-green-500"
                                      : "text-red-500"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {profit !== null
                                  ? `${profit >= 0 ? "+" : ""}$${formatBalance(
                                      profit
                                    )}`
                                  : "-"}
                              </td>
                              <td className="p-3 font-mono">
                                {trade.cycle !== null &&
                                trade.cycle !== undefined
                                  ? trade.cycle
                                  : "-"}
                              </td>
                              <td className="p-3">
                                {status ? (
                                  <span
                                    className={`px-2 py-1 rounded text-xs capitalize ${
                                      status === "win"
                                        ? "bg-green-500/20 text-green-500"
                                        : status === "loss"
                                        ? "bg-red-500/20 text-red-500"
                                        : status === "tie"
                                        ? "bg-yellow-500/20 text-yellow-500"
                                        : "bg-blue-500/20 text-blue-500"
                                    }`}
                                  >
                                    {status}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-xs text-muted-foreground">
                                {new Date(trade.timestamp).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={9}
                            className="p-8 text-center text-muted-foreground"
                          >
                            No trade history
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Trade History Panel */}
          {/* <div>
            <TradeHistoryPanel
              assetId={assetType === "crypto" ? selectedAsset : assetSymbol}
              assetName={assetName}
            />
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Trade;
