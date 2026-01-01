import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';

const DepositSuccessPopup = () => {
    const user = useAuthStore((state) => state.user);
    const [open, setOpen] = useState(false);
    const [depositDetails, setDepositDetails] = useState<{ amount: number; currency: string } | null>(null);

    useEffect(() => {
        if (!user?.id) return;

        // Listen for UPDATE events on crypto_deposits table
        const subscription = supabase
            .channel('deposit-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'crypto_deposits',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newData = payload.new;
                    const oldData = payload.old;

                    // Check if status changed to 'credited'
                    if (newData.status === 'credited' && oldData.status !== 'credited') {
                        setDepositDetails({
                            amount: parseFloat(newData.amount_usd),
                            currency: newData.currency,
                        });
                        setOpen(true);
                        triggerConfetti();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user?.id]);

    const triggerConfetti = () => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        };

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            });
        }, 250);
    };

    if (!depositDetails) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md border-none shadow-none bg-transparent p-0">
                <div className="relative bg-background/90 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl text-center overflow-hidden">
                    {/* Decorative background glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-green-500/20 to-transparent pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30 animate-in zoom-in duration-500">
                            <CheckCircle className="h-10 w-10 text-white" strokeWidth={3} />
                        </div>
                        
                        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                            Congratulations!
                        </h2>
                        
                        <p className="text-xl font-medium text-foreground mb-6">
                            Your Deposit is Confirmed
                        </p>
                        
                        <div className="bg-card/50 border border-border/50 rounded-xl p-6 w-full mb-8 backdrop-blur-sm">
                            <p className="text-muted-foreground text-sm mb-1">You have successfully received</p>
                            <div className="text-4xl font-bold text-foreground">
                                ${depositDetails.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs font-mono text-muted-foreground mt-2 bg-muted/50 py-1 px-3 rounded-full inline-block">
                                {depositDetails.currency}
                            </div>
                        </div>

                        <Button 
                            onClick={() => setOpen(false)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg rounded-xl shadow-lg shadow-green-500/20 transition-all hover:scale-[1.02]"
                        >
                            Awesome!
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DepositSuccessPopup;
