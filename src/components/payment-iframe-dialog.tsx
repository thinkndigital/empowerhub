"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface PaymentResultMessage {
  type: "payment-result";
  status: "paid" | "failed";
  orderId: string | null;
}

interface PaymentIframeDialogProps {
  paymentUrl: string | null;
  onOpenChange: (open: boolean) => void;
  onResult: (status: "paid" | "failed", orderId: string | null) => void;
}

// The payment gateway checkout opens inside this iframe instead of leaving
// the page. src/app/payment/callback/page.tsx already detects it's running
// inside an iframe (window !== window.parent) and posts a "payment-result"
// message back here once the gateway redirects it there.
export function PaymentIframeDialog({ paymentUrl, onOpenChange, onResult }: PaymentIframeDialogProps) {
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    setIframeLoading(true);
  }, [paymentUrl]);

  useEffect(() => {
    if (!paymentUrl) return;
    const handler = (event: MessageEvent) => {
      const data = event.data as PaymentResultMessage | undefined;
      if (data?.type !== "payment-result") return;
      onResult(data.status, data.orderId);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [paymentUrl, onResult]);

  return (
    <Dialog open={!!paymentUrl} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-2xl h-[85vh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <DialogTitle className="text-base">إتمام الدفع</DialogTitle>
        </DialogHeader>
        <div className="relative flex-1 min-h-0">
          {iframeLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {paymentUrl && (
            <iframe
              src={paymentUrl}
              className="w-full h-full border-0"
              onLoad={() => setIframeLoading(false)}
              title="إتمام الدفع"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
