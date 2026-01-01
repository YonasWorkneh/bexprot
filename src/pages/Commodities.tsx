import { useQuery } from "@tanstack/react-query";
import { fetchCommodities } from "@/lib/marketData";
import { TrendingUp, TrendingDown, Loader2, Sparkles, Fuel, Wheat } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  GiGoldBar,
  GiMetalBar,
  GiOilDrum,
  GiFire,
  GiWireCoil,
  GiRing,
  GiWheat,
  GiCorn,
  GiCoffeeBeans,
  GiSugarCane,
  GiTShirt,
  GiChocolateBar,
  GiMinerals,
  GiSodaCan
} from "react-icons/gi";

const getCommodityIcon = (symbol: string) => {
  const iconMap: Record<string, any> = {
    'GC': { icon: GiGoldBar, color: "text-yellow-500" },      // Gold
    'SI': { icon: GiMetalBar, color: "text-slate-400" },      // Silver
    'CL': { icon: GiOilDrum, color: "text-slate-800" },       // Oil
    'NG': { icon: GiFire, color: "text-blue-500" },           // Natural Gas
    'HG': { icon: GiWireCoil, color: "text-orange-600" },     // Copper
    'PL': { icon: GiRing, color: "text-slate-300" },          // Platinum
    'ZW': { icon: GiWheat, color: "text-yellow-600" },        // Wheat
    'ZC': { icon: GiCorn, color: "text-yellow-400" },         // Corn
    'PA': { icon: GiMinerals, color: "text-slate-500" },      // Palladium
    'AL': { icon: GiSodaCan, color: "text-slate-400" },       // Aluminum
    'KC': { icon: GiCoffeeBeans, color: "text-amber-800" },   // Coffee
    'SB': { icon: GiSugarCane, color: "text-green-600" },     // Sugar
    'CT': { icon: GiTShirt, color: "text-slate-200" },        // Cotton
    'CC': { icon: GiChocolateBar, color: "text-amber-900" },  // Cocoa
  };
  return iconMap[symbol] || { icon: GiMinerals, color: "text-primary" };
};

const Commodities = () => {
  const navigate = useNavigate();

  const { data: commodities, isLoading } = useQuery({
    queryKey: ["commodities"],
    queryFn: fetchCommodities,
    refetchInterval: 5000,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Commodities</h1>
        <p className="text-muted-foreground">Metals, energy, and agricultural products</p>
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
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Unit</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                </tr>
              </thead>
              <tbody>
                {commodities?.map((commodity) => {
                  const isPositive = commodity.changePercent >= 0;
                  const { icon: CommodityIcon, color } = getCommodityIcon(commodity.symbol);
                  return (
                    <tr
                      key={commodity.symbol}
                      onClick={() => navigate(`/commodity/${commodity.symbol}`)}
                      className="border-b border-border hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-secondary/50 rounded-lg flex items-center justify-center shrink-0">
                            <CommodityIcon className={color} size={20} />
                          </div>
                          <span className="font-semibold text-foreground">{commodity.symbol}</span>
                        </div>
                      </td>
                      <td className="p-4 text-foreground">{commodity.name}</td>
                      <td className="p-4 text-right font-mono text-foreground">
                        ${commodity.price.toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                        <div className={`flex items-center justify-end gap-1 font-medium ${isPositive ? "text-success" : "text-danger"
                          }`}>
                          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {isPositive ? "+" : ""}{commodity.changePercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{commodity.unit}</td>
                      <td className="p-4 text-muted-foreground">{commodity.category}</td>
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

export default Commodities;
