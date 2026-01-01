/**
 * Balance Snapshot Utility
 * Provides localStorage caching with SQL backend fallback
 * Ensures balance never shows $0 on refresh
 */

import { supabase } from './supabase';

const BALANCE_CACHE_KEY = 'balance_snapshot';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export interface BalanceSnapshot {
    user_id: string;
    total_balance: number;
    wallets: Array<{
        network: string;
        balance: number;
        address: string;
    }>;
    last_updated: string;
}

/**
 * Get balance from localStorage cache
 */
export function getCachedBalance(userId: string): number | null {
    try {
        const cached = localStorage.getItem(BALANCE_CACHE_KEY);
        if (!cached) return null;

        const snapshot: BalanceSnapshot = JSON.parse(cached);

        // Verify it's for the correct user
        if (snapshot.user_id !== userId) {
            localStorage.removeItem(BALANCE_CACHE_KEY);
            return null;
        }

        // Check if cache is still valid
        const cacheAge = Date.now() - new Date(snapshot.last_updated).getTime();
        if (cacheAge > CACHE_EXPIRY_MS) {
            return null; // Expired, but don't remove - better to show stale than $0
        }

        return snapshot.total_balance;
    } catch (error) {
        console.error('[BalanceSnapshot] Error reading cache:', error);
        return null;
    }
}

/**
 * Save balance to localStorage cache
 */
export function setCachedBalance(userId: string, totalBalance: number, wallets?: any[]): void {
    try {
        const snapshot: BalanceSnapshot = {
            user_id: userId,
            total_balance: totalBalance,
            wallets: wallets || [],
            last_updated: new Date().toISOString(),
        };

        localStorage.setItem(BALANCE_CACHE_KEY, JSON.stringify(snapshot));
        console.log('[BalanceSnapshot] Cache updated:', totalBalance);
    } catch (error) {
        console.error('[BalanceSnapshot] Error saving cache:', error);
    }
}

/**
 * Get balance from SQL snapshot table (fallback)
 */
export async function getSnapshotFromDB(userId: string): Promise<number | null> {
    try {
        const { data, error } = await supabase
            .from('balance_snapshots')
            .select('total_balance')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('[BalanceSnapshot] DB error:', error);
            return null;
        }

        return data?.total_balance || null;
    } catch (error) {
        console.error('[BalanceSnapshot] Error fetching snapshot:', error);
        return null;
    }
}

/**
 * Update SQL snapshot (called after balance changes)
 */
export async function updateSnapshotInDB(userId: string): Promise<void> {
    try {
        const { error } = await supabase.rpc('update_balance_snapshot', {
            user_id_param: userId,
        });

        if (error) {
            console.error('[BalanceSnapshot] Error updating snapshot:', error);
        } else {
            console.log('[BalanceSnapshot] DB snapshot updated');
        }
    } catch (error) {
        console.error('[BalanceSnapshot] Error calling update function:', error);
    }
}

/**
 * Get balance with multi-layer fallback
 * Priority: localStorage -> SQL snapshot -> Live fetch
 */
export async function getBalanceWithFallback(
    userId: string,
    liveFetchFn: () => Promise<number>,
    onFreshData?: (freshBalance: number) => void
): Promise<number> {
    console.log('[BalanceSnapshot] Getting balance with fallback...');

    // Layer 1: Try localStorage (fastest)
    const cachedBalance = getCachedBalance(userId);
    if (cachedBalance !== null && cachedBalance >= 0) { // Changed > 0 to >= 0 to handle valid 0 balance
        console.log('[BalanceSnapshot] Using cached balance:', cachedBalance);
        // Trigger background refresh
        liveFetchFn().then((liveBalance) => {
            if (liveBalance !== cachedBalance) {
                console.log('[BalanceSnapshot] Cache mismatch! Updating to:', liveBalance);
                setCachedBalance(userId, liveBalance);
                updateSnapshotInDB(userId);
                if (onFreshData) onFreshData(liveBalance);
            }
        });
        return cachedBalance;
    }

    // Layer 2: Try SQL snapshot (medium speed)
    const snapshotBalance = await getSnapshotFromDB(userId);
    if (snapshotBalance !== null && snapshotBalance >= 0) { // Changed > 0 to >= 0
        console.log('[BalanceSnapshot] Using DB snapshot:', snapshotBalance);
        setCachedBalance(userId, snapshotBalance);
        // Trigger background refresh
        liveFetchFn().then((liveBalance) => {
            if (liveBalance !== snapshotBalance) {
                console.log('[BalanceSnapshot] Snapshot mismatch! Updating to:', liveBalance);
                setCachedBalance(userId, liveBalance);
                updateSnapshotInDB(userId);
                if (onFreshData) onFreshData(liveBalance);
            }
        });
        return snapshotBalance;
    }

    // Layer 3: Live fetch (slowest but most accurate)
    console.log('[BalanceSnapshot] Fetching live balance...');
    const liveBalance = await liveFetchFn();
    setCachedBalance(userId, liveBalance);
    updateSnapshotInDB(userId);
    return liveBalance;
}

/**
 * Clear balance cache (use on logout)
 */
export function clearBalanceCache(): void {
    localStorage.removeItem(BALANCE_CACHE_KEY);
    console.log('[BalanceSnapshot] Cache cleared');
}
