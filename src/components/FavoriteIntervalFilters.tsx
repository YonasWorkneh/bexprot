import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Star } from "lucide-react";
import ChartIntervalSelector from "./ChartIntervalSelector";

interface FavoriteIntervalFiltersProps {
  value: string;
  onChange: (interval: string) => void;
}

const DEFAULT_FAVORITES = [
  "1",
  "2",
  "3",
  "5",
  "10",
  "15",
  "60",
  "240",
  "D",
  "W",
];

const getDisplayLabel = (intervalValue: string) => {
  if (intervalValue === "D") return "D";
  if (intervalValue === "W") return "W";
  if (intervalValue === "M") return "M";
  if (intervalValue === "3M") return "3M";
  if (intervalValue === "6M") return "6M";
  if (intervalValue === "60") return "1h";
  if (intervalValue === "120") return "2h";
  if (intervalValue === "180") return "3h";
  if (intervalValue === "240") return "4h";
  if (intervalValue === "15") return "15m";
  if (intervalValue === "10") return "10m";
  if (intervalValue === "5") return "5m";
  if (intervalValue === "3") return "3m";
  if (intervalValue === "2") return "2m";
  if (intervalValue === "1") return "1m";
  if (intervalValue === "30") return "30m";
  if (intervalValue === "45") return "45m";
  return intervalValue;
};

// Get category and numeric value for sorting
const getIntervalCategory = (
  intervalValue: string
): { category: number; value: number } => {
  // Days/Months
  if (intervalValue === "D") return { category: 3, value: 1 };
  if (intervalValue === "W") return { category: 3, value: 7 };
  if (intervalValue === "M") return { category: 4, value: 1 };
  if (intervalValue === "3M") return { category: 4, value: 3 };
  if (intervalValue === "6M") return { category: 4, value: 6 };

  // Hours (convert to minutes for comparison)
  if (intervalValue === "60") return { category: 2, value: 60 };
  if (intervalValue === "120") return { category: 2, value: 120 };
  if (intervalValue === "180") return { category: 2, value: 180 };
  if (intervalValue === "240") return { category: 2, value: 240 };

  // Minutes
  const numValue = parseInt(intervalValue);
  if (!isNaN(numValue) && numValue < 60) {
    return { category: 1, value: numValue };
  }

  // Seconds (if any custom ones exist)
  return { category: 0, value: numValue || 0 };
};

// Sort favorites by category and value
const sortFavorites = (favorites: string[]): string[] => {
  return [...favorites].sort((a, b) => {
    const aCat = getIntervalCategory(a);
    const bCat = getIntervalCategory(b);

    // First sort by category (seconds=0, minutes=1, hours=2, days=3, months=4)
    if (aCat.category !== bCat.category) {
      return aCat.category - bCat.category;
    }

    // Then sort by value within the same category
    return aCat.value - bCat.value;
  });
};

const FavoriteIntervalFilters = ({
  value,
  onChange,
}: FavoriteIntervalFiltersProps) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const stored = localStorage.getItem("chart-interval-favorites");
    return stored ? JSON.parse(stored) : DEFAULT_FAVORITES;
  });

  // Update favorites when they change in localStorage (from ChartIntervalSelector)
  useEffect(() => {
    const updateFavorites = () => {
      const stored = localStorage.getItem("chart-interval-favorites");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setFavorites(parsed);
        } catch (e) {
          // Invalid JSON, use defaults
          setFavorites(DEFAULT_FAVORITES);
        }
      }
    };

    // Check on mount
    updateFavorites();

    // Listen for storage events (works across tabs)
    window.addEventListener("storage", updateFavorites);

    // Also listen for custom event for same-tab updates
    const handleCustomStorage = () => updateFavorites();
    window.addEventListener("favorites-updated", handleCustomStorage);

    return () => {
      window.removeEventListener("storage", updateFavorites);
      window.removeEventListener("favorites-updated", handleCustomStorage);
    };
  }, []);

  // Sort favorites by category and value
  const sortedFavorites = sortFavorites(favorites);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {sortedFavorites.map((interval) => (
        <Button
          key={interval}
          variant="ghost"
          size="sm"
          onClick={() => onChange(interval)}
          className={cn(
            "h-7 px-3 text-xs font-medium rounded-md transition-colors",
            value === interval
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
          )}
        >
          {getDisplayLabel(interval)}
        </Button>
      ))}
      {/* Dropdown button positioned right after the last filter */}
      <ChartIntervalSelector value={value} onChange={onChange} />
    </div>
  );
};

export default FavoriteIntervalFilters;
