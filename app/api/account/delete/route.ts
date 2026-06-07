import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all user data before removing the auth record
    await Promise.all([
      supabase.from('papers').delete().eq('user_id', user.id),
      supabase.from('folders').delete().eq('user_id', user.id),
      supabase.from('subscriptions').delete().eq('user_id', user.id),
      supabase.from('daily_usage').delete().eq('user_id', user.id),
    ]);

    // Remove the auth user using the service role key
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { error } = await adminClient.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[account/delete]', err);
    return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 });
  }
}
