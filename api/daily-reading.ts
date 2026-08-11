// Vercel Edge Function. Keeps the Anthropic API key server-side — the
// client never sees it, it only ever POSTs the day's already-computed
// astrology/Human Design summary here and gets back synthesized prose.
export const config = { runtime: "edge" };

interface TransitPayloadItem {
  type: "aspect" | "hd_gate";
  headline: string;
  detail: string;
}

interface RequestBody {
  natalSummary?: string;
  hdSummary?: string;
  transits?: TransitPayloadItem[];
}

function buildPrompt(natalSummary: string, hdSummary: string, transits: TransitPayloadItem[]): string {
  const astroLines = transits
    .filter(t => t.type === "aspect")
    .map(t => `- ${t.headline}. ${t.detail}`)
    .join("\n") || "None of particular note.";

  const hdLines = transits
    .filter(t => t.type === "hd_gate")
    .map(t => `- ${t.headline}. ${t.detail}`)
    .join("\n") || "None of particular note.";

  return `You are a wise, grounded astrology and Human Design guide. Someone wants a brief daily reading that weighs ALL of today's influences together and finds the genuine, coherent thread connecting them — not a list of individual transits recited one after another.

Their natal chart: ${natalSummary}
Their Human Design: ${hdSummary}

Today's astrological transits (most significant first):
${astroLines}

Today's Human Design gate activity:
${hdLines}

Write a short (150-220 word) daily reading in second person ("you"). Synthesize — don't enumerate. Find what several of these influences have in common, or where they create a productive tension, and say something genuinely useful about how to move through the day. Sound wise and specific to THIS combination, not generic. No mystical clichés, no hedging disclaimers, no bullet points, no headings — just a few well-crafted paragraphs of real insight, as if from someone who has read thousands of charts and knows how to cut to what matters.`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI reading is not configured on the server." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const { natalSummary, hdSummary, transits } = body;
  if (!natalSummary || !hdSummary || !Array.isArray(transits)) {
    return new Response(JSON.stringify({ error: "Missing required fields." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const prompt = buildPrompt(natalSummary, hdSummary, transits);

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!anthropicRes.ok) {
    const detail = await anthropicRes.text();
    return new Response(JSON.stringify({ error: "AI reading request failed.", detail }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  const data = await anthropicRes.json();
  const text: string = data?.content?.[0]?.text ?? "";

  if (!text) {
    return new Response(JSON.stringify({ error: "AI reading returned no text." }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ text }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
