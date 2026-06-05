import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { customName } = await request.json();

  if (typeof customName !== 'string') {
    return NextResponse.json({ error: 'customName must be a string' }, { status: 400 });
  }

  const { error } = await supabase
    .from('papers')
    .update({ custom_name: customName.trim() || null })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch pdf_path before deleting so we can remove from storage
  const { data: paper } = await supabase
    .from('papers')
    .select('pdf_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  const { error } = await supabase
    .from('papers')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Best-effort storage cleanup
  if (paper?.pdf_path) {
    await supabase.storage.from('paper-pdfs').remove([paper.pdf_path]);
  }

  return NextResponse.json({ success: true });
}
