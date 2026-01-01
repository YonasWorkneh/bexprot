import { useEffect, useRef } from "react";
import { createChart, IChartApi, CandlestickSeries } from "lightweight-charts";
import { CandleData } from "@/lib/coingecko";

interface TradingChartProps {
  data: CandleData[];
  height?: number;
}

const TradingChart = ({ data, height = 500 }: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#000000" },
        textColor: "#FFFFFF",
      },
      grid: {
        vertLines: { color: "#1a1a1a" },
        horzLines: { color: "#1a1a1a" },
      },
      width: chartContainerRef.current.clientWidth,
      height,
      timeScale: {
        borderColor: "#1a1a1a",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "#1a1a1a",
      },
    });

    seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
      upColor: "#00C853",
      downColor: "#F44336",
      borderUpColor: "#00C853",
      borderDownColor: "#F44336",
      wickUpColor: "#00C853",
      wickDownColor: "#F44336",
    });

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [height]);

  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      const formattedData = data.map((d) => ({
        ...d,
        time: d.time as any,
      }));
      seriesRef.current.setData(formattedData);
    }
  }, [data]);

  return <div ref={chartContainerRef} className="w-full" />;
};

export default TradingChart;
