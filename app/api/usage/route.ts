import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getUserLimits } from '@/lib/subscription';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const [limits, usageResult, paperCountResult] = await Promise.all([
    getUserLimits(supabase, user.id),
    supabase
      .from('daily_usage')
      .select('upload_count, question_count')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .maybeSingle(),
    supabase
      .from('papers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  return NextResponse.json({
    isPro: limits.isPro,
    uploadCount: usageResult.data?.upload_count ?? 0,
    questionCount: usageResult.data?.question_count ?? 0,
    uploadLimit: limits.uploadLimit,
    questionLimit: limits.questionLimit,
    paperCount: paperCountResult.count ?? 0,
    paperLimit: limits.paperLimit,
  });
}
