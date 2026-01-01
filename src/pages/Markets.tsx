import { useNavigate } from "react-router-dom";
import { TrendingUp, DollarSign, Coins, Wheat } from "lucide-react";

const Markets = () => {
  const navigate = useNavigate();

  const marketCategories = [
    {
      title: "Cryptocurrencies",
      description: "Bitcoin, Ethereum, and other digital assets",
      icon: Coins,
      path: "/markets/crypto",
      color: "text-primary",
    },
    {
      title: "Stocks",
      description: "US equity markets and major companies",
      icon: TrendingUp,
      path: "/stocks",
      color: "text-success",
    },
    {
      title: "Forex",
      description: "Foreign exchange currency pairs",
      icon: DollarSign,
      path: "/forex",
      color: "text-warning",
    },
    {
      title: "Commodities",
      description: "Metals, energy, and agricultural products",
      icon: Wheat,
      path: "/commodities",
      color: "text-danger",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Markets</h1>
        <p className="text-muted-foreground">Explore all available trading markets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {marketCategories.map((category) => {
          const Icon = category.icon;
          return (
            <div
              key={category.path}
              onClick={() => navigate(category.path)}
              className="bg-card border border-border rounded-lg p-8 hover:border-primary transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className={`p-4 bg-secondary rounded-lg ${category.color} group-hover:scale-110 transition-transform`}>
                  <Icon size={32} />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {category.title}
                  </h2>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Markets;
