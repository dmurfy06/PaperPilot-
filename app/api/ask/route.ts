import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PaperAnalysis } from '@/lib/types';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const QUESTION_LIMIT = 5;

function buildContext(analysis: PaperAnalysis): string {
  const parts: string[] = [];

  if (analysis.studyObjective?.points?.length) {
    parts.push(`STUDY OBJECTIVES:\n${analysis.studyObjective.points.join('\n')}`);
  }
  if (analysis.plainEnglishSummary?.text) {
    parts.push(`SUMMARY:\n${analysis.plainEnglishSummary.text}`);
  }
  if (analysis.keyFindings?.length) {
    parts.push(`KEY FINDINGS:\n${analysis.keyFindings.map((f) => `- ${f.text}`).join('\n')}`);
  }
  if (analysis.methodsOverview?.text) {
    parts.push(`METHODS:\n${analysis.methodsOverview.text}`);
  }
  if (analysis.limitations?.length) {
    parts.push(`LIMITATIONS:\n${analysis.limitations.map((l) => `- ${l.text}`).join('\n')}`);
  }
  if (analysis.glossary?.length) {
    parts.push(`KEY TERMS:\n${analysis.glossary.map((g) => `${g.term}: ${g.definition}`).join('\n')}`);
  }

  return parts.join('\n\n');
}

export async function POST(req: Request) {
  try {
    // Verify auth
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Check daily question limit
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('upload_count, question_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if ((usage?.question_count ?? 0) >= QUESTION_LIMIT) {
      return NextResponse.json(
        { error: `Daily question limit reached (${QUESTION_LIMIT}/day). Your limit resets at midnight.` },
        { status: 429 }
      );
    }

    const { question, analysis } = (await req.json()) as {
      question: string;
      analysis: PaperAnalysis;
    };

    if (!question?.trim()) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    }
    if (!analysis) {
      return NextResponse.json({ error: 'No analysis provided' }, { status: 400 });
    }

    const context = buildContext(analysis);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 350,
      messages: [
        {
          role: 'system',
          content: `You are a research assistant helping a student understand a specific academic paper. Answer questions strictly based on the paper analysis provided below. If the answer cannot be found in the analysis, say so clearly and suggest they check the original paper. Be concise — 2-4 sentences unless a list is required. Do not speculate or draw on outside knowledge.\n\n${context}`,
        },
        { role: 'user', content: question.trim() },
      ],
    });

    const answer = completion.choices[0].message.content ?? 'No response generated.';

    // Increment daily question count
    await supabase.from('daily_usage').upsert({
      user_id: user.id,
      date: today,
      upload_count: usage?.upload_count ?? 0,
      question_count: (usage?.question_count ?? 0) + 1,
    }, { onConflict: 'user_id,date' });

    return NextResponse.json({ answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
