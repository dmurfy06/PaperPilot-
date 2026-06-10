import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getUserLimits } from '@/lib/subscription';

// Save a paper PDF to the library WITHOUT digesting (analysing) it.
// Counts toward the paper-storage limit, but not the daily digest limit (no AI cost).
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { filename, pdfPath } = await request.json();
  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  const limits = await getUserLimits(supabase, user.id);

  // Enforce the total paper-storage limit for free users
  if (limits.paperLimit !== null) {
    const { count } = await supabase
      .from('papers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count ?? 0) >= limits.paperLimit) {
      return NextResponse.json(
        { error: `Paper limit reached (${limits.paperLimit} papers). Delete a paper to free up space, or upgrade to Pro for unlimited storage.`, code: 'PAPER_LIMIT' },
        { status: 429 }
      );
    }
  }

  const { data: saved, error: dbError } = await supabase
    .from('papers')
    .insert({ user_id: user.id, filename, analysis: null, pdf_path: pdfPath ?? null })
    .select()
    .single();

  if (dbError) {
    console.error('Failed to save paper:', dbError);
    return NextResponse.json({ error: `Failed to save: ${dbError.message}` }, { status: 500 });
  }

  return NextResponse.json({
    id: saved.id,
    filename: saved.filename,
    pdfPath: saved.pdf_path ?? undefined,
    analysis: saved.analysis ?? null,
    uploadedAt: new Date(saved.uploaded_at).getTime(),
  });
}
