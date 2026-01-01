import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ANNOUNCEMENT_KEY = 'system_announcement_seen_v1';

const SystemAnnouncementModal = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user has already seen this announcement
        const hasSeenAnnouncement = localStorage.getItem(ANNOUNCEMENT_KEY);
        
        if (!hasSeenAnnouncement) {
            // Show modal after a short delay for better UX
            const timer = setTimeout(() => {
                setOpen(true);
            }, 1000);
            
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        // Mark announcement as seen
        localStorage.setItem(ANNOUNCEMENT_KEY, 'true');
        setOpen(false);
    };

    const handleSignUp = () => {
        handleClose();
        navigate('/auth');
    };

    return (
        <Dialog open={open} onOpenChange={(open) => {
            // Prevent closing by clicking outside or pressing escape
            if (!open) return;
            setOpen(open);
        }}>
            <DialogContent className="sm:max-w-[500px] border-2 border-primary/50 bg-gradient-to-br from-card via-card to-primary/10 [&>button]:hidden">
                <DialogHeader>
                    <div className="flex items-center justify-center mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative bg-primary/10 p-4 rounded-full border-2 border-primary/50">
                                <AlertTriangle className="w-12 h-12 text-primary animate-bounce" />
                            </div>
                        </div>
                    </div>
                    
                    <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-green-500 bg-clip-text text-transparent">
                        System Update Required
                    </DialogTitle>
                    
                    <DialogDescription className="text-center text-base mt-4 space-y-4">
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <RefreshCw className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                <p className="text-left text-muted-foreground">
                                    We apologize for recent system disruptions. To ensure the security of your assets and data, a mandatory system update has been deployed.
                                </p>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <UserPlus className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <p className="text-left text-muted-foreground">
                                    <span className="font-semibold text-foreground">All users are required to create a new account</span> to access the updated platform features.
                                </p>
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 mt-6">
                    <Button
                        onClick={handleSignUp}
                        className="w-full bg-gradient-to-r from-primary to-green-600 hover:from-primary/90 hover:to-green-700 text-white font-semibold py-6 text-lg shadow-lg shadow-primary/20"
                    >
                        <UserPlus className="w-5 h-5 mr-2" />
                        Create New Account
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SystemAnnouncementModal;
