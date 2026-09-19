import { ashnaFetch, readAshnaJson, verifyLabSecret } from "../../../../lib/ashnaai";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_MODELS = 3;
const MAX_MODEL_LENGTH = 200;

function getProviderError(data, fallback) {
  return data?.error?.message || data?.error || fallback;
}

async function runModel(model, message) {
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
    return {
      model,
      ok: false,
      error: getProviderError(data, "AshnaAI request failed"),
    };
  }

  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    return { model, ok: false, error: "مدل پاسخ متنی معتبری برنگرداند." };
  }

  return { model, ok: true, text: text.trim(), usage: data?.usage || null };
}

export async function POST(request) {
  if (!verifyLabSecret(request)) {
    return Response.json({ error: "AI Lab access denied" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const requestedModels = Array.isArray(body?.models) ? body.models : [];

    const models = [...new Set(
      requestedModels
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    )].slice(0, MAX_MODELS);

    if (!message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return Response.json({ error: "message is too long" }, { status: 400 });
    }

    if (!models.length) {
      return Response.json({ error: "at least one model is required" }, { status: 400 });
    }

    if (models.some((value) => value.length > MAX_MODEL_LENGTH)) {
      return Response.json({ error: "model is too long" }, { status: 400 });
    }

    const results = await Promise.all(models.map((model) => runModel(model, message)));

    return Response.json({
      results,
      requested: models.length,
      completed: results.filter((item) => item.ok).length,
    });
  } catch (error) {
    console.error("AshnaAI compare request failed:", error);

    if (error instanceof SyntaxError) {
      return Response.json({ error: "بدنه درخواست JSON معتبر نیست." }, { status: 400 });
    }

    return Response.json(
      { error: "ارتباط با AshnaAI برقرار نشد." },
      { status: 502 }
    );
  }
}
