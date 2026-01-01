import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface IntervalOption {
  label: string;
  value: string;
  category: "seconds" | "minutes" | "hours" | "days";
}

const INTERVAL_OPTIONS: IntervalOption[] = [
  // MINUTES (Fully supported by TradingView)
  { label: "1 minute", value: "1", category: "minutes" },
  { label: "2 minutes", value: "2", category: "minutes" },
  { label: "3 minutes", value: "3", category: "minutes" },
  { label: "5 minutes", value: "5", category: "minutes" },
  { label: "10 minutes", value: "10", category: "minutes" },
  { label: "15 minutes", value: "15", category: "minutes" },
  { label: "30 minutes", value: "30", category: "minutes" },
  { label: "45 minutes", value: "45", category: "minutes" },

  // HOURS (Fully supported by TradingView - values in minutes)
  { label: "1 hour", value: "60", category: "hours" },
  { label: "2 hours", value: "120", category: "hours" },
  { label: "3 hours", value: "180", category: "hours" },
  { label: "4 hours", value: "240", category: "hours" },

  // DAYS (Fully supported by TradingView)
  { label: "1 day", value: "D", category: "days" },
  { label: "1 week", value: "W", category: "days" },
  { label: "1 month", value: "M", category: "days" },
  { label: "3 months", value: "3M", category: "days" },
  { label: "6 months", value: "6M", category: "days" },
];

// Default favorites
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

interface ChartIntervalSelectorProps {
  value: string;
  onChange: (interval: string) => void;
}

const ChartIntervalSelector = ({
  value,
  onChange,
}: ChartIntervalSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customType, setCustomType] = useState<
    "minutes" | "hours" | "days"
  >("minutes");
  const [customInterval, setCustomInterval] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    const stored = localStorage.getItem("chart-interval-favorites");
    return stored ? JSON.parse(stored) : DEFAULT_FAVORITES;
  });
  const [customIntervals, setCustomIntervals] = useState<IntervalOption[]>(
    () => {
      const stored = localStorage.getItem("chart-custom-intervals");
      return stored ? JSON.parse(stored) : [];
    }
  );

  const toggleFavorite = (intervalValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newFavorites = favorites.includes(intervalValue)
      ? favorites.filter((f) => f !== intervalValue)
      : [...favorites, intervalValue];
    setFavorites(newFavorites);
    localStorage.setItem(
      "chart-interval-favorites",
      JSON.stringify(newFavorites)
    );
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("favorites-updated"));
  };

  const getDisplayLabel = (intervalValue: string) => {
    // Check if it's a custom interval
    const customOption = customIntervals.find(
      (ci) => ci.value === intervalValue
    );
    if (customOption) {
      // Extract number from label for display
      const match = customOption.label.match(/(\d+)/);
      if (match) {
        const num = match[1];
        if (customOption.category === "days") {
          if (intervalValue === "D") return "1D";
          if (intervalValue === "W") return "1W";
          if (intervalValue === "M") return "1M";
          return `${num}D`;
        }
        if (customOption.category === "hours") {
          return `${num}h`;
        }
        if (customOption.category === "minutes") {
          return `${num}m`;
        }
        if (customOption.category === "seconds") {
          return `${num}s`;
        }
      }
    }

    // Convert to common display format
    if (intervalValue === "D") return "1D";
    if (intervalValue === "W") return "1W";
    if (intervalValue === "M") return "1M";
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

  const convertToTradingViewValue = (
    interval: number,
    type: "seconds" | "minutes" | "hours" | "days"
  ): string => {
    if (type === "days") {
      if (interval === 1) return "D";
      if (interval === 7) return "W";
      if (interval === 30) return "M";
      return `${interval}D`;
    }
    if (type === "hours") {
      return String(interval * 60); // Convert hours to minutes
    }
    if (type === "seconds") {
      return "1"; // TradingView doesn't support seconds well, fallback to 1 minute
    }
    return String(interval); // minutes
  };

  const handleAddCustomInterval = () => {
    const intervalNum = parseInt(customInterval);
    if (!intervalNum || intervalNum <= 0) return;

    const tradingViewValue = convertToTradingViewValue(intervalNum, customType);
    const label =
      customType === "days"
        ? `${intervalNum} ${intervalNum === 1 ? "day" : "days"}`
        : customType === "hours"
        ? `${intervalNum} ${intervalNum === 1 ? "hour" : "hours"}`
        : `${intervalNum} ${intervalNum === 1 ? "minute" : "minutes"}`;

    const newCustomInterval: IntervalOption = {
      label,
      value: tradingViewValue,
      category: customType,
    };

    // Check if already exists
    const exists = customIntervals.some(
      (ci) => ci.value === tradingViewValue && ci.category === customType
    );
    if (exists) return;

    const updatedCustomIntervals = [...customIntervals, newCustomInterval];
    setCustomIntervals(updatedCustomIntervals);
    localStorage.setItem(
      "chart-custom-intervals",
      JSON.stringify(updatedCustomIntervals)
    );

    // Reset form
    setCustomInterval("");
    setCustomType("minutes");
    setCustomDialogOpen(false);
  };

  const allOptions = [...INTERVAL_OPTIONS, ...customIntervals];

  const groupedOptions = {
    seconds: allOptions.filter((opt) => opt.category === "seconds"),
    minutes: allOptions.filter((opt) => opt.category === "minutes"),
    hours: allOptions.filter((opt) => opt.category === "hours"),
    days: allOptions.filter((opt) => opt.category === "days"),
  };

  return (
    <Popover
      open={open}
      onOpenChange={(newOpen) => {
        // Don't close if custom dialog is open
        if (!newOpen && customDialogOpen) {
          return;
        }
        setOpen(newOpen);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs font-medium rounded-md transition-colors bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
        >
          {open ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0 bg-popover border-border"
        align="start"
        side="bottom"
        sideOffset={4}
        onInteractOutside={(e) => {
          // Don't close if clicking on the custom interval popover
          const target = e.target as HTMLElement;
          if (target.closest("[data-radix-popper-content-wrapper]")) {
            e.preventDefault();
          }
        }}
      >
        <div className="max-h-[600px] overflow-y-auto">
          <div className="p-2 border-b border-border">
            <Popover
              open={customDialogOpen}
              onOpenChange={(newOpen) => {
                setCustomDialogOpen(newOpen);
                // Keep parent open when custom dialog opens
                if (newOpen && !open) {
                  setOpen(true);
                }
              }}
              modal={false}
            >
              <PopoverTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setCustomDialogOpen(true);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  className="w-full text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1 hover:text-foreground transition-colors"
                >
                  + Add custom interval...
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-4 bg-popover border-border ml-4"
                align="start"
                side="right"
                sideOffset={8}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onInteractOutside={(e) => {
                  // Prevent closing parent popover when interacting with this one
                  const target = e.target as HTMLElement;
                  if (target.closest("[data-radix-popper-content-wrapper]")) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Add custom interval
                    </h3>
                  </div>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={customType}
                        onValueChange={(
                          value: "minutes" | "hours" | "days"
                        ) => setCustomType(value)}
                      >
                        <SelectTrigger id="type" className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="interval">Interval</Label>
                      <Input
                        id="interval"
                        type="number"
                        min="1"
                        placeholder="Enter interval"
                        value={customInterval}
                        onChange={(e) => setCustomInterval(e.target.value)}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            customInterval &&
                            parseInt(customInterval) > 0
                          ) {
                            handleAddCustomInterval();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCustomDialogOpen(false);
                        setCustomInterval("");
                        setCustomType("minutes");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddCustomInterval}
                      disabled={
                        !customInterval || parseInt(customInterval) <= 0
                      }
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* SECONDS */}
          {groupedOptions.seconds.length > 0 && (
            <div className="py-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                SECONDS
              </div>
              {groupedOptions.seconds.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors cursor-pointer",
                    value === option.value && "bg-primary/10 text-primary"
                  )}
                >
                  <button
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="flex-1 text-left"
                  >
                    {option.label}
                  </button>
                  <button
                    onClick={(e) => toggleFavorite(option.value, e)}
                    className="ml-2 p-0.5 hover:bg-muted rounded flex-shrink-0"
                  >
                    <Star
                      className={cn(
                        "h-3 w-3",
                        favorites.includes(option.value)
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* MINUTES */}
          {groupedOptions.minutes.length > 0 && (
            <div className="py-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                MINUTES
              </div>
              {groupedOptions.minutes.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors cursor-pointer",
                    value === option.value && "bg-primary/10 text-primary"
                  )}
                >
                  <button
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="flex-1 text-left"
                  >
                    {option.label}
                  </button>
                  <button
                    onClick={(e) => toggleFavorite(option.value, e)}
                    className="ml-2 p-0.5 hover:bg-muted rounded flex-shrink-0"
                  >
                    <Star
                      className={cn(
                        "h-3 w-3",
                        favorites.includes(option.value)
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* HOURS */}
          {groupedOptions.hours.length > 0 && (
            <div className="py-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                HOURS
              </div>
              {groupedOptions.hours.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors cursor-pointer",
                    value === option.value && "bg-primary/10 text-primary"
                  )}
                >
                  <button
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="flex-1 text-left"
                  >
                    {option.label}
                  </button>
                  <button
                    onClick={(e) => toggleFavorite(option.value, e)}
                    className="ml-2 p-0.5 hover:bg-muted rounded flex-shrink-0"
                  >
                    <Star
                      className={cn(
                        "h-3 w-3",
                        favorites.includes(option.value)
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* DAYS */}
          {groupedOptions.days.length > 0 && (
            <div className="py-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                DAYS
              </div>
              {groupedOptions.days.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors cursor-pointer",
                    value === option.value && "bg-primary/10 text-primary"
                  )}
                >
                  <button
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="flex-1 text-left"
                  >
                    {option.label}
                  </button>
                  <button
                    onClick={(e) => toggleFavorite(option.value, e)}
                    className="ml-2 p-0.5 hover:bg-muted rounded flex-shrink-0"
                  >
                    <Star
                      className={cn(
                        "h-3 w-3",
                        favorites.includes(option.value)
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
      <Popover open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <PopoverContent
          className="w-80 p-4 bg-popover border-border"
          align="start"
          side="right"
          sideOffset={8}
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Add custom interval
              </h3>
            </div>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={customType}
                  onValueChange={(
                    value: "minutes" | "hours" | "days"
                  ) => setCustomType(value)}
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="interval">Interval</Label>
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  placeholder="Enter interval"
                  value={customInterval}
                  onChange={(e) => setCustomInterval(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      customInterval &&
                      parseInt(customInterval) > 0
                    ) {
                      handleAddCustomInterval();
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCustomDialogOpen(false);
                  setCustomInterval("");
                  setCustomType("minutes");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddCustomInterval}
                disabled={!customInterval || parseInt(customInterval) <= 0}
              >
                Add
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </Popover>
  );
};

export default ChartIntervalSelector;
