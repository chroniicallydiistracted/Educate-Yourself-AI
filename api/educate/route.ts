// app/api/educate/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userQuestion, mapState, retrievedSnippets } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 });
    }

    const sys = "You are a patient science educator. Explain clearly, using only the provided context.";

    const content =
      `MAP_STATE:\n${JSON.stringify(mapState ?? {}, null, 2)}\n\n` +
      `CONTEXT:\n${(retrievedSnippets ?? []).join("\n---\n")}\n\n` +
      `QUESTION:\n${userQuestion || "Explain what is on screen."}`;

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: sys },
          { role: "user", content }
        ],
        temperature: 0.3,
        stream: false
      })
    });

    if (!r.ok) {
      const details = await r.text();
      return NextResponse.json({ error: "Groq upstream error", details }, { status: 502 });
    }

    const data = await r.json();
    const answer = data?.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ answer }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: "Bad request", details: String(err?.message || err) }, { status: 400 });
  }
}
