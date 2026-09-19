import { ashnaFetch, readAshnaJson, verifyLabSecret } from "../../../../lib/ashnaai";

export async function GET(request) {
  if (!verifyLabSecret(request)) {
    return Response.json({ error: "AI Lab access denied" }, { status: 401 });
  }

  try {
    const response = await ashnaFetch("/models");
    const data = await readAshnaJson(response);

    if (!response.ok) {
      return Response.json(data, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error("AshnaAI models request failed:", error);
    return Response.json(
      { error: "ارتباط با AshnaAI برقرار نشد." },
      { status: 502 }
    );
  }
}
