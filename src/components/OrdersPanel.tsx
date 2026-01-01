import { useTradingStore } from "@/store/tradingStore";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";

interface OrdersPanelProps {
  assetId?: string;
  assetSymbol?: string; // uppercase symbol/name
}

const OrdersPanel = ({ assetId, assetSymbol }: OrdersPanelProps) => {
  const orders = useTradingStore((state) => state.orders);
  const cancelOrder = useTradingStore((state) => state.cancelOrder);

  const normalize = (v?: string) => (v ? v.toLowerCase() : undefined);
  const targetId = normalize(assetId);
  const targetSymbol = normalize(assetSymbol);

  const filteredOrders = orders.filter((o) => {
    const oid = normalize(o.assetId);
    const oname = normalize(o.assetName);
    const byId = targetId ? oid === targetId : true;
    const bySymbol = targetSymbol ? oname === targetSymbol : true;
    return byId && bySymbol;
  });

  const handleCancelOrder = (orderId: string, assetName: string) => {
    cancelOrder(orderId);
    toast.info(`Order cancelled for ${assetName}`);
  };

  if (filteredOrders.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Pending Orders</h3>
        <div className="text-center text-muted-foreground py-8">
          {assetSymbol ? `No pending orders for ${assetSymbol}` : "No pending orders"}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Pending Orders</h3>
      
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-secondary border border-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-foreground">{order.assetName}</div>
                <div className="text-xs text-muted-foreground">
                  {order.type} • {order.side} • {order.amount} units
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCancelOrder(order.id, order.assetName)}
                className="text-muted-foreground hover:text-danger rounded-lg"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Price</div>
                <div className="font-mono text-foreground">${order.price.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total</div>
                <div className="font-mono text-foreground">${order.total.toFixed(2)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPanel;
