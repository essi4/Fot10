import { ashnaFetch, verifyLabSecret } from "../../../../lib/ashnaai";

export async function GET(request) {
  if (!verifyLabSecret(request)) {
    return Response.json({ error: "AI Lab access denied" }, { status: 401 });
  }

  try {
    const response = await ashnaFetch("/models");
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "AshnaAI request failed" },
      { status: 500 }
    );
  }
}
