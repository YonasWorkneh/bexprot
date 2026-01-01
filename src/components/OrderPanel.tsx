import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useTradingStore, OrderType, OrderSide } from "@/store/tradingStore";
import { toast } from "sonner";

interface OrderPanelProps {
  assetId: string;
  assetName: string;
  currentPrice: number;
}

const OrderPanel = ({ assetId, assetName, currentPrice }: OrderPanelProps) => {
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [side, setSide] = useState<OrderSide>("buy");
  const [amount, setAmount] = useState<string>("");
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice.toString());

  const placeOrder = useTradingStore((state) => state.placeOrder);
  const balance = useTradingStore((state) => state.balance);

  const handlePlaceOrder = () => {
    const orderAmount = parseFloat(amount);
    const price = orderType === "market" ? currentPrice : parseFloat(limitPrice);

    if (!orderAmount || orderAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (orderType === "limit" && (!price || price <= 0)) {
      toast.error("Please enter a valid limit price");
      return;
    }

    const total = orderAmount * price;

    if (total > balance) {
      toast.error("Insufficient balance");
      return;
    }

    placeOrder({
      assetId,
      assetName,
      type: orderType,
      side,
      price,
      amount: orderAmount,
      total,
    });

    toast.success(
      `${orderType === "market" ? "Market" : "Limit"} ${side} order placed for ${orderAmount} ${assetName}`
    );

    setAmount("");
  };

  const maxAmount = balance / currentPrice;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Place Order</h3>

      {/* Order Type */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={orderType === "market" ? "default" : "outline"}
          onClick={() => setOrderType("market")}
          className="flex-1 rounded-lg"
        >
          Market
        </Button>
        <Button
          variant={orderType === "limit" ? "default" : "outline"}
          onClick={() => setOrderType("limit")}
          className="flex-1 rounded-lg"
        >
          Limit
        </Button>
      </div>

      {/* Buy/Sell */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={side === "buy" ? "default" : "outline"}
          onClick={() => setSide("buy")}
          className={`flex-1 rounded-lg ${
            side === "buy" ? "bg-success hover:bg-success/90" : ""
          }`}
        >
          Buy
        </Button>
        <Button
          variant={side === "sell" ? "default" : "outline"}
          onClick={() => setSide("sell")}
          className={`flex-1 rounded-lg ${
            side === "sell" ? "bg-danger hover:bg-danger/90" : ""
          }`}
        >
          Sell
        </Button>
      </div>

      {/* Limit Price (only for limit orders) */}
      {orderType === "limit" && (
        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-2 block">Limit Price</label>
          <Input
            type="number"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder="0.00"
            className="bg-background border-border rounded-lg font-mono"
          />
        </div>
      )}

      {/* Amount */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-muted-foreground">Amount</label>
          <button
            onClick={() => setAmount(maxAmount.toFixed(8))}
            className="text-xs text-primary hover:underline"
          >
            Max: {maxAmount.toFixed(4)}
          </button>
        </div>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="bg-background border-border rounded-lg font-mono"
        />
      </div>

      {/* Total */}
      <div className="mb-4 p-3 bg-secondary rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-mono font-semibold text-foreground">
            ${((parseFloat(amount) || 0) * (orderType === "market" ? currentPrice : parseFloat(limitPrice) || 0)).toFixed(2)}
          </span>
        </div>
      </div>

      <Button
        onClick={handlePlaceOrder}
        className={`w-full rounded-lg ${
          side === "buy" ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90"
        }`}
      >
        Place {side === "buy" ? "Buy" : "Sell"} Order
      </Button>
    </div>
  );
};

export default OrderPanel;
