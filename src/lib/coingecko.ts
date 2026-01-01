import axios from "axios";

const COINGECKO_API = "https://api.coingecko.com/api/v3";

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export const fetchTopCryptos = async (limit: number = 20): Promise<CryptoAsset[]> => {
  const fetchWithRetry = async (retries = 3, delay = 1000): Promise<CryptoAsset[]> => {
    try {
      const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
        params: {
          vs_currency: "usd",
          order: "market_cap_desc",
          per_page: limit,
          page: 1,
          sparkline: false,
        },
      });
      return response.data;
    } catch (error) {
      if (retries > 0) {
        console.warn(`Error fetching crypto data, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(retries - 1, delay * 2);
      }
      console.error("Error fetching crypto data after retries:", error);
      return [];
    }
  };

  return fetchWithRetry();
};

export const fetchAssetDetail = async (id: string): Promise<CryptoAsset | null> => {
  const fetchWithRetry = async (retries = 3, delay = 1000): Promise<CryptoAsset | null> => {
    try {
      const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
        params: {
          vs_currency: "usd",
          ids: id,
          sparkline: false,
        },
      });
      return response.data[0] || null;
    } catch (error) {
      if (retries > 0) {
        console.warn(`Error fetching asset detail for ${id}, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(retries - 1, delay * 2);
      }
      console.error("Error fetching asset detail after retries:", error);
      return null;
    }
  };

  return fetchWithRetry();
};

export const fetchChartData = async (
  coinId: string,
  days: number = 7
): Promise<CandleData[]> => {
  try {
    const response = await axios.get(`${COINGECKO_API}/coins/${coinId}/ohlc`, {
      params: {
        vs_currency: "usd",
        days,
      },
    });

    return response.data.map((candle: number[]) => ({
      time: Math.floor(candle[0] / 1000),
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
    }));
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return [];
  }
};
