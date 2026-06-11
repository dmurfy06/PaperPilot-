'use client';

import { useEffect, useRef } from 'react';

// AdSense publisher ID, e.g. "ca-pub-1234567890123456".
// Set this in your environment (.env.local + Vercel) once AdSense approves you.
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

interface AdSlotProps {
  /** The ad unit's data-ad-slot ID from your AdSense dashboard. */
  slot: string;
  /** When true the user is on Pro — no ads are rendered. */
  isPro: boolean;
  /** AdSense ad format. "auto" is a responsive unit and the safest default. */
  format?: string;
  /** Whether the unit may go full-width on small screens. */
  responsive?: boolean;
  /** Wrapper classes for spacing/sizing around the unit. */
  className?: string;
  /** Optional minimum height so layout doesn't jump before the ad loads. */
  minHeight?: number;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * A single display-ad unit. Renders nothing for Pro users, and nothing until
 * an AdSense client ID is configured — so it's safe to drop in before approval.
 */
export function AdSlot({
  slot,
  isPro,
  format = 'auto',
  responsive = true,
  className = '',
  minHeight = 90,
}: AdSlotProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (isPro || !ADSENSE_CLIENT || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense script not ready / blocked — fail silently.
    }
  }, [isPro]);

  // Pro users never see ads.
  if (isPro) return null;

  // Before AdSense is set up, render a placeholder in dev and nothing in prod.
  if (!ADSENSE_CLIENT) {
    if (process.env.NODE_ENV !== 'production') {
      return (
        <div
          className={`flex items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-white/10 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-600 ${className}`}
          style={{ minHeight }}
        >
          Ad slot ({slot})
        </div>
      );
    }
    return null;
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
