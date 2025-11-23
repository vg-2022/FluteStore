
import { NextRequest, NextResponse } from 'next/server';
import { run } from '@/ai/flows/support-flow';
import { createClient } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  try {
    const response = await run(messages);
    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("Error in chat API route:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}
