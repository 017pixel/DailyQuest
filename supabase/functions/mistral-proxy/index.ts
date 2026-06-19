import "@supabase/functions-js/edge-runtime.d.ts";

const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json" }
    });
  }
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" }
    });
  }
  if (!MISTRAL_API_KEY) {
    return new Response(JSON.stringify({ error: "Mistral API key not configured" }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    const { prompt, userContext } = body;
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400, headers: { "Content-Type": "application/json" }
      });
    }

    const ctx = userContext
      ? ` Alter=${userContext.age || "?"} Equipment=${userContext.hasEquipment ? "ja" : "nein"}`
      : "";

    const systemMsg = `Antworte NUR mit JSON: {"name":"Kurzer Plan-Name","desc":"1 Satz Beschreibung","focus":"kraft|ausdauer|abnehmen|general","intensity":1-5}. Deutsch. Thema: ${prompt}${ctx}`;

    const response = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: "Du gibst NUR das JSON-Objekt zurueck, keine Erklaerung." },
          { role: "user", content: systemMsg }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Mistral error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Mistral API error" }), {
        status: 502, headers: { "Content-Type": "application/json" }
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ error: "Empty Mistral response" }), {
        status: 502, headers: { "Content-Type": "application/json" }
      });
    }

    const cleaned = content.replace(/```json?/gi, "").replace(/```/g, "").trim();

    let config = { name: `${prompt}-Plan`, desc: "Trainingsplan", focus: "general", intensity: 3 };
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.name) config.name = String(parsed.name);
      if (parsed.desc) config.desc = String(parsed.desc);
      if (parsed.focus) config.focus = String(parsed.focus);
      if (parsed.intensity) config.intensity = Number(parsed.intensity) || 3;
    } catch {
      // Use defaults
    }

    return new Response(JSON.stringify(config), {
      status: 200, headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    console.error("Edge function error:", e);
    return new Response(JSON.stringify({
      error: "Internal error", message: e.message
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
