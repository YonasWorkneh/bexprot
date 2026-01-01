import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchChartData, fetchTopCryptos } from "@/lib/coingecko";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradingPanel from "@/components/TradingPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTradingStore } from "@/store/tradingStore";
import { Loader2, X, TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { formatBalance } from "@/lib/walletUtils";

const Chart = () => {
  const [selectedAsset, setSelectedAsset] = useState("bitcoin");
  const [timeframe, setTimeframe] = useState(7);
  const [showTradeMarkers, setShowTradeMarkers] = useState(true);
  const { orders, positions, cancelOrder, closePosition } = useTradingStore();

  const { data: assets, error: assetsError, isLoading: assetsLoading } = useQuery({
    queryKey: ["topCryptos"],
    queryFn: () => fetchTopCryptos(10),
    staleTime: 60000,
  });

  const { data: chartData, isLoading, error } = useQuery({
    queryKey: ["chartData", selectedAsset, timeframe],
    queryFn: () => fetchChartData(selectedAsset, timeframe),
    refetchInterval: 60000,
    staleTime: 60000,
  });

  const selectedAssetData = assets?.find((a) => a.id === selectedAsset);
  const currentPrice = selectedAssetData?.current_price || 0;
  const [tvInterval, setTvInterval] = useState<string>("D");

  const timeframes = [
    { label: "1D", days: 1, tv: "D" },
    { label: "7D", days: 7, tv: "60" },
    { label: "1M", days: 30, tv: "240" },
    { label: "3M", days: 90, tv: "D" },
    { label: "6M", days: 180, tv: "D" },
    { label: "1Y", days: 365, tv: "W" },
    { label: "ALL", days: 1825, tv: "M" }, // 5 years
  ];

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold text-foreground">Advanced Trading Chart</h1>

        <div className="flex flex-wrap items-center gap-4">
          {assetsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" size={16} /> Loading assets…
            </div>
          ) : assetsError ? (
            <div className="text-sm text-destructive">Failed to load assets</div>
          ) : (
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="bg-card border border-border text-foreground px-4 py-2 rounded-md focus:outline-none focus:border-primary"
            >
              {assets?.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.symbol.toUpperCase()} - {asset.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex gap-1 bg-secondary p-1 rounded-md">
            {timeframes.map((tf) => (
                <Button
                  key={tf.days}
                  variant={timeframe === tf.days ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setTimeframe(tf.days);
                    setTvInterval(tf.tv);
                  }}
                  className="h-8 px-3"
                >
                  {tf.label}
                </Button>
              ))}
          </div>
        </div>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-card border border-border p-3 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Current Price</div>
          <div className="text-base md:text-lg font-mono font-bold text-foreground">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-card border border-border p-3 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
          <div className="text-base md:text-lg font-mono font-semibold text-foreground">
            {selectedAssetData?.market_cap
              ? `$${(selectedAssetData.market_cap / 1e9).toFixed(2)}B`
              : "—"}
          </div>
        </div>

        <div className="bg-card border border-border p-3 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">24h Volume</div>
          <div className="text-base md:text-lg font-mono font-semibold text-foreground">
            {selectedAssetData?.total_volume
              ? `$${(selectedAssetData.total_volume / 1e9).toFixed(2)}B`
              : "—"}
          </div>
        </div>

        <div className="bg-card border border-border p-3 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">24h Change</div>
          <div className={`text-base md:text-lg font-mono font-semibold ${(selectedAssetData?.price_change_percentage_24h || 0) >= 0
            ? "text-success"
            : "text-danger"
            }`}>
            {selectedAssetData?.price_change_percentage_24h
              ? `${selectedAssetData.price_change_percentage_24h.toFixed(2)}%`
              : "—"}
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-0">
        {/* Left Column: Chart & Trading Data */}
        <div className="xl:col-span-2 flex flex-col gap-4 min-h-0">
          {/* Chart Area with Controls */}
          <div className="flex-1 min-h-[450px] bg-card border border-border rounded-xl overflow-hidden relative flex flex-col">
            {/* Chart Controls Bar */}
            <div className="border-b border-border px-4 py-2 flex items-center justify-between bg-secondary/30">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-primary" />
                <span className="text-sm font-semibold">Live Chart</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={showTradeMarkers ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowTradeMarkers(!showTradeMarkers)}
                  className="h-7 text-xs"
                >
                  <BarChart3 size={14} className="mr-1" />
                  Trade Markers
                </Button>
              </div>
            </div>

            {/* Chart Canvas */}
            <div className="flex-1">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={40} />
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center text-destructive">
                  Failed to load chart data
                </div>
              ) : (
                <TradingViewWidget symbol={`CRYPTO:${selectedAsset.toUpperCase()}USD`} height={600} assetId={selectedAsset} interval={tvInterval} />
              )}
            </div>
          </div>

          {/* Orders & Positions Tabs */}
          <div className="bg-card border border-border rounded-xl min-h-[250px] overflow-hidden flex flex-col">
            <Tabs defaultValue="positions" className="w-full h-full flex flex-col">
              <div className="border-b border-border px-4">
                <TabsList className="h-12 bg-transparent">
                  <TabsTrigger value="positions" className="data-[state=active]:bg-secondary">Positions</TabsTrigger>
                  <TabsTrigger value="orders" className="data-[state=active]:bg-secondary">Open Orders</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="positions" className="flex-1 overflow-auto p-0 m-0">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground sticky top-0">
                    <tr>
                      <th className="p-3 font-medium">Asset</th>
                      <th className="p-3 font-medium">Side</th>
                      <th className="p-3 font-medium">Size</th>
                      <th className="p-3 font-medium">Entry Price</th>
                      <th className="p-3 font-medium">Current Price</th>
                      <th className="p-3 font-medium">P&L</th>
                      <th className="p-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {positions.length > 0 ? (
                      positions.map((pos) => (
                        <tr key={pos.id} className="hover:bg-secondary/20">
                          <td className="p-3 font-medium">{pos.assetName}</td>
                          <td className={`p-3 capitalize ${pos.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                            {pos.side}
                          </td>
                          <td className="p-3 font-mono">{pos.amount}</td>
                          <td className="p-3 font-mono">${formatBalance(pos.entryPrice)}</td>
                          <td className="p-3 font-mono">${formatBalance(pos.currentPrice)}</td>
                          <td className={`p-3 font-mono ${pos.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ${formatBalance(pos.pnl)} ({pos.pnlPercentage.toFixed(2)}%)
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
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No open positions
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TabsContent>

              <TabsContent value="orders" className="flex-1 overflow-auto p-0 m-0">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground sticky top-0">
                    <tr>
                      <th className="p-3 font-medium">Asset</th>
                      <th className="p-3 font-medium">Type</th>
                      <th className="p-3 font-medium">Side</th>
                      <th className="p-3 font-medium">Price</th>
                      <th className="p-3 font-medium">Amount</th>
                      <th className="p-3 font-medium">Total</th>
                      <th className="p-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.length > 0 ? (
                      orders.map((order) => (
                        <tr key={order.id} className="hover:bg-secondary/20">
                          <td className="p-3 font-medium">{order.assetName}</td>
                          <td className="p-3 capitalize">{order.type}</td>
                          <td className={`p-3 capitalize ${order.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                            {order.side}
                          </td>
                          <td className="p-3 font-mono">${formatBalance(order.price)}</td>
                          <td className="p-3 font-mono">{order.amount}</td>
                          <td className="p-3 font-mono">${formatBalance(order.total)}</td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => cancelOrder(order.id)}
                            >
                              <X size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No open orders
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Column: Trading Panel */}
        <div className="flex flex-col gap-4">
          <TradingPanel
            assetId={selectedAsset}
            assetSymbol={selectedAssetData?.symbol || ""}
            currentPrice={currentPrice}
          />
        </div>
      </div>
    </div>
  );
};

export default Chart;
