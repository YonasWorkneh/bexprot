import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import {
    createSupportTicket,
    sendSupportMessage,
    getUserTickets,
    getTicketMessages,
    uploadSupportImage,
    subscribeToTicketMessages,
    type SupportTicket,
    type SupportMessage,
} from '@/lib/supportService';
import { Send, Upload, X, Loader2, MessageCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface SupportChatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const PAGE_OPTIONS = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'trade', label: 'Trade Page' },
    { value: 'wallet', label: 'Wallet' },
    { value: 'deposit', label: 'Deposit' },
    { value: 'withdrawal', label: 'Withdrawal' },
    { value: 'account', label: 'Account Settings' },
    { value: 'other', label: 'Other' },
];

const SupportChatDialog = ({ open, onOpenChange }: SupportChatDialogProps) => {
    const user = useAuthStore((state) => state.user);
    const { toast } = useToast();

    const [view, setView] = useState<'list' | 'new' | 'chat'>('list');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    // New ticket form
    const [subject, setSubject] = useState('');
    const [pageContext, setPageContext] = useState('');
    const [initialMessage, setInitialMessage] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Chat form
    const [newMessage, setNewMessage] = useState('');
    const [chatImageFile, setChatImageFile] = useState<File | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load user tickets
    const loadTickets = async () => {
        if (!user?.id) return;
        setLoading(true);
        const userTickets = await getUserTickets(user.id);
        setTickets(userTickets);
        setLoading(false);
    };

    // Load messages for selected ticket
    const loadMessages = async (ticketId: string) => {
        const ticketMessages = await getTicketMessages(ticketId);
        setMessages(ticketMessages);
        scrollToBottom();
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (open && user?.id) {
            loadTickets();
        }
    }, [open, user?.id]);

    useEffect(() => {
        if (selectedTicket) {
            loadMessages(selectedTicket.id);

            // Subscribe to new messages
            const unsubscribe = subscribeToTicketMessages(selectedTicket.id, (newMessage) => {
                setMessages((prev) => [...prev, newMessage]);
                scrollToBottom();
            });

            return unsubscribe;
        }
    }, [selectedTicket]);

    const handleCreateTicket = async () => {
        if (!user?.id || !subject.trim() || !initialMessage.trim()) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        setSending(true);

        try {
            let imageUrl: string | undefined;

            if (imageFile) {
                const uploadResult = await uploadSupportImage(user.id, imageFile);
                if (uploadResult.success) {
                    imageUrl = uploadResult.url;
                }
            }

            const result = await createSupportTicket(
                user.id,
                subject,
                initialMessage,
                pageContext || undefined,
                imageUrl
            );

            if (result.success && result.ticket) {
                toast({
                    title: 'Ticket Created',
                    description: 'Our support team will respond shortly',
                });

                setSubject('');
                setPageContext('');
                setInitialMessage('');
                setImageFile(null);
                setSelectedTicket(result.ticket);
                setView('chat');
                await loadTickets();
            } else {
                throw new Error(result.error || 'Failed to create ticket');
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSending(false);
        }
    };

    const handleSendMessage = async () => {
        if (!user?.id || !selectedTicket || !newMessage.trim()) return;

        setSending(true);

        try {
            let imageUrl: string | undefined;

            if (chatImageFile) {
                const uploadResult = await uploadSupportImage(user.id, chatImageFile);
                if (uploadResult.success) {
                    imageUrl = uploadResult.url;
                }
            }

            const result = await sendSupportMessage(
                selectedTicket.id,
                user.id,
                newMessage,
                false,
                imageUrl
            );

            if (result.success) {
                setNewMessage('');
                setChatImageFile(null);
            } else {
                throw new Error(result.error || 'Failed to send message');
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSending(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open':
                return 'bg-blue-500';
            case 'in_progress':
                return 'bg-yellow-500';
            case 'resolved':
                return 'bg-green-500';
            case 'closed':
                return 'bg-gray-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl h-[600px] flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Customer Support
                    </DialogTitle>
                    <DialogDescription>
                        {view === 'list' && 'View your support tickets or create a new one'}
                        {view === 'new' && 'Create a new support ticket'}
                        {view === 'chat' && `Ticket: ${selectedTicket?.subject}`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    {/* Ticket List View */}
                    {view === 'list' && (
                        <div className="h-full flex flex-col">
                            <div className="p-6 space-y-4 flex-1 overflow-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : tickets.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>No support tickets yet</p>
                                        <p className="text-sm mt-2">Create one to get help from our team</p>
                                    </div>
                                ) : (
                                    tickets.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            className="p-4 border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                                            onClick={() => {
                                                setSelectedTicket(ticket);
                                                setView('chat');
                                            }}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-semibold">{ticket.subject}</h4>
                                                <Badge className={getStatusColor(ticket.status)}>
                                                    {ticket.status}
                                                </Badge>
                                            </div>
                                            {ticket.page_context && (
                                                <p className="text-sm text-muted-foreground mb-1">
                                                    Page: {ticket.page_context}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Created: {new Date(ticket.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-6 pt-4 border-t">
                                <Button onClick={() => setView('new')} className="w-full">
                                    Create New Ticket
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* New Ticket View */}
                    {view === 'new' && (
                        <div className="h-full flex flex-col">
                            <ScrollArea className="flex-1 p-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="subject">Subject *</Label>
                                        <Input
                                            id="subject"
                                            placeholder="Brief description of your issue"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="page">Which page do you need help with?</Label>
                                        <Select value={pageContext} onValueChange={setPageContext}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a page" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PAGE_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="message">Message *</Label>
                                        <Textarea
                                            id="message"
                                            placeholder="Describe your issue in detail..."
                                            rows={6}
                                            value={initialMessage}
                                            onChange={(e) => setInitialMessage(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="image">Attach Screenshot (Optional)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="image"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => document.getElementById('image')?.click()}
                                                className="w-full"
                                            >
                                                <Upload className="mr-2 h-4 w-4" />
                                                {imageFile ? imageFile.name : 'Upload Image'}
                                            </Button>
                                            {imageFile && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setImageFile(null)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                            <div className="p-6 pt-4 border-t flex gap-2">
                                <Button variant="outline" onClick={() => setView('list')} className="flex-1">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateTicket}
                                    disabled={sending || !subject.trim() || !initialMessage.trim()}
                                    className="flex-1"
                                >
                                    {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Ticket
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Chat View */}
                    {view === 'chat' && selectedTicket && (
                        <div className="h-full flex flex-col">
                            <ScrollArea className="flex-1 p-6">
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.is_admin_reply ? 'justify-start' : 'justify-end'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-lg p-3 ${msg.is_admin_reply
                                                        ? 'bg-secondary'
                                                        : 'bg-primary text-primary-foreground'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                                {msg.image_url && (
                                                    <img
                                                        src={msg.image_url}
                                                        alt="Attachment"
                                                        className="mt-2 rounded max-w-full"
                                                    />
                                                )}
                                                <p className="text-xs opacity-70 mt-1">
                                                    {new Date(msg.created_at).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>
                            <div className="p-6 pt-4 border-t space-y-2">
                                {chatImageFile && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>{chatImageFile.name}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => setChatImageFile(null)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setChatImageFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="chat-image"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => document.getElementById('chat-image')?.click()}
                                    >
                                        <Upload className="h-4 w-4" />
                                    </Button>
                                    <Input
                                        placeholder="Type your message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                    />
                                    <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                                        {sending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <Button variant="outline" onClick={() => setView('list')} className="w-full">
                                    Back to Tickets
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SupportChatDialog;
