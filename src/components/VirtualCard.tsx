import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { Wifi, Copy } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

const VirtualCard = () => {
    const user = useAuthStore((state) => state.user);
    const { toast } = useToast();

    // Mock card data - in a real app this would come from an API
    const cardNumber = "4921 8832 1092 3912";
    const expiry = "12/28";
    const cvv = "***";

    const copyCardNumber = () => {
        navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''));
        toast({
            title: "Copied",
            description: "Card number copied to clipboard",
        });
    };

    return (
        <div className="w-full max-w-md mx-auto perspective-1000">
            <div className="relative group transition-all duration-500 hover:scale-[1.02]">
                {/* Glassmorphism Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-2xl p-6 md:p-8 md:min-h-[220px] flex flex-col justify-between z-10">

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3"></div>
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Header */}
                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="text-xl font-bold italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                                BEXPROT
                            </div>
                            <div className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/30 font-medium">
                                PREMIUM
                            </div>
                        </div>
                        <Wifi className="text-white/50 w-8 h-8 rotate-90" />
                    </div>

                    {/* Chip & Contactless */}
                    <div className="my-6 relative z-10 flex items-center gap-4">
                        <div className="w-12 h-9 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 border border-yellow-500/30 shadow-sm relative overflow-hidden">
                            <div className="absolute top-1/2 -left-1 w-14 h-[1px] bg-black/20"></div>
                            <div className="absolute top-1/2 right-2 w-[1px] h-10 bg-black/20 -translate-y-1/2 rounded-[50%]"></div>
                        </div>
                    </div>

                    {/* Card Details */}
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="font-mono text-xl md:text-2xl text-white tracking-widest shadow-black drop-shadow-md">
                                {cardNumber}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-white/40 hover:text-white hover:bg-white/10"
                                onClick={copyCardNumber}
                            >
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>

                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <div className="text-[10px] uppercase text-white/50 tracking-wider">Card Holder</div>
                                <div className="font-medium text-white tracking-wide uppercase">
                                    {user?.name || "BEXPROT USER"}
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase text-white/50 tracking-wider">Expires</div>
                                    <div className="font-mono text-sm text-white">{expiry}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase text-white/50 tracking-wider">CVV</div>
                                    <div className="font-mono text-sm text-white">{cvv}</div>
                                </div>
                            </div>
                            <div className="ml-4">
                                <div className="text-white font-bold opacity-80 text-xl italic">VISA</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualCard;
