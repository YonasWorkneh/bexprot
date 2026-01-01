import axios from "axios";

// Stock data
export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  id: string;
}

// Forex pair
export interface ForexPair {
  symbol: string;
  name: string;
  rate: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  id: string;
}

// Commodity
export interface Commodity {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  category: string;
  id: string;
}

// Mock stock data (Top US stocks)
export const mockStocks: Stock[] = [
  { id: "apple", symbol: "AAPL", name: "Apple Inc.", price: 245.80, change: 3.45, changePercent: 1.42, volume: 55000000, marketCap: 3800000000000, sector: "Technology" },
  { id: "microsoft", symbol: "MSFT", name: "Microsoft Corp.", price: 485.20, change: -2.10, changePercent: -0.43, volume: 29000000, marketCap: 3600000000000, sector: "Technology" },
  { id: "alphabet", symbol: "GOOGL", name: "Alphabet Inc.", price: 195.50, change: 2.30, changePercent: 1.19, volume: 28000000, marketCap: 2400000000000, sector: "Technology" },
  { id: "amazon", symbol: "AMZN", name: "Amazon.com Inc.", price: 210.40, change: 4.50, changePercent: 2.18, volume: 51000000, marketCap: 2200000000000, sector: "Consumer" },
  { id: "nvidia", symbol: "NVDA", name: "NVIDIA Corp.", price: 1250.00, change: 45.20, changePercent: 3.75, volume: 48000000, marketCap: 3100000000000, sector: "Technology" },
  { id: "tesla", symbol: "TSLA", name: "Tesla Inc.", price: 320.50, change: -8.40, changePercent: -2.55, volume: 105000000, marketCap: 1020000000000, sector: "Automotive" },
  { id: "meta", symbol: "META", name: "Meta Platforms", price: 610.20, change: 12.50, changePercent: 2.09, volume: 21000000, marketCap: 1550000000000, sector: "Technology" },
  { id: "berkshire", symbol: "BRK.B", name: "Berkshire Hathaway", price: 480.50, change: 1.20, changePercent: 0.25, volume: 3800000, marketCap: 1050000000000, sector: "Financial" },
  { id: "jpmorgan", symbol: "JPM", name: "JPMorgan Chase", price: 215.80, change: 2.40, changePercent: 1.12, volume: 12000000, marketCap: 620000000000, sector: "Financial" },
  { id: "visa", symbol: "V", name: "Visa Inc.", price: 310.40, change: 3.50, changePercent: 1.14, volume: 7500000, marketCap: 650000000000, sector: "Financial" },
];

// Mock forex pairs
export const mockForexPairs: ForexPair[] = [
  { id: "eurusd", symbol: "EUR/USD", name: "Euro / US Dollar", rate: 1.0742, change: 0.0012, changePercent: 0.11, bid: 1.0741, ask: 1.0743 },
  { id: "gbpusd", symbol: "GBP/USD", name: "British Pound / US Dollar", rate: 1.2634, change: -0.0023, changePercent: -0.18, bid: 1.2633, ask: 1.2635 },
  { id: "usdjpy", symbol: "USD/JPY", name: "US Dollar / Japanese Yen", rate: 149.82, change: 0.45, changePercent: 0.30, bid: 149.81, ask: 149.83 },
  { id: "usdchf", symbol: "USD/CHF", name: "US Dollar / Swiss Franc", rate: 0.8843, change: 0.0015, changePercent: 0.17, bid: 0.8842, ask: 0.8844 },
  { id: "audusd", symbol: "AUD/USD", name: "Australian Dollar / US Dollar", rate: 0.6512, change: -0.0008, changePercent: -0.12, bid: 0.6511, ask: 0.6513 },
  { id: "usdcad", symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", rate: 1.3621, change: 0.0034, changePercent: 0.25, bid: 1.3620, ask: 1.3622 },
  { id: "nzdusd", symbol: "NZD/USD", name: "New Zealand Dollar / US Dollar", rate: 0.5923, change: -0.0015, changePercent: -0.25, bid: 0.5922, ask: 0.5924 },
  { id: "eurgbp", symbol: "EUR/GBP", name: "Euro / British Pound", rate: 0.8502, change: 0.0019, changePercent: 0.22, bid: 0.8501, ask: 0.8503 },
];

// Mock commodities
export const mockCommodities: Commodity[] = [
  { id: "gold", symbol: "GC", name: "Gold", price: 4050.80, change: 45.50, changePercent: 1.13, unit: "USD/oz", category: "Metals" },
  { id: "silver", symbol: "SI", name: "Silver", price: 48.20, change: 1.25, changePercent: 2.66, unit: "USD/oz", category: "Metals" },
  { id: "crudeoil", symbol: "CL", name: "Crude Oil WTI", price: 95.50, change: 2.10, changePercent: 2.25, unit: "USD/bbl", category: "Energy" },
  { id: "naturalgas", symbol: "NG", name: "Natural Gas", price: 4.20, change: 0.15, changePercent: 3.70, unit: "USD/MMBtu", category: "Energy" },
  { id: "copper", symbol: "HG", name: "Copper", price: 5.10, change: 0.08, changePercent: 1.59, unit: "USD/lb", category: "Metals" },
  { id: "platinum", symbol: "PL", name: "Platinum", price: 1250.40, change: 18.90, changePercent: 1.53, unit: "USD/oz", category: "Metals" },
  { id: "wheat", symbol: "ZW", name: "Wheat", price: 780.50, change: 12.25, changePercent: 1.59, unit: "USD/bu", category: "Agriculture" },
  { id: "corn", symbol: "ZC", name: "Corn", price: 590.25, change: 8.50, changePercent: 1.46, unit: "USD/bu", category: "Agriculture" },
  { id: "palladium", symbol: "PA", name: "Palladium", price: 1150.20, change: 25.40, changePercent: 2.25, unit: "USD/oz", category: "Metals" },
  { id: "aluminum", symbol: "AL", name: "Aluminum", price: 2600.50, change: 45.50, changePercent: 1.78, unit: "USD/ton", category: "Metals" },
  { id: "coffee", symbol: "KC", name: "Coffee", price: 245.30, change: 5.10, changePercent: 2.12, unit: "USD/lb", category: "Agriculture" },
  { id: "sugar", symbol: "SB", name: "Sugar", price: 28.40, change: 0.45, changePercent: 1.61, unit: "USD/lb", category: "Agriculture" },
  { id: "cotton", symbol: "CT", name: "Cotton", price: 95.50, change: 1.40, changePercent: 1.49, unit: "USD/lb", category: "Agriculture" },
  { id: "cocoa", symbol: "CC", name: "Cocoa", price: 5800.00, change: 250.00, changePercent: 4.50, unit: "USD/ton", category: "Agriculture" },
];

// Simulated price updates
export const simulatePriceUpdate = (currentPrice: number, volatility: number = 0.002): number => {
  const change = currentPrice * volatility * (Math.random() - 0.5) * 2;
  return parseFloat((currentPrice + change).toFixed(2));
};

// Generate historical chart data for stocks and commodities
export interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export const generateChartData = (
  basePrice: number,
  days: number = 30,
  volatility: number = 0.02
): ChartData[] => {
  const data: ChartData[] = [];
  let currentPrice = basePrice;
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  for (let i = days; i >= 0; i--) {
    const open = currentPrice;
    const change = currentPrice * volatility * (Math.random() - 0.5) * 2;
    const close = open + change;
    const high = Math.max(open, close) * (1 + Math.random() * volatility);
    const low = Math.min(open, close) * (1 - Math.random() * volatility);

    data.push({
      time: Math.floor((now - i * dayInMs) / 1000),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    });

    currentPrice = close;
  }

  return data;
};

export const fetchStocks = async (): Promise<Stock[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Add small random price changes
  return mockStocks.map(stock => ({
    ...stock,
    price: simulatePriceUpdate(stock.price, 0.01),
  }));
};

export const fetchStockDetail = async (id: string): Promise<Stock | undefined> => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return mockStocks.find(stock => stock.id === id);
};

export const fetchForexPairs = async (): Promise<ForexPair[]> => {
  await new Promise((resolve) => setTimeout(resolve, 50));

  return mockForexPairs.map(pair => ({
    ...pair,
    rate: simulatePriceUpdate(pair.rate, 0.001),
    bid: simulatePriceUpdate(pair.bid, 0.001),
    ask: simulatePriceUpdate(pair.ask, 0.001),
  }));
};

export const fetchForexPairDetail = async (id: string): Promise<ForexPair | undefined> => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return mockForexPairs.find(pair => pair.id === id);
};

export const fetchCommodities = async (): Promise<Commodity[]> => {
  await new Promise((resolve) => setTimeout(resolve, 50));

  return mockCommodities.map(commodity => ({
    ...commodity,
    price: simulatePriceUpdate(commodity.price, 0.005),
  }));
};

export const fetchCommodityDetail = async (id: string): Promise<Commodity | undefined> => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return mockCommodities.find(commodity => commodity.id === id);
};
