import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SupportChatDialog from "./SupportChatDialog";

const SupportChatButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Support Button */}
      <div
        className="fixed bottom-6 right-6 z-50 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <img src="/customer-support.png" alt="Support" className="h-14 w-14" />
      </div>

      {/* Support Dialog */}
      <SupportChatDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export default SupportChatButton;
