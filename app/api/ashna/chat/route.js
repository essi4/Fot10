import { ashnaFetch, readAshnaJson, verifyLabSecret } from "../../../../lib/ashnaai";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_MODEL_LENGTH = 200;

function getProviderError(data, fallback) {
  return data?.error?.message || data?.error || fallback;
}

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

    if (model.length > MAX_MODEL_LENGTH) {
      return Response.json({ error: "model is too long" }, { status: 400 });
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

    const data = await readAshnaJson(response);

    if (!response.ok) {
      return Response.json(
        { error: getProviderError(data, "AshnaAI request failed") },
        { status: response.status }
      );
    }

    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      return Response.json(
        { error: "AshnaAI پاسخ متنی معتبری برنگرداند." },
        { status: 502 }
      );
    }

    return Response.json({
      model,
      text: text.trim(),
      usage: data?.usage || null,
    });
  } catch (error) {
    console.error("AshnaAI chat request failed:", error);

    if (error instanceof SyntaxError) {
      return Response.json({ error: "بدنه درخواست JSON معتبر نیست." }, { status: 400 });
    }

    return Response.json(
      { error: "ارتباط با AshnaAI برقرار نشد." },
      { status: 502 }
    );
  }
}
