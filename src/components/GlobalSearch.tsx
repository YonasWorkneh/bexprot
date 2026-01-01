import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchTopCryptos } from "@/lib/coingecko";
import { mockStocks, mockForexPairs, mockCommodities } from "@/lib/marketData";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const GlobalSearch = ({ open, onOpenChange, searchQuery, setSearchQuery }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const [results, setResults] = useState<any[]>([]);

  const { data: cryptoData } = useQuery({
    queryKey: ["cryptos", "search"],
    queryFn: () => fetchTopCryptos(250), // Fetch more for better search coverage
    staleTime: 60000,
  });

  useEffect(() => {
    if (!searchQuery) {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const allResults: any[] = [];

    // Search Crypto
    if (cryptoData) {
      cryptoData
        .filter(
          (crypto) =>
            crypto.name.toLowerCase().includes(query) ||
            crypto.symbol.toLowerCase().includes(query)
        )
        .forEach((crypto) => {
          allResults.push({
            type: "crypto",
            name: crypto.name,
            symbol: crypto.symbol.toUpperCase(),
            id: crypto.id,
            price: crypto.current_price,
            change: crypto.price_change_percentage_24h,
          });
        });
    }

    // Search Stocks
    mockStocks
      .filter(
        (stock) =>
          stock.name.toLowerCase().includes(query) ||
          stock.symbol.toLowerCase().includes(query)
      )
      .forEach((stock) => {
        allResults.push({
          type: "stock",
          name: stock.name,
          symbol: stock.symbol,
          id: stock.symbol,
          price: stock.price,
          change: stock.changePercent,
        });
      });

    // Search Forex
    mockForexPairs
      .filter(
        (pair) =>
          pair.name.toLowerCase().includes(query) ||
          pair.symbol.toLowerCase().includes(query)
      )
      .forEach((pair) => {
        allResults.push({
          type: "forex",
          name: pair.name,
          symbol: pair.symbol,
          id: pair.symbol,
          price: pair.rate,
          change: pair.changePercent,
        });
      });

    // Search Commodities
    mockCommodities
      .filter(
        (commodity) =>
          commodity.name.toLowerCase().includes(query) ||
          commodity.symbol.toLowerCase().includes(query)
      )
      .forEach((commodity) => {
        allResults.push({
          type: "commodity",
          name: commodity.name,
          symbol: commodity.symbol,
          id: commodity.symbol, // Use symbol as ID for commodities
          price: commodity.price,
          change: commodity.changePercent,
        });
      });

    setResults(allResults.slice(0, 10));
  }, [searchQuery, cryptoData]);

  const handleResultClick = (result: any) => {
    if (result.type === "crypto") {
      navigate(`/asset/${result.id}`);
    } else if (result.type === "stock") {
      navigate(`/stock/${result.symbol}`);
    } else if (result.type === "forex") {
      // Replace slash with hyphen for URL safety and to match ForexDetail logic
      navigate(`/forex/${result.symbol.replace('/', '-')}`);
    } else if (result.type === "commodity") {
      navigate(`/commodity/${result.id}`);
    }
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 rounded-2xl">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="text-muted-foreground" size={20} />
          <Input
            placeholder="Search assets, stocks, forex, commodities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-xl transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                      <TrendingUp size={20} className="text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{result.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.symbol} • {result.type.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold">${result.price.toLocaleString()}</div>
                    <div
                      className={`text-sm ${result.change >= 0 ? "text-success" : "text-danger"
                        }`}
                    >
                      {result.change >= 0 ? "+" : ""}
                      {result.change.toFixed(2)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="p-8 text-center text-muted-foreground">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Start typing to search across all markets
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
