import { BarChart3, ShieldCheck, Wallet, ArrowUpDown } from "lucide-react";
import cryptoTable from "@/assets/crypto-table.png";
import networkWallets from "@/assets/network-wallets.png";
import goldTrading from "@/assets/gold-trading.png";
import goldChart from "@/assets/gold-chart.png";

export const features = [
  {
    title: "Advanced Trading Interface",
    description: "Professional-grade trading tools with real-time market data and advanced charting capabilities.",
    icon: <BarChart3 className="w-6 h-6" />,
    image: goldTrading
  },
  {
    title: "Portfolio Management",
    description: "Track your investments and monitor your gains with our comprehensive portfolio dashboard.",
    icon: <Wallet className="w-6 h-6" />,
    image: cryptoTable
  },
  {
    title: "Multi-Network Wallets",
    description: "Manage your assets across multiple blockchain networks with our secure wallet system.",
    icon: <ShieldCheck className="w-6 h-6" />,
    image: networkWallets
  },
  {
    title: "Real-Time Analytics",
    description: "Detailed analytics and live market data to help you make informed trading decisions.",
    icon: <ArrowUpDown className="w-6 h-6" />,
    image: goldChart
  }
];
