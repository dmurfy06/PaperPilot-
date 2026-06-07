import { SupabaseClient } from '@supabase/supabase-js';

export interface UserLimits {
  isPro: boolean;
  paperLimit: number | null; // null = unlimited
  uploadLimit: number;
  questionLimit: number;
}

export async function getUserLimits(supabase: SupabaseClient, userId: string): Promise<UserLimits> {
  const { data } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle();

  const isPro = data?.status === 'active';

  return {
    isPro,
    paperLimit: isPro ? null : 10,
    uploadLimit: isPro ? 50 : 5,
    questionLimit: isPro ? 50 : 3,
  };
}
