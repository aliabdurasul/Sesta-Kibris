import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquareWarning } from "lucide-react";

export default function SubstitutionDialog({ open, onOpenChange, onSend }) {
  const [msg, setMsg] = useState("");
  const handleSend = () => {
    if (!msg.trim()) return;
    onSend(msg.trim());
    setMsg("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareWarning className="h-4 w-4 text-amber-500" />
            Suggest a substitution
          </DialogTitle>
          <DialogDescription>
            Customer will see this suggestion and can accept or decline.
          </DialogDescription>
        </DialogHeader>
        <p className="text-xs text-gray-500">
          Customer will see this suggestion in their order page and can accept or
          decline.
        </p>
        <Textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Out of 1L milk — can we swap to 500ml × 2?"
          className="h-28 rounded-xl border-[#E5E7EB] text-sm"
          data-testid="substitution-message"
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            className="rounded-full bg-[#6C3BFF] font-bold hover:bg-[#582CD6]"
            data-testid="substitution-send"
          >
            Send suggestion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
