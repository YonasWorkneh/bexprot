import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SupportChatDialog from './SupportChatDialog';

const SupportChatButton = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Floating Support Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setOpen(true)}
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
                >
                    <MessageCircle className="h-6 w-6" />
                </Button>
            </div>

            {/* Support Dialog */}
            <SupportChatDialog open={open} onOpenChange={setOpen} />
        </>
    );
};

export default SupportChatButton;
