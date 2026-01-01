/**
 * Real Payment Gateway Integration
 * Supports both Crypto (Coinbase Commerce, NOWPayments) and Fiat (Stripe)
 */

import { supabase } from './supabase';

// ============================================
// CONFIGURATION - Add your API keys here
// ============================================

export const PAYMENT_CONFIG = {
    // Stripe Configuration (for fiat payments)
    stripe: {
        publicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
        secretKey: import.meta.env.VITE_STRIPE_SECRET_KEY || '',
        webhookSecret: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET || '',
    },

    // Coinbase Commerce Configuration (for crypto payments)
    coinbase: {
        apiKey: import.meta.env.VITE_COINBASE_COMMERCE_API_KEY || '',
        webhookSecret: import.meta.env.VITE_COINBASE_WEBHOOK_SECRET || '',
    },

    // NOWPayments Configuration (alternative crypto gateway)
    nowpayments: {
        apiKey: import.meta.env.VITE_NOWPAYMENTS_API_KEY || '',
        ipnSecret: import.meta.env.VITE_NOWPAYMENTS_IPN_SECRET || '',
    },
};

// ============================================
// TYPES
// ============================================

export type PaymentMethod = 'stripe' | 'coinbase' | 'nowpayments';
export type PaymentType = 'fiat' | 'crypto';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

export interface PaymentIntent {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    type: PaymentType;
    status: PaymentStatus;
    gatewayPaymentId?: string;
    gatewayUrl?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    expiresAt?: string;
}

export interface DepositResult {
    success: boolean;
    paymentIntent?: PaymentIntent;
    checkoutUrl?: string;
    error?: string;
}

// ============================================
// STRIPE INTEGRATION (Fiat Payments)
// ============================================

/**
 * Create a Stripe payment intent for fiat deposits
 */
export async function createStripeDeposit(
    userId: string,
    amount: number,
    currency: string = 'USD'
): Promise<DepositResult> {
    try {
        if (!PAYMENT_CONFIG.stripe.publicKey) {
            throw new Error('Stripe is not configured. Please add your API keys.');
        }

        // Create payment intent in your database
        const { data: paymentIntent, error } = await supabase
            .from('payment_intents')
            .insert({
                user_id: userId,
                amount,
                currency: currency.toUpperCase(),
                method: 'stripe',
                type: 'fiat',
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;

        // In production, call Stripe API to create checkout session
        // For now, return the payment intent
        // You'll need to implement Stripe Checkout on the frontend

        return {
            success: true,
            paymentIntent,
            checkoutUrl: `/payment/stripe/${paymentIntent.id}`,
        };
    } catch (error: any) {
        console.error('Stripe deposit error:', error);
        return {
            success: false,
            error: error.message || 'Failed to create Stripe payment',
        };
    }
}

/**
 * Process Stripe webhook (called by Stripe when payment succeeds)
 */
export async function processStripeWebhook(
    paymentIntentId: string,
    stripePaymentId: string,
    status: 'succeeded' | 'failed'
): Promise<boolean> {
    try {
        const newStatus: PaymentStatus = status === 'succeeded' ? 'completed' : 'failed';

        // Update payment intent
        const { error: updateError } = await supabase
            .from('payment_intents')
            .update({
                status: newStatus,
                gateway_payment_id: stripePaymentId,
                updated_at: new Date().toISOString(),
            })
            .eq('id', paymentIntentId);

        if (updateError) throw updateError;

        // If successful, credit user's account
        if (status === 'succeeded') {
            const { data: payment } = await supabase
                .from('payment_intents')
                .select('user_id, amount')
                .eq('id', paymentIntentId)
                .single();

            if (payment) {
                await creditUserAccount(payment.user_id, payment.amount);
            }
        }

        return true;
    } catch (error) {
        console.error('Stripe webhook processing error:', error);
        return false;
    }
}

// ============================================
// COINBASE COMMERCE (Crypto Payments)
// ============================================

/**
 * Create a Coinbase Commerce charge for crypto deposits
 */
export async function createCoinbaseDeposit(
    userId: string,
    amount: number,
    cryptocurrency: string = 'USDT'
): Promise<DepositResult> {
    try {
        if (!PAYMENT_CONFIG.coinbase.apiKey) {
            throw new Error('Coinbase Commerce is not configured. Please add your API key.');
        }

        // Create payment intent in database
        const { data: paymentIntent, error } = await supabase
            .from('payment_intents')
            .insert({
                user_id: userId,
                amount,
                currency: cryptocurrency.toUpperCase(),
                method: 'coinbase',
                type: 'crypto',
                status: 'pending',
                expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
            })
            .select()
            .single();

        if (error) throw error;

        // In production, call Coinbase Commerce API
        // const charge = await createCoinbaseCharge(amount, cryptocurrency, paymentIntent.id);

        return {
            success: true,
            paymentIntent,
            checkoutUrl: `/payment/coinbase/${paymentIntent.id}`,
        };
    } catch (error: any) {
        console.error('Coinbase deposit error:', error);
        return {
            success: false,
            error: error.message || 'Failed to create Coinbase payment',
        };
    }
}

/**
 * Process Coinbase webhook
 */
export async function processCoinbaseWebhook(
    chargeId: string,
    status: 'confirmed' | 'failed' | 'expired'
): Promise<boolean> {
    try {
        const statusMap: Record<string, PaymentStatus> = {
            confirmed: 'completed',
            failed: 'failed',
            expired: 'expired',
        };

        const { data: payment, error: fetchError } = await supabase
            .from('payment_intents')
            .select('*')
            .eq('gateway_payment_id', chargeId)
            .single();

        if (fetchError) throw fetchError;

        // Update payment status
        const { error: updateError } = await supabase
            .from('payment_intents')
            .update({
                status: statusMap[status],
                updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id);

        if (updateError) throw updateError;

        // Credit account if confirmed
        if (status === 'confirmed') {
            await creditUserAccount(payment.user_id, payment.amount);
        }

        return true;
    } catch (error) {
        console.error('Coinbase webhook processing error:', error);
        return false;
    }
}

// ============================================
// NOWPAYMENTS (Alternative Crypto Gateway)
// ============================================

/**
 * Create a NOWPayments invoice for crypto deposits
 */
export async function createNOWPaymentsDeposit(
    userId: string,
    amount: number,
    cryptocurrency: string = 'USDT'
): Promise<DepositResult> {
    try {
        if (!PAYMENT_CONFIG.nowpayments.apiKey) {
            throw new Error('NOWPayments is not configured. Please add your API key.');
        }

        const { data: paymentIntent, error } = await supabase
            .from('payment_intents')
            .insert({
                user_id: userId,
                amount,
                currency: cryptocurrency.toUpperCase(),
                method: 'nowpayments',
                type: 'crypto',
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            paymentIntent,
            checkoutUrl: `/payment/nowpayments/${paymentIntent.id}`,
        };
    } catch (error: any) {
        console.error('NOWPayments deposit error:', error);
        return {
            success: false,
            error: error.message || 'Failed to create NOWPayments invoice',
        };
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Credit user's account after successful payment
 */
async function creditUserAccount(userId: string, amount: number): Promise<boolean> {
    try {
        // Get user's current balance
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', userId)
            .single();

        if (fetchError) throw fetchError;

        const currentBalance = user?.balance || 0;
        const newBalance = currentBalance + amount;

        // Update balance
        const { error: updateError } = await supabase
            .from('users')
            .update({ balance: newBalance })
            .eq('id', userId);

        if (updateError) throw updateError;

        // Create transaction record
        await supabase.from('transactions').insert({
            user_id: userId,
            type: 'deposit',
            amount,
            status: 'completed',
            description: 'Account deposit',
        });

        return true;
    } catch (error) {
        console.error('Error crediting user account:', error);
        return false;
    }
}

/**
 * Get payment intent by ID
 */
export async function getPaymentIntent(paymentId: string): Promise<PaymentIntent | null> {
    try {
        const { data, error } = await supabase
            .from('payment_intents')
            .select('*')
            .eq('id', paymentId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching payment intent:', error);
        return null;
    }
}

/**
 * Get user's payment history
 */
export async function getUserPayments(userId: string): Promise<PaymentIntent[]> {
    try {
        const { data, error } = await supabase
            .from('payment_intents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching user payments:', error);
        return [];
    }
}

/**
 * Check if payment gateway is configured
 */
export function isPaymentGatewayConfigured(method: PaymentMethod): boolean {
    switch (method) {
        case 'stripe':
            return !!PAYMENT_CONFIG.stripe.publicKey;
        case 'coinbase':
            return !!PAYMENT_CONFIG.coinbase.apiKey;
        case 'nowpayments':
            return !!PAYMENT_CONFIG.nowpayments.apiKey;
        default:
            return false;
    }
}

/**
 * Get available payment methods
 */
export function getAvailablePaymentMethods(): {
    fiat: PaymentMethod[];
    crypto: PaymentMethod[];
} {
    return {
        fiat: isPaymentGatewayConfigured('stripe') ? ['stripe'] : [],
        crypto: [
            ...(isPaymentGatewayConfigured('coinbase') ? ['coinbase' as PaymentMethod] : []),
            ...(isPaymentGatewayConfigured('nowpayments') ? ['nowpayments' as PaymentMethod] : []),
        ],
    };
}
