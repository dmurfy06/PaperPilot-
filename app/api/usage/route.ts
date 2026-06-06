import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const UPLOAD_LIMIT = 5;
const QUESTION_LIMIT = 5;

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('daily_usage')
    .select('upload_count, question_count')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  return NextResponse.json({
    uploadCount: data?.upload_count ?? 0,
    questionCount: data?.question_count ?? 0,
    uploadLimit: UPLOAD_LIMIT,
    questionLimit: QUESTION_LIMIT,
  });
}
