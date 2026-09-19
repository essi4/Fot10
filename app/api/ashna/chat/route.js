import { ashnaFetch, verifyLabSecret } from "../../../../lib/ashnaai";

const MAX_MESSAGE_LENGTH = 4000;

export async function POST(request) {
  if (!verifyLabSecret(request)) {
    return Response.json({ error: "AI Lab access denied" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const model = typeof body?.model === "string" ? body.model.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!model || !message) {
      return Response.json({ error: "model and message are required" }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return Response.json({ error: "message is too long" }, { status: 400 });
    }

    const response = await ashnaFetch("/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are the FOT10 AI lab assistant. Help analyze football product ideas, UX, code, and data flows. Do not invent live match facts; clearly label assumptions.",
          },
          { role: "user", content: message },
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    if (!response.ok) return Response.json(data, { status: response.status });

    return Response.json({
      model,
      text: data?.choices?.[0]?.message?.content || "",
      usage: data?.usage || null,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "AshnaAI request failed" },
      { status: 500 }
    );
  }
}
