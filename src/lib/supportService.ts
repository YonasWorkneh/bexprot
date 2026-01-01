import { supabase } from './supabase';

export interface SupportTicket {
    id: string;
    user_id: string;
    subject: string;
    page_context?: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    created_at: string;
    updated_at: string;
}

export interface SupportMessage {
    id: string;
    ticket_id: string;
    user_id: string;
    message: string;
    image_url?: string;
    is_admin_reply: boolean;
    created_at: string;
}

export interface SupportTicketWithMessages extends SupportTicket {
    messages: SupportMessage[];
    user_email?: string;
    unread_count?: number;
}

/**
 * Create a new support ticket
 */
export async function createSupportTicket(
    userId: string,
    subject: string,
    initialMessage: string,
    pageContext?: string,
    imageUrl?: string
): Promise<{ success: boolean; ticket?: SupportTicket; error?: string }> {
    try {
        // Create the ticket
        const { data: ticket, error: ticketError } = await supabase
            .from('support_tickets')
            .insert({
                user_id: userId,
                subject,
                page_context: pageContext,
                status: 'open',
                priority: 'normal'
            })
            .select()
            .single();

        if (ticketError) throw ticketError;

        // Create the initial message
        const { error: messageError } = await supabase
            .from('support_messages')
            .insert({
                ticket_id: ticket.id,
                user_id: userId,
                message: initialMessage,
                image_url: imageUrl,
                is_admin_reply: false
            });

        if (messageError) throw messageError;

        return { success: true, ticket };
    } catch (error) {
        console.error('Error creating support ticket:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send a message to an existing ticket
 */
export async function sendSupportMessage(
    ticketId: string,
    userId: string,
    message: string,
    isAdminReply: boolean = false,
    imageUrl?: string
): Promise<{ success: boolean; message?: SupportMessage; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('support_messages')
            .insert({
                ticket_id: ticketId,
                user_id: userId,
                message,
                image_url: imageUrl,
                is_admin_reply: isAdminReply
            })
            .select()
            .single();

        if (error) throw error;

        // Update ticket's updated_at timestamp
        await supabase
            .from('support_tickets')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', ticketId);

        return { success: true, message: data };
    } catch (error) {
        console.error('Error sending support message:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get user's support tickets
 */
export async function getUserTickets(userId: string): Promise<SupportTicket[]> {
    try {
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching user tickets:', error);
        return [];
    }
}

/**
 * Get all support tickets (admin only)
 */
export async function getAllTickets(): Promise<SupportTicketWithMessages[]> {
    try {
        const { data: tickets, error: ticketsError } = await supabase
            .from('support_tickets')
            .select(`
                *,
                users!support_tickets_user_id_fkey(email)
            `)
            .order('updated_at', { ascending: false });

        if (ticketsError) throw ticketsError;

        // Fetch messages for each ticket
        const ticketsWithMessages = await Promise.all(
            (tickets || []).map(async (ticket) => {
                const { data: messages } = await supabase
                    .from('support_messages')
                    .select('*')
                    .eq('ticket_id', ticket.id)
                    .order('created_at', { ascending: true });

                return {
                    ...ticket,
                    user_email: ticket.users?.email,
                    messages: messages || []
                };
            })
        );

        return ticketsWithMessages;
    } catch (error) {
        console.error('Error fetching all tickets:', error);
        return [];
    }
}

/**
 * Get messages for a specific ticket
 */
export async function getTicketMessages(ticketId: string): Promise<SupportMessage[]> {
    try {
        const { data, error } = await supabase
            .from('support_messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });
        
            console.log("data: ", data);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching ticket messages:', error);
        return [];
    }
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
    ticketId: string,
    status: SupportTicket['status']
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('support_tickets')
            .update({ status })
            .eq('id', ticketId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error updating ticket status:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Upload support image
 */
export async function uploadSupportImage(
    userId: string,
    file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('support-images')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('support-images')
            .getPublicUrl(fileName);

        return { success: true, url: publicUrl };
    } catch (error) {
        console.error('Error uploading support image:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Subscribe to new messages for a ticket
 */
export function subscribeToTicketMessages(
    ticketId: string,
    callback: (message: SupportMessage) => void
) {
    const channel = supabase
        .channel(`ticket_${ticketId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'support_messages',
                filter: `ticket_id=eq.${ticketId}`
            },
            (payload) => {
                callback(payload.new as SupportMessage);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Subscribe to ticket updates (admin)
 */
export function subscribeToAllTickets(callback: () => void) {
    const channel = supabase
        .channel('all_tickets')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'support_tickets'
            },
            () => {
                callback();
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'support_messages'
            },
            () => {
                callback();
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
