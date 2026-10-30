'use client';

import { useEffect, useRef } from 'react';

interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void;
  minChars?: number;
  maxDelayMs?: number;
}

export function useBarcodeScanner({
  onScan,
  minChars = 4,
  maxDelayMs = 50,
}: UseBarcodeScannerProps) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing inside an explicit input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minChars) {
          onScan(bufferRef.current);
          bufferRef.current = '';
        }
        return;
      }

      // Scanner sends characters rapidly (usually < 50ms per key)
      if (timeDiff > maxDelayMs && bufferRef.current.length > 0) {
        // Reset buffer if delay too long (manual typing)
        bufferRef.current = '';
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan, minChars, maxDelayMs]);
}
