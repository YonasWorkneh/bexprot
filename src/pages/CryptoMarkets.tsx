import { useQuery } from "@tanstack/react-query";
import { fetchTopCryptos } from "@/lib/coingecko";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const CryptoMarkets = () => {
  const navigate = useNavigate();

  const { data: cryptos, isLoading, error, refetch } = useQuery({
    queryKey: ["topCryptos", 100],
    queryFn: () => fetchTopCryptos(100),
    refetchInterval: 30000,
    retry: 3,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Cryptocurrencies</h1>
        <p className="text-muted-foreground">Digital assets and blockchain tokens</p>
      </div>


      {error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
            <p className="text-muted-foreground mb-4">
              Unable to load cryptocurrency data. Please try again.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Reload
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">#</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Asset</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Price</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">24h Change</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Market Cap</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Volume (24h)</th>
                </tr>
              </thead>
              <tbody>
                {cryptos?.map((crypto, index) => {
                  const isPositive = crypto.price_change_percentage_24h >= 0;
                  return (
                    <tr
                      key={crypto.id}
                      onClick={() => navigate(`/crypto/${crypto.id}`)}
                      className="border-b border-border hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <td className="p-4 text-muted-foreground">{index + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={crypto.image} alt={crypto.name} className="w-6 h-6 rounded-full" />
                          <div>
                            <div className="font-medium text-foreground">
                              {crypto.symbol.toUpperCase()}
                            </div>
                            <div className="text-xs text-muted-foreground">{crypto.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-foreground">
                        ${crypto.current_price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <div
                          className={`flex items-center justify-end gap-1 font-medium ${isPositive ? "text-success" : "text-danger"
                            }`}
                        >
                          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-muted-foreground">
                        ${(crypto.market_cap / 1e9).toFixed(2)}B
                      </td>
                      <td className="p-4 text-right font-mono text-muted-foreground">
                        ${(crypto.total_volume / 1e9).toFixed(2)}B
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

export default CryptoMarkets;
