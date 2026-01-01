import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchAssetDetail, fetchChartData } from "@/lib/coingecko";
import TradingViewWidget from "@/components/TradingViewWidget";
import { ArrowLeft, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PositionsPanel from "@/components/PositionsPanel";
import OrdersPanel from "@/components/OrdersPanel";
import TradingPanel from "@/components/TradingPanel";
import { useTradingStore } from "@/store/tradingStore";
import { useEffect, useState } from "react";

const CryptoDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { updatePositionPrices, systemSettings } = useTradingStore();

    const [tvInterval, setTvInterval] = useState<string>("D");
    const [tradingMode, setTradingMode] = useState<"spot" | "futures" | "contract">("spot");

    const { data: asset, isLoading: assetLoading } = useQuery({
        queryKey: ["assetDetail", id],
        queryFn: () => fetchAssetDetail(id!),
        enabled: !!id,
        refetchInterval: 3000,
    });

    const { data: chartData, isLoading: chartLoading } = useQuery({
        queryKey: ["chartData", id, 30],
        queryFn: () => fetchChartData(id!, 30),
        enabled: !!id,
        refetchInterval: 60000,
    });

    useEffect(() => {
        if (asset) {
            updatePositionPrices(`crypto_${asset.id}`, asset.current_price);
        }
    }, [asset, updatePositionPrices]);

    if (assetLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    if (!asset) {
        return (
            <div className="flex items-center justify-center h-screen text-muted-foreground">
                Cryptocurrency not found
            </div>
        );
    }

    const isPositive = asset.price_change_percentage_24h >= 0;

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
                  {(["spot", "futures", "contract"] as const)
                    .filter(mode => {
                        if (mode === 'contract') {
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
            </div>

            <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <img src={asset.image} alt={asset.name} className="w-12 h-12 rounded-full" />
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{asset.name}</h1>
                        <div className="text-muted-foreground">{asset.symbol.toUpperCase()}</div>
                    </div>
                </div>

                <div className="flex items-baseline gap-3">
                    <div className="text-4xl font-bold font-mono text-foreground">
                        ${asset.current_price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </div>
                    <div
                        className={`flex items-center gap-1 text-xl font-medium ${isPositive ? "text-success" : "text-danger"
                            }`}
                    >
                        {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        {Math.abs(asset.price_change_percentage_24h).toFixed(2)}%
                    </div>
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
                <TradingViewWidget symbol={`BINANCE:${asset.symbol.toUpperCase()}USDT`} height={500} interval={tvInterval} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-sm text-muted-foreground mb-2">Market Cap</div>
                    <div className="text-xl font-mono font-semibold text-foreground">
                        ${(asset.market_cap / 1e9).toFixed(2)}B
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-sm text-muted-foreground mb-2">24h Volume</div>
                    <div className="text-xl font-mono font-semibold text-foreground">
                        ${(asset.total_volume / 1e9).toFixed(2)}B
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-sm text-muted-foreground mb-2">24h High</div>
                    <div className="text-xl font-mono font-semibold text-success">
                        ${asset.high_24h.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-sm text-muted-foreground mb-2">24h Low</div>
                    <div className="text-xl font-mono font-semibold text-danger">
                        ${asset.low_24h.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1">
                    <TradingPanel
                        assetId={`crypto_${asset.id}`}
                        assetSymbol={asset.symbol.toUpperCase()}
                        currentPrice={asset.current_price}
                        tradingMode={tradingMode}
                    />
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <PositionsPanel assetId={`crypto_${asset.id}`} assetSymbol={asset.symbol.toUpperCase()} />
                    <OrdersPanel assetId={`crypto_${asset.id}`} assetSymbol={asset.symbol.toUpperCase()} />
                </div>
            </div>
        </div>
    );
};

export default CryptoDetail;
