import { useTradingStore } from "@/store/tradingStore";
import { Button } from "./ui/button";
import { TrendingUp, TrendingDown, X } from "lucide-react";
import { toast } from "sonner";

interface PositionsPanelProps {
  assetId?: string;
  assetSymbol?: string; // uppercase symbol/name
}

const PositionsPanel = ({ assetId, assetSymbol }: PositionsPanelProps) => {
  const positions = useTradingStore((state) => state.positions);
  const closePosition = useTradingStore((state) => state.closePosition);

  const normalize = (v?: string) => (v ? v.toLowerCase() : undefined);
  const targetId = normalize(assetId);
  const targetSymbol = normalize(assetSymbol);

  const filteredPositions = positions.filter((p) => {
    const pid = normalize(p.assetId);
    const pname = normalize(p.assetName);
    const byId = targetId ? pid === targetId : true;
    const bySymbol = targetSymbol ? pname === targetSymbol : true;
    return byId && bySymbol;
  });

  const handleClosePosition = (positionId: string, assetName: string) => {
    closePosition(positionId);
    toast.success(`Position closed for ${assetName}`);
  };

  if (filteredPositions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Open Positions</h3>
        <div className="text-center text-muted-foreground py-8">
          {assetSymbol ? `No open positions for ${assetSymbol}` : "No open positions"}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Open Positions</h3>
      
      <div className="space-y-3">
        {filteredPositions.map((position) => {
          const isProfitable = position.pnl >= 0;
          
          return (
            <div
              key={position.id}
              className="bg-secondary border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-foreground">{position.assetName}</div>
                  <div className="text-xs text-muted-foreground">
                    {position.side === "buy" ? "Long" : "Short"} • {position.amount} units
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleClosePosition(position.id, position.assetName)}
                  className="text-muted-foreground hover:text-danger rounded-lg"
                >
                  <X size={16} />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Entry</div>
                  <div className="font-mono text-foreground">
                    ${position.entryPrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Current</div>
                  <div className="font-mono text-foreground">
                    ${position.currentPrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">P&L</div>
                  <div className={`font-mono font-semibold flex items-center gap-1 ${
                    isProfitable ? "text-success" : "text-danger"
                  }`}>
                    {isProfitable ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {isProfitable ? "+" : ""}${position.pnl.toFixed(2)}
                    <span className="text-xs">
                      ({isProfitable ? "+" : ""}{position.pnlPercentage.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PositionsPanel;
