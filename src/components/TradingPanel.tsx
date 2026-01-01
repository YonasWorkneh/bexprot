import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTradingStore } from "@/store/tradingStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface TradingPanelProps {
    assetId: string;
    assetSymbol: string;
    currentPrice: number;
    tradingMode: "spot" | "futures" | "contract";
}

import SwapModal from "./SwapModal";

const TradingPanel = ({ assetId, assetSymbol, currentPrice, tradingMode }: TradingPanelProps) => {
    const { toast } = useToast();
    const { balance, placeOrder } = useTradingStore();
    const { addNotification } = useNotificationStore();

    const [side, setSide] = useState<"buy" | "sell">("buy");
    const [type, setType] = useState<"market" | "limit">("market");
    const [amount, setAmount] = useState("");
    const [price, setPrice] = useState("");
    const [stopLoss, setStopLoss] = useState("");
    const [takeProfit, setTakeProfit] = useState("");
    const [loading, setLoading] = useState(false);

    // Futures State
    const [leverage, setLeverage] = useState(1);

    // Contract State
    const [contractTime, setContractTime] = useState(60); // seconds

    // Reset state on mode change
    useEffect(() => {
        const { contract_trading_enabled } = useTradingStore.getState().systemSettings;
        if (tradingMode === 'contract' && !contract_trading_enabled) {
            // This component doesn't control tradingMode, but we can't force parent update easily here without a callback.
            // However, the parent should have already filtered the button. 
            // This is just a safeguard for the internal state reset.
        }

        setSide("buy");
        setType("market");
        setAmount("");
        setPrice("");
        setStopLoss("");
        setTakeProfit("");
        setLeverage(1);
    }, [tradingMode]);

    // Update price input when current price changes for limit orders
    useEffect(() => {
        if (type === "limit" && !price) {
            setPrice(currentPrice.toString());
        }
    }, [currentPrice, type, price]);

    const handlePlaceOrder = async () => {
        const numAmount = parseFloat(amount);
        const numPrice = type === "market" ? currentPrice : parseFloat(price);

        if (isNaN(numAmount) || numAmount <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid amount",
                variant: "destructive",
            });
            return;
        }

        if (isNaN(numPrice) || numPrice <= 0) {
            toast({
                title: "Invalid Price",
                description: "Please enter a valid price",
                variant: "destructive",
            });
            return;
        }

        const total = numAmount * (tradingMode === "contract" ? 1 : numPrice);

        // Balance check
        const requiresUSDT = tradingMode !== "spot" || side === "buy";
        const buyingPower = balance * (tradingMode === "futures" ? leverage : 1);

        if (requiresUSDT && total > buyingPower) {
            toast({
                title: "Insufficient Balance",
                description: "You do not have enough funds to place this order",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            // Calculate payout based on time
            const payout = contractTime === 30 ? 20 : contractTime === 60 ? 25 : 50;

            // Place the order and wait for result
            const result = await placeOrder({
                assetId,
                assetName: assetSymbol.toUpperCase(),
                type,
                side,
                price: numPrice,
                amount: numAmount,
                total,
                mode: tradingMode,
                leverage: tradingMode === "futures" ? leverage : undefined,
                contractTime: tradingMode === "contract" ? contractTime : undefined,
                payout: tradingMode === "contract" ? payout : undefined,
                stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
                takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
            });

            // Check if order was successful
            if (!result.success) {
                toast({
                    title: "Order Failed",
                    description: result.error || "Failed to place order",
                    variant: "destructive",
                });

                addNotification({
                    title: "Order Failed",
                    message: result.error || `Failed to place order for ${assetSymbol.toUpperCase()}`,
                    type: 'error'
                });
                return;
            }

            let description = "";
            let notificationTitle = "Order Placed";

            if (tradingMode === "contract") {
                description = `${side === "buy" ? "Buy Long" : "Sell Short"} contract placed for ${contractTime}s`;
                notificationTitle = "Contract Order Placed";
            } else if (tradingMode === "futures") {
                description = `${side === "buy" ? "Long" : "Short"} ${leverage}x placed at $${numPrice}`;
                notificationTitle = "Futures Order Placed";
            } else {
                description = `${side === "buy" ? "Bought" : "Sold"} ${numAmount} ${assetSymbol.toUpperCase()} at $${numPrice}`;
                notificationTitle = "Spot Order Placed";
            }

            toast({
                title: notificationTitle,
                description: description,
            });

            addNotification({
                title: notificationTitle,
                message: description,
                type: 'success'
            });

            setAmount("");
            setStopLoss("");
            setTakeProfit("");
        } catch (error) {
            console.error("Order placement error:", error);
            toast({
                title: "Order Failed",
                description: "An unexpected error occurred",
                variant: "destructive",
            });

            addNotification({
                title: "Order Failed",
                message: `Failed to place order for ${assetSymbol.toUpperCase()}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const total = (parseFloat(amount) || 0) * (type === "market" ? currentPrice : parseFloat(price) || 0);

    return (
        <div className="bg-card border border-border rounded-xl p-4 h-full flex flex-col">
            {tradingMode === "contract" ? (
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant={side === "buy" ? "default" : "outline"}
                        className={`h-12 ${side === "buy" ? "bg-green-500 hover:bg-green-600 border-green-500" : "hover:bg-green-500/10 hover:text-green-500"}`}
                        onClick={() => setSide("buy")}
                    >
                        <TrendingUp className="mr-2 h-5 w-5" />
                        Buy Long
                    </Button>
                    <Button
                        variant={side === "sell" ? "default" : "outline"}
                        className={`h-12 ${side === "sell" ? "bg-red-500 hover:bg-red-600 border-red-500" : "hover:bg-red-500/10 hover:text-red-500"}`}
                        onClick={() => setSide("sell")}
                    >
                        <TrendingDown className="mr-2 h-5 w-5" />
                        Sell Short
                    </Button>
                </div>
            ) : (
                <Tabs value={side} onValueChange={(v) => setSide(v as "buy" | "sell")} className="w-full mb-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="buy" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500">
                            {tradingMode === "futures" ? "Long" : "Buy"}
                        </TabsTrigger>
                        <TabsTrigger value="sell" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500">
                            {tradingMode === "futures" ? "Short" : "Sell"}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            )}

            {/* Order Type (Spot/Futures only) */}
            {tradingMode !== "contract" && (
                <div className="flex gap-2 mb-4">
                    <Button
                        variant={type === "limit" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setType("limit")}
                        className="flex-1"
                    >
                        Limit
                    </Button>
                </div>
            )}

            <div className="space-y-4 flex-1">
                {/* Contract Time Selector */}
                {tradingMode === "contract" && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">Time Frame</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[30, 60, 120].map((t) => (
                                    <Button
                                        key={t}
                                        variant={contractTime === t ? "secondary" : "outline"}
                                        size="sm"
                                        onClick={() => setContractTime(t)}
                                        className="text-xs"
                                    >
                                        {t}s
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-secondary/30 p-3 rounded-lg border border-border space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Payout</span>
                                <span className="font-bold text-green-500">
                                    {contractTime === 30 ? "20%" : contractTime === 60 ? "25%" : "50%"}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Est. Profit</span>
                                <span className="font-bold text-green-500">
                                    +${((parseFloat(amount) || 0) * (contractTime === 30 ? 0.20 : contractTime === 60 ? 0.25 : 0.50)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Futures Leverage Selector */}
                {tradingMode === "futures" && (
                    <div className="space-y-3 py-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Leverage</span>
                            <span className="font-bold text-primary">{leverage}x</span>
                        </div>
                        <Slider
                            defaultValue={[1]}
                            max={100}
                            min={1}
                            step={1}
                            value={[leverage]}
                            onValueChange={(val) => setLeverage(val[0])}
                            className="py-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span>1x</span>
                            <span>25x</span>
                            <span>50x</span>
                            <span>75x</span>
                            <span>100x</span>
                        </div>
                    </div>
                )}

                {/* Price Input (Limit Order) */}
                {tradingMode !== "contract" && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">Price (USD)</label>
                            <Input
                                type="number"
                                value={type === "market" ? currentPrice : price}
                                onChange={(e) => setPrice(e.target.value)}
                                disabled={type === "market"}
                                className="font-mono"
                            />
                        </div>

                        {/* SL/TP Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">Stop Loss</label>
                                <Input
                                    type="number"
                                    placeholder="Optional"
                                    value={stopLoss}
                                    onChange={(e) => setStopLoss(e.target.value)}
                                    className="font-mono text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">Take Profit</label>
                                <Input
                                    type="number"
                                    placeholder="Optional"
                                    value={takeProfit}
                                    onChange={(e) => setTakeProfit(e.target.value)}
                                    className="font-mono text-xs"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Amount Input */}
                <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                        {tradingMode === "contract" ? "Amount (USDT)" : `Amount (${assetSymbol.toUpperCase()})`}
                    </label>
                    <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="font-mono"
                    />
                </div>

                {/* Percentage Quick Select - Only for Spot and Futures */}
                {tradingMode !== "contract" && (
                    <div className="grid grid-cols-3 gap-2">
                        {[20, 25, 50].map((pct) => (
                            <Button
                                key={pct}
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() => {
                                    if (side === "buy" || tradingMode === "futures") {
                                        const buyingPower = balance * (tradingMode === "futures" ? leverage : 1);
                                        const maxBuy = buyingPower / (type === "market" ? currentPrice : parseFloat(price) || currentPrice);
                                        setAmount((maxBuy * (pct / 100)).toFixed(6));
                                    }
                                }}
                            >
                                {pct}%
                            </Button>
                        ))}
                    </div>
                )}

                <div className="pt-4 border-t border-border mt-auto">
                    {tradingMode !== "contract" && (
                        <div className="flex justify-between mb-4 text-sm">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-mono font-semibold">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    )}

                    <Button
                        className={`w-full h-12 text-lg font-bold ${side === "buy"
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-red-600 hover:bg-red-700"
                            }`}
                        onClick={handlePlaceOrder}
                        disabled={loading || !amount || parseFloat(amount) <= 0}
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            tradingMode === "contract"
                                ? `${side === "buy" ? "Buy Long" : "Sell Short"} (${contractTime}s)`
                                : `${side === "buy" ? (tradingMode === "futures" ? "Long" : "Buy") : (tradingMode === "futures" ? "Short" : "Sell")} ${assetSymbol.toUpperCase()}`
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TradingPanel;
