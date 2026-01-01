import { TrendingUp, TrendingDown } from "lucide-react";
import { CryptoAsset } from "@/lib/coingecko";

interface PriceCardProps {
  asset: CryptoAsset;
  onClick?: () => void;
}

const PriceCard = ({ asset, onClick }: PriceCardProps) => {
  const isPositive = asset.price_change_percentage_24h >= 0;

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 mb-3">
        <img src={asset.image || "/placeholder.png"} alt={asset.name} className="w-8 h-8 rounded-full" />
        <div>
          <div className="font-medium text-foreground">{asset.symbol?.toUpperCase() || "UNKNOWN"}</div>
          <div className="text-xs text-muted-foreground">{asset.name || "Unknown Asset"}</div>
        </div>
      </div>

      <div className="font-mono text-xl font-semibold text-foreground mb-2">
        ${(asset.current_price || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 8,
        })}
      </div>

      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            isPositive ? "text-success" : "text-danger"
          }`}
        >
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {Math.abs(asset.price_change_percentage_24h || 0).toFixed(2)}%
        </div>
        <div className="text-xs text-muted-foreground">
          Vol ${(asset.total_volume / 1e9 || 0).toFixed(2)}B
        </div>
      </div>
    </div>
  );
};

export default PriceCard;
