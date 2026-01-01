import { supabase } from './supabase';

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
}

/**
 * Triggers the backend email service (Supabase Edge Function)
 * Note: Requires the Edge Function to be deployed and RESEND_API_KEY set.
 */
export const sendEmail = async (options: EmailOptions) => {
    try {
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: options,
        });

        if (error) {
            console.error('Email service invocation error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error('Email service execution error:', error);
        return { success: false, error: error.message || 'Failed to trigger email service' };
    }
};
