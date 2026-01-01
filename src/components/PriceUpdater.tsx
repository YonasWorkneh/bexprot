import { useEffect } from "react";
import { useTradingStore } from "@/store/tradingStore";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { fetchAssetDetail } from "@/lib/coingecko";
import { fetchStocks, fetchForexPairs, fetchCommodities } from "@/lib/marketData";

const PriceUpdater = () => {
    // const { livePositions, demoPositions, updatePositionPrices } = useTradingStore(); // Removed to avoid infinite loop

    const { user } = useAuthStore();
    const { addNotification } = useNotificationStore();

    useEffect(() => {
        const updatePrices = async () => {
            // Get latest state directly to avoid dependency loop
            const { livePositions, demoPositions, updatePositionPrices } = useTradingStore.getState();
            
            // Collect unique asset IDs from both live and demo positions
            const positions = [...livePositions, ...demoPositions];
            if (positions.length === 0) return;

            // Pre-fetch market data once to avoid repeated calls in loop
            const [stocks, forexPairs, commodities] = await Promise.all([
                fetchStocks(),
                fetchForexPairs(),
                fetchCommodities()
            ]);

            // Create maps for faster lookup
            const stockMap = new Map(stocks.map(s => [s.symbol, s.price]));
            const forexMap = new Map(forexPairs.map(f => [f.symbol, f.rate]));
            const commodityMap = new Map(commodities.map(c => [c.symbol, c.price]));

            // Process positions in parallel where possible (for crypto)
            await Promise.all(positions.map(async (pos) => {
                try {
                    let price = 0;
                    const [type, ...rest] = pos.assetId.split('_');
                    const id = rest.join('_');

                    if (type === 'crypto') {
                        // Crypto still needs individual fetch for now, but we run in parallel
                        const asset = await fetchAssetDetail(id);
                        if (asset) price = asset.current_price;
                    } else if (type === 'stock') {
                        price = stockMap.get(id) || 0;
                    } else if (type === 'forex') {
                        price = forexMap.get(id) || 0;
                    } else if (type === 'commodity') {
                        price = commodityMap.get(id) || 0;
                    }

                    if (price > 0) {
                        updatePositionPrices(pos.assetId, price);

                        // Price Alert Logic (Simulated for Demo)
                        if (user?.preferences?.priceAlerts) {
                            if (Math.random() < 0.005) { // Reduced probability since we run faster
                                const movement = (Math.random() * 5 + 1).toFixed(2);
                                const direction = Math.random() > 0.5 ? 'up' : 'down';
                                addNotification({
                                    title: `${pos.assetName} Price Alert`,
                                    message: `${pos.assetName} is ${direction} by ${movement}% in the last hour! Current price: $${price}`,
                                    type: 'info',
                                    iconType: 'trade',
                                    link: '/trade',
                                    details: `<p><strong>${pos.assetName}</strong> is experiencing high volatility.</p><p>Current Price: $${price}</p><p>24h Change: ${direction === 'up' ? '+' : '-'}${movement}%</p>`
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Failed to update price for ${pos.assetId}`, error);
                }
            }));

            // Check for expired contracts
            useTradingStore.getState().checkContractExpirations();
        };

        // Run immediately and then every 5 seconds
        updatePrices();
        const interval = setInterval(updatePrices, 5000);

        return () => clearInterval(interval);
    }, [user, addNotification]);

    // Separate effect for checking contract expirations more frequently (every 1s)
    useEffect(() => {
        const checkExpirations = () => {
            useTradingStore.getState().checkContractExpirations();
        };

        const interval = setInterval(checkExpirations, 1000);
        return () => clearInterval(interval);
    }, []);

    return null;
};

export default PriceUpdater;
