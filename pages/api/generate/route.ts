import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  // Placeholder răspuns. În pasul următor vom conecta OpenAI.
  const output = `Ai scris: "${prompt}". Aceasta este o simulare de răspuns AI.`;

  return NextResponse.json({ output });
}

