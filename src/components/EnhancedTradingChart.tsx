import { useEffect, useRef } from 'react';
import { useTradingStore } from '@/store/tradingStore';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface EnhancedTradingChartProps {
    data: Array<{ time: number; value: number }>;
    height?: number;
    assetId?: string;
    showTradeMarkers?: boolean;
}

const EnhancedTradingChart = ({
    data,
    height = 500,
    assetId,
    showTradeMarkers = true,
}: EnhancedTradingChartProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const orderHistory = useTradingStore((state) => state.orderHistory);
    const positions = useTradingStore((state) => state.positions);

    // Get trades for this asset
    const assetTrades = assetId
        ? orderHistory.filter((order) => order.assetId.toLowerCase() === assetId.toLowerCase())
        : [];

    useEffect(() => {
        if (!canvasRef.current || !data || data.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = canvas.offsetHeight * dpr;
        ctx.scale(dpr, dpr);

        const width = canvas.offsetWidth;
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Calculate min and max values
        const prices = data.map((d) => d.value);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;

        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();

            // Price labels
            const price = maxPrice - (priceRange / 5) * i;
            ctx.fillStyle = '#666';
            ctx.font = '12px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`$${price.toFixed(2)}`, padding - 10, y + 4);
        }

        // Vertical grid lines
        const timeIntervals = 6;
        for (let i = 0; i <= timeIntervals; i++) {
            const x = padding + (chartWidth / timeIntervals) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }

        // Draw chart line
        ctx.beginPath();
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;

        data.forEach((point, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y =
                height -
                padding -
                ((point.value - minPrice) / priceRange) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Fill area under line
        if (data.length > 0) {
            ctx.lineTo(
                padding + chartWidth,
                height - padding
            );
            ctx.lineTo(padding, height - padding);
            ctx.closePath();

            const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
            gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
            gradient.addColorStop(1, 'rgba(102, 126, 234, 0.05)');
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // Draw trade markers if enabled
        if (showTradeMarkers && assetTrades.length > 0) {
            assetTrades.forEach((trade) => {
                // Find closest data point to trade timestamp
                const tradeTime = trade.timestamp;
                let closestIndex = 0;
                let closestDiff = Math.abs(data[0].time - tradeTime);

                data.forEach((point, index) => {
                    const diff = Math.abs(point.time - tradeTime);
                    if (diff < closestDiff) {
                        closestDiff = diff;
                        closestIndex = index;
                    }
                });

                if (closestIndex >= 0 && closestIndex < data.length) {
                    const x = padding + (chartWidth / (data.length - 1)) * closestIndex;
                    const y =
                        height -
                        padding -
                        ((data[closestIndex].value - minPrice) / priceRange) * chartHeight;

                    // Draw marker circle
                    ctx.beginPath();
                    ctx.arc(x, y, 8, 0, 2 * Math.PI);
                    ctx.fillStyle = trade.side === 'buy' ? '#22c55e' : '#ef4444';
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Draw marker label
                    ctx.fillStyle = trade.side === 'buy' ? '#22c55e' : '#ef4444';
                    ctx.font = 'bold 10px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(
                        trade.side === 'buy' ? 'BUY' : 'SELL',
                        x,
                        y - 15
                    );

                    // Draw entry price line
                    ctx.beginPath();
                    ctx.setLineDash([5, 5]);
                    ctx.strokeStyle = trade.side === 'buy' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)';
                    ctx.lineWidth = 1;
                    const entryY = height - padding - ((trade.price - minPrice) / priceRange) * chartHeight;
                    ctx.moveTo(x - 20, entryY);
                    ctx.lineTo(x + 20, entryY);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            });
        }

        // Draw current position P&L indicators
        if (showTradeMarkers && positions.length > 0 && assetId) {
            const assetPosition = positions.find(
                (p) => p.assetId.toLowerCase() === assetId.toLowerCase()
            );

            if (assetPosition) {
                // Draw P&L box in top right
                const boxWidth = 150;
                const boxHeight = 60;
                const boxX = width - padding - boxWidth - 10;
                const boxY = padding + 10;

                // Box background
                ctx.fillStyle = assetPosition.pnl >= 0
                    ? 'rgba(34, 197, 94, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)';
                ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

                // Box border
                ctx.strokeStyle = assetPosition.pnl >= 0 ? '#22c55e' : '#ef4444';
                ctx.lineWidth = 2;
                ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

                // P&L text
                ctx.fillStyle = assetPosition.pnl >= 0 ? '#22c55e' : '#ef4444';
                ctx.font = 'bold 16px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(
                    `${assetPosition.pnl >= 0 ? '+' : ''}$${assetPosition.pnl.toFixed(2)}`,
                    boxX + boxWidth / 2,
                    boxY + 25
                );

                // Percentage text
                ctx.font = '12px monospace';
                ctx.fillText(
                    `${assetPosition.pnlPercentage >= 0 ? '+' : ''}${assetPosition.pnlPercentage.toFixed(2)}%`,
                    boxX + boxWidth / 2,
                    boxY + 45
                );
            }
        }
    }, [data, height, assetTrades, positions, assetId, showTradeMarkers]);

    return (
        <div className="relative w-full h-full">
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: `${height}px` }}
                className="bg-card"
            />
            {showTradeMarkers && assetTrades.length > 0 && (
                <div className="absolute bottom-4 left-4 flex gap-2">
                    <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded border border-green-500/50">
                        <TrendingUp size={14} className="text-green-500" />
                        <span className="text-xs text-green-500 font-semibold">
                            {assetTrades.filter((t) => t.side === 'buy').length} Buys
                        </span>
                    </div>
                    <div className="flex items-center gap-1 bg-red-500/20 px-2 py-1 rounded border border-red-500/50">
                        <TrendingDown size={14} className="text-red-500" />
                        <span className="text-xs text-red-500 font-semibold">
                            {assetTrades.filter((t) => t.side === 'sell').length} Sells
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedTradingChart;
