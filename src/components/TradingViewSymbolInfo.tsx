import { useEffect, useRef } from "react";

declare global {
    interface Window {
        TradingView: any;
    }
}

interface TradingViewSymbolInfoProps {
    symbol: string;
    colorTheme?: "light" | "dark";
    autosize?: boolean;
}

const TradingViewSymbolInfo = ({
    symbol,
    colorTheme = "dark",
    autosize = true
}: TradingViewSymbolInfoProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            symbol: symbol,
            width: "100%",
            locale: "en",
            colorTheme: colorTheme,
            isTransparent: true,
            autosize: autosize,
            largeChartUrl: "",
        });

        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };
    }, [symbol, colorTheme, autosize]);

    return (
        <div className="tradingview-widget-container" ref={containerRef}>
            <div className="tradingview-widget-container__widget"></div>
        </div>
    );
};

export default TradingViewSymbolInfo;
