import { useQuery } from "@tanstack/react-query";
import { fetchStocks } from "@/lib/marketData";
import { TrendingUp, TrendingDown, Loader2, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Stocks = () => {
  const navigate = useNavigate();

  const { data: stocks, isLoading } = useQuery({
    queryKey: ["stocks"],
    queryFn: fetchStocks,
    refetchInterval: 5000,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Stocks</h1>
        <p className="text-muted-foreground">US equity markets and major stocks</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Symbol</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Price</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Change</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Volume</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Market Cap</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Sector</th>
                </tr>
              </thead>
              <tbody>
                {stocks?.map((stock) => {
                  const isPositive = stock.changePercent >= 0;
                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => navigate(`/stock/${stock.symbol}`)}
                      className="border-b border-border hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-semibold text-foreground">{stock.symbol}</td>
                      <td className="p-4 text-foreground">{stock.name}</td>
                      <td className="p-4 text-right font-mono text-foreground">
                        ${stock.price.toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                        <div className={`flex items-center justify-end gap-1 font-medium ${
                          isPositive ? "text-success" : "text-danger"
                        }`}>
                          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-muted-foreground">
                        {(stock.volume / 1e6).toFixed(1)}M
                      </td>
                      <td className="p-4 text-right font-mono text-muted-foreground">
                        ${(stock.marketCap / 1e9).toFixed(2)}B
                      </td>
                      <td className="p-4 text-muted-foreground">{stock.sector}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stocks;
