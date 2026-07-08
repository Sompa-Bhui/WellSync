'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Printer } from 'lucide-react';
import { Button } from '@/src/components/ui/primitives';

type Props = {
  publicUrl: string | null;
  tokenStatus: 'active' | 'revoked' | 'expired' | 'missing';
  onCopy?: () => void;
  onPrint?: () => void;
};

export default function EmergencyQr({ publicUrl, tokenStatus, onCopy, onPrint }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      if (!canvasRef.current || !publicUrl || tokenStatus !== 'active') return;
      try {
        await QRCode.toCanvas(canvasRef.current, publicUrl, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 256,
          color: { dark: '#0f172a', light: '#ffffff' },
        });
      } catch {
        if (!cancelled) setRenderError('QR unavailable');
      }
    }
    void render();
    return () => {
      cancelled = true;
    };
  }, [publicUrl, tokenStatus]);

  if (tokenStatus !== 'active' || !publicUrl) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
        Emergency QR unavailable. Create or rotate an active token to generate a scannable card.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center rounded-2xl border border-border bg-white p-4 shadow-sm print:shadow-none">
        <canvas ref={canvasRef} aria-label="Emergency public QR code" className="h-auto w-full max-w-64" />
      </div>
      {renderError ? <p className="text-xs text-red-400">{renderError}</p> : null}
      <p className="break-all rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground" aria-label="Emergency public URL">
        {publicUrl}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCopy}>
          <Copy className="mr-2 h-4 w-4" /> Copy link
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onPrint}>
          <Printer className="mr-2 h-4 w-4" /> Print card
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        The QR encodes only the public emergency URL. It does not contain medical data or internal IDs.
      </p>
    </div>
  );
}
