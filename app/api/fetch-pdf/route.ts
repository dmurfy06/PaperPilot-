import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const MAX_PDF_BYTES = 25 * 1024 * 1024; // match the upload limit
const FETCH_TIMEOUT_MS = 30000;

// Block requests to internal/private hosts (basic SSRF guard)
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return true;
  // IPv4 private / loopback / link-local ranges
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  // IPv6 loopback / unique-local / link-local
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) return true;
  return false;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let url: string;
  try {
    ({ url } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return NextResponse.json({ error: 'Only HTTP(S) URLs are allowed' }, { status: 400 });
  }
  if (isBlockedHost(parsed.hostname)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 400 });
  }

  try {
    const res = await fetch(parsed.toString(), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
      headers: {
        // Some publishers reject requests without a browser-like UA
        'User-Agent': 'Mozilla/5.0 (compatible; Scigestible/1.0; paper import)',
        Accept: 'application/pdf,*/*',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `The publisher's server returned ${res.status}. Try "View online" and download manually.` },
        { status: 502 }
      );
    }

    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PDF_BYTES) {
      return NextResponse.json({ error: 'PDF exceeds the 25 MB limit' }, { status: 413 });
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_PDF_BYTES) {
      return NextResponse.json({ error: 'PDF exceeds the 25 MB limit' }, { status: 413 });
    }

    // Verify it's actually a PDF (%PDF magic bytes), not an HTML landing page
    const head = new Uint8Array(buffer.slice(0, 5));
    const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
    if (!isPdf) {
      return NextResponse.json(
        { error: 'That link returned a webpage, not a PDF. Try "View online" and download manually.' },
        { status: 422 }
      );
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: { 'Content-Type': 'application/pdf' },
    });
  } catch (err) {
    const message = err instanceof Error && err.name === 'TimeoutError'
      ? 'The download timed out. Try "View online" and download manually.'
      : 'Could not download the PDF. Try "View online" and download manually.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
