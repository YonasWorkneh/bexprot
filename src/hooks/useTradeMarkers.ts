import { useMemo } from 'react';
import { useTradingStore } from '@/store/tradingStore';

/**
 * Custom hook to convert trade history into TradingView marks format
 * 
 * @param assetId - The asset ID to filter trades for
 * @returns Array of TradingView marks
 */
export const useTradeMarkers = (assetId: string) => {
    const orderHistory = useTradingStore((state) => state.orderHistory);

    const markers = useMemo(() => {
        // Filter trades for the specific asset
        const assetTrades = orderHistory.filter(
            (order) => order.assetId.toLowerCase() === assetId.toLowerCase()
        );

        // Convert to TradingView marks format
        return assetTrades.map((trade) => ({
            id: trade.id,
            time: trade.timestamp / 1000, // TradingView uses seconds, not milliseconds
            color: trade.side === 'buy' ? '#22c55e' : '#ef4444', // Green for buy, red for sell
            text: trade.side === 'buy' ? 'B' : 'S',
            label: trade.side === 'buy' ? 'B' : 'S',
            labelFontColor: '#ffffff',
            minSize: 20,
            // Tooltip information
            tooltip: [
                `${trade.side.toUpperCase()} ${trade.amount} ${trade.assetName}`,
                `Price: $${trade.price.toLocaleString()}`,
                `Total: $${trade.total.toLocaleString()}`,
                `Time: ${new Date(trade.timestamp).toLocaleString()}`
            ],
        }));
    }, [orderHistory, assetId]);

    return markers;
};

/**
 * Get statistics about trade performance
 * 
 * @param assetId - The asset ID to analyze
 * @returns Trade statistics
 */
export const useTradeStats = (assetId: string) => {
    const orderHistory = useTradingStore((state) => state.orderHistory);

    const stats = useMemo(() => {
        const assetTrades = orderHistory.filter(
            (order) => order.assetId.toLowerCase() === assetId.toLowerCase()
        );

        const buys = assetTrades.filter((t) => t.side === 'buy');
        const sells = assetTrades.filter((t) => t.side === 'sell');

        const totalBuyAmount = buys.reduce((sum, t) => sum + t.total, 0);
        const totalSellAmount = sells.reduce((sum, t) => sum + t.total, 0);

        const averageBuyPrice = buys.length > 0
            ? buys.reduce((sum, t) => sum + t.price, 0) / buys.length
            : 0;

        const averageSellPrice = sells.length > 0
            ? sells.reduce((sum, t) => sum + t.price, 0) / sells.length
            : 0;

        return {
            totalTrades: assetTrades.length,
            buyCount: buys.length,
            sellCount: sells.length,
            totalBuyAmount,
            totalSellAmount,
            averageBuyPrice,
            averageSellPrice,
            netProfit: totalSellAmount - totalBuyAmount,
            profitPercentage: totalBuyAmount > 0
                ? ((totalSellAmount - totalBuyAmount) / totalBuyAmount) * 100
                : 0,
        };
    }, [orderHistory, assetId]);

    return stats;
};
