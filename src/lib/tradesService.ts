import { supabase } from "./supabase";

export interface Trade {
  id: string;
  user_id: string;
  asset: string;
  quantity: number;
  price: number;
  type: "buy" | "sell";
  is_demo: boolean;
  timestamp: string;
  exit_price?: number | null;
  payout?: number | null;
  profit?: number | null;
  p_l?: number | null; // Profit/Loss field from trades table
  status?: "open" | "win" | "loss" | "tie" | "closed" | null;
  open_time?: string | null;
  close_time?: string | null;
  contract_data?: Record<string, unknown> | null;
  cycle?: number | null;
}

export interface FetchTradesParams {
  userId: string;
  isDemo?: boolean;
  assetId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetches trades from the database for a specific user
 * @param params - Query parameters for fetching trades
 * @returns Array of trades
 */
export async function fetchTrades(params: FetchTradesParams): Promise<Trade[]> {
  const { userId, isDemo = false, assetId, limit = 100, offset = 0 } = params;

  let query = supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .eq("is_demo", isDemo)
    .order("timestamp", { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by asset if provided
  // Asset ID format matches what's stored in the database (e.g., "crypto_bitcoin", "stock_AAPL")
  if (assetId) {
    query = query.eq("asset", assetId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching trades:", error);
    throw new Error(`Failed to fetch trades: ${error.message}`);
  }

  return (data || []) as Trade[];
}

/**
 * Fetches a single trade by ID
 * @param tradeId - The trade ID
 * @returns Trade or null if not found
 */
export async function fetchTradeById(tradeId: string): Promise<Trade | null> {
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("id", tradeId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    console.error("Error fetching trade:", error);
    throw new Error(`Failed to fetch trade: ${error.message}`);
  }

  return data as Trade | null;
}

