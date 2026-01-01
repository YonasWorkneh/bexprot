import { Home, TrendingUp, Wallet, BarChart3, Settings, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/trade", icon: TrendingUp, label: "Trade" },
    { path: "/wallet", icon: Wallet, label: "Wallet" },
    { path: "/markets", icon: BarChart3, label: "Market" },
    { path: "/settings", icon: Settings, label: "Setting" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 lg:hidden pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
