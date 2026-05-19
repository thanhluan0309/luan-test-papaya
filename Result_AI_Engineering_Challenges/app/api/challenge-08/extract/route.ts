import { EXTRACTION_PROMPT } from "@/lib/challenge-08/prompt";
import { validate } from "@/lib/challenge-08/validator";
import type { ExtractionResult } from "@/lib/challenge-08/types";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      return Response.json(
        { error: "Only PNG, JPEG, and WEBP images are supported" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "File must be under 10MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const openRouterRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:${file.type};base64,${base64}` },
                },
                { type: "text", text: EXTRACTION_PROMPT },
              ],
            },
          ],
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      return Response.json(
        { error: `OpenRouter error: ${openRouterRes.status} — ${errText}` },
        { status: 502 }
      );
    }

    const raw = await openRouterRes.json();
    const content = raw?.choices?.[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "Empty response from model" }, { status: 502 });
    }

    const result = JSON.parse(content) as ExtractionResult;
    result.validation_errors = validate(result);

    return Response.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
