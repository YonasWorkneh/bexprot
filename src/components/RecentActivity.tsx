import { useTradingStore } from "@/store/tradingStore";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";

const RecentActivity = () => {
  const { orderHistory } = useTradingStore();

  // Sort by timestamp descending and take top 10
  const recentTrades = [...orderHistory]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  if (recentTrades.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 h-full flex flex-col items-center justify-center text-muted-foreground">
        <Clock size={48} className="mb-4 opacity-20" />
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 h-full overflow-hidden flex flex-col">
      <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
      <div className="overflow-y-auto flex-1 pr-2 space-y-3 custom-scrollbar">
        {recentTrades.map((trade) => (
          <div
            key={trade.id}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${trade.side === "buy"
                    ? "bg-success/10 text-success"
                    : "bg-danger/10 text-danger"
                  }`}
              >
                {trade.side === "buy" ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <ArrowDownLeft size={16} />
                )}
              </div>
              <div>
                <div className="font-medium text-foreground">
                  {trade.side === "buy" ? "Bought" : "Sold"} {trade.assetName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(trade.timestamp, "MMM d, h:mm a")}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-medium text-foreground">
                {trade.amount.toFixed(4)} {trade.assetName}
              </div>
              <div className="text-xs text-muted-foreground">
                @ ${trade.price.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
