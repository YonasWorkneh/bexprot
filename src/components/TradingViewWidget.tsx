import { useEffect, useRef } from "react";

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewWidgetProps {
  symbol: string;
  height?: number;
  assetId?: string; // Optional asset ID for trade markers
  interval?: string; // TradingView resolution (e.g., '1', '5', '60', 'D', 'W', 'M')
}

const TradingViewWidget = ({ symbol, height = 500, assetId, interval = "D" }: TradingViewWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !window.TradingView) return;

    // Clear previous widget
    if (widgetRef.current) {
      containerRef.current.innerHTML = "";
    }

    const containerId = `tradingview_${Math.random().toString(36).substr(2, 9)}`;
    if (containerRef.current) {
      containerRef.current.id = containerId;
    }

    // Create new widget
    try {
      widgetRef.current = new window.TradingView.widget({
        width: "100%",
        height: height,
        symbol: symbol,
        interval: interval,
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#1a1a1a",
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: containerId,
        studies: [],
        // Enable drawing tools and comparison features
        disabled_features: ["popup_hints"],
        enabled_features: ["study_templates", "chart_typing", "left_toolbar", "drawings_access"],
        // Save chart reference when ready
        onChartReady: function () {
          try {
            chartRef.current = widgetRef.current.chart();
            if (assetId) {
              console.log('Chart ready for markers on asset:', assetId);
            }
          } catch (error) {
            console.error('Error initializing chart:', error);
          }
        }
      });
    } catch (error) {
      console.error("Error creating TradingView widget:", error);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [symbol, interval]);

  // Update resolution when interval prop changes
  useEffect(() => {
    if (chartRef.current && interval) {
      try {
        chartRef.current.setResolution(interval, () => {});
      } catch (error) {
        console.warn('Failed to set chart resolution:', interval, error);
      }
    }
  }, [interval]);

  return (
    <div className="tradingview-widget-container bg-card border border-border rounded-xl overflow-hidden">
      <div ref={containerRef} />
      {assetId && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
          Trade markers ready — requires TradingView Pro for visual indicators
        </div>
      )}
    </div>
  );
};

export default TradingViewWidget;
