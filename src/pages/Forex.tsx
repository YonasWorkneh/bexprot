import { useQuery } from "@tanstack/react-query";
import { fetchForexPairs } from "@/lib/marketData";
import { TrendingUp, TrendingDown, Loader2, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Forex = () => {
  const navigate = useNavigate();

  const { data: pairs, isLoading } = useQuery({
    queryKey: ["forex"],
    queryFn: fetchForexPairs,
    refetchInterval: 3000,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Forex</h1>
        <p className="text-muted-foreground">Foreign exchange currency pairs</p>
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
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Pair</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Rate</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Change</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Bid</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ask</th>
                </tr>
              </thead>
              <tbody>
                {pairs?.map((pair) => {
                  const isPositive = pair.changePercent >= 0;
                  return (
                    <tr
                      key={pair.symbol}
                      onClick={() => navigate(`/forex/${pair.symbol.replace('/', '-')}`)}
                      className="border-b border-border hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <DollarSign className="text-primary" size={16} />
                          </div>
                          <span className="font-semibold text-foreground">{pair.symbol}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{pair.name}</td>
                      <td className="p-4 text-right font-mono text-foreground">
                        {pair.rate.toFixed(4)}
                      </td>
                      <td className="p-4 text-right">
                        <div className={`flex items-center justify-end gap-1 font-medium ${
                          isPositive ? "text-success" : "text-danger"
                        }`}>
                          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {isPositive ? "+" : ""}{pair.changePercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-muted-foreground">
                        {pair.bid.toFixed(4)}
                      </td>
                      <td className="p-4 text-right font-mono text-muted-foreground">
                        {pair.ask.toFixed(4)}
                      </td>
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

export default Forex;
